/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiteraturePiece, Bookmark, AppState, CollectionType, LanguageType } from '../types';
import { DEFAULT_PIECES } from '../data/content';
import { parsePathname, getPathnameFromState } from '../lib/router';

interface LibraryContextType {
  pieces: LiteraturePiece[];
  bookmarks: Bookmark[];
  routerState: AppState;
  isLoggedIn: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  transitionPhase: 'phase1' | 'phase2' | 'phase3' | 'idle';
  isTransitioning: boolean;
  navigateTo: (route: '/' | '/library' | '/library/[collection]' | '/read/[slug]' | '/archive' | '/search' | '/dashboard', params?: { collection?: CollectionType; slug?: string }) => void;
  addPiece: (piece: Omit<LiteraturePiece, 'views'>) => void;
  deletePiece: (slug: string) => void;
  incrementViews: (slug: string) => void;
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  loginWriter: (email: string, pass: string) => boolean;
  logoutWriter: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [pieces, setPieces] = useState<LiteraturePiece[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Router state
  const [routerState, setRouterState] = useState<AppState>({
    currentRoute: '/',
    routeParams: {}
  });

  // Cinematic transitions state
  const [transitionPhase, setTransitionPhase] = useState<'phase1' | 'phase2' | 'phase3' | 'idle'>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize data from LocalStorage or default
  useEffect(() => {
    // 1. Load pieces
    const savedPieces = localStorage.getItem('ink_archive_pieces');
    if (savedPieces) {
      try {
        setPieces(JSON.parse(savedPieces));
      } catch (e) {
        setPieces(DEFAULT_PIECES);
      }
    } else {
      localStorage.setItem('ink_archive_pieces', JSON.stringify(DEFAULT_PIECES));
      setPieces(DEFAULT_PIECES);
    }

    // 2. Load bookmarks
    const savedBookmarks = localStorage.getItem('ink_archive_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        setBookmarks([]);
      }
    }

    // 3. Load auth status
    const savedAuth = localStorage.getItem('ink_archive_auth');
    if (savedAuth === 'true') {
      setIsLoggedIn(true);
    }

    // 4. Initialize route from current location
    const initialRoute = parsePathname(window.location.pathname);
    setRouterState(initialRoute);

    // 5. Setup popstate handler
    const handlePopState = () => {
      const poppedRoute = parsePathname(window.location.pathname);
      setRouterState(poppedRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update localStorage when pieces changes
  const savePiecesToStorage = (updatedPieces: LiteraturePiece[]) => {
    localStorage.setItem('ink_archive_pieces', JSON.stringify(updatedPieces));
    setPieces(updatedPieces);
  };

  const navigateTo = (
    route: '/' | '/library' | '/library/[collection]' | '/read/[slug]' | '/archive' | '/search' | '/dashboard',
    params?: { collection?: CollectionType; slug?: string }
  ) => {
    const newState: AppState = {
      currentRoute: route,
      routeParams: params || {}
    };
    
    setIsTransitioning(true);
    setTransitionPhase('phase1');

    // Phase 1 -> Phase 2 (Environment reacts, camera starts moving: 600ms)
    setTimeout(() => {
      setTransitionPhase('phase2');
      
      // Phase 2 -> Phase 3 (Camera travels, old content dissolves: 1200ms)
      setTimeout(() => {
        setRouterState(newState);
        const newPath = getPathnameFromState(newState);
        window.history.pushState(null, '', newPath);
        window.scrollTo({ top: 0 }); // instant position reset before fade in
        
        setTransitionPhase('phase3');

        // Phase 3 -> Idle (New scene settles, typography fades in: 800ms)
        setTimeout(() => {
          setTransitionPhase('idle');
          setIsTransitioning(false);
        }, 800);
      }, 1200);
    }, 600);
  };

  const addPiece = (pieceData: Omit<LiteraturePiece, 'views'>) => {
    const index = pieces.findIndex(p => p.slug === pieceData.slug);
    let updated: LiteraturePiece[];
    
    if (index >= 0) {
      // Update existing piece
      updated = pieces.map(p => p.slug === pieceData.slug 
        ? { ...p, ...pieceData } 
        : p
      );
    } else {
      // Create new piece
      const newPiece: LiteraturePiece = {
        ...pieceData,
        views: 0
      };
      updated = [newPiece, ...pieces];
    }
    savePiecesToStorage(updated);
  };

  const deletePiece = (slug: string) => {
    const updated = pieces.filter(p => p.slug !== slug);
    savePiecesToStorage(updated);
  };

  const incrementViews = (slug: string) => {
    const updated = pieces.map(p => p.slug === slug 
      ? { ...p, views: p.views + 1 } 
      : p
    );
    savePiecesToStorage(updated);
  };

  const toggleBookmark = (slug: string) => {
    let updated: Bookmark[];
    const isBooked = bookmarks.some(b => b.slug === slug);
    if (isBooked) {
      updated = bookmarks.filter(b => b.slug !== slug);
    } else {
      updated = [...bookmarks, { slug, bookmarkedAt: new Date().toISOString() }];
    }
    setBookmarks(updated);
    localStorage.setItem('ink_archive_bookmarks', JSON.stringify(updated));
  };

  const isBookmarked = (slug: string): boolean => {
    return bookmarks.some(b => b.slug === slug);
  };

  const loginWriter = (email: string, pass: string): boolean => {
    // Standard auth logic for writer (the app email is shivanant2006@gmail.com, password can be configured or use simple master pass "writer123")
    if (email.toLowerCase() === 'shivanant2006@gmail.com' && pass === 'writer123') {
      setIsLoggedIn(true);
      localStorage.setItem('ink_archive_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutWriter = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('ink_archive_auth');
  };

  return (
    <LibraryContext.Provider value={{
      pieces,
      bookmarks,
      routerState,
      isLoggedIn,
      searchQuery,
      setSearchQuery,
      transitionPhase,
      isTransitioning,
      navigateTo,
      addPiece,
      deletePiece,
      incrementViews,
      toggleBookmark,
      isBookmarked,
      loginWriter,
      logoutWriter
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
