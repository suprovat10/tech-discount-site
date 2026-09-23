'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CATEGORIES, CatalogItem, CategoryDefinition } from '@/data/catalog';
import { upsertCatalogProduct } from '@/lib/catalogStore';
import { getCategories } from '@/lib/categoryStore';
import { getBrands } from '@/lib/brandStore';
import { getProductTags } from '@/lib/productTagStore';
import { ProductTag } from '@/types/tag';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
  Search,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
  Star,
  Share2,
  ArrowUp,
  ArrowDown,
  Copy,
  Pencil,
  Check,
  Store,
  Globe,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRetailerDisplayName, formatSlugInput } from '@/lib/utils';

export interface StoreOfferFormItem {
  id: string;
  retailer: string;
  retailerName: string;
  price: string;
  regularPrice?: string;
  url: string;
  inStock: boolean;
  shippingInfo: string;
}

const DEFAULT_PLATFORMS: StoreOfferFormItem[] = [
  {
    id: 'amazon',
    retailer: 'amazon',
    retailerName: 'Amazon US',
    price: '',
    regularPrice: '',
    url: '',
    inStock: true,
    shippingInfo: 'Free 1-Day Prime Delivery',
  },
  {
    id: 'walmart',
    retailer: 'walmart',
    retailerName: 'Walmart US',
    price: '',
    regularPrice: '',
    url: '',
    inStock: true,
    shippingInfo: 'Free 2-Day Shipping on orders $35+',
  },
  {
    id: 'bestbuy',
    retailer: 'bestbuy',
    retailerName: 'Best Buy US',
    price: '',
    regularPrice: '',
    url: '',
    inStock: true,
    shippingInfo: 'Free Next-Day Delivery or In-Store Pickup',
  },
  {
    id: 'target',
    retailer: 'target',
    retailerName: 'Target US',
    price: '',
    regularPrice: '',
    url: '',
    inStock: true,
    shippingInfo: 'Free 2-Day Delivery on $35+ or RedCard',
  },
];

const PRESET_STORES = [
  { name: 'B&H Photo Video', retailer: 'bhphoto', defaultShipping: 'Free Expedited Shipping' },
  { name: 'eBay', retailer: 'ebay', defaultShipping: 'Free Standard Shipping' },
  { name: 'Newegg', retailer: 'newegg', defaultShipping: 'Free 3-Day Shipping' },
  { name: 'Apple Store', retailer: 'apple', defaultShipping: 'Free Next-Day Delivery' },
  { name: 'Micro Center', retailer: 'microcenter', defaultShipping: 'In-Store Pickup & Delivery' },
  { name: 'AliExpress', retailer: 'aliexpress', defaultShipping: 'Free Global Delivery' },
];

interface FaqItem {
  question: string;
  answer: string;
}

interface SpecItem {
  key: string;
  value: string;
}

