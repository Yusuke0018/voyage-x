'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message = 'エラーが発生しました', onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-lg font-medium mb-2">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          再読み込み
        </Button>
      )}
    </div>
  );
}

export function ErrorPage({ message = 'ページの読み込みに失敗しました' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">エラー</h1>
        <p className="text-muted-foreground mb-4">{message}</p>
        <Button onClick={() => window.location.reload()}>
          ページを再読み込み
        </Button>
      </div>
    </div>
  );
}