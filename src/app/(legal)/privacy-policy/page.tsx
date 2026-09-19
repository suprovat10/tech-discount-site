import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'Privacy Policy | TechPrice US',
  description: 'Learn how TechPrice US protects user privacy and why we do not require account registration.',
};

export default function PrivacyPolicyPage() {
  return <PolicyPageClient slug="privacy-policy" />;
}
