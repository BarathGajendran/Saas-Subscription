from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from model import (
    predict_next_month_expense, 
    calculate_health_score, 
    generate_insights_and_recommendations
)

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "SubGuard SaaS ML Service"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'expenses' not in data:
            return jsonify({"error": "Missing 'expenses' (billing) list in request body."}), 400
        
        billings = data['expenses']
        result = predict_next_month_expense(billings)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health-score', methods=['POST'])
def health_score():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body."}), 400
        
        total_income = float(data.get('totalIncome', 0.0))
        total_expenses = float(data.get('totalExpenses', 0.0))
        total_budget = float(data.get('totalBudget', 0.0))
        category_expenses = data.get('categoryExpenses', {})
        category_budgets = data.get('categoryBudgets', {})
        subscriptions = data.get('subscriptions', [])
        
        cat_exp = {k: float(v) for k, v in category_expenses.items()}
        cat_bud = {k: float(v) for k, v in category_budgets.items()}
        
        result = calculate_health_score(total_income, total_expenses, total_budget, cat_exp, cat_bud, subscriptions)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/insights', methods=['POST'])
def insights():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body."}), 400
        
        total_income = float(data.get('totalIncome', 0.0))
        total_expenses = float(data.get('totalExpenses', 0.0))
        total_budget = float(data.get('totalBudget', 0.0))
        category_expenses = data.get('categoryExpenses', {})
        category_budgets = data.get('categoryBudgets', {})
        subscriptions = data.get('subscriptions', [])
        billings = data.get('billings', [])
        
        cat_exp = {k: float(v) for k, v in category_expenses.items()}
        cat_bud = {k: float(v) for k, v in category_budgets.items()}
        
        # 1. Generate insights and recommendations
        insights_recs = generate_insights_and_recommendations(total_income, total_expenses, total_budget, cat_exp, cat_bud, subscriptions, billings)
        
        # 2. Calculate health score
        health = calculate_health_score(total_income, total_expenses, total_budget, cat_exp, cat_bud, subscriptions)
        
        # 3. Predict next month's expense
        prediction = predict_next_month_expense(billings)
        
        # Merge them into a single unified response matching frontend expectations
        result = {
            "predictedExpense": prediction.get("prediction", 0.0),
            "isPredictionFallback": prediction.get("is_fallback", True),
            "predictionMessage": prediction.get("message", ""),
            "healthScore": health.get("score", 0),
            "healthRating": health.get("rating", "Unknown"),
            "healthBreakdown": {
                "savings_score": health.get("breakdown", {}).get("savings_score", 0.0),
                "budget_score": health.get("breakdown", {}).get("budget_score", 0.0),
                "spending_mix_score": health.get("breakdown", {}).get("spending_mix_score", 0.0)
            },
            "insights": insights_recs.get("insights", []),
            "recommendations": insights_recs.get("recommendations", [])
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=True)
