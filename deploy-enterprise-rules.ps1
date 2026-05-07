# Enterprise Student Firebase Rules Deployment Script (PowerShell)
# This script deploys updated Firestore security rules with enterprise student support

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Enterprise Student Firebase Rules Deploy" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseCmd) {
    Write-Host "❌ Firebase CLI not found. Using npx..." -ForegroundColor Yellow
    $NPX_FIREBASE = "npx firebase-tools"
} else {
    Write-Host "✅ Firebase CLI found" -ForegroundColor Green
    $NPX_FIREBASE = "firebase"
}

Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor White
Write-Host "  - Updated helper functions for enterprise roles"
Write-Host "  - Added institution-based access control"
Write-Host "  - Implemented data isolation for enterprise students"
Write-Host "  - Maintained backward compatibility"
Write-Host ""

# Deploy rules
Write-Host "🚀 Deploying Firestore rules..." -ForegroundColor Yellow
Write-Host ""

# Execute deployment
$deployCmd = "$NPX_FIREBASE deploy --only firestore:rules"
Invoke-Expression $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "✅ Deployment Successful!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Verify rules in Firebase Console"
    Write-Host "  2. Test with different user roles"
    Write-Host "  3. Monitor Firebase logs for errors"
    Write-Host ""
    Write-Host "Testing checklist:" -ForegroundColor White
    Write-Host "  □ Enterprise student can access institution materials"
    Write-Host "  □ Enterprise student cannot access other institutions"
    Write-Host "  □ Teacher can view institution students"
    Write-Host "  □ Regular students can access public materials"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "❌ Deployment Failed" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Firebase authentication: firebase login"
    Write-Host "  2. Verify project: firebase use --add"
    Write-Host "  3. Check rules syntax in Firebase Console"
    Write-Host ""
    exit 1
}
