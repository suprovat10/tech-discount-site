'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Table as TableIcon,
  MousePointerClick,
  Plus,
  Trash2,
  Columns,
  Rows,
  ShoppingCart,
  ArrowRight,
  Sparkles,
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

interface ActiveTableInfo {
  cell: HTMLTableCellElement;
  row: HTMLTableRowElement;
  table: HTMLTableElement;
  rowIndex: number;
  colIndex: number;
  totalRows: number;
  totalCols: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here in rich visual style...',
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

  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  // Table Creation Modal State
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);
  const [tableStyle, setTableStyle] = useState<'default' | 'striped' | 'blue' | 'dark'>('default');
  const [tableFullWidth, setTableFullWidth] = useState(true);

  // Active Table Context State (When cursor is inside a table)
  const [activeTableInfo, setActiveTableInfo] = useState<ActiveTableInfo | null>(null);
  const savedTargetCellRef = useRef<HTMLTableCellElement | null>(null);

  // Button (CTA) Modal State
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [buttonText, setButtonText] = useState('Check Price & Availability');
  const [buttonUrl, setButtonUrl] = useState('https://');
  const [buttonNewTab, setButtonNewTab] = useState(true);
  const [buttonPreset, setButtonPreset] = useState<'blue' | 'green' | 'amber' | 'dark' | 'red' | 'outline' | 'custom'>('blue');
  const [buttonBgColor, setButtonBgColor] = useState('#2563eb');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [buttonSize, setButtonSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [buttonRadius, setButtonRadius] = useState<'square' | 'rounded' | 'pill'>('square');
  const [buttonAlign, setButtonAlign] = useState<'inline' | 'center' | 'full'>('inline');
  const [buttonIcon, setButtonIcon] = useState<'none' | 'external' | 'cart' | 'arrow' | 'sparkle'>('external');

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

  // Detect if cursor is currently inside a table cell
  const getActiveTableCell = useCallback((): HTMLTableCellElement | null => {
    if (typeof window === 'undefined' || !editorRef.current) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (tag === 'td' || tag === 'th') {
          return node as HTMLTableCellElement;
        }
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  const updateTableContext = useCallback(() => {
    const foundCell = getActiveTableCell();
    if (foundCell) {
      const row = foundCell.closest('tr');
      const table = foundCell.closest('table');
      if (row && table) {
        setActiveTableInfo({
          cell: foundCell,
          row,
          table,
          rowIndex: row.rowIndex,
          colIndex: foundCell.cellIndex,
          totalRows: table.rows.length,
          totalCols: row.cells.length,
        });
        return;
      }
    }
    setActiveTableInfo(null);
  }, [getActiveTableCell]);

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
      updateTableContext();
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

  // ==========================================
  // TABLE CREATION & MANIPULATION LOGIC
  // ==========================================
  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = Math.max(1, Math.min(25, tableRows));
    const cols = Math.max(1, Math.min(12, tableCols));

    let styleClass = 'rich-table';
    if (tableStyle === 'striped') styleClass += ' rich-table-striped';
    if (tableStyle === 'blue') styleClass += ' rich-table-blue-header';
    if (tableStyle === 'dark') styleClass += ' rich-table-dark-header';

    let tableHtml = `<div class="rich-table-wrapper my-4 overflow-x-auto"><table class="${styleClass}" style="width: ${tableFullWidth ? '100%' : 'auto'}; border-collapse: collapse;">`;

    // Header row
    if (tableHasHeader) {
      tableHtml += '<thead><tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<th style="padding: 10px 14px; font-weight: 700;">Header ${c}</th>`;
      }
      tableHtml += '</tr></thead>';
    }

    // Body rows
    tableHtml += '<tbody>';
    const bodyRowCount = tableHasHeader ? Math.max(1, rows - 1) : rows;
    for (let r = 1; r <= bodyRowCount; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="padding: 10px 14px;">Cell ${r}-${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div><p><br/></p>';

    if (mode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      document.execCommand('insertHTML', false, tableHtml);
      handleEditorInput();
    } else {
      onChange((value || '') + '\n' + tableHtml);
    }

    setShowTableModal(false);
  };

  // Add Table Row (Above or Below)
  const handleAddTableRow = (pos: 'above' | 'below') => {
    const info = activeTableInfo;
    if (!info) return;
    const { row, table } = info;
    const colCount = row.cells.length || 1;
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.style.padding = '10px 14px';
      td.innerHTML = '<br/>';
      newRow.appendChild(td);
    }

    if (pos === 'above') {
      row.parentNode?.insertBefore(newRow, row);
    } else {
      if (row.nextSibling) {
        row.parentNode?.insertBefore(newRow, row.nextSibling);
      } else {
        row.parentNode?.appendChild(newRow);
      }
    }
    handleEditorInput();
  };

  // Delete Table Row
  const handleDeleteTableRow = () => {
    const info = activeTableInfo;
    if (!info) return;
    const { row, table } = info;
    row.remove();
    if (table.rows.length === 0) {
      const wrapper = table.closest('.rich-table-wrapper') || table;
      wrapper.remove();
      setActiveTableInfo(null);
    }
    handleEditorInput();
  };

  // Add Table Column (Left or Right)
  const handleAddTableCol = (pos: 'left' | 'right') => {
    const info = activeTableInfo;
    if (!info) return;
    const { table, colIndex } = info;
    const allRows = Array.from(table.rows);

    allRows.forEach((r) => {
      const isHeader = r.parentElement?.tagName.toLowerCase() === 'thead' || r.cells[0]?.tagName.toLowerCase() === 'th';
      const cell = document.createElement(isHeader ? 'th' : 'td');
      cell.style.padding = '10px 14px';
      if (isHeader) {
        cell.style.fontWeight = '700';
        cell.innerHTML = 'New Header';
      } else {
        cell.innerHTML = '<br/>';
      }

      const targetCell = r.cells[colIndex];
      if (pos === 'left') {
        r.insertBefore(cell, targetCell || null);
      } else {
        if (targetCell && targetCell.nextSibling) {
          r.insertBefore(cell, targetCell.nextSibling);
        } else {
          r.appendChild(cell);
        }
      }
    });
    handleEditorInput();
  };

  // Delete Table Column
  const handleDeleteTableCol = () => {
    const info = activeTableInfo;
    if (!info) return;
    const { table, colIndex } = info;
    const allRows = Array.from(table.rows);

    allRows.forEach((r) => {
      if (r.cells[colIndex]) {
        r.cells[colIndex].remove();
      }
    });

    if (table.rows[0]?.cells.length === 0 || table.rows.length === 0) {
      const wrapper = table.closest('.rich-table-wrapper') || table;
      wrapper.remove();
      setActiveTableInfo(null);
    }
    handleEditorInput();
  };

  // Change Cell Background
  const handleSetCellBg = (color: string) => {
    if (!activeTableInfo) return;
    activeTableInfo.cell.style.backgroundColor = color;
    handleEditorInput();
  };

  // Delete Entire Table
  const handleDeleteEntireTable = () => {
    if (!activeTableInfo) return;
    const wrapper = activeTableInfo.table.closest('.rich-table-wrapper') || activeTableInfo.table;
    wrapper.remove();
    setActiveTableInfo(null);
    handleEditorInput();
  };

  // ==========================================
  // BUTTON (CTA) CREATION LOGIC
  // ==========================================
  const handleSelectButtonPreset = (preset: typeof buttonPreset) => {
    setButtonPreset(preset);
    if (preset === 'blue') {
      setButtonBgColor('#2563eb');
      setButtonTextColor('#ffffff');
    } else if (preset === 'green') {
      setButtonBgColor('#16a34a');
      setButtonTextColor('#ffffff');
    } else if (preset === 'amber') {
      setButtonBgColor('#f59e0b');
      setButtonTextColor('#ffffff');
    } else if (preset === 'dark') {
      setButtonBgColor('#0f172a');
      setButtonTextColor('#ffffff');
    } else if (preset === 'red') {
      setButtonBgColor('#dc2626');
      setButtonTextColor('#ffffff');
    } else if (preset === 'outline') {
      setButtonBgColor('transparent');
      setButtonTextColor('#2563eb');
    }
  };

  const generateButtonHtml = () => {
    let iconMarkup = '';
    if (buttonIcon === 'external') {
      iconMarkup = '<span style="display:inline-block; margin-left:4px;">↗</span>';
    } else if (buttonIcon === 'cart') {
      iconMarkup = '<span style="display:inline-block; margin-right:4px;">🛒</span>';
    } else if (buttonIcon === 'arrow') {
      iconMarkup = '<span style="display:inline-block; margin-left:4px;">→</span>';
    } else if (buttonIcon === 'sparkle') {
      iconMarkup = '<span style="display:inline-block; margin-right:4px;">✦</span>';
    }

    const targetAttr = buttonNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const radiusClass =
      buttonRadius === 'pill'
        ? 'rich-btn-pill'
        : buttonRadius === 'rounded'
        ? 'rich-btn-rounded'
        : 'rich-btn-square';
    const borderRadius =
      buttonRadius === 'pill' ? '9999px' : buttonRadius === 'rounded' ? '6px' : '0px';

    let padding = '10px 22px';
    let fontSize = '14px';
    if (buttonSize === 'sm') {
      padding = '6px 14px';
      fontSize = '12px';
    } else if (buttonSize === 'lg') {
      padding = '14px 28px';
      fontSize = '16px';
    }

    const borderStyle = buttonPreset === 'outline' ? '2px solid #2563eb' : 'none';

    const btnAnchor = `<a href="${buttonUrl.trim()}"${targetAttr} class="rich-btn ${radiusClass}" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; background-color: ${buttonBgColor}; color: ${buttonTextColor} !important; padding: ${padding}; font-size: ${fontSize}; font-weight: 700; text-decoration: none; border-radius: ${borderRadius}; border: ${borderStyle}; cursor: pointer; text-align: center;">${
      buttonIcon === 'cart' || buttonIcon === 'sparkle' ? iconMarkup : ''
    }<span>${buttonText.trim() || 'Click Here'}</span>${
      buttonIcon === 'external' || buttonIcon === 'arrow' ? iconMarkup : ''
    }</a>`;

    // If placed inside a table cell or inline
    if (buttonAlign === 'inline' || savedTargetCellRef.current) {
      return btnAnchor;
    }
    if (buttonAlign === 'center') {
      return `<div class="rich-btn-wrapper my-3" style="text-align: center;">${btnAnchor}</div><p><br/></p>`;
    }
    if (buttonAlign === 'full') {
      return `<div class="rich-btn-wrapper my-3" style="width: 100%;"><a href="${buttonUrl.trim()}"${targetAttr} class="rich-btn ${radiusClass}" style="display: flex; width: 100%; align-items: center; justify-content: center; gap: 6px; background-color: ${buttonBgColor}; color: ${buttonTextColor} !important; padding: ${padding}; font-size: ${fontSize}; font-weight: 700; text-decoration: none; border-radius: ${borderRadius}; border: ${borderStyle}; cursor: pointer; text-align: center;">${
        buttonIcon === 'cart' || buttonIcon === 'sparkle' ? iconMarkup : ''
      }<span>${buttonText.trim() || 'Click Here'}</span>${
        buttonIcon === 'external' || buttonIcon === 'arrow' ? iconMarkup : ''
      }</a></div><p><br/></p>`;
    }
    return btnAnchor;
  };

  const handleInsertButton = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buttonUrl.trim() || buttonUrl.trim() === 'https://') return;

    const btnHtml = generateButtonHtml();

    if (mode === 'visual' && editorRef.current) {
      editorRef.current.focus();

      // Check if target was inside a table cell
      if (savedTargetCellRef.current && editorRef.current.contains(savedTargetCellRef.current)) {
        const cell = savedTargetCellRef.current;
        if (cell.innerHTML === '<br>' || cell.innerHTML === '<br/>' || !cell.textContent?.trim()) {
          cell.innerHTML = btnHtml;
        } else {
          cell.insertAdjacentHTML('beforeend', '&nbsp;' + btnHtml);
        }
        handleEditorInput();
      } else {
        restoreSelection();
        document.execCommand('insertHTML', false, btnHtml);
        handleEditorInput();
      }
    } else {
      onChange((value || '') + '\n' + btnHtml);
    }

    savedTargetCellRef.current = null;
    setShowButtonModal(false);
  };

  return (
    <div className="border border-border bg-card shadow-xs">
      {/* Divi / WordPress Top Bar: Add Media Button + Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-900 border-b border-border">
        {/* Left: Add Media Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowMediaModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-border hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground transition-colors shadow-xs cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Media</span>
          </button>

          {/* Table Trigger Button in Top Header */}
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowTableModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-border hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground transition-colors shadow-xs cursor-pointer"
            title="Create and customize a comparison table"
          >
            <TableIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Insert Table</span>
          </button>

          {/* Button Trigger in Top Header */}
          <button
            type="button"
            onClick={() => {
              saveSelection();
              savedTargetCellRef.current = getActiveTableCell();
              if (typeof window !== 'undefined') {
                const str = window.getSelection()?.toString();
                if (str && str.trim()) setButtonText(str.trim());
              }
              setShowButtonModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-border hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground transition-colors shadow-xs cursor-pointer"
            title="Insert a styled CTA Buy Now / Deal button"
          >
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
            <span>Insert CTA Button</span>
          </button>
        </div>

        {/* Right: Visual / Text Mode Tabs */}
        <div className="flex items-center border border-border bg-white dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
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
            className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
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
          {/* Custom Heading / Paragraph Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => setShowHeadingMenu(!showHeadingMenu)}
              className="h-7 px-2.5 bg-white dark:bg-slate-800 border border-border hover:border-blue-600 text-xs font-bold flex items-center gap-1.5 text-foreground shadow-2xs cursor-pointer"
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
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 flex items-center justify-between font-semibold cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 font-black text-xs cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 italic text-xs cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 underline text-xs cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 line-through text-xs cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Link Modal Trigger */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleOpenLinkModal();
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('unlink');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
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
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1 group cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Table Modal Trigger Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setShowTableModal(true);
            }}
            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 flex items-center gap-1 font-bold text-xs border border-transparent hover:border-blue-300 dark:hover:border-blue-800 cursor-pointer"
            title="Create Custom Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>

          {/* Button (CTA) Modal Trigger Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              savedTargetCellRef.current = getActiveTableCell();
              if (typeof window !== 'undefined') {
                const str = window.getSelection()?.toString();
                if (str && str.trim()) setButtonText(str.trim());
              }
              setShowButtonModal(true);
            }}
            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 flex items-center gap-1 font-bold text-xs border border-transparent hover:border-emerald-300 dark:hover:border-emerald-800 cursor-pointer"
            title="Insert CTA Button"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Button</span>
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('undo');
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Contextual Table Helper Bar (Appears when cursor is clicked inside any table cell) */}
      {mode === 'visual' && activeTableInfo && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-blue-50/90 dark:bg-blue-950/80 border-b border-blue-200 dark:border-blue-900/60 text-xs animate-in fade-in">
          <div className="flex items-center gap-1 font-bold text-blue-700 dark:text-blue-300 text-[11px] mr-1">
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table Tools (R{activeTableInfo.rowIndex + 1}:C{activeTableInfo.colIndex + 1}):</span>
          </div>

          {/* Row actions */}
          <div className="flex items-center border border-border bg-card">
            <button
              type="button"
              onClick={() => handleAddTableRow('above')}
              className="px-2 py-0.5 text-[11px] font-semibold hover:bg-muted text-foreground border-r border-border cursor-pointer"
              title="Insert Row Above"
            >
              + Row ↑
            </button>
            <button
              type="button"
              onClick={() => handleAddTableRow('below')}
              className="px-2 py-0.5 text-[11px] font-semibold hover:bg-muted text-foreground border-r border-border cursor-pointer"
              title="Insert Row Below"
            >
              + Row ↓
            </button>
            <button
              type="button"
              onClick={handleDeleteTableRow}
              className="px-2 py-0.5 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-950 text-red-600 cursor-pointer"
              title="Delete This Row"
            >
              Delete Row
            </button>
          </div>

          {/* Col actions */}
          <div className="flex items-center border border-border bg-card">
            <button
              type="button"
              onClick={() => handleAddTableCol('left')}
              className="px-2 py-0.5 text-[11px] font-semibold hover:bg-muted text-foreground border-r border-border cursor-pointer"
              title="Insert Column Left"
            >
              + Col ←
            </button>
            <button
              type="button"
              onClick={() => handleAddTableCol('right')}
              className="px-2 py-0.5 text-[11px] font-semibold hover:bg-muted text-foreground border-r border-border cursor-pointer"
              title="Insert Column Right"
            >
              + Col →
            </button>
            <button
              type="button"
              onClick={handleDeleteTableCol}
              className="px-2 py-0.5 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-950 text-red-600 cursor-pointer"
              title="Delete This Column"
            >
              Delete Col
            </button>
          </div>

          {/* Cell color presets */}
          <div className="flex items-center gap-1 border border-border bg-card px-2 py-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold">Cell Bg:</span>
            {[
              { name: 'Clear', color: 'transparent' },
              { name: 'Gray', color: '#f1f5f9' },
              { name: 'Blue', color: '#eff6ff' },
              { name: 'Green', color: '#f0fdf4' },
              { name: 'Amber', color: '#fffbeb' },
              { name: 'Red', color: '#fef2f2' },
            ].map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSetCellBg(c.color)}
                className="w-3.5 h-3.5 border border-slate-300 dark:border-slate-700 hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: c.color === 'transparent' ? '#ffffff' : c.color }}
                title={`Set cell background: ${c.name}`}
              />
            ))}
          </div>

          {/* Button inside cell shortcut */}
          <button
            type="button"
            onClick={() => {
              saveSelection();
              savedTargetCellRef.current = activeTableInfo.cell;
              setShowButtonModal(true);
            }}
            className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Insert CTA Button directly into this cell"
          >
            <MousePointerClick className="w-3 h-3" />
            <span>+ Button in Cell</span>
          </button>

          {/* Delete table */}
          <button
            type="button"
            onClick={handleDeleteEntireTable}
            className="ml-auto px-2 py-0.5 text-[11px] font-semibold hover:bg-red-600 hover:text-white text-red-600 border border-red-200 dark:border-red-900 transition-colors flex items-center gap-1 cursor-pointer"
            title="Delete this entire table"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete Table</span>
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
          onKeyUp={() => {
            saveSelection();
            updateTableContext();
          }}
          onMouseUp={() => {
            saveSelection();
            updateTableContext();
          }}
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

      {/* ======================================================== */}
      {/* 1. TABLE CREATION & SETTINGS MODAL */}
      {/* ======================================================== */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-foreground">Create & Insert Table</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertTable} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">
                    Number of Rows (1-25)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 bg-background border border-border focus:border-blue-600 focus:outline-none font-semibold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">
                    Number of Columns (1-12)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 bg-background border border-border focus:border-blue-600 focus:outline-none font-semibold text-xs"
                    required
                  />
                </div>
              </div>

              {/* Table Style Options */}
              <div>
                <label className="block font-bold text-foreground mb-1">Table Design Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'default', label: 'Clean Bordered', desc: 'Standard borders' },
                    { id: 'striped', label: 'Zebra Striped', desc: 'Alternate row tint' },
                    { id: 'blue', label: 'Blue Header', desc: 'Tech Blue accent' },
                    { id: 'dark', label: 'Dark Header', desc: 'Sleek contrast' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTableStyle(s.id as any)}
                      className={`p-2 text-left border text-xs font-semibold cursor-pointer transition-colors ${
                        tableStyle === s.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                          : 'border-border bg-card hover:border-foreground/50'
                      }`}
                    >
                      <div className="font-bold">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tableHasHeader}
                    onChange={(e) => setTableHasHeader(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="font-semibold text-foreground">Include Header Row (&lt;thead&gt;)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tableFullWidth}
                    onChange={(e) => setTableFullWidth(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="font-semibold text-foreground">100% Full Width Container</span>
                </label>
              </div>

              {/* Preview */}
              <div className="p-3 bg-muted/40 border border-border space-y-1.5">
                <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                  <span>Layout Preview:</span>
                  <span>{tableRows} Rows &times; {tableCols} Columns</span>
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Inside each cell, you can directly type text, format styles (bold, italic, font colors, links), and insert CTA Buttons!
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 border border-border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Table</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CALL-TO-ACTION (CTA) BUTTON MODAL */}
      {/* ======================================================== */}
      {showButtonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-foreground">Insert CTA Button</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowButtonModal(false)}
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertButton} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Button Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g. Check Price on Amazon, Buy Now, View Deal"
                  className="w-full h-9 px-3 bg-background border border-border focus:border-blue-600 focus:outline-none font-semibold text-xs"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">
                  Destination URL / Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="https://amazon.com/... or /product/..."
                  className="w-full h-9 px-3 bg-background border border-border focus:border-blue-600 focus:outline-none font-mono text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="btnNewTabCheck"
                  checked={buttonNewTab}
                  onChange={(e) => setButtonNewTab(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="btnNewTabCheck" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1">
                  <span>Open link in new tab</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </label>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">Color Style Preset</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'blue', label: 'Primary Blue', bg: '#2563eb' },
                    { id: 'green', label: 'Deal Green', bg: '#16a34a' },
                    { id: 'amber', label: 'Amazon Amber', bg: '#f59e0b' },
                    { id: 'dark', label: 'Sleek Dark', bg: '#0f172a' },
                    { id: 'red', label: 'Crimson Red', bg: '#dc2626' },
                    { id: 'outline', label: 'Outline Blue', bg: '#ffffff', text: '#2563eb' },
                    { id: 'custom', label: 'Custom Color', bg: buttonBgColor },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectButtonPreset(p.id as any)}
                      className={`p-2 text-center border font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        buttonPreset === p.id
                          ? 'border-foreground shadow-sm ring-1 ring-foreground'
                          : 'border-border hover:border-foreground/60'
                      }`}
                    >
                      <span
                        className="w-3 h-3 border border-border inline-block shrink-0"
                        style={{ backgroundColor: p.bg }}
                      />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Color Pickers */}
                {buttonPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mt-2.5 p-3 bg-muted/30 border border-border">
                    <div>
                      <label className="block text-[11px] font-bold text-foreground mb-1">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={buttonBgColor}
                          onChange={(e) => setButtonBgColor(e.target.value)}
                          className="w-8 h-8 p-0 border border-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={buttonBgColor}
                          onChange={(e) => setButtonBgColor(e.target.value)}
                          className="w-full h-8 px-2 font-mono text-xs bg-background border border-border"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-foreground mb-1">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={buttonTextColor}
                          onChange={(e) => setButtonTextColor(e.target.value)}
                          className="w-8 h-8 p-0 border border-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={buttonTextColor}
                          onChange={(e) => setButtonTextColor(e.target.value)}
                          className="w-full h-8 px-2 font-mono text-xs bg-background border border-border"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Size, Corners, and Alignment in 3 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Size */}
                <div>
                  <label className="block font-bold text-foreground mb-1">Button Size</label>
                  <select
                    value={buttonSize}
                    onChange={(e) => setButtonSize(e.target.value as any)}
                    className="w-full h-8 px-2 bg-background border border-border text-xs font-semibold"
                  >
                    <option value="sm">Small (Compact / Table)</option>
                    <option value="md">Medium (Standard)</option>
                    <option value="lg">Large (Hero CTA)</option>
                  </select>
                </div>

                {/* Corners */}
                <div>
                  <label className="block font-bold text-foreground mb-1">Corner Style</label>
                  <select
                    value={buttonRadius}
                    onChange={(e) => setButtonRadius(e.target.value as any)}
                    className="w-full h-8 px-2 bg-background border border-border text-xs font-semibold"
                  >
                    <option value="square">Square (Default)</option>
                    <option value="rounded">Rounded (6px)</option>
                    <option value="pill">Pill Rounded (Capsule)</option>
                  </select>
                </div>

                {/* Icon */}
                <div>
                  <label className="block font-bold text-foreground mb-1">Button Icon</label>
                  <select
                    value={buttonIcon}
                    onChange={(e) => setButtonIcon(e.target.value as any)}
                    className="w-full h-8 px-2 bg-background border border-border text-xs font-semibold"
                  >
                    <option value="none">None</option>
                    <option value="external">External Link (↗)</option>
                    <option value="cart">Shopping Cart (🛒)</option>
                    <option value="arrow">Arrow Right (→)</option>
                    <option value="sparkle">Sparkle (✦)</option>
                  </select>
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="block font-bold text-foreground mb-1">Alignment / Placement</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'inline', label: 'Inline / In Cell' },
                    { id: 'center', label: 'Centered Block' },
                    { id: 'full', label: '100% Full Width' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setButtonAlign(a.id as any)}
                      className={`py-1.5 border text-center font-bold text-xs cursor-pointer ${
                        buttonAlign === a.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600'
                          : 'border-border bg-card hover:border-foreground/50'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-muted/40 border border-border space-y-2">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Live Preview:
                </div>
                <div className="py-2 flex items-center justify-center min-h-[50px]">
                  <div
                    style={{
                      display: buttonAlign === 'full' ? 'flex' : 'inline-flex',
                      width: buttonAlign === 'full' ? '100%' : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: buttonBgColor,
                        color: buttonTextColor,
                        padding:
                          buttonSize === 'sm'
                            ? '6px 14px'
                            : buttonSize === 'lg'
                            ? '14px 28px'
                            : '10px 22px',
                        fontSize: buttonSize === 'sm' ? '12px' : buttonSize === 'lg' ? '16px' : '14px',
                        fontWeight: 700,
                        borderRadius:
                          buttonRadius === 'pill'
                            ? '9999px'
                            : buttonRadius === 'rounded'
                            ? '6px'
                            : '0px',
                        border: buttonPreset === 'outline' ? '2px solid #2563eb' : 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {buttonIcon === 'cart' && <span>🛒</span>}
                      {buttonIcon === 'sparkle' && <span>✦</span>}
                      <span>{buttonText || 'Button Text'}</span>
                      {buttonIcon === 'external' && <span>↗</span>}
                      {buttonIcon === 'arrow' && <span>→</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowButtonModal(false)}
                  className="px-4 py-2 border border-border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!buttonUrl.trim() || buttonUrl.trim() === 'https://'}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Button</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. LINK MODAL */}
      {/* ======================================================== */}
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
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
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
                  className="px-4 py-2 border border-border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!linkUrl.trim() || linkUrl.trim() === 'https://'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Insert Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ADD MEDIA MODAL */}
      {/* ======================================================== */}
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
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) {
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('folder', 'editor');
                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.success && data.url) {
                              setMediaUrl(data.url);
                              if (!mediaAlt) {
                                setMediaAlt(file.name.replace(/\.[^/.]+$/, ''));
                              }
                              return;
                            }
                          } catch (err) {
                            console.warn('Editor image upload API failed:', err);
                          }
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
                      className={`py-1.5 border font-semibold capitalize cursor-pointer ${
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
                className="px-4 py-2 border border-border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertMedia}
                disabled={!mediaUrl.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
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
