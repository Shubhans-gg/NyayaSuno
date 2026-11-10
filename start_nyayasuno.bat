@echo off
echo ===================================================================
echo             STARTING NYAYASUNO APPLICATION (FULL-STACK)
echo ===================================================================
echo 1. Starting FastAPI Backend Server on http://127.0.0.1:8000 ...
start "NyayaSuno Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo 2. Starting Vite Frontend Server on http://localhost:5173 ...
start "NyayaSuno Frontend" cmd /k "cd frontend && npm run dev"

echo ===================================================================
echo  NyayaSuno is launching!
echo  Backend Docs:  http://127.0.0.1:8000/docs
echo  Frontend App:  http://localhost:5173
echo ===================================================================
pause

