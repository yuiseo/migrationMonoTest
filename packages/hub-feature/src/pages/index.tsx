import type { GetServerSideProps } from 'next';
import { Header } from '@test/ui';
import { getEnv } from '@test/shared/runtime-config';
export const getServerSideProps: GetServerSideProps = async () => {
  if (!getEnv().ENABLE_HUB) return { notFound: true };
  return { props: { now: new Date().toISOString() } };
};
export default function HubHome({ now }: { now: string }) {
  return (<div><Header currentProduct="hub" /><main>Hub Home — {now}</main></div>);
}
