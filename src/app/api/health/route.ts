import { NextResponse } from 'next/server';
import { getMongoDb, isMongoConfigured, getLastMongoError } from '@/lib/db/mongodb';
import { isCloudinaryConfigured, getCloudinaryConfig, uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const dbName = (process.env.MONGODB_DB_NAME || 'techpricedrop').replace(/^["']|["']$/g, '').trim();
  const cfg = getCloudinaryConfig();

  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    cloudinaryConfigured: isCloudinaryConfigured(),
    cloudinaryInfo: cfg ? {
      configured: true,
      cloudName: cfg.cloudName,
      apiKeyPrefix: cfg.apiKey ? `${cfg.apiKey.slice(0, 4)}***` : null,
      apiSecretLength: cfg.apiSecret ? cfg.apiSecret.length : 0,
    } : { configured: false },
    mongoConfigured: isMongoConfigured(),
    database: dbName,
    mongoConnected: false,
  };

  if (!isMongoConfigured()) {
    status.error = 'MONGODB_URI is not configured in environment variables.';
    return NextResponse.json(status, { status: 500 });
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      status.error = getLastMongoError() || 'Failed to obtain MongoDB instance.';
      return NextResponse.json(status, { status: 500 });
    }

    await db.command({ ping: 1 });
    status.mongoConnected = true;

    const kvDoc = await db.collection('site_kv').findOne({ key: 'products_catalog' });
    status.productsInDb = Array.isArray(kvDoc?.value) ? kvDoc.value.length : 0;

    const delDoc = await db.collection('site_kv').findOne({ key: 'deleted_product_ids' });
    status.deletedIdsInDb = Array.isArray(delDoc?.value) ? delDoc.value.length : 0;

    try {
      const testPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      const testRes = await uploadToCloudinary(testPng, { folder: 'techpricedrop/test', mimeType: 'image/png' });
      status.cloudinaryTest = testRes;
    } catch (cErr: any) {
      status.cloudinaryTest = { success: false, error: cErr.message || String(cErr) };
    }

    return NextResponse.json(status, { status: 200 });
  } catch (err: any) {
    status.mongoConnected = false;
    status.error = err?.message || String(err);
    return NextResponse.json(status, { status: 500 });
  }
}
