import { NextResponse } from 'next/server';
import { getMongoDb, isMongoConfigured, getLastMongoError } from '@/lib/db/mongodb';
import { isCloudinaryConfigured } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    cloudinaryConfigured: isCloudinaryConfigured(),
    mongoConfigured: isMongoConfigured(),
    mongoConnected: false,
    database: process.env.MONGODB_DB_NAME || 'techpricedrop',
  };

  if (!isMongoConfigured()) {
    status.error = 'MONGODB_URI is not configured in environment variables.';
    return NextResponse.json(status, { status: 500 });
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      status.error = getLastMongoError() || 'Failed to obtain MongoDB instance (check IP whitelist or connection string).';
      return NextResponse.json(status, { status: 500 });
    }

    // Ping the database
    await db.command({ ping: 1 });
    status.mongoConnected = true;

    // Check site_kv
    const kvDoc = await db.collection('site_kv').findOne({ key: 'products_catalog' });
    status.productsInDb = Array.isArray(kvDoc?.value) ? kvDoc.value.length : 0;

    const delDoc = await db.collection('site_kv').findOne({ key: 'deleted_product_ids' });
    status.deletedIdsInDb = Array.isArray(delDoc?.value) ? delDoc.value.length : 0;

    return NextResponse.json(status, { status: 200 });
  } catch (err: any) {
    status.mongoConnected = false;
    status.error = err.message || 'Error connecting to MongoDB';
    return NextResponse.json(status, { status: 500 });
  }
}
