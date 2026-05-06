# Paystack Payment Setup for Vision AI

## ✅ Setup Complete!

Your Paystack integration is now configured and ready to use.

---

## What's Been Configured

✅ **Public Key Added:** `pk_live_5cfb4e0d3f1a40de9ee4dbb7afb67107e7875155` in `vision-ai/pricing.js`
✅ **Secret Key Added:** In local `.env` file
⚠️ **Action Required:** Add secret key to Vercel environment variables (see below)

---

## Final Step: Add Secret Key to Vercel

The secret key needs to be added to Vercel for production:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **Vision AI** project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `PAYSTACK_SECRET_KEY`
   - **Value:** Your Paystack secret key from `.env` file (starts with `sk_live_...`)
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**
6. Go to **Deployments** tab
7. Click **...** on the latest deployment → **Redeploy**

---

## How It Works

### Payment Flow

1. User clicks "Upgrade to Pro — GH₵ 30/mo" button
2. Paystack popup opens with payment form
3. User completes payment using:
   - Mobile Money (MTN, Vodafone, AirtelTigo)
   - Bank Card (Visa, Mastercard)
   - Bank Transfer
4. On successful payment, user is upgraded to Pro
5. User is redirected to chat interface

### Pricing

- **Free Tier:** Basic AI, 10 questions/day, Core Math only
- **Pro Tier:** GH₵ 30/month
  - Premium GPT-4o AI
  - Unlimited questions
  - All WASSCE subjects
  - Image upload & analysis
  - Priority support

---

## Testing the Payment

### Test on Live Site

1. Visit https://ai.visionedu.online/pricing
2. Click "Upgrade to Pro — GH₵ 30/mo"
3. Paystack popup will open
4. Complete payment with any supported method
5. Verify user is upgraded to Pro

### Test Cards (for testing only)

If you want to test without real charges:
- Card: `5060 6666 6666 6666 666`
- CVV: `123`
- Expiry: Any future date
- PIN: `1234`
- OTP: `123456`

---

## Security Notes

✅ Public key is safe in frontend code (already committed)
✅ Secret key is in `.env` (git-ignored, not committed)
⚠️ Remember to add secret key to Vercel for production

---

## Troubleshooting

### Payment popup doesn't open
- Check browser console for errors
- Ensure Paystack script is loaded: `https://js.paystack.co/v1/inline.js`

### 400 Bad Request error
- ✅ Fixed! Public key is now configured correctly

### User not upgraded after payment
- Check that secret key is added to Vercel environment variables
- Check browser console for Firebase/Supabase errors

---

**Status:** Ready for production once secret key is added to Vercel! 🚀
