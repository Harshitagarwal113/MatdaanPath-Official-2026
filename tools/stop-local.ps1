$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "[stop-local] $Message"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$pidFile = Join-Path $repoRoot ".local-dev.pids.json"

if (-not (Test-Path $pidFile)) {
  Write-Step "No PID file found. Nothing to stop."
  exit 0
}

$pidData = Get-Content -Raw $pidFile | ConvertFrom-Json

foreach ($processId in @($pidData.backend_pid, $pidData.frontend_pid)) {
  if (-not $processId) { continue }
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $processId -Force
    Write-Step "Stopped PID $processId."
  }
}

Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
Write-Step "Local services stopped."
