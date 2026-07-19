/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState, CollectionType } from '../types';

/**
 * Parses the current pathname into an AppState object.
 */
export function parsePathname(pathname: string): AppState {
  // Normalize pathname (remove trailing slash except for root)
  const cleanPath = pathname.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;

  if (cleanPath === '/' || cleanPath === '') {
    return { currentRoute: '/', routeParams: {} };
  }
  
  if (cleanPath === '/library') {
    return { currentRoute: '/library', routeParams: {} };
  }
  
  if (cleanPath === '/archive') {
    return { currentRoute: '/archive', routeParams: {} };
  }
  
  if (cleanPath === '/search') {
    return { currentRoute: '/search', routeParams: {} };
  }
  
  if (cleanPath === '/dashboard') {
    return { currentRoute: '/dashboard', routeParams: {} };
  }

  // Check /library/[collection]
  const libraryCollectionMatch = cleanPath.match(/^\/library\/([a-zA-Z0-9_-]+)$/);
  if (libraryCollectionMatch) {
    const col = libraryCollectionMatch[1] as CollectionType;
    return {
      currentRoute: '/library/[collection]',
      routeParams: { collection: col }
    };
  }

  // Check /read/[slug]
  const readSlugMatch = cleanPath.match(/^\/read\/([a-zA-Z0-9_-]+)$/);
  if (readSlugMatch) {
    const slug = readSlugMatch[1];
    return {
      currentRoute: '/read/[slug]',
      routeParams: { slug }
    };
  }

  // Fallback to library
  return { currentRoute: '/library', routeParams: {} };
}

/**
 * Converts an AppState back into a pathname string.
 */
export function getPathnameFromState(state: AppState): string {
  switch (state.currentRoute) {
    case '/':
      return '/';
    case '/library':
      return '/library';
    case '/archive':
      return '/archive';
    case '/search':
      return '/search';
    case '/dashboard':
      return '/dashboard';
    case '/library/[collection]':
      return `/library/${state.routeParams.collection || 'poems'}`;
    case '/read/[slug]':
      return `/read/${state.routeParams.slug || ''}`;
    default:
      return '/library';
  }
}
