import Link from 'next/link';
import { getEnv } from '@test/shared/runtime-config';

export function Header({ currentProduct }: { currentProduct: 'cloud' | 'hub' }) {
  const showSecurehub = getEnv().ENABLE_HUB;
  return (
    <header style={{ display: 'flex', gap: 16, padding: 12, borderBottom: '1px solid #ccc' }}>
      <Link href="/">Cloud</Link>
      {showSecurehub && <a href="/hub">Hub</a>}
      <span style={{ marginLeft: 'auto', opacity: 0.6 }}>현재: {currentProduct}</span>
    </header>
  );
}
