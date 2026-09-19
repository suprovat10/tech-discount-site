import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
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

    // Write directly to local public folder (Node.js / Hostinger VPS)
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
