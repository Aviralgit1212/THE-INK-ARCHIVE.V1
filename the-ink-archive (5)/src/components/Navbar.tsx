/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Library, BookOpen, Clock, Search, ShieldAlert, Heart, Languages, LogOut } from 'lucide-react';

export default function Navbar() {
  const { routerState, navigateTo, bookmarks, pieces, isLoggedIn, logoutWriter } = useLibrary();
  const [showBookmarksDropdown, setShowBookmarksDropdown] = useState(false);

  const activeRoute = routerState.currentRoute;

  // Don't render navbar on the landing page
  if (activeRoute === '/') return null;

  const bookmarkedPieces = pieces.filter(p => bookmarks.some(b => b.slug === p.slug));

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-slate-900 bg-ink-black/85 backdrop-blur-md px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo / Link back to home */}
        <button
          id="nav-logo"
          onClick={() => navigateTo('/library')}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ink-accent-cyan to-ink-accent-purple p-[1px] flex items-center justify-center transition-all group-hover:scale-105">
            <div className="w-full h-full bg-ink-black rounded-[7px] flex items-center justify-center font-display font-bold text-sm text-ink-accent-cyan">
              I
            </div>
          </div>
          <div>
            <h1 className="font-display font-medium tracking-wider text-xs text-slate-200 group-hover:text-white uppercase transition-colors">
              THE INK ARCHIVE
            </h1>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">
              Digital Library
            </span>
          </div>
        </button>

        {/* Central Routes */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
          <button
            id="nav-link-library"
            onClick={() => navigateTo('/library')}
            className={`flex items-center gap-1.5 font-display text-xs uppercase tracking-widest cursor-pointer transition-all ${
              activeRoute === '/library' || activeRoute === '/library/[collection]'
                ? 'text-ink-accent-cyan font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            Library Floor
          </button>
          
          <button
            id="nav-link-archive"
            onClick={() => navigateTo('/archive')}
            className={`flex items-center gap-1.5 font-display text-xs uppercase tracking-widest cursor-pointer transition-all ${
              activeRoute === '/archive'
                ? 'text-ink-accent-cyan font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Archive Timeline
          </button>
          
          <button
            id="nav-link-search"
            onClick={() => navigateTo('/search')}
            className={`flex items-center gap-1.5 font-display text-xs uppercase tracking-widest cursor-pointer transition-all ${
              activeRoute === '/search'
                ? 'text-ink-accent-cyan font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Quick Language shortcut */}
          <button
            id="nav-hindi-shortcut"
            onClick={() => navigateTo('/library/[collection]', { collection: 'poems' })}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-full px-3 py-1 cursor-pointer transition-all hover:bg-slate-900/60"
            title="Switch Language/Category"
          >
            <Languages className="w-3.5 h-3.5 text-ink-accent-purple" />
            <span className="font-devanagari-serif">हिन्दी</span>
          </button>

          {/* Bookmarks Drawer Trigger */}
          <div className="relative">
            <button
              id="nav-bookmarks-btn"
              onClick={() => setShowBookmarksDropdown(!showBookmarksDropdown)}
              className="relative p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer rounded-full hover:bg-slate-900 transition-all"
              title="Saved Pieces"
            >
              <Heart className={`w-4 h-4 ${bookmarks.length > 0 ? 'fill-pink-500 text-pink-500' : ''}`} />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-[8px] font-bold text-white w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {showBookmarksDropdown && (
              <div className="absolute right-0 mt-3 w-72 rounded-xl bg-ink-deep border border-slate-800 p-4 shadow-xl z-50 glow-card-purple animate-fade-in">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                  <h3 className="font-display font-semibold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                    Saved Readings ({bookmarks.length})
                  </h3>
                  <button onClick={() => setShowBookmarksDropdown(false)} className="text-[10px] text-slate-500 hover:text-slate-400 font-mono uppercase">
                    Close
                  </button>
                </div>
                {bookmarkedPieces.length === 0 ? (
                  <p className="text-xs text-slate-500 font-serif italic py-4 text-center">
                    No bookmarked pieces yet. Add some while reading!
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2.5">
                    {bookmarkedPieces.map(piece => (
                      <button
                        key={piece.slug}
                        onClick={() => {
                          navigateTo('/read/[slug]', { slug: piece.slug });
                          setShowBookmarksDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-ink-black/40 hover:bg-ink-black border border-slate-800/40 hover:border-slate-800 transition-all flex justify-between items-center"
                      >
                        <div className="truncate pr-2">
                          <p className={`text-xs font-semibold text-slate-200 truncate ${piece.language === 'hi' ? 'font-devanagari-serif' : 'font-serif'}`}>
                            {piece.title}
                          </p>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            {piece.collection}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-ink-accent-cyan shrink-0">
                          {piece.readingTime}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dashboard Route */}
          <button
            id="nav-link-dashboard"
            onClick={() => navigateTo('/dashboard')}
            className={`flex items-center gap-1.5 p-1.5 border rounded-full cursor-pointer transition-all ${
              isLoggedIn 
                ? 'border-ink-accent-cyan bg-ink-accent-cyan/10 text-ink-accent-cyan glow-card-cyan' 
                : activeRoute === '/dashboard'
                ? 'border-slate-700 text-white bg-slate-900'
                : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
            title="Writer Dashboard"
          >
            <ShieldAlert className="w-4 h-4" />
            {isLoggedIn && (
              <span className="text-[10px] uppercase font-display tracking-widest pr-1 pl-0.5 hidden md:inline">
                Admin
              </span>
            )}
          </button>

          {isLoggedIn && (
            <button
              onClick={() => {
                logoutWriter();
                navigateTo('/library');
              }}
              className="p-1.5 text-slate-500 hover:text-red-400 rounded-full hover:bg-slate-900 transition-all cursor-pointer"
              title="Log out from Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation row for smaller devices */}
      <div className="md:hidden flex justify-around items-center border-t border-slate-900/60 pt-3 mt-3 w-full">
        <button
          onClick={() => navigateTo('/library')}
          className={`flex flex-col items-center gap-0.5 font-display text-[9px] uppercase tracking-widest ${
            activeRoute === '/library' || activeRoute === '/library/[collection]' ? 'text-ink-accent-cyan font-bold' : 'text-slate-500'
          }`}
        >
          <Library className="w-4 h-4" />
          Library
        </button>
        <button
          onClick={() => navigateTo('/archive')}
          className={`flex flex-col items-center gap-0.5 font-display text-[9px] uppercase tracking-widest ${
            activeRoute === '/archive' ? 'text-ink-accent-cyan font-bold' : 'text-slate-500'
          }`}
        >
          <Clock className="w-4 h-4" />
          Timeline
        </button>
        <button
          onClick={() => navigateTo('/search')}
          className={`flex flex-col items-center gap-0.5 font-display text-[9px] uppercase tracking-widest ${
            activeRoute === '/search' ? 'text-ink-accent-cyan font-bold' : 'text-slate-500'
          }`}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </header>
  );
}
