'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pipette, Check, X } from 'lucide-react';

interface ColorPickerPopoverProps {
  initialColor?: string;
  onSelectColor: (hex: string) => void;
  onClose: () => void;
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Convert RGB to HEX
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Convert HEX to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  } else if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  }
  return null;
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return [Math.round(h), Math.round(s), Math.round(v)];
}

export default function ColorPickerPopover({
  initialColor = '#2563EB',
  onSelectColor,
  onClose,
}: ColorPickerPopoverProps) {
  const [hue, setHue] = useState(217);
  const [saturation, setSaturation] = useState(85);
  const [value, setValue] = useState(92);
  const [hexInput, setHexInput] = useState('#2563EB');

  const spectrumRef = useRef<HTMLDivElement>(null);
  const isDraggingSpectrum = useRef(false);

  // Parse initial color
  useEffect(() => {
    const rgb = hexToRgb(initialColor);
    if (rgb) {
      const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      setHue(h);
      setSaturation(s);
      setValue(v);
      setHexInput(rgbToHex(rgb[0], rgb[1], rgb[2]));
    }
  }, [initialColor]);

  // Current RGB
  const [r, g, b] = hsvToRgb(hue, saturation, value);
  const currentHex = rgbToHex(r, g, b);

  // Update from spectrum coordinates
  const updateFromSpectrum = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    setSaturation(s);
    setValue(v);

    const [newR, newG, newB] = hsvToRgb(hue, s, v);
    setHexInput(rgbToHex(newR, newG, newB));
  }, [hue]);

  const handleMouseDownSpectrum = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSpectrum.current = true;
    updateFromSpectrum(e);

    const handleMouseMove = (ev: MouseEvent) => {
      if (isDraggingSpectrum.current) {
        updateFromSpectrum(ev);
      }
    };

    const handleMouseUp = () => {
      isDraggingSpectrum.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleHexInputChange = (val: string) => {
    let formatted = val;
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    setHexInput(formatted);

    const parsed = hexToRgb(formatted);
    if (parsed) {
      const [h, s, v] = rgbToHsv(parsed[0], parsed[1], parsed[2]);
      setHue(h);
      setSaturation(s);
      setValue(v);
    }
  };

  // Browser EyeDropper API
  const handleEyeDropper = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).EyeDropper) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          handleHexInputChange(result.sRGBHex);
        }
      } catch {
        // User canceled
      }
    }
  };

  return (
    <div
      className="absolute top-9 left-0 z-50 bg-white dark:bg-slate-900 border border-border shadow-2xl p-3.5 w-[270px] text-foreground select-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Top Header Row: Swatch + Hex Input (NO RGB, NO PRESET) */}
      <div className="space-y-1.5 mb-3 pb-2.5 border-b border-border">
        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          HEX Color Code:
        </label>
        <div className="flex items-center gap-2">
          {/* Active Swatch */}
          <div
            className="w-8 h-8 shrink-0 border border-slate-300 dark:border-slate-700 shadow-2xs"
            style={{ backgroundColor: currentHex }}
          />
          {/* Hex Input Box */}
          <div className="flex items-center border border-border bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 flex-1">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInputChange(e.target.value)}
              className="w-full text-xs font-mono font-bold bg-transparent text-foreground uppercase focus:outline-none"
              maxLength={7}
              placeholder="#FFFFFF"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 border border-border"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2D Spectrum Box (Saturation & Value) */}
      <div
        ref={spectrumRef}
        onMouseDown={handleMouseDownSpectrum}
        className="relative w-full h-36 cursor-crosshair border border-slate-300 dark:border-slate-700 overflow-hidden"
        style={{
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
          backgroundImage: `
            linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0) 100%),
            linear-gradient(to top, #000000 0%, rgba(0,0,0,0) 100%)
          `,
        }}
      >
        {/* Pointer Circle */}
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{
            left: `${saturation}%`,
            top: `${100 - value}%`,
            backgroundColor: currentHex,
          }}
        />
      </div>

      {/* Middle Row: Eyedropper + Color Swatch + Rainbow Hue Slider */}
      <div className="flex items-center gap-2.5 my-3">
        {/* Eyedropper Button */}
        <button
          type="button"
          onClick={handleEyeDropper}
          className="p-1.5 border border-border hover:border-blue-600 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 text-muted-foreground transition-colors shrink-0"
          title="Pick color from screen"
        >
          <Pipette className="w-3.5 h-3.5" />
        </button>

        {/* Current Color Indicator Circle */}
        <div
          className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 shadow-xs"
          style={{ backgroundColor: currentHex }}
        />

        {/* Rainbow Hue Slider */}
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => {
              const h = Number(e.target.value);
              setHue(h);
              const [newR, newG, newB] = hsvToRgb(h, saturation, value);
              setHexInput(rgbToHex(newR, newG, newB));
            }}
            className="w-full h-3 appearance-none cursor-pointer rounded-full"
            style={{
              background: 'linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)',
            }}
          />
        </div>
      </div>

      {/* Footer: Hex Value & Apply Color Button */}
      <div className="pt-2.5 border-t border-border flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-foreground">{currentHex}</span>
        <button
          type="button"
          onClick={() => onSelectColor(currentHex)}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply Color</span>
        </button>
      </div>
    </div>
  );
}
