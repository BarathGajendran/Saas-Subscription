# SmartSpend Application Setup Instructions

This document provides step-by-step instructions to initialize the database, launch the Python AI service, compile the Spring Boot backend, and start the React frontend.

---

## Prerequisites

Ensure you have the following installed on your system:
* **Java SDK 17** (or higher)
* **Node.js** (v18 or higher) & **npm**
* **Python 3.10** (or higher) & **pip**
* **MySQL Database / MariaDB** (e.g., via XAMPP, Docker, or native installer)

---

## 1. Database Setup

1. Start your local MySQL server (port `3306`).
2. Open your preferred database client (e.g., MySQL Workbench, phpMyAdmin, DBeaver, or via terminal).
3. Execute the schema definition script to create the database and tables:
   * **Script Path**: `database/schema.sql`
4. Execute the seeding script to populate the database with test data:
   * **Script Path**: `database/seeds.sql`

*Note: The seeded database creates a default user with username `john_doe` and password `password123`.*

---

## 2. Python AI Service Launch

The AI Service is a Flask API providing linear regression prediction models, score ratings, and savings recommendations on port `5000`.

1. Open a terminal and navigate to the `ai` directory:
   ```bash
   cd ai
   ```
2. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (Command Prompt)
   venv\Scripts\activate
   # On Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask microservice:
   ```bash
   python app.py
   ```
5. Confirm it is running by hitting `http://localhost:5000/health` in your browser.

---

## 3. Spring Boot Backend Launch

The backend service runs on port `8080` and acts as the orchestrator.

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Verify that the MySQL credentials in `src/main/resources/application.properties` match your local MySQL configuration:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=
   ```
3. Run the Spring Boot application.
   * If you have **Maven** globally installed:
     ```bash
     mvn spring-boot:run
     ```
   * Or run it through your preferred IDE (IntelliJ IDEA, Eclipse, VS Code) by launching the main class `com.smartspend.api.SmartSpendApplication`.

---

## 4. React Frontend Launch

The React UI runs on port `5173` and communicates with the backend on port `8080`.

1. Open a terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local client address:
   * **URL**: `http://localhost:5173`

---

## 5. Live Demonstration & Verification

1. On the Login screen, use the seeded credentials:
   * **Username**: `john_doe` (or Email: `john@example.com`)
   * **Password**: `password123`
2. You will be redirected to the **Dashboard**, displaying charts populated by the seeded financial records.
3. Click on **AI ML Insights** in the sidebar to review the Linear Regression spending prediction, Health Score, and savings advice loaded from the Python ML service.
4. Try adding new expenses or incomes in the **Expense Manager** or **Income Tracking** sections, and observe the charts and budget utilization progress bar update in real-time.
