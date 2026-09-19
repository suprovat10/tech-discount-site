import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'Price Accuracy Methodology | TechPrice US',
  description: 'Our methodology for real-time pricing verification, savings calculations, and merchant stock data.',
};

export default function PriceMethodologyPage() {
  return <PolicyPageClient slug="price-methodology" />;
}
