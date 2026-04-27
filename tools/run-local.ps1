param(
  [switch]$SkipBootstrap,
  [switch]$ForceStaticFrontend
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$startScript = Join-Path $scriptDir "start-local.ps1"
$stopScript = Join-Path $scriptDir "stop-local.ps1"
$pidFile = Join-Path (Split-Path -Parent $scriptDir) ".local-dev.pids.json"

try {
  $startArgs = @()
  if ($SkipBootstrap) {
    $startArgs += "-SkipBootstrap"
  }
  if ($ForceStaticFrontend) {
    $startArgs += "-ForceStaticFrontend"
  }

  & $startScript @startArgs
  $runtimeUrls = @{
    frontend = "http://localhost:3000"
    backend = "http://localhost:8000"
  }
  if (Test-Path $pidFile) {
    try {
      $pidData = Get-Content -Raw $pidFile | ConvertFrom-Json
      if ($pidData.frontend_url) {
        $runtimeUrls.frontend = $pidData.frontend_url
      }
      if ($pidData.backend_url) {
        $runtimeUrls.backend = $pidData.backend_url
      }
    } catch {
      # Keep defaults if pid file parsing fails.
    }
  }

  Write-Host ""
  Write-Host "[run-local] Services are running."
  Write-Host "[run-local] Frontend: $($runtimeUrls.frontend)"
  Write-Host "[run-local] Backend : $($runtimeUrls.backend)"
  Write-Host "[run-local] Press ENTER to stop."
  Read-Host | Out-Null
}
finally {
  & $stopScript
}
