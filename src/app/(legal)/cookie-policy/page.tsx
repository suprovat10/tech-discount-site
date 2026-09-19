import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'Cookie Policy | TechPrice US',
  description: 'How TechPrice US handles cookies and local browser storage.',
};

export default function CookiePolicyPage() {
  return <PolicyPageClient slug="cookie-policy" />;
}
