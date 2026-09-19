import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'FTC Affiliate Disclosure | TechPrice US',
  description: 'Full Federal Trade Commission (FTC) affiliate disclosure and monetization policy for TechPrice US.',
};

export default function AffiliateDisclosurePage() {
  return <PolicyPageClient slug="affiliate-disclosure" />;
}
