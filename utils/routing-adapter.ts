// Adapter to make Next.js routing work with components expecting react-router-dom
'use client';

import {
  useRouter as useNextRouter,
  usePathname,
  useSearchParams as useNextSearchParams
} from 'next/navigation';
import { useMemo } from 'react';

export function useNavigate() {
  const router = useNextRouter();

  return (to: string | number, options?: { replace?: boolean; state?: any }) => {
    if (typeof to === 'number') {
      // Handle back/forward navigation
      if (to === -1) {
        router.back();
      } else if (to === 1) {
        router.forward();
      }
    } else {
      // Handle string navigation
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    }
  };
}

export function useParams<T = any>(): T {
  // This should be handled by page components using Next.js params
  // For now, return empty object as params are passed directly to components
  return {} as T;
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();

  return useMemo(() => ({
    pathname,
    search: searchParams ? `?${searchParams.toString()}` : '',
    hash: '',
    state: null,
    key: 'default',
  }), [pathname, searchParams]);
}

// Wrap useSearchParams to return react-router-dom compatible format
export function useSearchParams() {
  const searchParams = useNextSearchParams();

  // Return as [searchParams, setSearchParams] tuple like react-router-dom
  // setSearchParams is not implemented for now
  const setSearchParams = () => {
    console.warn('setSearchParams is not implemented in Next.js adapter');
  };

  return [searchParams, setSearchParams] as const;
}

export { useRouter } from 'next/navigation';

// Export Link component from Next.js
export { default as Link } from 'next/link';
