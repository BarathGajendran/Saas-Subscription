import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime

def predict_next_month_expense(billing_list):
    """
    Predicts the software spend for the next month using Linear Regression.
    Falls back to a simple average if history is short.
    """
    if not billing_list:
        return {"prediction": 0.0, "is_fallback": True, "message": "No payment history available."}

    df = pd.DataFrame(billing_list)
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = df['amount'].astype(float)
    
    df['month'] = df['date'].dt.to_period('M')
    monthly_data = df.groupby('month')['amount'].sum().reset_index()
    monthly_data = monthly_data.sort_values('month')
    
    n_months = len(monthly_data)
    
    if n_months < 3:
        prediction = monthly_data['amount'].mean()
        return {
            "prediction": float(round(prediction, 2)),
            "is_fallback": True,
            "message": f"Short billing history ({n_months} month(s)). Using historical average."
        }
    
    X = np.arange(n_months).reshape(-1, 1)
    y = monthly_data['amount'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    next_month_idx = np.array([[n_months]])
    prediction = model.predict(next_month_idx)[0]
    prediction = max(0.0, prediction)
    
    return {
        "prediction": float(round(prediction, 2)),
        "is_fallback": False,
        "message": f"Linear Regression forecast based on {n_months} months of payments."
    }

def calculate_health_score(total_income, total_expenses, total_budget, category_expenses, category_budgets, subscriptions=None):
    """
    Calculates a Subscription Optimization Score (0-100) based on:
    1. Budget Adherence (30%)
    2. License Utilization Rates (40%)
    3. Portfolio Clutter & Overlap Penalty (30%)
    """
    if subscriptions is None:
        subscriptions = []

    # 1. Budget Adherence (Max 30 points)
    budget_score = 30.0
    if total_budget > 0:
        ratio = total_expenses / total_budget
        if ratio <= 0.85:
            budget_score = 30.0
        elif ratio <= 1.0:
            budget_score = 25.0
        elif ratio <= 1.15:
            budget_score = 15.0
        else:
            budget_score = max(0.0, 15.0 - (ratio - 1.15) * 50)
    else:
        budget_score = 20.0 # Standard score if no budget set

    # 2. License Utilization Rates (Max 40 points)
    utilization_score = 40.0
    if subscriptions:
        total_util = sum(float(sub.get('utilizationRate', 1.0)) for sub in subscriptions)
        avg_util = total_util / len(subscriptions)
        utilization_score = avg_util * 40.0
    
    # 3. Portfolio Overlap/Clutter Index (Max 30 points)
    # Penalizes duplicate tools in same categories (e.g. Collaboration, DevTools)
    overlap_score = 30.0
    category_counts = {}
    underutilized_count = 0
    
    for sub in subscriptions:
        cat = sub.get('category', 'Other')
        category_counts[cat] = category_counts.get(cat, 0) + 1
        
        # Count underutilized subscriptions (< 30%)
        if float(sub.get('utilizationRate', 1.0)) < 0.30:
            underutilized_count += 1
            
    # Deduct points for duplicates (more than 2 in Collaboration, DevTools, Entertainment)
    overlap_penalty = 0.0
    overlap_categories = ['Collaboration', 'DevTools', 'Entertainment']
    for cat in overlap_categories:
        count = category_counts.get(cat, 0)
        if count > 1:
            overlap_penalty += (count - 1) * 5.0 # Deduct 5 points per duplicate tool
            
    # Deduct for neglected/underutilized tools
    overlap_penalty += underutilized_count * 5.0
    
    overlap_score = max(5.0, 30.0 - overlap_penalty)

    total_score = int(round(budget_score + utilization_score + overlap_score))
    total_score = min(100, max(0, total_score))
    
    # Qualitative label
    if total_score >= 85:
        rating = "Excellent"
    elif total_score >= 70:
        rating = "Good"
    elif total_score >= 50:
        rating = "Fair"
    else:
        rating = "Needs Attention"
        
    return {
        "score": total_score,
        "rating": rating,
        "breakdown": {
            "savings_score": float(round(utilization_score, 1)), # Map to savings_score for UI
            "budget_score": float(round(budget_score, 1)),
            "spending_mix_score": float(round(overlap_score, 1)) # Map to spending_mix_score
        }
    }

def generate_insights_and_recommendations(total_income, total_expenses, total_budget, category_expenses, category_budgets, subscriptions=None, billings=None):
    """
    Generates SaaS specific insights, cancels low-utilization licenses, and detects pricing anomalies.
    """
    if subscriptions is None:
        subscriptions = []
    if billings is None:
        billings = []
        
    insights = []
    recommendations = []
    
    # General monthly cost insight
    insights.append(f"Your monthly SaaS subscription cost is currently running at ₹{total_expenses:,.2f}/month.")
    
    # Budget Cap Compliance
    if total_budget > 0:
        if total_expenses > total_budget:
            overage = total_expenses - total_budget
            insights.append(f"Total software subscriptions exceed your budget cap by ₹{overage:,.2f} this month.")
            recommendations.append("Audit and cancel low-utilization tools immediately to bring your total SaaS spend below the budget limit.")
        else:
            savings = total_budget - total_expenses
            insights.append(f"You have a budget buffer of ₹{savings:,.2f} before hitting your SaaS spending cap.")
            
    # Category breakdown top spend
    if category_expenses:
        top_cat = max(category_expenses, key=category_expenses.get)
        top_amount = category_expenses[top_cat]
        insights.append(f"Your highest spending category is '{top_cat}', accounting for ₹{top_amount:,.2f}/month.")
        
    # Overlapping Categories Check (Collaboration and DevTools)
    categories_to_check = ['Collaboration', 'DevTools', 'Entertainment']
    for cat in categories_to_check:
        cat_subs = [sub for sub in subscriptions if sub.get('category') == cat]
        if len(cat_subs) > 1:
            insights.append(f"Found {len(cat_subs)} active tools in the '{cat}' category: " + ", ".join([s.get('name') for s in cat_subs]) + ".")
            recommendations.append(f"Overlapping licenses in '{cat}'. Consolidate onto a single platform (e.g. migrate Zoom licenses to Slack/Teams) to save costs.")

    # Under-utilized tools check
    neglected_count = 0
    for sub in subscriptions:
        util = float(sub.get('utilizationRate', 1.0))
        name = sub.get('name')
        price = float(sub.get('amount', 0.0))
        cycle = sub.get('billingCycle', 'MONTHLY')
        
        if util < 0.25:
            neglected_count += 1
            cycle_label = "/month" if cycle == 'MONTHLY' else "/year"
            insights.append(f"Subscription '{name}' shows critical low utilization ({util*100:.0f}%).")
            recommendations.append(f"Cancel unused license: '{name}' (₹{price:,.2f}{cycle_label}) has negligible feature utilization.")
            
    # Billing Anomalies (price hikes or double chargers) using payment history
    if billings:
        # Group billing history by subscription name
        history = {}
        for bill in billings:
            name = bill.get('subscription_name')
            if name:
                history.setdefault(name, []).append(bill)
                
        # Look for anomalies in the past 2 months
        for name, bills in history.items():
            # Sort by date descending
            bills.sort(key=lambda x: x.get('date'), reverse=True)
            if len(bills) >= 2:
                latest_amt = float(bills[0].get('amount', 0.0))
                prev_amt = float(bills[1].get('amount', 0.0))
                
                # Check for double charge (exactly double) or price hike
                if latest_amt >= 1.5 * prev_amt:
                    if latest_amt == 2.0 * prev_amt:
                        insights.append(f"Billing Alert: Detected potential duplicate/double charge on '{name}' (₹{latest_amt:,.2f} vs previous ₹{prev_amt:,.2f}).")
                        recommendations.append(f"Contact support for '{name}' to dispute a potential double-billing charge.")
                    else:
                        hike = latest_amt - prev_amt
                        insights.append(f"Billing Alert: Subscription cost for '{name}' increased by ₹{hike:,.2f} (₹{latest_amt:,.2f} vs ₹{prev_amt:,.2f}).")
                        recommendations.append(f"Verify if you upgraded your tier for '{name}' or if an automatic price increase occurred.")

    if not recommendations:
        recommendations.append("Track login usage monthly to capture subscription bloat and keep average utilization above 80%.")

    return {
        "insights": insights,
        "recommendations": recommendations
    }
