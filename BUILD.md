# Togo — Production Build Guide

## Step 1: Set up Supabase

1. Go to https://supabase.com → New project → Name it "togo"
2. Wait for provisioning, then go to **Settings > API**
3. Copy your **Project URL** and **anon public** key
4. Open `.env` and fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

5. In Supabase → **SQL Editor** → run `supabase/migrations/001_initial_schema.sql`
6. Then run `supabase/seed.sql` to populate events, packages, players
7. Go to **Authentication > Providers** → Enable **Phone** provider
8. Under Authentication > Settings, set **Site URL** to `togo://`

## Step 2: Set up Razorpay

1. Create an account at https://razorpay.com
2. Go to **Settings > API Keys** → Generate test keys
3. Add to `.env`:
   ```
   EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
   ```
4. Deploy the Edge Function (for payment orders):
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxx RAZORPAY_KEY_SECRET=xxxx
   npx supabase functions deploy create-razorpay-order
   ```

## Step 3: Build the Android APK

### Prerequisites
- [Android Studio](https://developer.android.com/studio) installed
- JDK 17 (bundled with Android Studio)
- Android SDK 35

### Generate native project
```bash
cd D:\TogoApp
npx expo prebuild --platform android --clean
```

### Open in Android Studio
```
File → Open → D:\TogoApp\android
```
Wait for Gradle sync to complete (first time takes ~5 min).

### Build Debug APK (for testing)
```
Build → Build Bundle(s) / APK(s) → Build APK(s)
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK (for distribution)

1. Generate a signing keystore (one-time):
   ```bash
   keytool -genkey -v -keystore togo-release.jks -alias togo -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add to `android/app/build.gradle` under `android { signingConfigs { release { ... } } }`
3. In Android Studio: **Build → Generate Signed Bundle/APK → APK → use your keystore**

### Build AAB (for Google Play)
Same as Release APK but choose **Android App Bundle** instead of APK.

## Step 4: Environment Variables in Native Build

For native builds, Expo reads `.env` at build time. Make sure your `.env` has all values before running `expo prebuild`.

## Phone Auth (OTP) — Important Notes
- Supabase Phone auth uses Twilio by default. Set up Twilio in Supabase Dashboard > Auth > SMS
- For testing, Supabase provides a test phone number: `+15005550006` with OTP: `123456`
- For production India numbers, enable the **+91** country code in Auth settings

## Going to Production Checklist
- [ ] Replace Razorpay test keys with live keys (`rzp_live_...`)
- [ ] Set `RAZORPAY_KEY_SECRET` in Supabase Secrets (not in .env)
- [ ] Enable email/SMS templates in Supabase Auth
- [ ] Set up Twilio for SMS OTP (or use Supabase's built-in SMS)
- [ ] Configure proper RLS policies audit
- [ ] Set up database backups in Supabase
- [ ] Set up error monitoring (Sentry)
- [ ] Generate production signing keystore and keep it safe
