import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isRequestAdminAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'favicon' | 'logo' | 'og' | 'blog'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.png';
    const mimeType = file.type || 'image/png';
    const timestamp = Date.now();
    const prefix = type || 'asset';
    const filename = `${prefix}-${timestamp}${ext}`;

    // 1. If Cloudinary is configured, upload directly to Cloudinary CDN
    const { isCloudinaryConfigured, uploadToCloudinary } = await import('@/lib/cloudinary');
    if (isCloudinaryConfigured()) {
      const cloudRes = await uploadToCloudinary(buffer, {
        folder: 'techpricedrop/branding',
        filename,
        mimeType,
      });

      if (cloudRes.success && cloudRes.url) {
        return NextResponse.json({
          success: true,
          url: cloudRes.url,
          provider: 'cloudinary',
          message: 'Asset uploaded to Cloudinary successfully.',
        });
      } else {
        console.warn('Cloudinary upload warning, falling back:', cloudRes.error);
      }
    }

    // 2. Write directly to local public folder (Node.js / Hostinger VPS)
    let localSaved = false;
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);

      if (type === 'favicon') {
        fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.png'), buffer);
        fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), buffer);
      } else if (type === 'logo') {
        fs.writeFileSync(path.join(process.cwd(), 'public', 'logo.png'), buffer);
      }
      localSaved = true;
    } catch (err) {
      console.warn('Local asset write warning:', err);
      localSaved = false;
    }

    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const returnUrl = localSaved ? `/uploads/${filename}` : dataUrl;

    return NextResponse.json({
      success: true,
      url: returnUrl,
      message: 'Asset processed and saved successfully.',
    });
  } catch (error: any) {
    console.error('Error uploading setting asset:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
