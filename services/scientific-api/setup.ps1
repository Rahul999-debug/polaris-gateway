# Setup script for Polaris RAG API
Write-Host "Setting up Polaris Scientific API..." -ForegroundColor Cyan

# Check if venv exists, if not create it
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install requirements
Write-Host "Installing dependencies (this might take a minute)..." -ForegroundColor Yellow
pip install -r requirements.txt

# Setup .env file
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "IMPORTANT: Please open the .env file and add your GOOGLE_API_KEY before running the server!" -ForegroundColor Red
} else {
    Write-Host ".env file already exists." -ForegroundColor Green
}

Write-Host "Setup complete! To run the server, ensure your GOOGLE_API_KEY is in the .env file, then run:" -ForegroundColor Cyan
Write-Host ".\venv\Scripts\activate" -ForegroundColor White
Write-Host "uvicorn main:app --reload --port 8000" -ForegroundColor White
