# SmartSpend REST API Documentation

This document describes the REST APIs exposed by the Spring Boot backend on port `8080`.

All endpoints require the HTTP Header `Authorization: Bearer <JWT_TOKEN>` unless specified as **Public**.

---

## Authentication Service (`/api/auth`)

### 1. User Registration [Public]
* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```
* **Response (201 Created)**:
```json
{
  "message": "User registered successfully!"
}
```
* **Response (400 Bad Request)**:
```json
{
  "error": "Username is already taken!"
}
```

### 2. User Login [Public]
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Request Body**:
```json
{
  "usernameOrEmail": "john_doe",
  "password": "password123"
}
```
* **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com"
}
```
* **Response (401 Unauthorized)**:
```json
{
  "error": "Invalid username/email or password."
}
```

---

## Expense Management Service (`/api/expenses`)

### 1. Get All User Expenses
* **URL**: `/api/expenses`
* **Method**: `GET`
* **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "category": "Food",
    "amount": 150.00,
    "description": "Weekly grocery run",
    "date": "2026-06-03"
  }
]
```

### 2. Log New Expense
* **URL**: `/api/expenses`
* **Method**: `POST`
* **Request Body**:
```json
{
  "category": "Food",
  "amount": 150.00,
  "description": "Weekly grocery run",
  "date": "2026-06-03"
}
```
* **Response (201 Created)**: Returns the saved expense object including `id`.

### 3. Modify Expense
* **URL**: `/api/expenses/{id}`
* **Method**: `PUT`
* **Request Body**: Same as POST.
* **Response (200 OK)**: Returns the updated expense object.

### 4. Delete Expense
* **URL**: `/api/expenses/{id}`
* **Method**: `DELETE`
* **Response (200 OK)**:
```json
{
  "message": "Expense deleted successfully."
}
```

---

## Income Management Service (`/api/income`)

### 1. Get All Income Records
* **URL**: `/api/income`
* **Method**: `GET`

### 2. Log Income
* **URL**: `/api/income`
* **Method**: `POST`
* **Request Body**:
```json
{
  "amount": 5000.00,
  "description": "Monthly Salary",
  "date": "2026-06-01"
}
```

### 3. Update Income
* **URL**: `/api/income/{id}`
* **Method**: `PUT`

### 4. Delete Income
* **URL**: `/api/income/{id}`
* **Method**: `DELETE`

---

## Budget Management Service (`/api/budgets`)

### 1. Get Budgets for Month
* **URL**: `/api/budgets?month=2026-06`
* **Method**: `GET`
* **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "category": "TOTAL",
    "amount": 3500.00,
    "month": "2026-06"
  },
  {
    "id": 2,
    "category": "Food",
    "amount": 600.00,
    "month": "2026-06"
  }
]
```

### 2. Create or Update Budget Limit
* **URL**: `/api/budgets`
* **Method**: `POST`
* **Request Body**:
```json
{
  "category": "Food",
  "amount": 600.00,
  "month": "2026-06"
}
```
* **Response (201 Created)**: Returns the saved budget object.

### 3. Remove Budget Target
* **URL**: `/api/budgets/{id}`
* **Method**: `DELETE`

---

## Dashboard Summary Service (`/api/dashboard`)

### 1. Fetch Aggregated Metrics
* **URL**: `/api/dashboard?month=2026-06`
* **Method**: `GET`
* **Response (200 OK)**:
```json
{
  "totalIncome": 5750.00,
  "totalExpenses": 2590.00,
  "savings": 3160.00,
  "budgetUtilization": 74.0,
  "categoryExpenses": {
    "Bills": 950.00,
    "Food": 530.00,
    "Shopping": 600.00,
    "Travel": 240.00,
    "Healthcare": 45.00,
    "Education": 120.00
  },
  "categoryBudgets": {
    "Food": 700.00,
    "Shopping": 600.00,
    "Bills": 1100.00,
    "Travel": 500.00,
    "Healthcare": 200.00,
    "Education": 200.00
  },
  "budgetAlerts": [
    "Category 'Shopping' is approaching its budget limit (80%+ utilized)."
  ]
}
```

---

## AI Analytics Service (`/api/ai`)

### 1. Get Prediction, Health Rating & Actionable Recommendations
* **URL**: `/api/ai/insights`
* **Method**: `GET`
* **Response (200 OK)**:
```json
{
  "predictedExpense": 3530.0,
  "isPredictionFallback": false,
  "predictionMessage": "Prediction based on 4 months of historical data.",
  "healthScore": 85,
  "healthRating": "Excellent",
  "healthBreakdown": {
    "savings_score": 40.0,
    "budget_score": 25.0,
    "spending_mix_score": 20.0
  },
  "insights": [
    "Your savings rate is 55.0% this month, yielding a surplus of $3,160.00.",
    "Your highest spending category is 'Bills', accounting for $950.00 (36.7% of all expenses)."
  ],
  "recommendations": [
    "Excellent savings rate! Consider allocating a portion of your surplus to long-term investments or high-yield savings accounts.",
    "Consistently log all cash transactions daily to capture minor leakages like coffee, quick snacks, or ridesharing."
  ]
}
```
