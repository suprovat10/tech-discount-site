import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient } from '@/lib/db/client';

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

    // 1. Try Supabase Storage first for permanent CDN hosting
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('uploads')
          .upload(filename, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(filename);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
              filename,
              message: 'File uploaded to Supabase Storage successfully',
            });
          }
        }
      } catch (err) {
        console.warn('Supabase storage product upload failed, using fallback:', err);
      }
    }

    // 2. Try writing to local public/uploads for local development
    let localSaved = false;
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      localSaved = true;
    } catch {
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
