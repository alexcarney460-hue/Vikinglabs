"use client";
import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  const headline = '≥99% Purity';
  const subhead = 'Research‑grade peptides with verified COAs';
  const cta = 'View Catalog';

  // Use a real <picture> element for the hero image so mobile browsers get a supported format
  const optimizedBase = '/optimized/products/ipamorelin-10ml';

  return (
    <section className={styles.hero} aria-label="Viking Labs hero">
      <div className={styles.inner}>
        <div className={styles.text}>
          <div className={styles.badge}>QC‑tested</div>
          <h1 className={styles.title}>{headline}</h1>
          <p className={styles.sub}>{subhead}</p>
          <Link className={styles.cta} href="/catalog">{cta}</Link>
          <div className={styles.legal}>For research use only. Not for human consumption.</div>
        </div>
        <div className={styles.imageWrap}>
          <picture className={styles.image}>
            <source srcSet={`${optimizedBase}-1024.avif`} type="image/avif" />
            <source srcSet={`${optimizedBase}-1024.webp`} type="image/webp" />
            <img src="/products/ipamorelin-cjc-10ml.png" alt="Viking Labs product vials" className="w-full h-full object-contain" loading="eager" />
          </picture>
        </div>
      </div>
    </section>
  );
}
