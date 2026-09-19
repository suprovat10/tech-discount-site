import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'Supported Retailers | TechPrice US',
  description: 'Overview of supported stores: Amazon, Walmart, Best Buy, and Target with API and affiliate status.',
};

export default function RetailersPage() {
  return <PolicyPageClient slug="retailers" />;
}
