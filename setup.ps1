# Project Setup Script
Write-Host "🚀 Setting up MediExpress Project..." -ForegroundColor Green
Write-Host ""

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Setup Backend
Write-Host ""
Write-Host "🔧 Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ Created backend/.env from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please update backend/.env with your Supabase credentials!" -ForegroundColor Red
}

npm install
Set-Location ..

# Setup Frontend
Write-Host ""
Write-Host "🎨 Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ Created frontend/.env from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please update frontend/.env with your Supabase credentials!" -ForegroundColor Red
}

npm install
Set-Location ..

Write-Host ""
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your Supabase credentials"
Write-Host "2. Update frontend/.env with your Supabase credentials"
Write-Host "3. Run 'npm run dev' to start both servers"
Write-Host ""
