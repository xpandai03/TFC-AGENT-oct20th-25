# Excel Embed URL Troubleshooting

## Current Issue: "This item won't load right now"

This error typically means the embed URL is incorrect or the file sharing settings are wrong.

## Step-by-Step Fix

### 1. Verify File Sharing Settings

**In OneDrive/SharePoint:**
1. Open your Excel file
2. Click **"Share"** button (top right)
3. Click **"Anyone with the link"** or **"People in [Your Organization]"**
4. Make sure **"View"** permission is selected (not Edit)
5. Click **"Apply"**

### 2. Get the Correct Embed URL

**Method A: From OneDrive (Recommended)**
1. Open Excel file in OneDrive
2. Click **"File"** → **"Share"** → **"Embed"**
3. Copy the **iframe src URL** - it should look like:
   ```
   https://onedrive.live.com/embed?resid=[FILE_ID]&authkey=[AUTH_KEY]&em=2&wdAllowInteractivity=False&wdHideGridlines=True&wdDownloadButton=True
   ```

**Method B: From SharePoint**
1. Open Excel file in SharePoint
2. Click **"..."** menu → **"Embed"**
3. Copy the embed URL from the iframe code

**Method C: Manual Construction**
If you have the file ID:
```
https://onedrive.live.com/embed?resid=[FILE_ID]&authkey=[AUTH_KEY]&em=2&wdAllowInteractivity=False&wdHideGridlines=True
```

### 3. Test the URL

**Before adding to Railway:**
1. Open the embed URL directly in a browser
2. If it shows "This item won't load right now" → File isn't shared properly
3. If it loads → URL is correct, proceed to step 4

### 4. Common URL Issues

**❌ Wrong Format:**
```
https://onedrive.live.com/view.aspx?resid=...  (WRONG - this is view URL, not embed)
```

**✅ Correct Format:**
```
https://onedrive.live.com/embed?resid=...&authkey=...&em=2  (CORRECT)
```

**Missing Parameters:**
Make sure your URL includes:
- `resid=` - File ID
- `authkey=` - Auth key
- `em=2` - Embed mode
- Optional: `wdAllowInteractivity=False`
- Optional: `wdHideGridlines=True`

### 5. Alternative: Use SharePoint Embed

If OneDrive embed doesn't work, try SharePoint embed format:

```
https://[tenant].sharepoint.com/:x:/r/sites/[site]/_layouts/15/Doc.aspx?sourcedoc=%7B[FILE_ID]%7D&file=[FILE_NAME].xlsx&action=default&mobileredirect=true&wdOrigin=OFFICECOM-WEB.START.REC&wdExp=TELEMETRY&wdo=2
```

### 6. Update Railway

1. Go to Railway → Variables
2. Edit `EXCEL_EMBED_URL`
3. Paste the **full embed URL** (no quotes)
4. Save
5. Wait for redeploy

### 7. Verify After Update

After redeploy, check:
1. Railway logs show: `✅ Returning Excel embed URL`
2. Browser console shows: `✅ Excel iframe loaded successfully`
3. If still failing, check browser console for CORS/iframe errors

## Debugging

### Check Browser Console

Open browser DevTools (F12) → Console tab, look for:
- `✅ Excel iframe loaded successfully` - Good!
- `❌ Excel iframe failed to load` - Bad URL or sharing issue
- CORS errors - File sharing issue
- iframe sandbox errors - May need to adjust sandbox attributes

### Check Railway Logs

Look for:
```
📋 Excel Embed URL check: {
  hasEnvVar: true,
  envVarLength: [should be > 50],
  envVarPrefix: 'https://onedrive.live.com/embe...',
  hasEmbedUrl: true,
  embedUrlLength: [should match envVarLength]
}
```

## Still Not Working?

### Try These Alternatives:

1. **Use SharePoint Online Embed** (if using SharePoint):
   - Get embed code from SharePoint
   - Use the iframe src URL

2. **Use Microsoft Graph API** (advanced):
   - Generate embed URL programmatically
   - Requires Azure AD app registration

3. **Use Direct Link** (fallback):
   - Instead of embed, provide direct link to file
   - User opens in new tab

4. **Check File Format**:
   - Make sure it's `.xlsx` format
   - Some older formats may not embed well

## Quick Test

To verify your URL works, paste it directly into this HTML file and open in browser:

```html
<!DOCTYPE html>
<html>
<body>
  <iframe src="YOUR_EMBED_URL_HERE" width="100%" height="600px"></iframe>
</body>
</html>
```

If it works here but not in the app, it's a CORS/sandbox issue.
If it doesn't work here, the URL is wrong.

