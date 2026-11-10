# Start NyayaSuno Backend and Frontend
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "            STARTING NYAYASUNO APPLICATION (FULL-STACK)            " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

Write-Host "1. Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "2. Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nNyayaSuno is launching!" -ForegroundColor Yellow
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend App:     http://localhost:5173" -ForegroundColor Yellow

