'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b">
          <div className="flex flex-col p-4 space-y-2">
            <a href="/" className="py-2 hover:text-primary" onClick={() => setIsOpen(false)}>
              ダッシュボード
            </a>
            <a href="/goals" className="py-2 hover:text-primary" onClick={() => setIsOpen(false)}>
              目標
            </a>
            <a href="/timeline" className="py-2 hover:text-primary" onClick={() => setIsOpen(false)}>
              タイムライン
            </a>
            <a href="/review" className="py-2 hover:text-primary" onClick={() => setIsOpen(false)}>
              レビュー
            </a>
            <a href="/settings" className="py-2 hover:text-primary" onClick={() => setIsOpen(false)}>
              設定
            </a>
          </div>
        </div>
      )}
    </>
  );
}