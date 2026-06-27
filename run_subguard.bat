@echo off
echo ===================================================
echo Starting SubGuard SaaS Cost Optimizer (Local Deploy)
echo ===================================================

:: Ensure data directory exists
if not exist "%CD%\database_data" (
    echo [1/5] Creating database directory...
    mkdir "%CD%\database_data"
    echo [2/5] Initializing database engine...
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --initialize-insecure --datadir="%CD%\database_data"
    ping 127.0.0.1 -n 4 >nul
)

echo [3/5] Starting MySQL Server on port 3307...
start /B "MySQL 3307" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="%CD%\database_data" --port=3307 --shared-memory
ping 127.0.0.1 -n 6 >nul

:: Seed database (runs python helper)
echo [4/5] Running schema migration and seeding...
python seed_db.py
ping 127.0.0.1 -n 3 >nul

:: Start AI Service
echo [5/5] Starting Flask AI Service on port 5005...
cd ai
start /B "Flask AI" python app.py
cd ..
ping 127.0.0.1 -n 3 >nul

:: Start Backend
echo Starting Python Flask Backend on port 8080...
cd backend_flask
start /B "Flask Backend" python app.py
cd ..
ping 127.0.0.1 -n 6 >nul

:: Start Frontend
echo Starting React Frontend on port 3000...
cd frontend
start "Vite React UI" npm run dev
cd ..

echo ===================================================
echo All services launched!
echo Access the site at: http://localhost:3000/
echo Seeded login: john_doe / password123
echo ===================================================
echo SubGuard services setup complete.
