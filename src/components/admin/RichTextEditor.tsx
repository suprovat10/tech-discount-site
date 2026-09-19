'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  ImagePlus,
  Undo,
  Redo,
  RemoveFormatting,
  Minus,
  Palette,
  Eye,
  FileCode,
  X,
  Check,
  ChevronDown,
  ExternalLink,
  Upload,
} from 'lucide-react';
import ColorPickerPopover from './ColorPickerPopover';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}



const HEADING_OPTIONS = [
  { label: 'Paragraph', tag: 'p', preview: 'Normal text' },
  { label: 'Heading 1', tag: 'h1', preview: 'Main title' },
  { label: 'Heading 2', tag: 'h2', preview: 'Section header' },
  { label: 'Heading 3', tag: 'h3', preview: 'Sub-heading' },
  { label: 'Heading 4', tag: 'h4', preview: 'Small heading' },
  { label: 'Blockquote', tag: 'blockquote', preview: 'Quote text' },
  { label: 'Preformatted', tag: 'pre', preview: 'Code snippet' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your article body here in rich Divi/WordPress style...',
  minHeight = '360px',
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'text'>('visual');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2563eb');
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [currentFormatLabel, setCurrentFormatLabel] = useState('Paragraph');

  // Media Modal State (Centered Modal)
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaAlt, setMediaAlt] = useState('');
  const [mediaAlign, setMediaAlign] = useState<'center' | 'left' | 'right' | 'full'>('center');

  // Link Modal State (Centered Modal - replaces native window.prompt)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const savedSelectionRef = useRef<Range | null>(null);

  // Save text selection whenever cursor/selection changes
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (typeof window === 'undefined' || !savedSelectionRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Sync value to contentEditable when not typing inside
  useEffect(() => {
    if (editorRef.current && mode === 'visual') {
      if (editorRef.current.innerHTML !== value && !isInternalUpdate.current) {
        editorRef.current.innerHTML = value || '';
      }
      isInternalUpdate.current = false;
    }
  }, [value, mode]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    document.execCommand(command, false, val);
    handleEditorInput();
  };

  const handleApplyFormat = (tag: string, label: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    try {
      document.execCommand('formatBlock', false, `<${tag}>`);
    } catch {
      document.execCommand('formatBlock', false, tag);
    }
    setCurrentFormatLabel(label);
    setShowHeadingMenu(false);
    handleEditorInput();
  };

  // Open Link Modal (Centered)
  const handleOpenLinkModal = () => {
    saveSelection();
    if (typeof window !== 'undefined') {
      const sel = window.getSelection();
      const selectedStr = sel ? sel.toString() : '';
      setLinkText(selectedStr);
    }
    setLinkUrl('https://');
    setLinkNewTab(true);
    setShowLinkModal(true);
  };

  // Insert Link from Centered Modal
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim() || linkUrl.trim() === 'https://') return;

    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();

    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const textToInsert = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}"${targetAttr} class="text-blue-600 underline font-semibold">${textToInsert}</a>`;

    document.execCommand('insertHTML', false, linkHtml);
    handleEditorInput();
    setShowLinkModal(false);
  };

  // Insert Media from Centered Modal
  const handleInsertMedia = () => {
    if (!mediaUrl.trim()) return;

    let alignClass = 'my-4 block mx-auto rounded-none border border-border shadow-sm';
    if (mediaAlign === 'left') alignClass = 'my-4 mr-4 float-left rounded-none border border-border';
    if (mediaAlign === 'right') alignClass = 'my-4 ml-4 float-right rounded-none border border-border';
    if (mediaAlign === 'full') alignClass = 'my-4 w-full block rounded-none border border-border';

    const imgTag = `<figure class="my-4"><img src="${mediaUrl.trim()}" alt="${mediaAlt || 'Article illustration'}" class="${alignClass}" /><figcaption class="text-xs text-center text-muted-foreground mt-1.5 italic">${mediaAlt || ''}</figcaption></figure><p><br/></p>`;

    if (mode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      document.execCommand('insertHTML', false, imgTag);
      handleEditorInput();
    } else {
      onChange((value || '') + '\n' + imgTag);
    }

    setMediaUrl('');
    setMediaAlt('');
    setShowMediaModal(false);
  };

  return (
    <div className="border border-border bg-card shadow-xs">
      {/* Divi / WordPress Top Bar: Add Media Button + Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-900 border-b border-border">
        {/* Left: Add Media Button */}
        <button
          type="button"
          onClick={() => {
            saveSelection();
            setShowMediaModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-border hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground transition-colors shadow-xs"
        >
          <ImagePlus className="w-3.5 h-3.5 text-blue-600" />
          <span>Add Media</span>
        </button>

        {/* Right: Visual / Text Mode Tabs */}
        <div className="flex items-center border border-border bg-white dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors ${
              mode === 'visual'
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors ${
              mode === 'text'
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode className="w-3 h-3" />
            <span>Text (HTML)</span>
          </button>
        </div>
      </div>

      {/* Visual Toolbar (Shown only in Visual Mode) */}
      {mode === 'visual' && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 border-b border-border text-foreground">
          {/* Custom Heading / Paragraph Dropdown Menu (Prevents selection loss) */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => setShowHeadingMenu(!showHeadingMenu)}
              className="h-7 px-2.5 bg-white dark:bg-slate-800 border border-border hover:border-blue-600 text-xs font-bold flex items-center gap-1.5 text-foreground shadow-2xs"
              title="Change heading or paragraph format"
            >
              <span>{currentFormatLabel}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {showHeadingMenu && (
              <div
                className="absolute top-8 left-0 z-30 bg-white dark:bg-slate-900 border border-border shadow-xl w-48 py-1"
                onMouseDown={(e) => e.preventDefault()}
              >
                {HEADING_OPTIONS.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleApplyFormat(item.tag, item.label)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 flex items-center justify-between font-semibold"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.preview}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Text Styling: Bold, Italic, Underline, Strikethrough */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('bold');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 font-black text-xs"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('italic');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 italic text-xs"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('underline');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 underline text-xs"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('strikeThrough');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 line-through text-xs"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('insertUnorderedList');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Bulleted List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('insertOrderedList');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleApplyFormat('blockquote', 'Blockquote');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Alignments */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('justifyLeft');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('justifyCenter');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('justifyRight');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('justifyFull');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Centered Link Modal Trigger */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleOpenLinkModal();
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-600"
            title="Insert Link (Centered Popup)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('unlink');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
            title="Remove Link"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Color Picker Toggle & Hex-only Box */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowColorPicker(!showColorPicker);
              }}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1 group"
              title="Text Color & Custom HEX"
            >
              <div className="relative">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span
                  className="absolute -bottom-1 left-0 right-0 h-1 rounded-none border border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: currentColor }}
                />
              </div>
            </button>

            {showColorPicker && (
              <ColorPickerPopover
                initialColor={currentColor}
                onSelectColor={(hex) => {
                  setCurrentColor(hex);
                  if (editorRef.current) {
                    editorRef.current.focus();
                  }
                  restoreSelection();
                  exec('foreColor', hex);
                  setShowColorPicker(false);
                }}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('insertHorizontalRule');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Horizontal Line"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('removeFormat');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('undo');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('redo');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      {mode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onBlur={() => {
            saveSelection();
            handleEditorInput();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          style={{ minHeight }}
          className="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 rich-text-content text-sm leading-relaxed overflow-y-auto"
          data-placeholder={placeholder}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-900 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 border-0 resize-y"
        />
      )}

      {/* 1. Centered Link Modal (Middle Center of Screen) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-foreground">Insert / Edit Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/..."
                  className="w-full h-9 px-3 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Display Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text to display (or leave empty)"
                  className="w-full h-9 px-3 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="linkNewTabCheck"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <label htmlFor="linkNewTabCheck" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1">
                  <span>Open link in new tab</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!linkUrl.trim() || linkUrl.trim() === 'https://'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Insert Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Centered Add Media Modal (Middle Center of Screen) */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-foreground">Insert Media / Image</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Image Source</label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Computer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setMediaUrl(reader.result);
                              if (!mediaAlt) {
                                setMediaAlt(file.name.replace(/\.[^/.]+$/, ''));
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-muted-foreground">or paste direct image URL below</span>
                </div>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Image SEO Alt Text / Caption
                </label>
                <input
                  type="text"
                  value={mediaAlt}
                  onChange={(e) => setMediaAlt(e.target.value)}
                  placeholder="e.g. Detailed product comparison diagram"
                  className="w-full h-9 px-3 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Used for Google Image search SEO and accessibility (&lt;img alt=&quot;...&quot;&gt;).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Alignment</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {(['center', 'left', 'right', 'full'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setMediaAlign(align)}
                      className={`py-1.5 border font-semibold capitalize ${
                        mediaAlign === align
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600'
                          : 'border-border bg-background hover:border-foreground'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="px-4 py-2 border border-border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertMedia}
                disabled={!mediaUrl.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Insert into Article</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;
