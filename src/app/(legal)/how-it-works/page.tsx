import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'How Price Tracking Works | TechPrice US',
  description: 'Discover how our real-time price comparison engine fetches, validates, and compares tech deals.',
};

export default function HowItWorksPage() {
  return <PolicyPageClient slug="how-it-works" />;
}
