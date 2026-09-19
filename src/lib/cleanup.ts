import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient } from './db/client';

/**
 * Safely delete uploaded files from public/uploads or cloud storage when a product or blog is deleted.
 */
export async function deleteUploadedFiles(fileUrlsOrPaths: (string | undefined | null)[]): Promise<void> {
  const publicDir = path.join(process.cwd(), 'public');

  for (const item of fileUrlsOrPaths) {
    if (!item || typeof item !== 'string') continue;

    // Check if it's a local public/uploads file
    if (item.includes('/uploads/') || item.startsWith('uploads/')) {
      try {
        const cleanPath = item.replace(/^\/?(uploads\/)/, 'uploads/');
        const fullLocalPath = path.join(publicDir, cleanPath);

        // Security check: ensure path is within public/uploads
        const uploadsDir = path.join(publicDir, 'uploads');
        if (fullLocalPath.startsWith(uploadsDir) && fs.existsSync(fullLocalPath)) {
          fs.unlinkSync(fullLocalPath);
          console.log(`[Cleanup] Deleted local file: ${fullLocalPath}`);
        }
      } catch (err: any) {
        console.warn(`[Cleanup] Failed to delete local file ${item}:`, err.message);
      }
    }

    // Check if it's stored in Supabase Storage
    const supabase = getSupabaseAdminClient();
    if (supabase && item.includes('supabase.co/storage/v1/object/public/')) {
      try {
        const urlParts = item.split('supabase.co/storage/v1/object/public/');
        if (urlParts[1]) {
          const [bucket, ...pathSegments] = urlParts[1].split('/');
          const objectPath = pathSegments.join('/');
          if (bucket && objectPath) {
            await supabase.storage.from(bucket).remove([objectPath]);
            console.log(`[Cleanup] Deleted Supabase storage file: ${bucket}/${objectPath}`);
          }
        }
      } catch (err: any) {
        console.warn(`[Cleanup] Failed to delete Supabase file ${item}:`, err.message);
      }
    }
  }
}
