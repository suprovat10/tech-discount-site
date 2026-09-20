import fs from 'fs';
import path from 'path';
import { deleteFromCloudinary } from './cloudinary';

/**
 * Safely delete uploaded files from public/uploads or cloud storage when a product or blog is deleted.
 */
export async function deleteUploadedFiles(fileUrlsOrPaths: (string | undefined | null)[]): Promise<void> {
  const publicDir = path.join(process.cwd(), 'public');

  for (const item of fileUrlsOrPaths) {
    if (!item || typeof item !== 'string') continue;

    // 1. Check if it's a Cloudinary URL
    if (item.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(item);
        console.log(`[Cleanup] Deleted Cloudinary image: ${item}`);
      } catch (err: any) {
        console.warn(`[Cleanup] Failed to delete Cloudinary image:`, err.message);
      }
      continue;
    }

    // 2. Check if it's a local public/uploads file
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
  }
}
