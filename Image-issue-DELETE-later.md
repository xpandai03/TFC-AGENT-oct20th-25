# Logo Display Issue - Debug Analysis

## Problem Statement
TFC logo does not display on signin page (`/auth/signin`) despite multiple fix attempts, but DOES work in the Sidebar component.

## Current State

### What WORKS ✅
- **Sidebar logo**: Uses `/images/tfc-logo-dark.png` - displays correctly on deployed site
- **File exists in git**: `public/images/tfc-logo-dark.png` is committed
- **Build succeeds**: No errors during build process
- **Animated background**: Warp shader displays correctly on signin page

### What DOESN'T WORK ❌
- **Signin page logo**: Same file `/images/tfc-logo-dark.png` - does NOT display
- Shows as broken image icon (tiny missing image placeholder)

## Key Differences Between Working and Non-Working Components

### Sidebar (WORKING)
- Location: `components/Sidebar.jsx`
- Type: **Client Component** ("use client")
- Loads: **After authentication**, in the main app
- Code:
```jsx
<img
  src={theme === 'dark' ? '/images/tfc-logo-dark.png' : '/images/tfc-logo-light.jpg'}
  alt="The Family Connection"
  className="h-8 w-auto object-contain"
/>
```

### Signin Page (NOT WORKING)
- Location: `app/auth/signin/page.tsx`
- Type: **Server Component** (no "use client")
- Loads: **Before authentication**, publicly accessible
- Rendering: **Static prerendering** (shown in build output as `○ /auth/signin`)
- Code:
```tsx
<img
  src="/images/tfc-logo-dark.png"
  alt="The Family Connection Logo"
  className="h-20 md:h-24 w-auto object-contain drop-shadow-2xl"
/>
```

## Hypothesis: Why It's Failing

### Theory 1: Static Generation + Standalone Build Issue ⭐ MOST LIKELY
- Signin page is **statically prerendered** during build
- With `output: 'standalone'` in next.config.mjs, public files might not be available during static generation
- The Sidebar works because it's rendered on the client-side AFTER the app loads
- The prerendered HTML for signin page has broken image paths

**How to test**:
1. Check if signin page works on localhost (it probably does)
2. Check the deployed HTML source - does the img src path exist?
3. Try making signin page dynamic instead of static

### Theory 2: Public Folder Not Copied to Standalone Build
- Added `cp -r public .next/standalone/public` but it might not be enough
- Standalone builds also need `.next/static` folder copied
- Or the copy happens too late in the build process

**How to test**:
1. SSH into Render container and check if files exist
2. Add more comprehensive copy commands
3. Check Render build logs for the copy operation

### Theory 3: Next.js Image Optimization with Standalone
- Even though `images: { unoptimized: true }` is set, there might be issues
- Standalone mode + static generation might have edge cases

**How to test**:
1. Try using a fully qualified URL (external hosted image)
2. Check if other images on signin page work
3. Convert signin page to use a different image format

### Theory 4: Middleware or Auth Blocking
- Since it's /auth/signin, maybe NextAuth middleware is interfering
- Path resolution might be different for /auth/* routes

**How to test**:
1. Move signin page to a different route temporarily
2. Check middleware.ts for path matching rules

### Theory 5: Browser/CDN Caching
- Old broken image is cached
- Need cache bust or wait for cache expiry

**How to test**:
1. Add query parameter to image: `/images/tfc-logo-dark.png?v=2`
2. Hard refresh browser (Cmd+Shift+R)
3. Check in incognito mode

## Attempted Fixes (All Failed)

1. ❌ Used Next.js Image component with exact dimensions
2. ❌ Switched to regular img tag
3. ❌ Changed to different logo file (tfc-logo-white.png)
4. ❌ Repositioned logo outside glassmorphic card
5. ❌ Used the exact same file that works in Sidebar (tfc-logo-dark.png)
6. ❌ Added public folder copy to build script

## Next Steps to Try

### Option A: Use External URL (QUICK TEST)
Upload logo to a CDN or image host (Imgur, Cloudinary, etc.) and use full URL:
```tsx
<img src="https://i.imgur.com/xxx.png" alt="..." />
```
**If this works**: Confirms it's a static file serving issue with standalone builds

### Option B: Make Signin Page Dynamic
Add this to signin page.tsx:
```tsx
export const dynamic = 'force-dynamic'
```
**If this works**: Confirms it's a static generation issue

### Option C: Inline SVG or Base64
Convert logo to SVG or base64 data URI and inline it directly in the code
**If this works**: Confirms file serving is the issue

### Option D: Fix Standalone Build Properly
```bash
# In package.json, update build script:
"build": "prisma generate && prisma migrate deploy && next build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/"
```

### Option E: Remove Standalone Mode Temporarily
Change next.config.mjs:
```js
// output: 'standalone', // Comment this out temporarily
```
**If this works**: Confirms standalone mode is the culprit

## Questions to Answer

1. Does the logo display on localhost when running `npm run dev`?
2. Does the logo display on localhost when running `npm run build && npm start`?
3. Can you access the logo directly at `https://your-render-url.com/images/tfc-logo-dark.png`?
4. What does the browser Network tab show when you inspect the broken image?
5. What's the actual error in browser console for the image?

## File Information

- **Logo file**: `public/images/tfc-logo-dark.png`
- **File size**: 25KB
- **Dimensions**: 1500 x 465 pixels
- **Format**: PNG with transparency
- **Color**: White logo on transparent background
- **Git status**: Committed (blob 48faef0a204b588df1f5ba2d522827b76fcd1012)

## Build Configuration

```js
// next.config.mjs
const nextConfig = {
  output: 'standalone', // ⚠️ This is key
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // ⚠️ Images not optimized
  },
  reactStrictMode: true,
}
```

## Render Deployment

- Platform: Render
- Build command: `npm run build`
- Start command: `npm start`
- Node version: From package.json packageManager
