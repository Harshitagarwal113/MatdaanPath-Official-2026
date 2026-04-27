param(
  [switch]$SkipBootstrap,
  [switch]$ForceStaticFrontend
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "[start-local] $Message"
}

function Wait-HttpOk([string]$Url, [int]$TimeoutSeconds = 30) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 600
    }
  }
  return $false
}

function Test-PortInUse([int]$Port) {
  $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {
    $_.LocalPort -eq $Port
  }
  return ($listeners | Select-Object -First 1) -ne $null
}

function Get-AvailablePort([int]$PreferredPort, [int]$MaxAttempts = 20) {
  for ($offset = 0; $offset -lt $MaxAttempts; $offset++) {
    $candidate = $PreferredPort + $offset
    if (-not (Test-PortInUse -Port $candidate)) {
      return $candidate
    }
  }
  throw "Could not find an available port starting from $PreferredPort."
}

function Ensure-FrontendEnv([string]$FrontendDir, [int]$BackendPort) {
  $envFile = Join-Path $FrontendDir ".env.local"
  $apiLine = "NEXT_PUBLIC_API_URL=http://localhost:$BackendPort"

  if (-not (Test-Path $envFile)) {
    Set-Content -Path $envFile -Value $apiLine -Encoding ascii
    return
  }

  $content = Get-Content -Raw $envFile
  if ($content -notmatch "(?m)^NEXT_PUBLIC_API_URL=") {
    Add-Content -Path $envFile -Value "`n$apiLine"
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"
$pidFile = Join-Path $repoRoot ".local-dev.pids.json"
$backendPort = Get-AvailablePort -PreferredPort 8000
$frontendPort = Get-AvailablePort -PreferredPort 3000

if (-not (Test-Path $pythonExe)) {
  throw "Backend virtual environment is missing. Expected: $pythonExe"
}

if (Test-Path $pidFile) {
  Write-Step "Existing PID file found. Stopping old processes first."
  & (Join-Path $scriptDir "stop-local.ps1")
}

if (-not $SkipBootstrap) {
  Write-Step "Running backend bootstrap (migrations + seed)."
  Push-Location $backendDir
  try {
    & $pythonExe "scripts\bootstrap.py"
  } finally {
    Pop-Location
  }
}

$backendOut = Join-Path $backendDir "local.backend.out.log"
$backendErr = Join-Path $backendDir "local.backend.err.log"
Remove-Item $backendOut, $backendErr -ErrorAction SilentlyContinue

Write-Step "Starting backend on http://localhost:$backendPort."
$backendProc = Start-Process -FilePath $pythonExe `
  -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "$backendPort") `
  -WorkingDirectory $backendDir `
  -RedirectStandardOutput $backendOut `
  -RedirectStandardError $backendErr `
  -PassThru

if (-not (Wait-HttpOk -Url "http://127.0.0.1:$backendPort/health" -TimeoutSeconds 35)) {
  $backendLog = if (Test-Path $backendErr) { Get-Content -Raw $backendErr } else { "" }
  throw "Backend failed to start on port $backendPort.`n$backendLog"
}

Ensure-FrontendEnv -FrontendDir $frontendDir -BackendPort $backendPort

$frontendMode = "next-dev"
$frontendOut = Join-Path $frontendDir "local.frontend.out.log"
$frontendErr = Join-Path $frontendDir "local.frontend.err.log"
Remove-Item $frontendOut, $frontendErr -ErrorAction SilentlyContinue

if (-not $ForceStaticFrontend) {
  Write-Step "Starting frontend Next.js dev server on http://localhost:$frontendPort."
  $frontendProc = Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "--port", "$frontendPort") `
    -WorkingDirectory $frontendDir `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError $frontendErr `
    -PassThru

  $frontendOk = Wait-HttpOk -Url "http://127.0.0.1:$frontendPort" -TimeoutSeconds 35
  if (-not $frontendOk) {
    $frontendLog = if (Test-Path $frontendErr) { Get-Content -Raw $frontendErr } else { "" }
    if ($frontendLog -match "spawn EPERM") {
      Write-Step "Detected spawn EPERM. Falling back to static frontend from /frontend/out."
      if (Get-Process -Id $frontendProc.Id -ErrorAction SilentlyContinue) {
        Stop-Process -Id $frontendProc.Id -Force
      }
      $frontendMode = "static-fallback"
      $frontendProc = $null
    } else {
      throw "Frontend failed to start on port 3000.`n$frontendLog"
    }
  }
}

if ($ForceStaticFrontend -or $frontendMode -eq "static-fallback") {
  $staticOut = Join-Path $frontendDir "local.frontend.static.out.log"
  $staticErr = Join-Path $frontendDir "local.frontend.static.err.log"
  Remove-Item $staticOut, $staticErr -ErrorAction SilentlyContinue

  $frontendProc = Start-Process -FilePath $pythonExe `
    -ArgumentList @("-m", "http.server", "$frontendPort", "--directory", (Join-Path $frontendDir "out")) `
    -WorkingDirectory $frontendDir `
    -RedirectStandardOutput $staticOut `
    -RedirectStandardError $staticErr `
    -PassThru
  $frontendMode = "static-fallback"

  if (-not (Wait-HttpOk -Url "http://127.0.0.1:$frontendPort" -TimeoutSeconds 20)) {
    $staticLog = if (Test-Path $staticErr) { Get-Content -Raw $staticErr } else { "" }
    throw "Static fallback frontend failed to start on port $frontendPort.`n$staticLog"
  }
}

$pidData = @{
  backend_pid = $backendProc.Id
  frontend_pid = $frontendProc.Id
  frontend_mode = $frontendMode
  backend_url = "http://localhost:$backendPort"
  frontend_url = "http://localhost:$frontendPort"
}
$pidData | ConvertTo-Json | Set-Content -Path $pidFile -Encoding utf8

Write-Step "Backend running: http://localhost:$backendPort"
Write-Step "Frontend running: http://localhost:$frontendPort ($frontendMode)"
Write-Step "Use tools/stop-local.ps1 to stop both processes."
