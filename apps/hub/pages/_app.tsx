import type { AppProps } from 'next/app';
import { AppProviders } from '@test/shared/providers';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <Component {...pageProps} />
    </AppProviders>
  );
}
