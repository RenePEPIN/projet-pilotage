[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidAssignmentToAutomaticVariable', '', Justification='False positive from analyzer on this script.')]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidDefaultValueSwitchParameter', '', Justification='False positive from analyzer on this script.')]
param(
  [string]$HostAddress = "127.0.0.1",
  [int]$Port = 8001,
  [ValidateSet("reload", "no-reload")]
  [string]$ReloadMode = "reload"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $backendDir

# Charger les variables depuis backend/.env si present.
$envPath = Join-Path $backendDir ".env"
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
      [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
    }
  }
}

if (-not $env:WRITE_API_KEY) {
  throw "WRITE_API_KEY est obligatoire. Definis-la dans backend/.env ou dans l'environnement."
}

if (-not $env:DATABASE_URL) {
  $env:DATABASE_URL = "sqlite:///./data/api_tache.db"
}

$uvicorn = Join-Path $backendDir ".venv/Scripts/uvicorn.exe"
if (-not (Test-Path $uvicorn)) {
  throw "Uvicorn introuvable: $uvicorn"
}

$shouldReload = $ReloadMode -eq "reload"
$commandLine = '"main:app" --host "{0}" --port "{1}"' -f $HostAddress, $Port
if ($shouldReload) {
  $commandLine += " --reload"
}

Start-Process -FilePath $uvicorn -ArgumentList $commandLine -Wait -NoNewWindow
