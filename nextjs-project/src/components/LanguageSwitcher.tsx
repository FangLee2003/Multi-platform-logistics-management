"use client";
import Link from 'next/link';

export default function LanguageSwitcher() {
  return (
    <div style={{marginTop: 16}}>
      <Link href="/en">English</Link> | <Link href="/vi">Tiếng Việt</Link>
    </div>
  );
}
