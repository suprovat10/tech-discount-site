import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'Terms of Service | TechPrice US',
  description: 'Terms and conditions governing the use of TechPrice US price comparison engine.',
};

export default function TermsPage() {
  return <PolicyPageClient slug="terms" />;
}
