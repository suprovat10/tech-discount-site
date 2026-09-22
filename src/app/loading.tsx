import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-blue-600 animate-spin" />
        <span className="text-xs text-muted-foreground font-medium animate-pulse">
          Loading deals...
        </span>
      </div>
    </div>
  );
}
