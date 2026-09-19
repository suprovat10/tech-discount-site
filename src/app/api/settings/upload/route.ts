import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'favicon' | 'logo'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.png';
    const timestamp = Date.now();

    if (type === 'favicon') {
      // 1. Save specific versioned file in uploads
      const versionedFilename = `favicon-${timestamp}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, versionedFilename), buffer);

      // 2. Overwrite standard favicon files in public/
      fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.png'), buffer);
      fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), buffer);
      fs.writeFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.png'), buffer);

      // 3. Overwrite App Router dynamic icons in src/app/ if they exist
      const srcAppDir = path.join(process.cwd(), 'src', 'app');
      try {
        fs.writeFileSync(path.join(srcAppDir, 'icon.png'), buffer);
        fs.writeFileSync(path.join(srcAppDir, 'favicon.ico'), buffer);
        fs.writeFileSync(path.join(srcAppDir, 'apple-icon.png'), buffer);
      } catch (err) {
        console.warn('Could not write to src/app icons:', err);
      }

      const publicUrl = `/uploads/${versionedFilename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fallbackUrl: `/favicon.png?v=${timestamp}`,
        message: 'Favicon successfully uploaded and saved to server.',
      });
    } else if (type === 'og' || type === 'ogImage') {
      const versionedFilename = `og-image-${timestamp}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, versionedFilename), buffer);

      const publicUrl = `/uploads/${versionedFilename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        message: 'OpenGraph Image successfully uploaded and saved.',
      });
    } else if (type === 'blog') {
      const versionedFilename = `blog-cover-${timestamp}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, versionedFilename), buffer);

      const publicUrl = `/uploads/${versionedFilename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        message: 'Blog cover image successfully uploaded.',
      });
    } else {
      // Logo upload
      const versionedFilename = `logo-${timestamp}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, versionedFilename), buffer);
      fs.writeFileSync(path.join(process.cwd(), 'public', 'logo.png'), buffer);

      const publicUrl = `/uploads/${versionedFilename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fallbackUrl: `/logo.png?v=${timestamp}`,
        message: 'Logo successfully uploaded and saved to server.',
      });
    }
  } catch (error: any) {
    console.error('Error uploading setting asset:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
