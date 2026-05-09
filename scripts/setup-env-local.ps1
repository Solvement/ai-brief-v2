param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$target = Join-Path (Get-Location) ".env.local"

if ((Test-Path $target) -and -not $Force) {
  Write-Host ".env.local already exists. Re-run with -Force to overwrite."
  exit 0
}

function Read-PlainSecret([string]$Prompt) {
  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

$deepseek = Read-PlainSecret "Paste DEEPSEEK_API_KEY"
$github = Read-PlainSecret "Paste GITHUB_TOKEN"
$embedding = Read-PlainSecret "Paste EMBEDDING_API_KEY"
$anthropic = Read-PlainSecret "Paste ANTHROPIC_API_KEY (optional, press Enter to skip)"

$lines = @(
  "# Local secrets for AI-brief. Do not commit.",
  "DEEPSEEK_API_KEY=$deepseek",
  "DEEPSEEK_BASE_URL=https://api.deepseek.com",
  "ANTHROPIC_API_KEY=$anthropic",
  "GITHUB_TOKEN=$github",
  "EMBEDDING_PROVIDER=openai",
  "EMBEDDING_API_KEY=$embedding",
  "EMBEDDING_MODEL=text-embedding-3-small",
  "EVALUATOR_PRIMARY_MODEL=deepseek-chat",
  "EVALUATOR_FALLBACK_MODEL=deepseek-chat",
  "EVALUATOR_MAX_INPUT_TOKENS=4000",
  "EVALUATOR_TIMEOUT_MS=30000",
  "EVALUATOR_MONTHLY_BUDGET_USD=50"
)

Set-Content -Path $target -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
Write-Host ".env.local written. Keys were not printed."
