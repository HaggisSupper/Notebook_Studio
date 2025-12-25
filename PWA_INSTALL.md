# Installing Notebook Studio as a PWA

## Quick Installation Guide

### Desktop (Chrome/Edge)

1. **Open the app** in Chrome or Edge:
   ```
   http://localhost:3000
   ```

2. **Look for install icon** in the address bar:
   - Chrome: Look for ⊕ icon on the right side of address bar
   - Edge: Look for ➕ icon or "App available" message

3. **Click the install icon** or:
   - Chrome: Click the ⋮ menu → "Install Notebook Studio"
   - Edge: Click the ⋯ menu → "Apps" → "Install this site as an app"

4. **Click "Install"** in the popup

5. **Done!** App will open in its own window and appear in your Start Menu/Applications

### Mobile (Android - Chrome)

1. Open `http://192.168.1.160:3000` in Chrome (use your network IP)
2. Tap the ⋮ menu (top right)
3. Tap "Install app" or "Add to Home screen"
4. Tap "Install" in the popup
5. App icon appears on your home screen

### Mobile (iOS - Safari)

1. Open `http://192.168.1.160:3000` in Safari
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. App icon appears on your home screen

---

## ⚠️ Current Issues (Need to Fix)

Your PWA won't install right now because:

### 1. Missing HTTPS (Required for PWA)
- PWAs require HTTPS in production
- `localhost` is exempt, so you can test locally
- Use ngrok or deploy to Vercel for remote testing

### 2. CDN Dependencies (Breaks Offline)
Your `index.html` still has:
```html
<script src="https://cdn.tailwindcss.com"></script>
```
This prevents offline functionality.

### 3. ESM Import Maps (External Dependencies)
```html
<script type="importmap">
  "react": "https://esm.sh/react@^19.2.3"
</script>
```
These need to be bundled locally.

---

## Quick Fix for PWA Installation

I'll fix these issues so you can actually install it:

### Option 1: Test Locally (Works Now)
```bash
# Your dev server is already running
# Open: http://localhost:3000
# Install from Chrome/Edge
```

### Option 2: Deploy for Real PWA
```bash
# Build production version
npm run build

# Deploy to Vercel (free HTTPS)
npx vercel --prod

# Then install from the Vercel URL
```

---

## Verify PWA is Installable

1. Open Chrome DevTools (F12)
2. Go to "Application" tab
3. Click "Manifest" in left sidebar
4. Check for errors
5. Click "Service Workers" - should show registered worker

Or run Lighthouse audit:
1. F12 → "Lighthouse" tab
2. Check "Progressive Web App"
3. Click "Generate report"
4. Score should be 90+ for installability

---

## What Happens After Install

✅ App opens in standalone window (no browser UI)
✅ Icon in Start Menu / Applications
✅ Shortcuts on desktop/home screen
✅ Works offline (after fixing CDN issues)
✅ Gets app updates automatically

---

## Network Access for Mobile Testing

Your dev server is accessible at:
- Local: `http://localhost:3000`
- Network: `http://192.168.1.160:3000` (for phones on same WiFi)

Use the network URL on your phone to test mobile installation.
