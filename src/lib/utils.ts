import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RetailerId } from "@/types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  const isWhole = Number.isInteger(amount) || amount % 1 === 0;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted.replace(/\.00$/, "");
}


export function formatPercentage(rate: number): string {
  return `${Math.round(rate)}%`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Real-time slug formatter for input fields.
 * Whenever spacebar is pressed or space is entered, converts it to hyphen (-)
 * while preserving ongoing typing and lowercase alphanumeric structure.
 */
export function formatSlugInput(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * Strips leading and trailing hyphens when saving or on blur.
 */
export function cleanFinalSlug(value: string): string {
  return formatSlugInput(value).replace(/^-+|-+$/g, '');
}

export function getRetailerDisplayName(retailer: RetailerId | string): string {
  if (!retailer) return "Store";
  switch (retailer.toLowerCase()) {
    case "amazon":
      return "Amazon";
    case "walmart":
      return "Walmart";
    case "bestbuy":
      return "Best Buy";
    case "target":
      return "Target";
    case "bhphoto":
      return "B&H Photo";
    case "ebay":
      return "eBay";
    case "newegg":
      return "Newegg";
    case "apple":
      return "Apple Store";
    case "microcenter":
      return "Micro Center";
    case "aliexpress":
      return "AliExpress";
    case "custom":
    case "custom-store":
    case "custom_store":
      return "Custom Store";
    default:
      return retailer
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
  }
}

export function getRetailerHexColor(retailer: string): string {
  if (!retailer) return '#64748B';
  switch (retailer.toLowerCase()) {
    case 'amazon':
      return '#FF9900';
    case 'walmart':
      return '#0071DC';
    case 'bestbuy':
      return '#FFE000';
    case 'target':
      return '#CC0000';
    case 'bhphoto':
      return '#00843D';
    case 'ebay':
      return '#E53238';
    case 'newegg':
      return '#F59E0B';
    case 'apple':
      return '#555555';
    case 'microcenter':
      return '#10B981';
    case 'aliexpress':
      return '#FF4747';
    default: {
      const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#10B981'];
      let hash = 0;
      for (let i = 0; i < retailer.length; i++) {
        hash = retailer.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    }
  }
}

export function getRetailerBrandColor(retailer: RetailerId): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (retailer?.toLowerCase()) {
    case "amazon":
      return {
        bg: "bg-amber-500/10 hover:bg-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/30",
        badge: "bg-amber-500 text-black font-semibold",
      };
    case "walmart":
      return {
        bg: "bg-blue-600/10 hover:bg-blue-600/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/30",
        badge: "bg-blue-600 text-white font-semibold",
      };
    case "bestbuy":
      return {
        bg: "bg-yellow-400/10 hover:bg-yellow-400/20",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-400/30",
        badge: "bg-yellow-400 text-black font-bold",
      };
    case "target":
      return {
        bg: "bg-rose-600/10 hover:bg-rose-600/20",
        text: "text-rose-600 dark:text-rose-400",
        border: "border-rose-500/30",
        badge: "bg-rose-600 text-white font-semibold",
      };
    default:
      return {
        bg: "bg-slate-500/10 hover:bg-slate-500/20",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-500/30",
        badge: "bg-slate-600 text-white font-semibold",
      };
  }
}

export function calculateSavings(
  price: number,
  regularPrice?: number
): { amount: number; percentage: number } | null {
  if (!regularPrice || regularPrice <= price) return null;
  const amount = Number((regularPrice - price).toFixed(2));
  const percentage = Math.round(((regularPrice - price) / regularPrice) * 100);
  return { amount, percentage };
}
