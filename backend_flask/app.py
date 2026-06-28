import os
import sys
import jwt
import bcrypt
import requests
try:
    import MySQLdb
except ImportError:
    MySQLdb = None

try:
    import psycopg2
except ImportError:
    psycopg2 = None
from datetime import datetime, timedelta, date
from decimal import Decimal
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Secret key for JWT signing - matching the Spring Boot application configuration
SECRET_KEY = "9a67471ec639e4d58855cf83d2e67df142646d5c6b907e5c5c165d5c0e25df5a"
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:5005")

def get_db():
    if 'db' not in g:
        db_url = os.environ.get("DATABASE_URL") or os.environ.get("DB_URL")
        if db_url:
            from urllib.parse import urlparse
            result = urlparse(db_url)
            db_host = result.hostname
            db_port = result.port
            db_user = result.username
            db_password = result.password
            db_name = result.path.lstrip('/')
            
            if "postgres" in result.scheme or "postgresql" in result.scheme:
                g.db_type = "postgres"
                g.db = psycopg2.connect(
                    host=db_host,
                    port=db_port or 5432,
                    user=db_user or "postgres",
                    password=db_password or "",
                    database=db_name or "postgres"
                )
            else:
                g.db_type = "mysql"
                g.db = MySQLdb.connect(
                    host=db_host or "127.0.0.1",
                    port=db_port or 3307,
                    user=db_user or "root",
                    passwd=db_password or "",
                    db=db_name or "smartspend",
                    charset="utf8mb4"
                )
        else:
            db_type = os.environ.get("DB_TYPE", "mysql").lower()
            db_host = os.environ.get("DB_HOST", "127.0.0.1")
            if "postgres" in db_type or "supabase" in db_host or "postgres" in db_host or "pooler.supabase.com" in db_host:
                db_port = int(os.environ.get("DB_PORT", 5432))
                db_user = os.environ.get("DB_USER", "postgres")
                db_password = os.environ.get("DB_PASSWORD", "")
                db_name = os.environ.get("DB_NAME", "postgres")
                g.db_type = "postgres"
                g.db = psycopg2.connect(
                    host=db_host,
                    port=db_port,
                    user=db_user,
                    password=db_password,
                    database=db_name
                )
            else:
                db_port = int(os.environ.get("DB_PORT", 3307))
                db_user = os.environ.get("DB_USER", "root")
                db_password = os.environ.get("DB_PASSWORD", "")
                db_name = os.environ.get("DB_NAME", "smartspend")
                g.db_type = "mysql"
                g.db = MySQLdb.connect(
                    host=db_host,
                    port=db_port,
                    user=db_user,
                    passwd=db_password,
                    db=db_name,
                    charset="utf8mb4"
                )
    return g.db

@app.teardown_appcontext
def teardown_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# Helper to format decimals/dates for JSON serialization
def json_format(val):
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, date)):
        return val.strftime('%Y-%m-%d')
    return val

# JWT authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                
        if not token:
            return jsonify({"error": "Unauthorized: Token is missing!"}), 401
            
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.user_id = data["sub"]
            g.username = data.get("username")
            g.email = data.get("email")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized: Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Unauthorized: Invalid token!"}), 401
            
        return f(*args, **kwargs)
    return decorated

# ----------------- AUTH ENDPOINTS -----------------

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({"error": "All fields are required!"}), 400
        
    if len(username) < 3 or len(username) > 50:
        return jsonify({"error": "Username must be between 3 and 50 characters!"}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters!"}), 400

    db = get_db()
    cursor = db.cursor()
    
    # Check if username exists
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        return jsonify({"error": "Username is already taken!"}), 400
        
    # Check if email exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        return jsonify({"error": "Email Address already in use!"}), 400
        
    # Hash password using BCrypt
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (username, email, hashed_pw)
        )
        db.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to register user: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username_or_email = data.get('usernameOrEmail')
    password = data.get('password')
    
    if not username_or_email or not password:
        return jsonify({"error": "Username/email and password are required!"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    # Query user
    cursor.execute(
        "SELECT id, username, email, password FROM users WHERE username = %s OR email = %s",
        (username_or_email, username_or_email)
    )
    user_row = cursor.fetchone()
    
    if not user_row:
        return jsonify({"error": "Invalid username/email or password."}), 401
        
    user_id, username, email, hashed_pw = user_row
    
    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), hashed_pw.encode('utf-8')):
        return jsonify({"error": "Invalid username/email or password."}), 401
        
    # Issue JWT token
    payload = {
        "sub": user_id,
        "username": username,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    
    return jsonify({
        "token": token,
        "id": user_id,
        "username": username,
        "email": email
    }), 200

# ----------------- SUBSCRIPTION ENDPOINTS -----------------

@app.route('/api/expenses', methods=['GET'])
@token_required
def get_subscriptions():
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, name, category, amount, billing_cycle, next_renewal_date, utilization_rate, last_used_date "
        "FROM subscriptions WHERE user_id = %s ORDER BY next_renewal_date ASC",
        (g.user_id,)
    )
    rows = cursor.fetchall()
    
    subs = []
    for row in rows:
        subs.append({
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "amount": json_format(row[3]),
            "billingCycle": row[4],
            "nextRenewalDate": json_format(row[5]),
            "utilizationRate": row[6],
            "lastUsedDate": json_format(row[7]) if row[7] else None
        })
    return jsonify(subs), 200

