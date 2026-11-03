import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// 관리 링크(관리 코드 포함)가 검색 엔진이나 외부 사이트 Referer로 새지 않게 한다.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ManageLayout({ children }: { children: ReactNode }) {
  return children;
}
