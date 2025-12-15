# Excel Embed URL Setup

## Issue
The `showExcelPreview` tool is working correctly, but it needs the `EXCEL_EMBED_URL` environment variable to be set in Railway.

## How to Get Your Excel Embed URL

### Option 1: From SharePoint/OneDrive (Recommended)

1. **Open your Excel file** in SharePoint or OneDrive
2. **Click "File" → "Share" → "Embed"**
3. **Copy the iframe src URL** - it will look like:
   ```
   https://onedrive.live.com/embed?resid=XXXXX&authkey=XXXXX&em=2&wdAllowInteractivity=False&wdHideGridlines=True
   ```
   OR
   ```
   https://[your-tenant].sharepoint.com/.../embed.aspx?...
   ```

### Option 2: From SharePoint Directly

1. Open your Excel file in SharePoint
2. Click the **"..."** menu → **"Embed"**
3. Copy the embed URL from the iframe code

### Option 3: Manual Construction (if needed)

If you have the file ID, you can construct it:
```
https://onedrive.live.com/embed?resid=[FILE_ID]&authkey=[AUTH_KEY]&em=2
```

## Add to Railway

1. Go to **Railway Dashboard** → Your Service → **Variables**
2. Click **"New Variable"**
3. Set:
   - **Name**: `EXCEL_EMBED_URL`
   - **Value**: Your embed URL (NO QUOTES)
4. Click **Save**
5. Railway will automatically redeploy

## Example

```
EXCEL_EMBED_URL=https://onedrive.live.com/embed?resid=ABC123&authkey=XYZ789&em=2&wdAllowInteractivity=False&wdHideGridlines=True
```

**Important**: 
- No quotes around the URL
- Make sure the file is shared publicly or accessible
- The URL should start with `https://`

## Verify It Works

After adding the variable and redeploying:

1. Ask DAWN: "Show me the spreadsheet"
2. Check Railway logs - you should see:
   ```
   ✅ Returning Excel embed URL
   ✅ Tool result: { success: true, ... }
   ```
3. The Excel preview should appear in the chat

## Troubleshooting

### If the preview doesn't load:
- Check that the file is shared/publicly accessible
- Verify the embed URL works by opening it directly in a browser
- Check browser console for iframe errors
- Make sure the URL doesn't have extra characters or spaces

### If you get "Excel preview is not configured":
- Verify `EXCEL_EMBED_URL` is set in Railway
- Check that there are no quotes around the value
- Redeploy after adding the variable

