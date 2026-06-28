import { Html, Head, Main, NextScript } from 'next/document';
export default function Document() {
  return (
    <Html>
      <Head>
        <script src="/hub/env-config.js" />
      </Head>
      <body><Main /><NextScript /></body>
    </Html>
  );
}
