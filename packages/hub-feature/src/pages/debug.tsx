import type { GetServerSideProps } from 'next';
import { Header } from '@test/ui';
import { getEnv } from '@test/shared/runtime-config';
export const getServerSideProps: GetServerSideProps = async () => {
  if (!getEnv().ENABLE_HUB) return { notFound: true };
  return { props: { env: getEnv() } };
};
export default function HubDebug({ env }: { env: any }) {
  return (<div><Header currentProduct="hub" />
    <pre>{JSON.stringify(env, null, 2)}</pre></div>);
}
