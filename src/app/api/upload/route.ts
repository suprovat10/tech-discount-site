import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.png';
    const mimeType = file.type || 'image/png';
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const timestamp = Date.now();
    const filename = `${folder}-${cleanName || 'image'}-${timestamp}${ext}`;

    // 1. If Cloudinary is configured, upload directly to Cloudinary CDN
    const { isCloudinaryConfigured, uploadToCloudinary } = await import('@/lib/cloudinary');
    if (isCloudinaryConfigured()) {
      const cloudRes = await uploadToCloudinary(buffer, {
        folder: `techpricedrop/${folder}`,
        filename,
        mimeType,
      });

      if (cloudRes.success && cloudRes.url) {
        return NextResponse.json({
          success: true,
          url: cloudRes.url,
          filename,
          provider: 'cloudinary',
          message: 'Image uploaded to Cloudinary successfully',
        });
      } else {
        console.error('Cloudinary upload error:', cloudRes.error);
        return NextResponse.json(
          {
            success: false,
            error: cloudRes.error || 'Failed to upload image to Cloudinary',
            provider: 'cloudinary',
          },
          { status: 400 }
        );
      }
    }

    // 2. Write directly to local public/uploads (standard Node.js / Hostinger VPS)
    let localSaved = false;
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      localSaved = true;
    } catch (err) {
      console.warn('Local disk write warning:', err);
      localSaved = false;
    }

    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const returnUrl = localSaved ? `/uploads/${filename}` : dataUrl;

    return NextResponse.json({
      success: true,
      url: returnUrl,
      filename,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
