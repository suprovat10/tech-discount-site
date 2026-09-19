'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Award,
  FileText,
  FolderPlus,
  Sliders,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Ticket,
  Globe,
  LogOut,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const branding = useBranding();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isLoginPage = pathname === '/supro111vat29/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin-logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    window.location.href = '/supro111vat29/login';
  };

  const navItems = [
    { label: 'Overview', href: '/supro111vat29', icon: LayoutDashboard, exact: true },
    { label: 'Hero Section', href: '/supro111vat29/hero', icon: Sparkles },
    { label: 'Products & Prices', href: '/supro111vat29/products', icon: Package },
    { label: 'Categories & Subs', href: '/supro111vat29/categories', icon: Layers },
    { label: 'Brand Partners', href: '/supro111vat29/brands', icon: Award },
    { label: 'Coupons & Deals', href: '/supro111vat29/coupons', icon: Ticket },
    { label: 'Blog Articles', href: '/supro111vat29/blogs', icon: FileText, exact: true },
    { label: 'Blog Categories', href: '/supro111vat29/blogs/categories', icon: FolderPlus, exact: true },
    { label: 'Site Pages & Legal', href: '/supro111vat29/pages', icon: Globe },
    { label: 'SEO & Analytics', href: '/supro111vat29/settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 font-black text-sm">
          <img
            src={branding.faviconUrl || '/favicon.png'}
            alt="Favicon"
            className="w-5 h-5 object-contain"
          />
          <span>{branding.brandName || 'suprodesign'} Admin</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-1.5 border border-border"
        >
          {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDEBAR NAVIGATION (Sticky always visible) */}
      <aside
        className={`w-full md:w-64 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto ${
          isMobileNavOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Version */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link href="/supro111vat29" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0">
                <img
                  src={branding.faviconUrl || '/favicon.png'}
                  alt="Favicon"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h2 className="font-black text-sm tracking-tight text-white leading-none">
                  {branding.brandName || 'suprodesign'}
                </h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="space-y-1 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Storefront & Status */}
        <div className="p-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
            <span>Multi-Store Feeds Live</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white transition-colors cursor-pointer"
          >
            <span>Sign Out</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Header */}
        <header className="h-14 border-b border-border bg-white dark:bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span>Admin Workspace</span>
            <span>/</span>
            <span className="text-foreground capitalize">
              {pathname.replace('/supro111vat29/', '').replace('/supro111vat29', 'Overview')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> System Connected
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20 rounded"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
