import { useState } from 'react';
import { Laptop, Smartphone, Headphones, Cpu } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
}

export function ProductImage({ src, alt, category, className = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const Icon =
      category === 'Laptops'
        ? Laptop
        : category === 'Áudio'
          ? Headphones
          : category === 'Peças'
            ? Cpu
            : Smartphone;

    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon className="w-10 h-10 mb-2 stroke-[1.5]" />
        <span className="text-xs font-medium text-slate-500 px-3 text-center line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
