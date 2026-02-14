"use client";
import { useState } from 'react';

export default function ProductImage({ candidates, alt }) {
  // candidates is an array ordered by preference: avif, webp, optimized base, original
  // We'll render a <picture> with avif/webp sources and a fallback <img> to avoid 404s in browsers without AVIF support.
  const base = candidates.find(c => c && c.endsWith('.png')) || candidates[candidates.length-1];
  const avif = candidates.find(c => c && c.endsWith('.avif'));
  const webp = candidates.find(c => c && c.endsWith('.webp'));

  return (
    <picture>
      {avif && <source srcSet={avif} type="image/avif" />}
      {webp && <source srcSet={webp} type="image/webp" />}
      <img
        src={base}
        alt={alt}
        className="object-contain object-center drop-shadow-xl group-hover:scale-110 transition-transform duration-500 w-full h-full"
        loading="lazy"
      />
    </picture>
  );
}
