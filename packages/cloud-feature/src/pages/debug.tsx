import type { GetServerSideProps } from 'next';
import { Header } from '@test/ui';
import { getEnv } from '@test/shared/runtime-config';
export const getServerSideProps: GetServerSideProps = async () => ({ props: { env: getEnv() } });
export default function CloudDebug({ env }: { env: any }) {
  return (<div><Header currentProduct="cloud" />
    <pre>{JSON.stringify(env, null, 2)}</pre></div>);
}
