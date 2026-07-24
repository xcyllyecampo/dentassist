$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DentAssist - Starting All Services   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Kill anything on our ports ---
Write-Host "[1/4] Cleaning up old processes..." -ForegroundColor Yellow
foreach ($port in @(3000, 5000, 8000)) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Write-Host "  -> Killed process on port $port" -ForegroundColor DarkGray
    }
}
Start-Sleep -Seconds 1
Write-Host "  -> Ports cleared" -ForegroundColor Green
Write-Host ""

# --- PostgreSQL ---
Write-Host "[2/4] Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" } | Select-Object -First 1
if ($pgService) {
    Write-Host "  -> PostgreSQL is running ($($pgService.Name))" -ForegroundColor Green
} else {
    Write-Host "  -> Starting PostgreSQL service..." -ForegroundColor Yellow
    Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Start-Service -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-Host "  -> PostgreSQL started" -ForegroundColor Green
}

$env:PGPASSWORD = "postgres"
$psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psqlPath) {
    $pgDirs = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    foreach ($dir in $pgDirs) {
        $candidate = Join-Path $dir.FullName "bin\psql.exe"
        if (Test-Path $candidate) { $psqlPath = $candidate; break }
    }
}
if (-not $psqlPath) {
    Write-Host "  -> psql not found, skipping database check" -ForegroundColor DarkGray
} else {
    $dbExists = & $psqlPath -U postgres -h localhost -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='dental_assist'" 2>$null
    if ($dbExists -ne "1") {
        Write-Host "  -> Creating dental_assist database..." -ForegroundColor Yellow
        & $psqlPath -U postgres -h localhost -d postgres -c "CREATE DATABASE dental_assist;" 2>$null
        Write-Host "  -> Database created" -ForegroundColor Green
    }
    Write-Host "  -> Database ready" -ForegroundColor Green
}
Write-Host ""

# --- Start all services ---
Write-Host "[3/4] Starting all services in one terminal..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Frontend:   http://localhost:3000    " -ForegroundColor White
Write-Host "   Backend:    http://localhost:5000    " -ForegroundColor White
Write-Host "   AI Service: http://localhost:8000    " -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop all services   " -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npx concurrently --names "ai,server,client" --prefix-colors "yellow,magenta,cyan" "cd ai-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload" "cd server && npx nodemon index.js" "cd client && npm run dev"
