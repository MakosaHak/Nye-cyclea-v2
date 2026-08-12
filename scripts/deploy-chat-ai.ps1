# Deploiement NyeAI (Edge Function chat-ai + Gemini)
# Executer dans PowerShell depuis la racine du projet :
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\scripts\deploy-chat-ai.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Nye Cyclea - Deploiement NyeAI Gemini ===" -ForegroundColor Magenta
Write-Host ""

# Supabase CLI (npm global, avec certificats systeme si besoin)
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host "Installation Supabase CLI..." -ForegroundColor Yellow
  $env:NODE_OPTIONS = "--use-system-ca"
  npm install -g supabase
}

Write-Host "CLI version: $(supabase --version)" -ForegroundColor Gray

# Project ref depuis .env
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) {
  throw "Fichier .env introuvable. Cree-le avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY."
}

$urlLine = Select-String -Path $envFile -Pattern "^\s*VITE_SUPABASE_URL=(.+)$" | Select-Object -First 1
if (-not $urlLine) { throw "VITE_SUPABASE_URL manquant dans .env" }

$projectRef = ($urlLine.Matches.Groups[1].Value.Trim() -replace '^https?://', '' -replace '\.supabase\.co.*$', '')
Write-Host "Project ref detecte : $projectRef" -ForegroundColor Cyan

# 1. Connexion (ouvre le navigateur)
Write-Host "`n[1/4] Connexion Supabase — le navigateur va s'ouvrir..." -ForegroundColor Yellow
supabase login
if ($LASTEXITCODE -ne 0) { throw "supabase login a echoue" }

# 2. Lier le projet
Write-Host "`n[2/4] Liaison du projet..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..")
supabase link --project-ref $projectRef
if ($LASTEXITCODE -ne 0) { throw "supabase link a echoue" }

# 3. Secret Gemini (saisie masquee)
Write-Host "`n[3/4] Cle Gemini (Google AI Studio)" -ForegroundColor Yellow
Write-Host "      https://aistudio.google.com/apikey" -ForegroundColor Gray
$geminiKey = Read-Host "Colle ta GEMINI_API_KEY (non affichee)" -AsSecureString
$geminiPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey)
)
if ([string]::IsNullOrWhiteSpace($geminiPlain)) { throw "Cle Gemini vide" }

supabase secrets set "GEMINI_API_KEY=$geminiPlain"
if ($LASTEXITCODE -ne 0) { throw "supabase secrets set a echoue" }
Write-Host "Secret GEMINI_API_KEY configure." -ForegroundColor Green

# Effacer la cle de la memoire
$geminiPlain = $null

# 4. Deploy
Write-Host "`n[4/4] Deploiement Edge Function chat-ai..." -ForegroundColor Yellow
supabase functions deploy chat-ai
if ($LASTEXITCODE -ne 0) { throw "supabase functions deploy a echoue" }

Write-Host "`n=== Termine ! ===" -ForegroundColor Green
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host "  1. npm run build"
Write-Host "  2. Glisser le dossier build/ sur Netlify"
Write-Host "  3. Tester NyeAI avec un compte Pro`n"
