import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const metadata: Metadata = {
  title: 'About Us | TechPrice US',
  description: 'Learn about TechPrice US, our mission, independence, and real-time tech price comparison architecture.',
};

export default function AboutPage() {
  return <PolicyPageClient slug="about" />;
}
