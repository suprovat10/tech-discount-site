'use client';

import React from 'react';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  itemType?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title = 'Confirm Deletion',
  itemName,
  itemType = 'item',
  message,
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isDeleting = false,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-card text-card-foreground border border-border max-w-md w-full p-6 shadow-2xl space-y-5 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-dialog-title" className="font-black text-base text-foreground tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Permanently remove {itemType}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs">
          {itemName && (
            <div className="bg-muted/40 border border-border/70 p-3 rounded-lg flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="font-bold text-foreground text-xs truncate flex-1">
                {itemName}
              </span>
            </div>
          )}

          <p className="text-muted-foreground leading-relaxed">
            {message || (
              <>
                Are you sure you want to permanently delete this {itemType}? This action cannot be undone and will remove all associated data.
              </>
            )}
          </p>

          <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400 text-[11px] font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This change will take effect immediately.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={onClose}
            className="text-xs h-9 px-4 font-semibold"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isDeleting}
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs h-9 px-4 flex items-center gap-1.5 shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
