# Deploy Firestore Rules - Teacher Access Fix
# This script deploys updated Firestore rules that allow teachers to list users

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIRESTORE RULES DEPLOYMENT" -ForegroundColor Cyan
Write-Host "  Teacher Access Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
$projects = firebase projects:list 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not logged in to Firebase!" -ForegroundColor Red
    Write-Host "Run: firebase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Authenticated" -ForegroundColor Green
Write-Host ""

# Show current project
Write-Host "Current Firebase project:" -ForegroundColor Yellow
firebase use
Write-Host ""

# Confirm deployment
Write-Host "This will deploy the following changes:" -ForegroundColor Yellow
Write-Host "  • Allow teachers to list users collection (getDocs)" -ForegroundColor White
Write-Host "  • Allow enterprise admins to list users collection" -ForegroundColor White
Write-Host "  • Teachers can then see students from their institution" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Deploy Firestore rules? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Deploying Firestore rules..." -ForegroundColor Cyan

# Deploy rules
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Teachers can now:" -ForegroundColor Green
    Write-Host "  ✓ List users from their institution" -ForegroundColor White
    Write-Host "  ✓ View students in enterprise dashboard" -ForegroundColor White
    Write-Host "  ✓ Access grade book and analytics" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test teacher login" -ForegroundColor White
    Write-Host "  2. Verify students appear in dashboard" -ForegroundColor White
    Write-Host "  3. Check console for any errors" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error message above." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  • Syntax error in firestore.rules" -ForegroundColor White
    Write-Host "  • Not logged in to Firebase" -ForegroundColor White
    Write-Host "  • Wrong project selected" -ForegroundColor White
    exit 1
}
