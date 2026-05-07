# Deploy Firestore Rules for Quiz Builder
# Run this script to deploy the updated security rules

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Quiz Builder - Deploy Firestore Rules" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Deploying Firestore security rules..." -ForegroundColor Yellow
Write-Host ""

try {
    firebase deploy --only firestore:rules
    
    Write-Host ""
    Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "New rules include:" -ForegroundColor Cyan
    Write-Host "  • Quiz collection permissions" -ForegroundColor White
    Write-Host "  • Quiz attempts collection permissions" -ForegroundColor White
    Write-Host "  • Institution-based access control" -ForegroundColor White
    Write-Host "  • Teacher/student/admin permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Quiz Builder is now ready to use!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Ensure Firebase CLI is installed: npm install -g firebase-tools" -ForegroundColor White
    Write-Host "  2. Login to Firebase: firebase login" -ForegroundColor White
    Write-Host "  3. Check firebase.json configuration" -ForegroundColor White
    Write-Host "  4. Verify you have permissions for the project" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
