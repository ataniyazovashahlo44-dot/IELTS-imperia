import { useState } from 'react';

interface Props {
  className?: string;   // img height class, e.g. "h-8"
  wrapDark?: boolean;   // wrap in white bg for dark mode
}

export default function Logo({ className = 'h-8', wrapDark = true }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Get approximate size from className (h-8 = 2rem, h-20 = 5rem, etc.)
    const sizeMap: Record<string, string> = {
      'h-6': '1rem', 'h-7': '1.1rem', 'h-8': '1.25rem', 'h-9': '1.4rem', 'h-10': '1.5rem',
      'h-12': '1.75rem', 'h-14': '2rem', 'h-16': '2.25rem', 'h-20': '2.75rem',
      'h-24': '3rem', 'h-28': '3.5rem', 'h-32': '4rem',
    };
    const fs = sizeMap[className ?? ''] || '1.25rem';
    return (
      <span className="font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-0.5 select-none" style={{ fontSize: fs }}>
        <span className="text-red-600">IELTS</span>
        <span className="ml-1">Imperia</span>
      </span>
    );
  }

  const img = (
    <img
      src="/logo.png"
      alt="IELTS Imperia"
      className={`${className} w-auto object-contain`}
      onError={() => setFailed(true)}
    />
  );

  if (!wrapDark) return img;

  return (
    <div className="rounded-lg dark:bg-white dark:px-2 dark:py-1 transition-colors inline-flex">
      {img}
    </div>
  );
}
