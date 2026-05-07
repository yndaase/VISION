# Deploy Updated Firestore Rules for Hierarchical User Creation
# This script deploys the updated Firestore rules to Firebase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firestore Rules Deployment Script" -ForegroundColor Cyan
Write-Host "  Hierarchical User Creation System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI installation..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Firebase CLI first:" -ForegroundColor Yellow
    Write-Host "  npm install -g firebase-tools" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase CLI is installed" -ForegroundColor Green
Write-Host ""

# Check if user is logged in
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
$loginCheck = firebase login:list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged into Firebase!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logging in to Firebase..." -ForegroundColor Yellow
    firebase login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Firebase login failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Authenticated with Firebase" -ForegroundColor Green
Write-Host ""

# Show current project
Write-Host "Current Firebase project:" -ForegroundColor Yellow
firebase use

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying Firestore Rules" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Confirm deployment
Write-Host "This will deploy the updated Firestore rules with:" -ForegroundColor Yellow
Write-Host "  ✓ System admin can create enterprise accounts" -ForegroundColor White
Write-Host "  ✓ Enterprise admins can create teachers" -ForegroundColor White
Write-Host "  ✓ Enterprise admins can create students" -ForegroundColor White
Write-Host "  ✓ Institution isolation enforced" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Do you want to proceed? (y/n)"

if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Deploying Firestore rules..." -ForegroundColor Yellow

# Deploy rules
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test system admin creating enterprise account" -ForegroundColor White
    Write-Host "  2. Test enterprise admin creating teacher" -ForegroundColor White
    Write-Host "  3. Test enterprise admin creating student" -ForegroundColor White
    Write-Host "  4. Verify institution isolation" -ForegroundColor White
    Write-Host ""
    Write-Host "See DEPLOY_HIERARCHICAL_RULES.md for testing guide" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ Deployment Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check firestore.rules file for syntax errors" -ForegroundColor White
    Write-Host "  2. Verify you have permission to deploy" -ForegroundColor White
    Write-Host "  3. Check Firebase Console for error details" -ForegroundColor White
    Write-Host ""
    Write-Host "See DEPLOY_HIERARCHICAL_RULES.md for more help" -ForegroundColor Cyan
    exit 1
}
