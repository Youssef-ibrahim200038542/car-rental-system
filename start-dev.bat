@echo off
REM Starts DriveX in three windows: Laravel API (8000), AI recommender (8001), Next.js site (3000).
REM One-time setup first: see README.md "Getting Started".
cd /d "%~dp0"

start "DriveX API - Laravel :8000" cmd /k "cd backend && php artisan serve --port 8000"

if exist ".venv\Scripts\python.exe" (
    start "DriveX AI - Python :8001" cmd /k ".venv\Scripts\python.exe -m uvicorn app:app --app-dir ML/service --port 8001"
) else (
    start "DriveX AI - Python :8001" cmd /k "python -m uvicorn app:app --app-dir ML/service --port 8001"
)

start "DriveX Web - Next.js :3000" cmd /k "cd frontend && npm run dev"

echo DriveX is starting. Open http://localhost:3000 once the three windows are ready.
