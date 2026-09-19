'use client';

import React, { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-3 px-5 rounded-xl bg-white text-sky-900 font-bold text-xs">
        ✓ You are subscribed to price drop alerts!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md w-full">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address here..."
        className="flex-1 h-11 px-4 rounded-xl bg-white text-slate-900 text-xs font-medium placeholder:text-muted-foreground focus:outline-none shadow-inner"
      />
      <button
        type="submit"
        className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors shrink-0 shadow-sm"
      >
        Subscribe!
      </button>
    </form>
  );
}
