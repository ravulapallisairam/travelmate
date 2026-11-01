# Pre-push safety check for TravelMate. Read-only: never prints secret values, never pushes.
# Run from anywhere: powershell -ExecutionPolicy Bypass -File .\scripts\pre-push-check.ps1

$ErrorActionPreference = "Continue"
Set-Location (Split-Path -Parent $PSScriptRoot)

$script:problems = 0
function Section($t) { Write-Host "`n== $t ==" -ForegroundColor Cyan }
function Ok($t)      { Write-Host "  OK    $t" -ForegroundColor Green }
function Warn($t)    { Write-Host "  CHECK $t" -ForegroundColor Yellow }
function Bad($t)     { Write-Host "  FAIL  $t" -ForegroundColor Red; $script:problems++ }

if (-not (Test-Path ".git")) {
  Write-Host "Run this from inside the TravelMate repo (no .git folder found)." -ForegroundColor Red
  exit 1
}

# 1. .env files must never be tracked or appear in history
Section "1. .env files in git"
$tracked = @(git ls-files | Where-Object { $_ -match '(^|/)\.env$' })
if ($tracked.Count -gt 0) {
  Bad "Tracked right now: $($tracked -join ', ')  (fix: git rm --cached <file>)"
} else {
  Ok "No .env file is currently tracked"
}
$history = @(git log --all --full-history --oneline -- '*.env' | Where-Object { $_ })
if ($history.Count -gt 0) {
  Bad "A .env file appears in history ($($history.Count) commit(s)). Rotate the Gemini, OpenWeather, Gmail and Resend keys."
  $history | Select-Object -First 5 | ForEach-Object { Write-Host "        $_" }
} else {
  Ok "No .env file has ever been committed"
}

# 2. Odd-looking files that 'git add .' would commit
Section "2. Odd-looking files"
$changed = @(git status --porcelain --untracked-files=all | Where-Object { $_ } | ForEach-Object { $_.Substring(3).Trim('"') })
$odd = @($changed | Where-Object { [System.IO.Path]::GetFileName($_) -match '[`$\{\}\(\)\[\];=,]' })
if ($odd.Count -gt 0) {
  Warn "These look like accidents from a pasted command. Open each one and delete it if it is a fragment:"
  $odd | ForEach-Object { Write-Host "        $_" }
} else {
  Ok "No odd-looking file names"
}

# 3. Mass-assignment patterns in controllers
Section "3. Mass-assignment patterns in backend controllers"
$patterns = 'Object\.assign\([^)]*req\.body', '\.create\(\s*req\.body', 'new\s+\w+\(\s*req\.body', 'find\w*AndUpdate\([^;]*req\.body', '\.\.\.req\.body'
$hits = @(Select-String -Path "backend\controllers\*.js" -Pattern $patterns)
if ($hits.Count -gt 0) {
  Warn "Review these. Each one lets a client set any field, including the owner:"
  $hits | ForEach-Object { Write-Host "        $($_.Filename):$($_.LineNumber)  $($_.Line.Trim())" }
} else {
  Ok "No raw req.body writes found"
}

# 4. Secrets referenced in frontend code
Section "4. Secrets in frontend source"
$leaks = @(Get-ChildItem "travelmate\src" -Recurse -Include *.js,*.jsx -ErrorAction SilentlyContinue |
  Select-String -Pattern 'GEMINI|OPENWEATHER|RESEND|API_KEY|apikey')
if ($leaks.Count -gt 0) {
  Bad "Possible secret references in the frontend:"
  $leaks | ForEach-Object { Write-Host "        $($_.Filename):$($_.LineNumber)" }
} else {
  Ok "No secret names found in travelmate/src"
}

# 5. Backend tests
Section "5. Backend tests"
Push-Location backend
$testOut = npm test 2>&1 | Out-String
$testCode = $LASTEXITCODE
Pop-Location
($testOut -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -Last 10) | ForEach-Object { Write-Host "        $_" }
if ($testCode -eq 0) { Ok "npm test passed" } else { Bad "npm test failed (exit code $testCode). Paste the full output." }

# 6. Push state
Section "6. Push state"
$dirty = @(git status --porcelain | Where-Object { $_ })
$unpushed = @(git log --oneline origin/main..HEAD 2>$null | Where-Object { $_ })
Write-Host "        Uncommitted changes: $($dirty.Count)"
Write-Host "        Commits not pushed:  $($unpushed.Count)"

Write-Host ""
if ($script:problems -eq 0) {
  Write-Host "No blocking problems. Review any CHECK lines above, then commit and push." -ForegroundColor Green
} else {
  Write-Host "$($script:problems) blocking problem(s). Fix the FAIL lines before pushing." -ForegroundColor Red
}