#!/bin/bash

# Enterprise Student Firebase Rules Deployment Script
# This script deploys updated Firestore security rules with enterprise student support

echo "=========================================="
echo "Enterprise Student Firebase Rules Deploy"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing via npx..."
    NPX_FIREBASE="npx firebase-tools"
else
    echo "✅ Firebase CLI found"
    NPX_FIREBASE="firebase"
fi

echo ""
echo "📋 Deployment Summary:"
echo "  - Updated helper functions for enterprise roles"
echo "  - Added institution-based access control"
echo "  - Implemented data isolation for enterprise students"
echo "  - Maintained backward compatibility"
echo ""

# Validate rules syntax
echo "🔍 Validating Firestore rules syntax..."
if $NPX_FIREBASE firestore:rules:validate firestore.rules 2>/dev/null; then
    echo "✅ Rules syntax is valid"
else
    echo "⚠️  Could not validate rules (continuing anyway)"
fi

echo ""
echo "🚀 Deploying Firestore rules..."
echo ""

# Deploy rules
$NPX_FIREBASE deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Deployment Successful!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "  1. Verify rules in Firebase Console"
    echo "  2. Test with different user roles"
    echo "  3. Monitor Firebase logs for errors"
    echo ""
    echo "Testing checklist:"
    echo "  □ Enterprise student can access institution materials"
    echo "  □ Enterprise student cannot access other institutions"
    echo "  □ Teacher can view institution students"
    echo "  □ Regular students can access public materials"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ Deployment Failed"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check Firebase authentication: firebase login"
    echo "  2. Verify project: firebase use --add"
    echo "  3. Check rules syntax: firebase firestore:rules:validate"
    echo ""
    exit 1
fi
