import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { isCloudinaryConfigured } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  let rawUri = (
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.STORAGE_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();

  if (rawUri.startsWith('MONGODB_URI=')) {
    rawUri = rawUri.replace(/^MONGODB_URI=/, '').trim();
  }
  rawUri = rawUri.replace(/^["']|["']$/g, '').trim();

  const dbName = (process.env.MONGODB_DB_NAME || 'techpricedrop').replace(/^["']|["']$/g, '').trim();

  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    cloudinaryConfigured: isCloudinaryConfigured(),
    mongoConfigured: Boolean(rawUri.length > 0),
    uriLength: rawUri.length,
    uriPreview: rawUri ? `${rawUri.substring(0, 15)}...${rawUri.slice(-10)}` : 'EMPTY',
    database: dbName,
    mongoConnected: false,
  };

  if (!rawUri) {
    status.error = 'MONGODB_URI is empty or not found in process.env';
    return NextResponse.json(status, { status: 500 });
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(rawUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
    });

    await client.connect();
    const db = client.db(dbName);
    await db.command({ ping: 1 });

    status.mongoConnected = true;

    const kvDoc = await db.collection('site_kv').findOne({ key: 'products_catalog' });
    status.productsInDb = Array.isArray(kvDoc?.value) ? kvDoc.value.length : 0;

    const delDoc = await db.collection('site_kv').findOne({ key: 'deleted_product_ids' });
    status.deletedIdsInDb = Array.isArray(delDoc?.value) ? delDoc.value.length : 0;

    return NextResponse.json(status, { status: 200 });
  } catch (err: any) {
    status.mongoConnected = false;
    status.errorName = err?.name || 'Error';
    status.errorMessage = err?.message || String(err);
    status.errorStack = err?.stack || '';
    return NextResponse.json(status, { status: 500 });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {}
    }
  }
}
