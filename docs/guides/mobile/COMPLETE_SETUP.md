# WALRUS Mobile App - Complete Setup Guide

Complete guide to setting up, configuring, and running the WALRUS mobile app on Android.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Android Studio Setup](#android-studio-setup)
3. [Install Dependencies](#install-dependencies)
4. [Environment Configuration](#environment-configuration)
5. [Run the App](#run-the-app)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)
8. [Physical Device Setup](#physical-device-setup)

---

## Prerequisites

- ✅ Android Studio installed
- ✅ Node.js installed (check with `node --version`)
- ✅ Supabase account (for database)
- ✅ Backend server running (optional for testing with simulated data)

---

## Android Studio Setup

### 1. Open Android Studio

1. Launch **Android Studio**
2. Click on **More Actions** → **Virtual Device Manager**
   - Or go to **Tools** → **Device Manager**

### 2. Create a Virtual Device

1. Click **Create Device** (the + button)
2. **Select Hardware**:
   - Choose a phone (e.g., **Pixel 5** or **Pixel 8**)
   - Click **Next**
3. **Select System Image**:
   - Choose **Android 13 (Tiramisu)** or **Android 14**
   - If not downloaded, click **Download** next to it
   - Wait for download to complete
   - Click **Next**
4. **Verify Configuration**:
   - Name: `Pixel_5_API_33` (or whatever you prefer)
   - Click **Finish**

### 3. Start the Emulator

1. In Device Manager, find your device
2. Click the **▶️ Play** button next to it
3. Wait for Android to boot up (30-60 seconds)
4. You should see the Android home screen

**Keep the emulator running!** ⚠️

---

## Install Dependencies

### 1. Navigate to Mobile Folder

```bash
cd mobile

# Check if you're in the right place
ls package.json  # Should show the file
```

### 2. Install Node Modules

```bash
npm install
```

This will take 2-3 minutes. You should see:
```
added 1500+ packages in 2m
```

---

## Environment Configuration

### 1. Create .env File

```bash
cp .env.example .env.local
```

### 2. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your WALRUS project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### 3. Edit .env.local File

Open `mobile/.env.local` and fill in your credentials:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key-here

# Backend API URL
# For local development:
EXPO_PUBLIC_API_URL=http://localhost:8000

# For production (once deployed to Vercel):
# EXPO_PUBLIC_API_URL=https://walrus-backend.vercel.app

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

### 4. Important Environment Notes

#### EXPO_PUBLIC_ Prefix ⚠️
Expo requires the `EXPO_PUBLIC_` prefix for environment variables that need to be accessible in your React Native code. Without this prefix, the variables won't be available.

#### Restart After Changes 🔄
Whenever you change `.env.local`:
1. Stop the Metro bundler (Ctrl+C)
2. Restart with `npm run android` or `npm start`

Environment variables are bundled at build time, not runtime!

#### Physical Device IP Address 📱
If using a physical Android device connected to your computer:

**Use your computer's local IP, not localhost:**

```env
# Find your local IP:
# Windows: ipconfig (look for IPv4 Address)
# Mac/Linux: ifconfig (look for inet)

EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

Replace `192.168.1.100` with your actual local IP address.

### 5. Verify Environment Variables

Add this to any screen (like `app/(tabs)/index.tsx`):

```typescript
console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
```

Run the app and check the terminal logs - you should see your URLs printed.

---

## Run the App

### Option A: Run on Emulator (Recommended)

**Make sure Android emulator is running first!**

```bash
npm run android
```

What happens:
1. Metro bundler starts (JavaScript packager)
2. App builds and installs on emulator
3. App opens automatically
4. You'll see the WALRUS dashboard! 🎉

### Option B: Interactive Start

```bash
npm start
```

You'll see options:
```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

Press **`a`** to open on Android

---

## Development Workflow

### While the app is running:

**Reload the app:**
- Press **`r`** in terminal
- Or shake the device and tap "Reload"

**Open developer menu:**
- Press **`m`** in terminal
- Or press `Ctrl + M` in emulator

**View logs:**
The terminal will show all console.log outputs

**Hot reload is enabled:**
- Save any file in `mobile/` folder
- App automatically updates! ⚡

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler (interactive) |
| `npm run android` | Build and run on Android |
| `npm run web` | Run in web browser |
| `npx expo start -c` | Start with cleared cache |
| `adb devices` | List connected devices |
| `adb logcat` | View Android system logs |

---

## Troubleshooting

### ❌ Error: "No Android devices found"

**Solution 1: Check emulator is running**
```bash
# List running emulators
adb devices
```
You should see:
```
List of devices attached
emulator-5554   device
```

If empty, start your Android Studio emulator.

**Solution 2: Restart ADB**
```bash
adb kill-server
adb start-server
```

---

### ❌ Error: "ANDROID_HOME not set"

**Windows:**
1. Open **System Properties** → **Environment Variables**
2. Add new **System Variable**:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
3. Add to **Path**:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
4. Restart terminal

**Quick PowerShell command:**
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
```

---

### ❌ Error: "Metro bundler failed to start"

**Solution:**
```bash
# Clear cache and restart
npx expo start -c
```

---

### ❌ App crashes immediately

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start -c
```

---

### ❌ Emulator is too slow

**Solutions:**
1. **Enable Hardware Acceleration**:
   - Android Studio → **Tools** → **AVD Manager**
   - Edit your device → **Show Advanced Settings**
   - Graphics: **Hardware - GLES 2.0**

2. **Allocate more RAM**:
   - Edit device → **Show Advanced Settings**
   - RAM: **4096 MB** (4GB)

3. **Use a physical device instead** (faster!):
   - See "Physical Device Setup" section below

---

### ❌ "process.env.EXPO_PUBLIC_API_URL is undefined"

- Make sure you have the `EXPO_PUBLIC_` prefix
- Restart the app after creating/editing `.env.local`
- Clear cache: `npx expo start -c`

---

### ❌ "Network Error" or "Connection Failed"

**If using local server:**
- Make sure backend is running (`python main.py` in server folder)
- Check the URL in `.env.local` is correct
- On physical device, use local IP instead of localhost

**If using deployed server:**
- Make sure you deployed to Vercel
- Check the URL is correct (no trailing slash)
- Test the URL in browser first

---

### ❌ "CORS Error"

Update your server `.env.local` file:
```env
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.*
```

And restart the backend server.

---

## Physical Device Setup

Much faster than emulator! Recommended for development.

### 1. Enable Developer Mode
1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. You'll see "You are now a developer!"

### 2. Enable USB Debugging
1. Go to **Settings** → **Developer Options**
2. Enable **USB Debugging**

### 3. Connect Phone
1. Connect phone to computer via USB
2. Allow USB debugging when prompted on phone
3. Check connection:
```bash
adb devices
```
You should see your device listed

### 4. Update .env.local for Physical Device

Use your computer's local IP address:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

Find your IP:
- Windows: `ipconfig` (IPv4 Address)
- Mac/Linux: `ifconfig` (inet)

### 5. Run App
```bash
npm run android
```

The app will install on your phone! 📱

---

## App Structure

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       ← WALRUS Dashboard (main screen)
│   │   └── explore.tsx     ← Second tab
│   ├── _layout.tsx         ← Root layout
│   └── modal.tsx           ← Example modal
├── components/             ← Reusable UI components
│   ├── SensorCard.tsx      ← Sensor display cards
│   ├── StatusBadge.tsx     ← System status indicator
│   └── BatteryIndicator.tsx ← Battery visual
├── services/
│   └── api.ts              ← Backend API client
├── constants/              ← Colors, themes
└── assets/                 ← Images, icons
```

**To modify the dashboard:**
1. Open `mobile/app/(tabs)/index.tsx`
2. Edit the JSX code
3. Save - app auto-reloads! ✨

---

## Testing with Backend

### Option A: Local Server

1. **Start the backend:**
```bash
cd server
python main.py
```

2. **Start mobile app:**
```bash
cd mobile
npm run android
```

3. **Verify connection:**
- Dashboard should show "Connected" or load data
- Check terminal logs for API calls

### Option B: Deployed Server

1. **Update .env.local:**
```env
EXPO_PUBLIC_API_URL=https://walrus-backend.vercel.app
```

2. **Restart app:**
```bash
# Stop current app (Ctrl+C)
npm run android
```

---

## Next Steps

Once your app is running:

1. ✅ **Test with simulated data** (already working!)
2. ✅ **Connect to backend** (follow backend setup guide)
3. 📊 **Add historical charts** (coming soon)
4. 🔔 **Implement notifications** (coming soon)
5. ⚙️ **Add settings screen** (coming soon)

---

## Success Checklist

- [ ] Android emulator is running (or physical device connected)
- [ ] `npm install` completed successfully
- [ ] `.env.local` configured with Supabase credentials
- [ ] `npm run android` builds without errors
- [ ] App opens showing WALRUS dashboard
- [ ] Data updates every 5 seconds (simulated)
- [ ] Pull-to-refresh works
- [ ] Hot reload works (save a file and see changes)

**Once all checked, you're ready!** 🚀

---

## Resources

- **Expo Documentation:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/
- **Supabase Docs:** https://supabase.com/docs
- **Dashboard Guide:** See `DASHBOARD.md`

---

## Common Commands Reference

```bash
# Start development
npm start                    # Interactive mode

# Run on specific platform
npm run android             # Android
npm run ios                 # iOS (Mac only)
npm run web                 # Web browser

# Debugging
npx expo start -c           # Clear cache
adb devices                 # Check connected devices
adb logcat                  # View system logs

# Clean install
rm -rf node_modules         # Remove deps
npm install                 # Reinstall

# Environment
cat .env.local              # View env vars
```

---

**Need help?** Check the [troubleshooting section](#troubleshooting) or open an issue!
