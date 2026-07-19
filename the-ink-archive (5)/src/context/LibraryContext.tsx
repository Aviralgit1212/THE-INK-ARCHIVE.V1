/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiteraturePiece, Bookmark, AppState, CollectionType } from '../types';
import { DEFAULT_PIECES } from '../data/content';
import { parsePathname, getPathnameFromState } from '../lib/router';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  increment, 
  onSnapshot, 
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

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
  addPiece: (piece: Omit<LiteraturePiece, 'views'>) => Promise<void>;
  deletePiece: (slug: string) => Promise<void>;
  incrementViews: (slug: string) => Promise<void>;
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  loginWriter: (email: string, pass: string) => Promise<boolean>;
  logoutWriter: () => Promise<void>;
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

  // Initialize data from Firebase Firestore Realtime Listener
  useEffect(() => {
    // If authenticated, fetch all pieces (including drafts).
    // If public user, fetch only published pieces (isDraft != true, or specifically isDraft == false).
    // Note: Since rules restrict access to drafts for public users, we must query using isDraft == false
    // to align with security rules and avoid "Missing or insufficient permissions" errors.
    const q = isLoggedIn
      ? query(collection(db, 'pieces'))
      : query(collection(db, 'pieces'), where('isDraft', '==', false));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        console.log('Firestore "pieces" collection is empty. Displaying default pieces locally...');
        setPieces(isLoggedIn ? [] : DEFAULT_PIECES.filter(p => !p.isDraft));
      } else {
        const items: LiteraturePiece[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as LiteraturePiece);
        });
        // Sort pieces by publishDate descending (newest first)
        items.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
        setPieces(items);
      }
    }, (err) => {
      console.error('Firestore connection notice:', err);
      // Fallback to default content if Firestore cannot connect or is block-restricted
      setPieces(isLoggedIn ? DEFAULT_PIECES : DEFAULT_PIECES.filter(p => !p.isDraft));
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  // Auto-seed Firestore if logged in and pieces collection was verified empty in Firestore
  useEffect(() => {
    const checkAndSeed = async () => {
      if (isLoggedIn) {
        try {
          // Double check if there are no pieces in Firestore before seeding
          const q = query(collection(db, 'pieces'));
          const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
              console.log('Archivist is logged in and Firestore is empty. Seeding database with default pieces...');
              for (const piece of DEFAULT_PIECES) {
                try {
                  await setDoc(doc(db, 'pieces', piece.slug), piece);
                  console.log(`Successfully seeded piece: ${piece.slug}`);
                } catch (err) {
                  console.error(`Failed to seed piece ${piece.slug}:`, err);
                }
              }
            }
            unsubscribe(); // Clean up this temporary check listener immediately
          });
        } catch (err) {
          console.error('Error during auto-seed verification:', err);
        }
      }
    };
    checkAndSeed();
  }, [isLoggedIn]);

  // Sync Firebase Auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        localStorage.setItem('ink_archive_auth', 'true');
      } else {
        const savedAuth = localStorage.getItem('ink_archive_auth');
        if (savedAuth !== 'true') {
          setIsLoggedIn(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize client routing & static bookmarks from local storage
  useEffect(() => {
    // Load bookmarks
    const savedBookmarks = localStorage.getItem('ink_archive_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        setBookmarks([]);
      }
    }

    // Load local auth status fallback
    const savedAuth = localStorage.getItem('ink_archive_auth');
    if (savedAuth === 'true') {
      setIsLoggedIn(true);
    }

    // Initialize route from current location
    const initialRoute = parsePathname(window.location.pathname);
    setRouterState(initialRoute);

    // Setup popstate handler
    const handlePopState = () => {
      const poppedRoute = parsePathname(window.location.pathname);
      setRouterState(poppedRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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

  const addPiece = async (pieceData: Omit<LiteraturePiece, 'views'>) => {
    try {
      const existingPiece = pieces.find(p => p.slug === pieceData.slug);
      const views = existingPiece ? (existingPiece.views || 0) : 0;
      await setDoc(doc(db, 'pieces', pieceData.slug), {
        ...pieceData,
        views
      });
    } catch (err) {
      console.error('Failed to save piece to Firestore:', err);
    }
  };

  const deletePiece = async (slug: string) => {
    try {
      await deleteDoc(doc(db, 'pieces', slug));
    } catch (err) {
      console.error('Failed to delete piece from Firestore:', err);
    }
  };

  const incrementViews = async (slug: string) => {
    try {
      await updateDoc(doc(db, 'pieces', slug), {
        views: increment(1)
      });
    } catch (err) {
      console.error('Failed to increment views in Firestore:', err);
    }
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

  const loginWriter = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsLoggedIn(true);
      localStorage.setItem('ink_archive_auth', 'true');
      return true;
    } catch (err) {
      console.error('Firebase Auth login failed:', err);
      return false;
    }
  };

  const logoutWriter = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Auth signout failed:', err);
    }
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
