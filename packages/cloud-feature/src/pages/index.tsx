import { Header } from '@test/ui';
// CLOUD-ONLY-MARKER: 이 문자열은 hub 이미지에서 절대 grep되면 안 된다 (acceptance C)
export default function CloudHome() {
  return (<div><Header currentProduct="cloud" /><main>Cloud Home (prototype)</main></div>);
}
