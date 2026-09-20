import React from 'react';

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      {/* Top thin loading indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-blue-600/20 z-[100] overflow-hidden">
        <div className="h-full bg-blue-600 animate-pulse w-2/3 mx-auto rounded-full" />
      </div>

      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-muted-foreground animate-pulse">
        Loading deals & prices...
      </p>
    </div>
  );
}