@app.route('/api/expenses', methods=['POST'])
@token_required
def add_subscription():
    data = request.json or {}
    name = data.get('name')
    category = data.get('category')
    amount = data.get('amount')
    billing_cycle = data.get('billingCycle')
    next_renewal_date = data.get('nextRenewalDate')
    utilization_rate = data.get('utilizationRate', 1.0)
    last_used_date = data.get('lastUsedDate')
    
    if not name or not category or amount is None or not billing_cycle or not next_renewal_date:
        return jsonify({"error": "Name, category, amount, billingCycle, and nextRenewalDate are required!"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    try:
        if g.get('db_type') == 'postgres':
            cursor.execute(
                "INSERT INTO subscriptions (user_id, name, category, amount, billing_cycle, next_renewal_date, utilization_rate, last_used_date) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (g.user_id, name, category, amount, billing_cycle, next_renewal_date, utilization_rate, last_used_date)
            )
            sub_id = cursor.fetchone()[0]
        else:
            cursor.execute(
                "INSERT INTO subscriptions (user_id, name, category, amount, billing_cycle, next_renewal_date, utilization_rate, last_used_date) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (g.user_id, name, category, amount, billing_cycle, next_renewal_date, utilization_rate, last_used_date)
            )
            sub_id = cursor.lastrowid
        db.commit()
        
        return jsonify({
            "id": sub_id,
            "name": name,
            "category": category,
            "amount": float(amount),
            "billingCycle": billing_cycle,
            "nextRenewalDate": next_renewal_date,
            "utilizationRate": float(utilization_rate),
            "lastUsedDate": last_used_date
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to add subscription: {str(e)}"}), 500

@app.route('/api/expenses/<int:sub_id>', methods=['PUT'])
@token_required
def update_subscription(sub_id):
    data = request.json or {}
    name = data.get('name')
    category = data.get('category')
    amount = data.get('amount')
    billing_cycle = data.get('billingCycle')
    next_renewal_date = data.get('nextRenewalDate')
    utilization_rate = data.get('utilizationRate')
    last_used_date = data.get('lastUsedDate')
    
    db = get_db()
    cursor = db.cursor()
    
    # Check ownership
    cursor.execute("SELECT id FROM subscriptions WHERE id = %s AND user_id = %s", (sub_id, g.user_id))
    if not cursor.fetchone():
        return jsonify({"error": "Subscription not found or unauthorized!"}), 404
        
    try:
        cursor.execute(
            "UPDATE subscriptions SET name = %s, category = %s, amount = %s, billing_cycle = %s, "
            "next_renewal_date = %s, utilization_rate = %s, last_used_date = %s "
            "WHERE id = %s AND user_id = %s",
            (name, category, amount, billing_cycle, next_renewal_date, utilization_rate, last_used_date, sub_id, g.user_id)
        )
        db.commit()
        
        return jsonify({
            "id": sub_id,
            "name": name,
            "category": category,
            "amount": float(amount) if amount is not None else None,
            "billingCycle": billing_cycle,
            "nextRenewalDate": next_renewal_date,
            "utilizationRate": float(utilization_rate) if utilization_rate is not None else None,
            "lastUsedDate": last_used_date
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to update subscription: {str(e)}"}), 500

@app.route('/api/expenses/<int:sub_id>', methods=['DELETE'])
@token_required
def delete_subscription(sub_id):
    db = get_db()
    cursor = db.cursor()
    
    # Check ownership
    cursor.execute("SELECT id FROM subscriptions WHERE id = %s AND user_id = %s", (sub_id, g.user_id))
    if not cursor.fetchone():
        return jsonify({"error": "Subscription not found or unauthorized!"}), 404
        
    try:
        cursor.execute("DELETE FROM subscriptions WHERE id = %s AND user_id = %s", (sub_id, g.user_id))
        db.commit()
        return jsonify({"message": "Subscription deleted successfully!"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to delete subscription: {str(e)}"}), 500

# ----------------- BILLING LOGS ENDPOINTS -----------------

@app.route('/api/income', methods=['GET'])
@token_required
def get_billing_history():
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, subscription_name, amount, date FROM payment_history "
        "WHERE user_id = %s ORDER BY date DESC",
        (g.user_id,)
    )
    rows = cursor.fetchall()
    
    history = []
    for row in rows:
        history.append({
            "id": row[0],
            "subscriptionName": row[1],
            "amount": json_format(row[2]),
            "date": json_format(row[3])
        })
    return jsonify(history), 200

@app.route('/api/income', methods=['POST'])
@token_required
def create_billing_history():
    data = request.json or {}
    sub_name = data.get('subscriptionName')
    amount = data.get('amount')
    date_val = data.get('date')

    if not sub_name or amount is None or not date_val:
        return jsonify({"error": "All fields are required!"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Billing amount must be positive."}), 400
    except ValueError:
        return jsonify({"error": "Invalid billing amount!"}), 400

    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO payment_history (user_id, subscription_name, amount, date) "
            "VALUES (%s, %s, %s, %s)",
            (g.user_id, sub_name, amount, date_val)
        )
        db.commit()
        return jsonify({"message": "Billing receipt logged successfully!"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to save receipt: {str(e)}"}), 500

@app.route('/api/income/<int:log_id>', methods=['PUT'])
@token_required
def update_billing_history(log_id):
    data = request.json or {}
    sub_name = data.get('subscriptionName')
    amount = data.get('amount')
    date_val = data.get('date')

    if not sub_name or amount is None or not date_val:
        return jsonify({"error": "All fields are required!"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Billing amount must be positive."}), 400
    except ValueError:
        return jsonify({"error": "Invalid billing amount!"}), 400

    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE payment_history SET subscription_name = %s, amount = %s, date = %s "
            "WHERE id = %s AND user_id = %s",
            (sub_name, amount, date_val, log_id, g.user_id)
        )
        db.commit()
        return jsonify({"message": "Billing receipt updated successfully!"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to update receipt: {str(e)}"}), 500

@app.route('/api/income/<int:log_id>', methods=['DELETE'])
@token_required
def delete_billing_history(log_id):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "DELETE FROM payment_history WHERE id = %s AND user_id = %s",
            (log_id, g.user_id)
        )
        db.commit()
        return jsonify({"message": "Billing record deleted successfully!"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to delete billing record: {str(e)}"}), 500

# ----------------- BUDGETS ENDPOINTS -----------------

@app.route('/api/budgets', methods=['GET'])
@token_required
def get_budgets():
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, category, amount, month FROM budgets WHERE user_id = %s",
        (g.user_id,)
    )
    rows = cursor.fetchall()
    
    budgets = []
    for row in rows:
        budgets.append({
            "id": row[0],
            "category": row[1],
            "amount": json_format(row[2]),
            "month": row[3]
        })
    return jsonify(budgets), 200

@app.route('/api/budgets', methods=['POST'])
@token_required
def set_budget():
    data = request.json or {}
    category = data.get('category')
    amount = data.get('amount')
    month = data.get('month')
    
    if not category or amount is None or not month:
        return jsonify({"error": "Category, amount, and month are required!"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    try:
        # Check if budget already exists for user + category + month
        cursor.execute(
            "SELECT id FROM budgets WHERE user_id = %s AND category = %s AND month = %s",
            (g.user_id, category, month)
        )
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute(
                "UPDATE budgets SET amount = %s WHERE id = %s",
                (amount, existing[0])
            )
            b_id = existing[0]
        else:
            if g.get('db_type') == 'postgres':
                cursor.execute(
                    "INSERT INTO budgets (user_id, category, amount, month) VALUES (%s, %s, %s, %s) RETURNING id",
                    (g.user_id, category, amount, month)
                )
                b_id = cursor.fetchone()[0]
            else:
                cursor.execute(
                    "INSERT INTO budgets (user_id, category, amount, month) VALUES (%s, %s, %s, %s)",
                    (g.user_id, category, amount, month)
                )
                b_id = cursor.lastrowid
            
        db.commit()
        return jsonify({
            "id": b_id,
            "category": category,
            "amount": float(amount),
            "month": month
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to set budget: {str(e)}"}), 500

# ----------------- DASHBOARD ENDPOINTS -----------------

@app.route('/api/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    month_str = request.args.get('month')
    today = datetime.now()
    if not month_str:
        month_str = today.strftime('%Y-%m')
        
    db = get_db()
    cursor = db.cursor()
    
    # 1. Fetch subscriptions
    cursor.execute(
        "SELECT name, category, amount, billing_cycle, next_renewal_date, utilization_rate "
        "FROM subscriptions WHERE user_id = %s",
        (g.user_id,)
    )
    subs = cursor.fetchall()
    
    # 2. Fetch budgets for the month
    cursor.execute(
        "SELECT category, amount FROM budgets WHERE user_id = %s AND month = %s",
        (g.user_id, month_str)
    )
    budgets = cursor.fetchall()
    
    # 3. Calculate aggregates
    total_monthly_spend = Decimal('0.00')
    total_utilization = 0.0
    active_count = 0
    category_expenses = {}
    
    for sub in subs:
        name, category, amount, billing_cycle, next_renewal, utilization = sub
        amount = Decimal(str(amount))
        
        # Prorate annual contracts
        monthly_val = amount
        if billing_cycle.upper() == 'ANNUAL':
            monthly_val = (amount / Decimal('12')).quantize(Decimal('0.01'))
            
        total_monthly_spend += monthly_val
        total_utilization += utilization * 100 if utilization is not None else 100.0
        active_count += 1
        
        category_expenses[category] = category_expenses.get(category, Decimal('0.00')) + monthly_val
        
    avg_utilization = total_utilization / active_count if active_count > 0 else 0.0
    arr = total_monthly_spend * Decimal('12')
    
    # Parse budgets
    total_budget = Decimal('0.00')
    category_budgets = {}
    for b in budgets:
        b_cat, b_amt = b
        b_amt = Decimal(str(b_amt))
        if b_cat == 'TOTAL':
            total_budget = b_amt
        else:
            category_budgets[b_cat] = b_amt
            
    budget_utilization = 0.0
    if total_budget > 0:
        budget_utilization = float((total_monthly_spend / total_budget) * 100)
        
    # Generate Alerts
    alerts = []
    if total_budget > 0 and total_monthly_spend > total_budget:
        over = total_monthly_spend - total_budget
        alerts.append(f"Monthly software spend exceeds budget cap by ₹{over}!")
    elif total_budget > 0 and float(total_monthly_spend) >= 0.8 * float(total_budget):
        alerts.append("Warning: You have used over 80% of your software spend budget cap!")
        
    # Category limits check
    for cat, b_amt in category_budgets.items():
        exp = category_expenses.get(cat, Decimal('0.00'))
        if exp > b_amt:
            over = exp - b_amt
            alerts.append(f"Category '{cat}' has exceeded its software budget cap of ₹{b_amt} by ₹{over}!")
            
    # Renewal and low utilization alerts
    today_date = today.date()
    for sub in subs:
        name, category, amount, billing_cycle, next_renewal, utilization = sub
        days = (next_renewal - today_date).days
        if 0 <= days <= 7:
            alerts.append(f"Renewing soon: '{name}' auto-renews in {days} day(s) (₹{amount})")
        if utilization is not None and utilization < 0.25:
            alerts.append(f"Optimization: '{name}' is under-utilized ({int(utilization * 100)}% utilization). Consider canceling.")
            
    # Format categories dict for response
    cat_exp_json = {k: float(v) for k, v in category_expenses.items()}
    cat_bud_json = {k: float(v) for k, v in category_budgets.items()}
    
    # Dashboard response structure matching React expected fields
    response = {
        "totalIncome": active_count,
        "totalExpenses": float(total_monthly_spend),
        "savings": float(arr),
        "budgetUtilization": avg_utilization,
        "categoryExpenses": cat_exp_json,
        "categoryBudgets": cat_bud_json,
        "budgetAlerts": alerts
    }
    return jsonify(response), 200

# ----------------- AI ENDPOINTS -----------------

@app.route('/api/ai/insights', methods=['GET'])
@token_required
def get_ai_insights():
    # Gather data to forward to Flask AI service on port 5005
    db = get_db()
    cursor = db.cursor()
    
    # 1. Fetch user subscriptions
    cursor.execute(
        "SELECT id, name, category, amount, billing_cycle, next_renewal_date, utilization_rate "
        "FROM subscriptions WHERE user_id = %s",
        (g.user_id,)
    )
    subs = cursor.fetchall()
    
    # 2. Fetch budgets
    cursor.execute(
        "SELECT category, amount, month FROM budgets WHERE user_id = %s",
        (g.user_id,)
    )
    budgets = cursor.fetchall()
    
    # 3. Fetch billing logs
    cursor.execute(
        "SELECT subscription_name, amount, date FROM payment_history WHERE user_id = %s",
        (g.user_id,)
    )
    history = cursor.fetchall()
    
    # Calculate aggregates matching dashboard
    total_monthly_spend = 0.0
    category_expenses = {}
    payload_subs = []
    for sub in subs:
        sub_id, name, cat, amt, billing_cycle, next_renewal, utilization = sub
        amount = float(amt)
        
        payload_subs.append({
            "id": sub_id,
            "name": name,
            "category": cat,
            "amount": amount,
            "billingCycle": billing_cycle,
            "nextRenewalDate": next_renewal.strftime('%Y-%m-%d'),
            "utilizationRate": float(utilization) if utilization is not None else 1.0
        })
        
        # Prorate annual contracts
        monthly_val = amount
        if billing_cycle.upper() == 'ANNUAL':
            monthly_val = amount / 12.0
            
        total_monthly_spend += monthly_val
        category_expenses[cat] = category_expenses.get(cat, 0.0) + monthly_val
        
    # Calculate budgets
    total_budget = 0.0
    category_budgets = {}
    today = datetime.now()
    month_str = today.strftime('%Y-%m')
    
    payload_budgets = []
    for b in budgets:
        b_cat, b_amt, b_month = b
        payload_budgets.append({
            "category": b_cat,
            "amount": float(b_amt),
            "month": b_month
        })
        
        if b_month == month_str:
            if b_cat == 'TOTAL':
                total_budget = float(b_amt)
            else:
                category_budgets[b_cat] = float(b_amt)
        
    payload_history = []
    for item in history:
        payload_history.append({
            "subscriptionName": item[0],
            "amount": float(item[1]),
            "date": item[2].strftime('%Y-%m-%d')
        })
        
    ai_payload = {
        "totalIncome": float(len(subs)),
        "totalExpenses": total_monthly_spend,
        "totalBudget": total_budget,
        "categoryExpenses": category_expenses,
        "categoryBudgets": category_budgets,
        "subscriptions": payload_subs,
        "billings": payload_history  # Map to "billings" as expected by Flask AI
    }
    
    try:
        # Call Flask AI on port 5000
        res = requests.post(f"{AI_SERVICE_URL}/insights", json=ai_payload, timeout=5)
        if res.status_code == 200:
            ai_data = res.json()
            return jsonify(ai_data), 200
        else:
            return jsonify({"error": f"AI service error: {res.text}"}), 500
    except Exception as e:
        # Fallback diagnostics when Flask AI is offline
        print("Flask AI offline, using local fallbacks...", e)
        total_cost = sum(float(sub[3]) for sub in subs)
        insights = [f"Your monthly SaaS subscription cost is currently running at ₹{total_cost:.2f}/month."]
        recs = ["Track login usage monthly to capture subscription bloat and keep average utilization above 80%."]
        for sub in subs:
            if sub[6] is not None and sub[6] < 0.25:
                recs.append(f"Cancel unused license: '{sub[1]}' (₹{float(sub[3]):.2f}) has negligible feature utilization.")
                
        fallback_res = {
            "predictedExpense": total_cost,
            "isPredictionFallback": True,
            "predictionMessage": "AI forecasting service offline. Displaying current total spend.",
            "healthScore": 85 if len(recs) <= 2 else 60,
            "healthRating": "Excellent" if len(recs) <= 2 else "Fair",
            "healthBreakdown": {"budget_score": 40.0, "savings_score": 30.0, "spending_mix_score": 15.0},
            "insights": insights,
            "recommendations": recs
        }
        return jsonify(fallback_res), 200

if __name__ == '__main__':
    # Start on port 8080 (matching Spring Boot port)
    app.run(host='0.0.0.0', port=8080, debug=True)
