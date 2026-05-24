$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

npm run papers:discover
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run papers:triage
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run papers:review
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run papers:daily
exit $LASTEXITCODE
