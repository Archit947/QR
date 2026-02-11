# Supabase Storage Setup for File Uploads

## Quick Setup Steps

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `training-files`
   - **Public bucket**: ✅ **Check this box** (files need to be publicly accessible)
   - **File size limit**: 50 MB (or higher if needed for large videos)
   - Click **"Create bucket"**

### 2. Set Up Storage Policies (Optional but Recommended)

For better security, you can restrict who can upload files:

1. In the Storage section, click on `training-files` bucket
2. Go to **Policies** tab
3. Click **"New Policy"**
4. Create a policy for uploads:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'training-files');
   
   -- Allow public read access
   CREATE POLICY "Public can download files"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'training-files');
   ```

### 3. All Done!

Your admins can now:
- Upload PDF files directly
- Upload video files (MP4, WebM, OGG, MOV)
- Drag and drop files into the upload area
- Files are automatically hosted on Supabase CDN

## File Upload Limits

Default limits:
- **Single file**: 50 MB
- **Videos**: Up to 50 MB (increase in Supabase settings if needed)
- **PDFs**: Up to 50 MB

To increase limits:
1. Go to Supabase Dashboard → Storage
2. Click on `training-files` bucket
3. Settings → Change file size limit

## Troubleshooting

**Error: "Failed to upload file"**
- Ensure the bucket is marked as **Public**
- Check that the bucket name is exactly `training-files`
- Verify your Supabase URL and keys are correct in environment variables

**Files not loading**
- Check if the bucket is public
- Verify the file was uploaded successfully in Storage dashboard
- Check browser console for CORS errors