export default function CreateProductStudioPage() {
  const router = useRouter();

  // Dynamic Categories from store
  const [categoriesList, setCategoriesList] = useState<CategoryDefinition[]>(CATEGORIES);

  useEffect(() => {
    const loaded = getCategories();
    setCategoriesList(loaded);
    const brands = getBrands().map((b) => b.name);
    const standardBrands = ['Apple', 'Samsung', 'Sony', 'Bose', 'Dell', 'HP', 'Asus', 'Nintendo', 'LG', 'Google', 'Microsoft', 'Lenovo', 'Logitech', 'Anker', 'Razer'];
    const mergedBrands = Array.from(new Set([...standardBrands, ...brands])).filter(Boolean).sort();
    setAvailableBrands(mergedBrands);
    setAvailableProductTags(getProductTags());
  }, []);

  // Basic Information (Starts completely blank)
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('No Brand');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [badge, setBadge] = useState('');
  const [rating, setRating] = useState('');
  const [reviewCount, setReviewCount] = useState('');

  // Product Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [availableProductTags, setAvailableProductTags] = useState<ProductTag[]>([]);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Rich Text Description & Short Description (Starts blank)
  const [richDescription, setRichDescription] = useState('');

  // Key Features & Benefits (Starts empty)
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // 4. Key Specifications (Shown Beside Price)
  const [keySpecsList, setKeySpecsList] = useState<SpecItem[]>([]);
  const [newKeySpecKey, setNewKeySpecKey] = useState('');
  const [newKeySpecValue, setNewKeySpecValue] = useState('');

  // 5. Technical Specifications (Full Detailed Table)
  const [specsList, setSpecsList] = useState<SpecItem[]>([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  // FAQs (Starts empty)
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  // Images & Slider with Image SEO Alt Text
  const [images, setImages] = useState<string[]>([]);
  const [coverAlt, setCoverAlt] = useState('');
  const [imageAlts, setImageAlts] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  // Dynamic Multi-Platform Stores, Links & Pricing
  const [platforms, setPlatforms] = useState<StoreOfferFormItem[]>(DEFAULT_PLATFORMS);

  const handleUpdatePlatform = (id: string, field: keyof StoreOfferFormItem, value: any) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddPlatform = (preset?: { name: string; retailer: string; defaultShipping: string }) => {
    const newId = `platform-${Date.now()}`;
    const newItem: StoreOfferFormItem = preset
      ? {
          id: newId,
          retailer: preset.retailer,
          retailerName: preset.name,
          price: '',
          regularPrice: '',
          url: '',
          inStock: true,
          shippingInfo: preset.defaultShipping,
        }
      : {
          id: newId,
          retailer: 'custom',
          retailerName: 'Custom Store',
          price: '',
          regularPrice: '',
          url: '',
          inStock: true,
          shippingInfo: 'Free Standard Delivery',
        };
    setPlatforms((prev) => [...prev, newItem]);
  };

  const handleDuplicatePlatform = (idx: number) => {
    const target = platforms[idx];
    if (!target) return;
    const duplicated: StoreOfferFormItem = {
      ...target,
      id: `platform-${Date.now()}`,
      retailerName: `${target.retailerName} (Copy)`,
    };
    const updated = [...platforms];
    updated.splice(idx + 1, 0, duplicated);
    setPlatforms(updated);
  };

  const handleRemovePlatform = (id: string) => {
    setPlatforms((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMovePlatform = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= platforms.length) return;
    const updated = [...platforms];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPlatforms(updated);
  };

  const handleResetPlatforms = () => {
    if (confirm('Reset platforms to the 4 standard US stores?')) {
      setPlatforms(DEFAULT_PLATFORMS);
    }
  };

  // SEO Suite
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [ogImageAlt, setOgImageAlt] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Feature Handlers: Add, Remove, Move, Duplicate, Edit
  const [editingFeatureIdx, setEditingFeatureIdx] = useState<number | null>(null);
  const [editingFeatureVal, setEditingFeatureVal] = useState<string>('');

  const handleAddFeature = () => {
    if (newFeatureInput.trim()) {
      setFeatures([...features, newFeatureInput.trim()]);
      setNewFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, idx) => idx !== index));
    if (editingFeatureIdx === index) setEditingFeatureIdx(null);
  };

  const handleMoveFeature = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= features.length) return;
    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFeatures(updated);
  };

  const handleDuplicateFeature = (index: number) => {
    const updated = [...features];
    updated.splice(index + 1, 0, features[index]);
    setFeatures(updated);
  };

  const handleStartEditFeature = (index: number) => {
    setEditingFeatureIdx(index);
    setEditingFeatureVal(features[index]);
  };

  const handleSaveEditFeature = (index: number) => {
    if (editingFeatureVal.trim()) {
      const updated = [...features];
      updated[index] = editingFeatureVal.trim();
      setFeatures(updated);
    }
    setEditingFeatureIdx(null);
  };

  // 4. Key Spec Handlers: Add, Remove, Move, Duplicate, Edit (Shown Beside Price)
  const [editingKeySpecIdx, setEditingKeySpecIdx] = useState<number | null>(null);
  const [editingKeySpecKey, setEditingKeySpecKey] = useState<string>('');
  const [editingKeySpecVal, setEditingKeySpecVal] = useState<string>('');

  const handleAddKeySpec = () => {
    if (newKeySpecKey.trim() && newKeySpecValue.trim()) {
      setKeySpecsList([...keySpecsList, { key: newKeySpecKey.trim(), value: newKeySpecValue.trim() }]);
      setNewKeySpecKey('');
      setNewKeySpecValue('');
    }
  };

  const handleRemoveKeySpec = (index: number) => {
    setKeySpecsList(keySpecsList.filter((_, idx) => idx !== index));
    if (editingKeySpecIdx === index) setEditingKeySpecIdx(null);
  };

  const handleMoveKeySpec = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= keySpecsList.length) return;
    const updated = [...keySpecsList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setKeySpecsList(updated);
  };

  const handleDuplicateKeySpec = (index: number) => {
    const updated = [...keySpecsList];
    updated.splice(index + 1, 0, { ...keySpecsList[index] });
    setKeySpecsList(updated);
  };

  const handleStartEditKeySpec = (index: number) => {
    setEditingKeySpecIdx(index);
    setEditingKeySpecKey(keySpecsList[index].key);
    setEditingKeySpecVal(keySpecsList[index].value);
  };

  const handleSaveEditKeySpec = (index: number) => {
    if (editingKeySpecKey.trim() && editingKeySpecVal.trim()) {
      const updated = [...keySpecsList];
      updated[index] = { key: editingKeySpecKey.trim(), value: editingKeySpecVal.trim() };
      setKeySpecsList(updated);
    }
    setEditingKeySpecIdx(null);
  };

  // 5. Technical Spec Handlers: Add, Remove, Move, Duplicate, Edit
  const [editingSpecIdx, setEditingSpecIdx] = useState<number | null>(null);
  const [editingSpecKey, setEditingSpecKey] = useState<string>('');
  const [editingSpecVal, setEditingSpecVal] = useState<string>('');

  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecsList([...specsList, { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const handleRemoveSpec = (index: number) => {
    setSpecsList(specsList.filter((_, idx) => idx !== index));
    if (editingSpecIdx === index) setEditingSpecIdx(null);
  };

  const handleMoveSpec = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= specsList.length) return;
    const updated = [...specsList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSpecsList(updated);
  };

  const handleDuplicateSpec = (index: number) => {
    const updated = [...specsList];
    updated.splice(index + 1, 0, { ...specsList[index] });
    setSpecsList(updated);
  };

  const handleStartEditSpec = (index: number) => {
    setEditingSpecIdx(index);
    setEditingSpecKey(specsList[index].key);
    setEditingSpecVal(specsList[index].value);
  };

  const handleSaveEditSpec = (index: number) => {
    if (editingSpecKey.trim() && editingSpecVal.trim()) {
      const updated = [...specsList];
      updated[index] = { key: editingSpecKey.trim(), value: editingSpecVal.trim() };
      setSpecsList(updated);
    }
    setEditingSpecIdx(null);
  };

  // FAQ Handlers: Add, Remove, Move, Duplicate, Edit
  const [editingFaqIdx, setEditingFaqIdx] = useState<number | null>(null);
  const [editingFaqQ, setEditingFaqQ] = useState<string>('');
  const [editingFaqA, setEditingFaqA] = useState<string>('');

  const handleAddFaq = () => {
    if (newFaqQuestion.trim() && newFaqAnswer.trim()) {
      setFaqs([...faqs, { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }]);
      setNewFaqQuestion('');
      setNewFaqAnswer('');
    }
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, idx) => idx !== index));
    if (editingFaqIdx === index) setEditingFaqIdx(null);
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;
    const updated = [...faqs];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFaqs(updated);
  };

  const handleDuplicateFaq = (index: number) => {
    const updated = [...faqs];
    updated.splice(index + 1, 0, { ...faqs[index] });
    setFaqs(updated);
  };

  const handleStartEditFaq = (index: number) => {
    setEditingFaqIdx(index);
    setEditingFaqQ(faqs[index].question);
    setEditingFaqA(faqs[index].answer);
  };

  const handleSaveEditFaq = (index: number) => {
    if (editingFaqQ.trim() && editingFaqA.trim()) {
      const updated = [...faqs];
      updated[index] = { question: editingFaqQ.trim(), answer: editingFaqA.trim() };
      setFaqs(updated);
    }
    setEditingFaqIdx(null);
  };

  // Image Management: Cover & Gallery
  // 1. Direct replace cover with local upload
  const handleReplaceCoverLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset file input so the same file can be re-uploaded
      e.target.value = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url && !data.url.startsWith('data:')) {
          setImages((prev) => [data.url, ...prev.slice(1)]);
          return;
        } else if (data.url && !data.url.startsWith('data:')) {
          setImages((prev) => [data.url, ...prev.slice(1)]);
          return;
        } else {
          alert(data.error || 'Failed to upload image to Cloudinary. Please verify your Cloudinary settings in Vercel.');
          return;
        }
      } catch (err: any) {
        console.error('Upload API failed:', err);
        alert('Image upload failed: ' + (err.message || 'Network error'));
      }
    }
  };

  // 3. Add multiple gallery images from local computer
  const handleLocalGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Reset file input so the same file(s) can be re-uploaded
    e.target.value = '';

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url && !data.url.startsWith('data:')) {
          setImages((prev) => [...prev, data.url]);
          setImageAlts((prev) => [...prev, file.name.replace(/\.[^/.]+$/, '')]);
          continue;
        } else {
          alert(data.error || `Failed to upload ${file.name} to Cloudinary.`);
        }
      } catch (err: any) {
        console.error('Upload API failed:', err);
        alert(`Failed to upload ${file.name}: ` + (err.message || 'Network error'));
      }
    }
  };

  // 4. Add image by URL with SEO Alt Text
  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setImageAlts([...imageAlts, newImageAlt.trim()]);
      setNewImageUrl('');
      setNewImageAlt('');
    }
  };

  const handleUpdateImageAlt = (index: number, alt: string) => {
    const updated = [...imageAlts];
    updated[index] = alt;
    setImageAlts(updated);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
    setImageAlts(imageAlts.filter((_, idx) => idx !== index));
  };

  // 5. Set any gallery image as Cover Photo and swap Alt texts
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    const targetImg = images[index];
    const targetAlt = imageAlts[index] || '';
    const otherImgs = images.filter((_, idx) => idx !== index);
    const otherAlts = imageAlts.filter((_, idx) => idx !== index);

    setImages([targetImg, ...otherImgs]);
    setImageAlts([coverAlt, ...otherAlts]);
    setCoverAlt(targetAlt);
  };

  // SEO Social Image Handlers
  const handleSocialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset file input so the same file can be re-uploaded
      e.target.value = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'social');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url) {
          setOgImageUrl(data.url);
          return;
        }
      } catch (err) {
        console.warn('Social image upload API failed:', err);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setOgImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseCoverForSeo = () => {
    if (images[0]) {
      setOgImageUrl(images[0]);
    }
  };

  // Dynamic Price Sync
  const handleSimulatePriceSync = () => {
    const firstValid = platforms.find((p) => parseFloat(p.price) > 0);
    if (!firstValid) {
      alert('Please enter a Live Price for at least one store first.');
      return;
    }
    const basePrice = parseFloat(firstValid.price);
    const baseRegularPrice = parseFloat(firstValid.regularPrice || '') || Number((basePrice * 1.15).toFixed(2));

    setPlatforms((prev) =>
      prev.map((p) => {
        const currentPrice = parseFloat(p.price) > 0 ? parseFloat(p.price) : basePrice;
        const currentRegPrice = parseFloat(p.regularPrice || '') > 0
          ? parseFloat(p.regularPrice!)
          : (parseFloat(p.price) > 0 ? Number((parseFloat(p.price) * 1.15).toFixed(2)) : baseRegularPrice);
        return {
          ...p,
          price: currentPrice.toFixed(2),
          regularPrice: currentRegPrice > currentPrice ? currentRegPrice.toFixed(2) : (currentPrice * 1.15).toFixed(2),
        };
      })
    );
  };

  // Save Product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Product title is required.');
      return;
    }

    setIsSubmitting(true);

    const generatedSlug = (customSlug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const keySpecsMap: Record<string, string> = {};
    keySpecsList.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        keySpecsMap[s.key.trim()] = s.value.trim();
      }
    });
    // Auto-capture uncommitted Key Spec input
    if (newKeySpecKey.trim() && newKeySpecValue.trim()) {
      keySpecsMap[newKeySpecKey.trim()] = newKeySpecValue.trim();
    }

    const specsMap: Record<string, string> = {};
    specsList.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specsMap[s.key.trim()] = s.value.trim();
      }
    });
    // Auto-capture uncommitted Hardware Spec input
    if (newSpecKey.trim() && newSpecValue.trim()) {
      specsMap[newSpecKey.trim()] = newSpecValue.trim();
    }

    // Auto-capture uncommitted Feature input
    let finalFeatures = [...features];
    if (newFeatureInput.trim() && !finalFeatures.includes(newFeatureInput.trim())) {
      finalFeatures.push(newFeatureInput.trim());
    }

    const plainDescription = richDescription.replace(/<[^>]*>?/gm, '').trim();

    // Process valid offers (only platforms with a valid URL)
    const validPlatforms = platforms.filter((p) => p.url.trim().length > 0);
    const offerPrices = validPlatforms.map((p) => parseFloat(p.price) || 0).filter((p) => p > 0);
    const minOfferPrice = offerPrices.length > 0 ? Math.min(...offerPrices) : 0;

    const constructedOffers = validPlatforms.map((p, idx) => {
      const priceNum = parseFloat(p.price) || 0;
      const regPriceNum = parseFloat(p.regularPrice || '') || 0;
      const finalRegularPrice = regPriceNum > priceNum
        ? regPriceNum
        : (priceNum > 0 ? Number((priceNum * 1.15).toFixed(2)) : undefined);
      const userStoreName = p.retailerName?.trim() || '';
      const cleanRetailer = (p.retailer && p.retailer !== 'custom')
        ? p.retailer.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : (userStoreName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'custom');
      const finalRetailerName = (userStoreName && userStoreName.toLowerCase() !== 'custom')
        ? userStoreName
        : getRetailerDisplayName(cleanRetailer);

      return {
        retailer: cleanRetailer as any,
        retailerName: finalRetailerName,
        retailerItemId: `${cleanRetailer}-${Date.now()}-${idx}`,
        productUrl: p.url.trim(),
        price: priceNum,
        regularPrice: finalRegularPrice,
        isInStock: p.inStock,
        availabilityStatus: (p.inStock ? 'In Stock' : 'Out of Stock') as 'In Stock' | 'Out of Stock',
        shippingInfo: p.shippingInfo.trim() || 'Free Standard Delivery',
        condition: 'New' as const,
        currency: 'USD' as const,
        isLowestPrice: priceNum > 0 && priceNum === minOfferPrice,
        lastUpdated: new Date().toISOString(),
      };
    });

    const finalBrand = isCustomBrand
      ? (customBrandInput.trim() || 'No Brand')
      : (brand.trim() || 'No Brand');

    const newProduct: CatalogItem = {
      id: `prod-dyn-${Date.now()}`,
      slug: generatedSlug,
      title: title.trim(),
      brand: finalBrand,
      category: category.trim(),
      subcategory: subcategory.trim() || undefined,
      badge: badge.trim() || undefined,
      tags: tags.filter(Boolean),
      rating: parseFloat(rating) || 5.0,
      reviewCount: parseInt(reviewCount, 10) || 0,
      imageUrl: images[0] || '',
      imageAlt: coverAlt.trim() || undefined,
      images,
      imageAlts,
      description: plainDescription || title,
      richDescription,
      features: finalFeatures,
      specs: specsMap,
      keySpecs: Object.keys(keySpecsMap).length > 0 ? keySpecsMap : undefined,
      faqs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seo: {
        metaTitle: metaTitle || `${title} - Compare Lowest Prices & Deals`,
        metaDescription:
          metaDescription ||
          `Compare verified live prices for ${title} across leading retailers. Save with real-time price tracking.`,
        keywords,
        canonicalUrl: `https://smarttechdeals.com/product/${generatedSlug}`,
        ogImageUrl: ogImageUrl.trim() || undefined,
        ogImageAlt: ogImageAlt.trim() || undefined,
      },
      offers: constructedOffers,
    };

    await upsertCatalogProduct(newProduct);
    setSuccessToast(true);

    setTimeout(() => {
      router.push('/supro111vat29/products');
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-[1100px] pb-24">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/supro111vat29/products"
            className="h-9 px-3 text-xs font-bold border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 transition-colors rounded-none cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground">Create New Affiliate Product</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure rich text description, dynamic features, FAQ accordion, multi-image slider, and live 4-store pricing.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-6 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Publishing...' : 'Save & Publish Product'}</span>
        </Button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Product created successfully! Redirecting to inventory table...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. BASIC INFORMATION & TAXONOMY */}
        <section className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">1. Basic Product Information</h2>
              <p className="text-[11px] text-muted-foreground">Title, brand manufacturer, and category classification.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">Product Title *</label>
              <Input
                required
                placeholder="e.g. Sony WH-1000XM5 Wireless Noise Canceling Headphones"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">Brand Manufacturer</label>
                <select
                  value={isCustomBrand ? '__custom__' : brand}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      setIsCustomBrand(true);
                      setBrand(customBrandInput || '');
                    } else {
                      setIsCustomBrand(false);
                      setBrand(val);
                    }
                  }}
                  className="w-full h-9 border border-input bg-background px-3 text-xs font-semibold"
                >
                  <option value="No Brand">No Brand / None (No Brand Shown)</option>
                  <optgroup label="Popular Brands">
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">Other / Custom Brand...</option>
                </select>
                {isCustomBrand && (
                  <div className="mt-2">
                    <Input
                      placeholder="Type custom brand name..."
                      value={customBrandInput}
                      onChange={(e) => {
                        setCustomBrandInput(e.target.value);
                        setBrand(e.target.value);
                      }}
                      className="h-8 text-xs"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Category <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory('');
                  }}
                  className="w-full h-9 border border-input bg-background px-3 text-xs font-semibold"
                >
                  <option value="">None (No Category)</option>
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Subcategory <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full h-9 border border-input bg-background px-3 text-xs font-semibold"
                >
                  <option value="">None (No Subcategory)</option>
                  {categoriesList.find((c) => c.name === category)?.subcategories.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">Badge</label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full h-9 border border-input bg-background px-3 text-xs font-semibold"
                >
                  <option value="">None (No Badge)</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="Editors Choice">Editors Choice</option>
                  <option value="Hot Deal">Hot Deal</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Customer Rating (0 - 5.0)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Review Count</label>
                <Input
                  type="number"
                  value={reviewCount}
                  onChange={(e) => setReviewCount(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Product Tags */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Product Tags</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    (Click suggestions or type custom tags)
                  </span>
                </label>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {tags.length} selected
                </span>
              </div>

              {/* Tag Suggestions */}
              {availableProductTags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground">Quick Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableProductTags.map((t) => {
                      const isSelected = tags.includes(t.name);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveTag(t.name);
                            } else {
                              handleAddTag(t.name);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                          }`}
                        >
                          #{t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tag Input & Active Tags Chips */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a tag and press Add (e.g. Wireless, Noise-Cancelling, OLED)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    className="h-9 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddTag(tagInput)}
                    className="h-9 text-xs font-bold gap-1 px-4"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Tag
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. RICH TEXT PRODUCT OVERVIEW & DESCRIPTION */}
        <section className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  2. Product Overview & Full Description (Rich Text Editor)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Format headings, font sizes, colors, bold weights, and bullet points. Displays under Related Products.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <RichTextEditor
              value={richDescription}
              onChange={setRichDescription}
              placeholder="Write detailed product description with bold, colored text, or headings..."
              minHeight="220px"
            />
          </div>
        </section>

        {/* 3. KEY FEATURES & BENEFITS (Item-by-item with (+) button, edit, duplicate, move up/down) */}
        <section className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  3. Key Features & Benefits (Add One by One)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Click (+) button to add highlight points. Use (↑ / ↓) to reorder, pencil to edit, copy to duplicate.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">{features.length} Features Added</span>
          </div>

          {/* Add New Feature Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a key benefit or technical feature..."
              value={newFeatureInput}
              onChange={(e) => setNewFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
              className="h-9 text-xs"
            />
            <Button
              type="button"
              onClick={handleAddFeature}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Feature</span>
            </Button>
          </div>

          {/* Feature Items List */}
          <div className="space-y-2 pt-2">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-2.5 border border-border bg-background text-xs font-medium space-y-2"
              >
                {editingFeatureIdx === idx ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={editingFeatureVal}
                      onChange={(e) => setEditingFeatureVal(e.target.value)}
                      className="h-8 text-xs flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveEditFeature(idx)}
                      className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingFeatureIdx(null)}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-foreground break-words">{feat}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveFeature(idx, 'up')}
                        title="Move Up"
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === features.length - 1}
                        onClick={() => handleMoveFeature(idx, 'down')}
                        title="Move Down"
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditFeature(idx)}
                        title="Edit Feature"
                        className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateFeature(idx)}
                        title="Duplicate Feature"
                        className="p-1 text-muted-foreground hover:text-emerald-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        title="Delete Feature"
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. KEY SPECIFICATIONS (Shown Beside Price & Title) */}
        <section className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  4. Key Specifications (Price Highlight)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Quick key highlights (e.g. Brand, Processor, Memory, Storage) displayed right beside the product price at the top of the page.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600">{keySpecsList.length} Key Specs Added</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="sm:col-span-2">
              <Input
                placeholder="Key Spec Name (e.g. Processor, Memory)"
                value={newKeySpecKey}
                onChange={(e) => setNewKeySpecKey(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                placeholder="Key Spec Value (e.g. Apple M3 8-Core, 8GB RAM)"
                value={newKeySpecValue}
                onChange={(e) => setNewKeySpecValue(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddKeySpec}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 px-4 shrink-0 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Key Spec</span>
            </Button>
          </div>

          {/* Key Specs List */}
          <div className="space-y-1.5 pt-2">
            {keySpecsList.map((item, idx) => (
              <div
                key={idx}
                className="p-2 border border-border bg-background text-xs space-y-2"
              >
                {editingKeySpecIdx === idx ? (
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <Input
                      value={editingKeySpecKey}
                      onChange={(e) => setEditingKeySpecKey(e.target.value)}
                      placeholder="Spec Name"
                      className="h-8 text-xs sm:w-1/3"
                      autoFocus
                    />
                    <Input
                      value={editingKeySpecVal}
                      onChange={(e) => setEditingKeySpecVal(e.target.value)}
                      placeholder="Spec Value"
                      className="h-8 text-xs flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEditKeySpec(idx)}
                        className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingKeySpecIdx(null)}
                        className="h-8 px-2 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-muted-foreground w-28 sm:w-36 truncate">{item.key}:</span>
                      <span className="font-semibold text-foreground truncate">{item.value}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveKeySpec(idx, 'up')}
                        title="Move Up"
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === keySpecsList.length - 1}
                        onClick={() => handleMoveKeySpec(idx, 'down')}
                        title="Move Down"
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditKeySpec(idx)}
                        title="Edit Spec"
                        className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateKeySpec(idx)}
                        title="Duplicate Spec"
                        className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeySpec(idx)}
                        title="Delete Spec"
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. FULL TECHNICAL SPECIFICATIONS (Detailed Hardware Table) */}
        <section className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  5. Full Technical Specifications (Hardware Table)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Complete technical hardware specifications shown in the detailed table under the product description.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600">{specsList.length} Tech Specs Added</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="sm:col-span-2">
              <Input
                placeholder="Spec Name (e.g. Display, Battery, Dimensions)"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                placeholder="Spec Value (e.g. 13.6-inch Liquid Retina, Up to 18 Hours)"
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddSpec}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-9 px-4 shrink-0 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tech Spec</span>
            </Button>
          </div>

          {/* Specs List */}
          <div className="space-y-1.5 pt-2">
            {specsList.map((item, idx) => (
              <div
                key={idx}
                className="p-2 border border-border bg-background text-xs space-y-2"
              >
                {editingSpecIdx === idx ? (
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <Input
                      value={editingSpecKey}
                      onChange={(e) => setEditingSpecKey(e.target.value)}
                      placeholder="Spec Name"
                      className="h-8 text-xs sm:w-1/3"
                      autoFocus
                    />
                    <Input
                      value={editingSpecVal}
                      onChange={(e) => setEditingSpecVal(e.target.value)}
                      placeholder="Spec Value"
                      className="h-8 text-xs flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEditSpec(idx)}
                        className="h-8 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSpecIdx(null)}
                        className="h-8 px-2 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-5 h-5 bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-muted-foreground w-28 sm:w-36 truncate">{item.key}:</span>
                      <span className="font-semibold text-foreground truncate">{item.value}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSpec(idx, 'up')}
                        title="Move Up"
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === specsList.length - 1}
                        onClick={() => handleMoveSpec(idx, 'down')}
                        title="Move Down"
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditSpec(idx)}
                        title="Edit Spec"
                        className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateSpec(idx)}
                        title="Duplicate Spec"
                        className="p-1 text-muted-foreground hover:text-amber-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        title="Delete Spec"
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. FREQUENTLY ASKED QUESTIONS */}
        <section className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  6. Frequently Asked Questions (FAQ Section)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Add questions and answers. Use (↑ / ↓) to reorder, pencil to edit, copy to duplicate. Displays as an interactive accordion.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600">{faqs.length} FAQs Added</span>
          </div>

          <div className="space-y-3 p-4 border border-border bg-muted/20">
            <Input
              placeholder="Question: e.g. Does this support wireless charging?"
              value={newFaqQuestion}
              onChange={(e) => setNewFaqQuestion(e.target.value)}
              className="h-9 text-xs"
            />
            <textarea
              rows={2}
              placeholder="Answer: e.g. Yes, it is compatible with all Qi-certified and MagSafe wireless chargers."
              value={newFaqAnswer}
              onChange={(e) => setNewFaqAnswer(e.target.value)}
              className="w-full p-2.5 border border-input bg-background text-xs font-medium focus:outline-none focus:border-blue-600"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddFaq}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 px-4 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ Question</span>
              </Button>
            </div>
          </div>

          {/* FAQs List */}
          <div className="space-y-3 pt-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-3 border border-border bg-background space-y-2">
                {editingFaqIdx === idx ? (
                  <div className="space-y-2">
                    <Input
                      value={editingFaqQ}
                      onChange={(e) => setEditingFaqQ(e.target.value)}
                      placeholder="FAQ Question"
                      className="h-8 text-xs font-bold"
                      autoFocus
                    />
                    <textarea
                      rows={2}
                      value={editingFaqA}
                      onChange={(e) => setEditingFaqA(e.target.value)}
                      placeholder="FAQ Answer"
                      className="w-full p-2 border border-input bg-background text-xs font-medium focus:outline-none focus:border-blue-600"
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingFaqIdx(null)}
                        className="h-7 px-2 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEditFaq(idx)}
                        className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black text-foreground flex items-center gap-2">
                        <span className="text-blue-600 font-bold">Q{idx + 1}:</span>
                        <span>{faq.question}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveFaq(idx, 'up')}
                          title="Move Up"
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === faqs.length - 1}
                          onClick={() => handleMoveFaq(idx, 'down')}
                          title="Move Down"
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditFaq(idx)}
                          title="Edit FAQ"
                          className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateFaq(idx)}
                          title="Duplicate FAQ"
                          className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          title="Delete FAQ"
                          className="text-muted-foreground hover:text-red-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6 leading-relaxed">{faq.answer}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. PRODUCT COVER & IMAGE SLIDER GALLERY (Enhanced with direct Replace & Set as Cover) */}
        <section className="border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  6. Product Cover & Slider Gallery
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Set or replace the primary cover image, upload gallery photos, and click &ldquo;Set as Cover&rdquo; on any image.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600">{images.length} Image{images.length > 1 ? 's' : ''} in Carousel</span>
          </div>

          {/* PRIMARY COVER SPOTLIGHT */}
          <div className="p-4 border-2 border-blue-600/60 bg-blue-50/20 dark:bg-blue-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-600 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-blue-600" />
                <span>Primary Cover Image (Main Product Display & Cards)</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">Aspect Ratio 5:4</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Cover Image Preview */}
              <div className="relative w-36 h-28 aspect-[5/4] border-2 border-blue-600 bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-sm">
                {images[0] ? (
                  <Image
                    src={images[0]}
                    alt="Current Cover"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-bold">
                    No Cover Set
                  </div>
                )}
                <span className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 shadow-sm">
                  Active Cover
                </span>
              </div>

              {/* Cover Action Buttons: Direct Replace */}
              <div className="space-y-2.5 flex-1 w-full text-xs">
                <p className="text-muted-foreground font-medium text-[11px]">
                  This image is featured as the main product card photo, hero image, and default comparison banner. You can replace it directly from your computer or URL.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Cover (Computer)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReplaceCoverLocal}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 min-w-[200px] flex gap-1.5">
                    <Input
                      type="url"
                      placeholder="Or paste new cover image URL..."
                      value={images[0] || ''}
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        setImages((prev) => [newUrl, ...prev.slice(1)]);
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Cover Image SEO Alt Text */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Cover Image Alt Text (Image SEO & Google Image Search)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones primary angle"
                    value={coverAlt}
                    onChange={(e) => setCoverAlt(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Important for SEO: This keyword description is inserted into the &lt;img alt=&quot;...&quot;&gt; tag.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ALL GALLERY SLIDES & THUMBNAILS WITH 'SET AS COVER' ACTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  All Active Gallery Slides ({images.length})
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Click <strong>&ldquo;★ Set as Cover&rdquo;</strong> on any image to instantly make it the primary cover photo, and customize individual SEO Alt text.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 bg-muted/20 border border-border">
              {images.map((img, idx) => {
                const isCover = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`relative border-2 bg-card p-1.5 flex flex-col justify-between space-y-2 transition-all ${
                      isCover ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-border hover:border-foreground/60'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[5/4] w-full bg-white dark:bg-slate-900 overflow-hidden">
                      <Image
                        src={img}
                        alt={isCover ? (coverAlt || `Cover Slide`) : (imageAlts[idx] || `Slide ${idx + 1}`)}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {isCover && (
                        <span className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-black uppercase px-1">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white flex items-center justify-center shadow-sm"
                        title="Delete Image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Image SEO Alt Text Input */}
                    <div className="pt-0.5">
                      <input
                        type="text"
                        placeholder="SEO Alt text..."
                        value={isCover ? coverAlt : (imageAlts[idx] || '')}
                        onChange={(e) => {
                          if (isCover) {
                            setCoverAlt(e.target.value);
                          } else {
                            handleUpdateImageAlt(idx, e.target.value);
                          }
                        }}
                        className="w-full text-[10px] px-1.5 py-0.5 border border-border bg-background focus:border-blue-600 focus:outline-none"
                        title="Image Alt Text (SEO)"
                      />
                    </div>

                    {/* Action Button: Set as Cover */}
                    {isCover ? (
                      <div className="text-center py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-black text-[10px] uppercase">
                        ★ Current Cover
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetAsCover(idx)}
                        className="w-full py-1 bg-background hover:bg-blue-600 hover:text-white border border-border text-[10px] font-bold text-foreground transition-colors flex items-center justify-center gap-1"
                        title="Make this the primary product cover photo"
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>Set as Cover</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADD MORE GALLERY SLIDES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-blue-600 p-4 cursor-pointer bg-background transition-colors">
              <Upload className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs font-bold text-foreground">Add Gallery Photos (Computer)</span>
              <span className="text-[10px] text-muted-foreground">Select one or multiple files</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleLocalGalleryUpload}
                className="hidden"
              />
            </label>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground block">Or Add Slide by URL</label>
              <div className="space-y-1.5">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Slide SEO Alt Text (e.g. Side angle controls)"
                    value={newImageAlt}
                    onChange={(e) => setNewImageAlt(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImageUrl}
                    variant="outline"
                    className="h-8 px-3 text-xs font-bold shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Slide</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. REAL MULTI-PLATFORM PRICING & DIRECT STORE LINKS */}
        <section className="border border-border bg-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">
                  7. Retailer Platforms, Direct Store Links & Shipping
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Add Amazon, Walmart, Best Buy, Target or ANY custom store / website with real-time price and custom shipping info.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSimulatePriceSync}
                className="text-xs font-bold h-8 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Prices</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddPlatform()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Platform</span>
              </Button>
            </div>
          </div>

          {/* Quick Preset Badges */}
          <div className="p-3 bg-muted/30 border border-border/70 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider mr-1">
              Quick Add Presets:
            </span>
            {PRESET_STORES.map((preset) => (
              <button
                key={preset.retailer}
                type="button"
                onClick={() => handleAddPlatform(preset)}
                className="px-2.5 py-1 bg-background border border-border/80 hover:border-blue-600 hover:text-blue-600 font-semibold text-[11px] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-blue-600" />
                <span>{preset.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={handleResetPlatforms}
              className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Reset to 4 Standard Stores
            </button>
          </div>

          {/* Dynamic Platforms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {platforms.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 border border-border bg-muted/20 space-y-3.5 relative group hover:border-blue-600/50 transition-colors"
              >
                {/* Platform Card Header */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2 flex-1 max-w-[240px]">
                    <Store className="w-4 h-4 text-blue-600 shrink-0" />
                    <Input
                      type="text"
                      value={p.retailerName}
                      onChange={(e) => handleUpdatePlatform(p.id, 'retailerName', e.target.value)}
                      placeholder="Store Name (e.g. Amazon, B&H)"
                      className="h-7 text-xs font-bold tracking-tight bg-background border-border px-2"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1.5 cursor-pointer mr-2">
                      <input
                        type="checkbox"
                        checked={p.inStock}
                        onChange={(e) => handleUpdatePlatform(p.id, 'inStock', e.target.checked)}
                        className="w-3.5 h-3.5"
                      />
                      <span className="font-semibold text-[11px]">In Stock</span>
                    </label>

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMovePlatform(idx, 'up')}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === platforms.length - 1}
                      onClick={() => handleMovePlatform(idx, 'down')}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicatePlatform(idx)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title="Duplicate Offer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePlatform(p.id)}
                      className="p-1 text-rose-500 hover:text-rose-700"
                      title="Remove Platform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Live Price ($ USD) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="199.99"
                      value={p.price}
                      onChange={(e) => handleUpdatePlatform(p.id, 'price', e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold">Regular Price ($)</label>
                      {parseFloat(p.regularPrice || '0') > parseFloat(p.price || '0') && parseFloat(p.price || '0') > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded">
                          Save ${(parseFloat(p.regularPrice!) - parseFloat(p.price)).toFixed(2)} ({Math.round(((parseFloat(p.regularPrice!) - parseFloat(p.price)) / parseFloat(p.regularPrice!)) * 100)}% OFF)
                        </span>
                      )}
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={p.price ? (parseFloat(p.price) * 1.15).toFixed(2) : '249.99'}
                      value={p.regularPrice || ''}
                      onChange={(e) => handleUpdatePlatform(p.id, 'regularPrice', e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">
                      Shipping Info <span className="text-[10px] text-muted-foreground font-normal">(Default / Custom)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Free 2-Day Shipping"
                      value={p.shippingInfo}
                      onChange={(e) => handleUpdatePlatform(p.id, 'shippingInfo', e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Product Store Link * <span className="text-[10px] text-muted-foreground font-normal">(Only platforms with links appear on site)</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={p.url}
                    onChange={(e) => handleUpdatePlatform(p.id, 'url', e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. COMPLETE PER-PRODUCT SEO SUITE & SOCIAL SHARE IMAGE (Requirement 2) */}
        <section className="border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">8. Per-Product Search Engine Optimization (SEO)</h2>
              <p className="text-[11px] text-muted-foreground">
                Custom Meta Title, Meta Description, Keywords, Canonical URL, and Social Share Image.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">Custom Meta Title</label>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {metaTitle.length || title.length} / 60 characters
                </span>
              </div>
              <Input
                placeholder={title ? `${title} - Compare Prices` : 'e.g. Sony WH-1000XM5 Best Deals across 4 Stores'}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">Meta Description</label>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {metaDescription.length} / 160 characters
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Find the lowest price and discounts for this product across Amazon, Walmart, Best Buy, and Target..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full p-2.5 border border-input bg-background text-xs font-medium focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">Keywords (Comma separated)</label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Custom Slug (URL parameter)</label>
                <Input
                  placeholder="sony-wh-1000xm5-deals"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(formatSlugInput(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* SEO SOCIAL SHARE (OG) IMAGE UPLOADER & PREVIEW (Requirement 2) */}
            <div className="p-4 border border-border bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-black text-foreground flex items-center gap-1.5 text-xs">
                  <Share2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Social Media Share (OG) Image</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Recommended size: 1200 x 630 px
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Social Card Preview Thumbnail */}
                <div className="relative aspect-[1.91/1] w-48 border border-border bg-background overflow-hidden shrink-0 shadow-sm">
                  {ogImageUrl ? (
                    <Image
                      src={ogImageUrl}
                      alt="Social Share Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-bold">
                      No Image Set
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] font-bold px-1.5 py-0.5">
                    1.91:1 Card
                  </span>
                </div>

                {/* Upload & URL Controls */}
                <div className="space-y-2.5 flex-1 w-full">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    This image will appear when your product link is shared on Facebook, Twitter/X, WhatsApp, LinkedIn, or messaging apps.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-sm">
                      <Upload className="w-3 h-3" />
                      <span>Upload Social Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSocialImageUpload}
                        className="hidden"
                      />
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseCoverForSeo}
                      className="h-8 px-3 text-xs font-bold"
                    >
                      Use Product Cover Image
                    </Button>
                  </div>

                  <div className="pt-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                      Or Social Image URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={ogImageUrl}
                      onChange={(e) => setOgImageUrl(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                      Social Image Alt Text / Caption (SEO)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Sony WH-1000XM5 wireless headphones social share preview"
                      value={ogImageAlt}
                      onChange={(e) => setOgImageAlt(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Accessible alt description used for OpenGraph / Twitter Cards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Social Card Feed Preview */}
              <div className="p-3 border border-border bg-background space-y-1 mt-2">
                <span className="text-[9px] font-bold uppercase text-purple-600 block">
                  Facebook & Twitter Social Card Preview
                </span>
                <div className="border border-border/80 overflow-hidden max-w-sm">
                  <div className="relative aspect-[1.91/1] w-full bg-muted flex items-center justify-center">
                    {ogImageUrl ? (
                      <Image
                        src={ogImageUrl}
                        alt={ogImageAlt || title || "Card Preview"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                        <Share2 className="w-5 h-5 mb-1 opacity-40" />
                        <span className="text-[11px] font-semibold">No Social Image Set</span>
                        <span className="text-[9px] opacity-75">Upload an image or click &quot;Use Product Cover Image&quot;</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      smarttechdeals.com
                    </span>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {metaTitle || (title ? `${title} - Compare Prices` : 'Product Title')}
                    </h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {metaDescription || 'Compare live prices and discounts across 4 major stores.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Search Result Live Preview Box */}
            <div className="p-4 border border-border bg-background space-y-1 mt-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                Google Search Result Preview
              </span>
              <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-sm font-semibold truncate hover:underline cursor-pointer">
                {metaTitle || (title ? `${title} - 4-Store Price Comparison | SmartTech` : 'Product Title')}
              </div>
              <div className="text-[#006621] dark:text-[#34a853] text-[11px] truncate">
                https://smarttechdeals.com/product/{customSlug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product-slug')}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {metaDescription ||
                  'Compare real-time prices for this item across Amazon, Walmart, Best Buy, and Target. Verified lowest prices and authorized retailer offers.'}
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href="/supro111vat29/products"
            className="text-xs font-bold h-10 px-5 border border-border bg-background hover:bg-muted text-foreground inline-flex items-center justify-center transition-colors rounded-none cursor-pointer"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-8 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Publish Product to Storefront</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
