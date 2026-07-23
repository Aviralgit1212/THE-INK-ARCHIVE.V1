/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { LiteraturePiece, CollectionType } from '../types';
import { BookOpen, Eye, Calendar, Sparkles, ChevronRight, Hash, Heart } from 'lucide-react';

export default function LibraryFloor() {
  const { pieces, navigateTo, isBookmarked, toggleBookmark } = useLibrary();
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'en' | 'hi'>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Filter pieces to exclude drafts in normal view
  const activePieces = pieces.filter(p => !p.isDraft);

  // Filter by language
  const languageFiltered = activePieces.filter(p => {
    if (selectedLanguage === 'all') return true;
    return p.language === selectedLanguage;
  });

  // Featured pieces are the ones with highest views or marked featured
  const featuredPieces = activePieces.filter(p => p.views > 130).slice(0, 2);

  // Collections we support
  const collectionTypes: { type: CollectionType; titleEn: string; titleHi: string; desc: string }[] = [
    { type: 'poems', titleEn: 'Poems', titleHi: 'कविताएं', desc: 'Syllables of soul, woven in meter and verse.' },
    { type: 'essays', titleEn: 'Essays', titleHi: 'निबंध', desc: 'Critical thought and formal musings on life and art.' },
    { type: 'stories', titleEn: 'Stories', titleHi: 'कहानियां', desc: 'Immersive narratives exploring human nature.' },
    { type: 'philosophy', titleEn: 'Philosophy', titleHi: 'दर्शन', desc: 'Discussions on existence, consciousness, and eternal truth.' },
    { type: 'journal', titleEn: 'Journal', titleHi: 'पत्रिका', desc: 'Raw reflections, daily observations, and personal healing.' }
  ];

  // Map mood to custom visual glow borders/shadows
  const getMoodStyles = (mood: string, isHovered: boolean) => {
    switch (mood) {
      case 'sad':
        return {
          border: isHovered ? 'border-sky-500/40 bg-sky-950/10' : 'border-slate-800/80 bg-slate-900/30',
          glow: 'shadow-[0_0_20px_-5px_rgba(56,189,248,0.15)]',
          badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
        };
      case 'horror':
        return {
          border: isHovered ? 'border-red-500/40 bg-red-950/10' : 'border-slate-800/80 bg-slate-900/30',
          glow: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]',
          badge: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
      case 'hopeful':
        return {
          border: isHovered ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800/80 bg-slate-900/30',
          glow: 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'philosophical':
      default:
        return {
          border: isHovered ? 'border-purple-500/40 bg-purple-950/10' : 'border-slate-800/80 bg-slate-900/30',
          glow: 'shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)]',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
    }
  };

  return (
    <div id="library-floor" className="w-full max-w-7xl mx-auto px-6 py-10 space-y-16 animate-fade-in">
      
      {/* 1. HERO - FEATURED WORK BANNER */}
      {featuredPieces.length > 0 && (
        <section id="featured-hero-section" className="relative rounded-2xl overflow-hidden border border-slate-900 bg-ink-dark/60 p-8 md:p-12">
          {/* Glowing ambient backgrounds */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-ink-accent-purple/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-ink-accent-cyan/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* Left info column */}
            <div className="col-span-3 space-y-5">
              <div className="inline-flex items-center gap-1.5 bg-ink-accent-cyan/10 text-ink-accent-cyan border border-ink-accent-cyan/20 px-3 py-1 rounded-full text-xs font-display font-medium tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Featured Masterpiece
              </div>

              <div className="space-y-2">
                <h2 className={`text-3xl md:text-5xl font-serif font-bold text-white tracking-wide ${featuredPieces[0].language === 'hi' ? 'font-devanagari-display leading-tight' : 'font-serif'}`}>
                  {featuredPieces[0].title}
                </h2>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {featuredPieces[0].publishDate}
                  </span>
                  <span>•</span>
                  <span>{featuredPieces[0].readingTime}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {featuredPieces[0].views} reads
                  </span>
                </div>
              </div>

              <p className={`text-slate-300 font-light text-base md:text-lg leading-relaxed ${featuredPieces[0].language === 'hi' ? 'font-devanagari-serif leading-relaxed' : 'font-serif italic'}`}>
                "{featuredPieces[0].summary}"
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {featuredPieces[0].tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-md flex items-center gap-0.5">
                    <Hash className="w-3 h-3 text-slate-600" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={() => navigateTo('/read/[slug]', { slug: featuredPieces[0].slug })}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-ink-accent-cyan to-ink-accent-purple text-ink-black font-display font-medium text-xs uppercase tracking-widest px-6 py-3.5 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                >
                  Enter Experience
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleBookmark(featuredPieces[0].slug)}
                  className={`p-3 border rounded-full transition-all cursor-pointer ${
                    isBookmarked(featuredPieces[0].slug)
                      ? 'border-pink-500/30 bg-pink-500/10 text-pink-400'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                  title="Bookmark"
                >
                  <Heart className={`w-4 h-4 ${isBookmarked(featuredPieces[0].slug) ? 'fill-pink-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Right graphic shelf teaser column */}
            <div className="col-span-2 hidden lg:flex items-center justify-center">
              <div className="relative w-72 h-96 rounded-2xl bg-ink-black/40 border border-slate-900 p-6 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-ink-accent-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                {/* Lit book styling */}
                <div className="w-44 h-60 rounded-[4px] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-4 relative transform group-hover:rotate-3 group-hover:scale-105 transition-all duration-700">
                  <div className="w-1 bg-gradient-to-b from-slate-700 to-slate-900 absolute left-0 top-0 bottom-0 rounded-l-[4px]" />
                  <div className="space-y-1 text-left pl-2">
                    <span className="text-[8px] font-mono text-ink-accent-purple uppercase tracking-widest">
                      {featuredPieces[0].collection}
                    </span>
                    <h3 className={`text-sm font-semibold text-slate-200 line-clamp-2 ${featuredPieces[0].language === 'hi' ? 'font-devanagari-serif' : 'font-serif'}`}>
                      {featuredPieces[0].title}
                    </h3>
                  </div>
                  
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-600 pl-2">
                    <span>THE INK ARCHIVE</span>
                    <span>©2026</span>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Resting in Room I / {featuredPieces[0].collection}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. MAIN SHELVES NAVIGATION & LITERATURE GRID */}
      <div className="space-y-10">
        
        {/* Navigation & Language Filter bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-6 gap-4">
          <div>
            <h3 className="font-display font-medium text-lg text-white uppercase tracking-wider">
              Browse Rooms & Shelves
            </h3>
            <p className="text-slate-500 text-xs font-serif italic mt-0.5">
              Select a room to walk through the writer's collections
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto bg-slate-900/40 border border-slate-800/80 p-1 rounded-full">
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`flex-1 sm:flex-none text-xs font-display tracking-widest uppercase px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                selectedLanguage === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`flex-1 sm:flex-none text-xs font-display tracking-widest uppercase px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                selectedLanguage === 'en' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('hi')}
              className={`flex-1 sm:flex-none text-xs font-display tracking-widest uppercase px-4 py-1.5 rounded-full cursor-pointer transition-all flex items-center gap-1 ${
                selectedLanguage === 'hi' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-devanagari-serif">हिन्दी</span>
            </button>
          </div>
        </div>

        {/* Shelves List */}
        <div className="space-y-12">
          {collectionTypes.map(col => {
            const collectionPieces = languageFiltered.filter(p => p.collection === col.type);
            const shelfHasHover = collectionPieces.some(p => p.slug === hoveredCard);

            return (
              <div key={col.type} className="space-y-4">
                {/* Shelf Title bar */}
                <div className="flex justify-between items-end border-l-2 border-ink-accent-purple pl-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-medium text-base text-slate-100 uppercase tracking-widest">
                        {col.titleEn}
                      </h4>
                      <span className="text-slate-600 font-mono text-xs">/</span>
                      <h4 className="font-devanagari-serif font-semibold text-sm text-slate-400">
                        {col.titleHi}
                      </h4>
                    </div>
                    <p className="text-slate-500 text-xs font-serif italic mt-0.5">
                      {col.desc}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigateTo('/library/[collection]', { collection: col.type })}
                    className="flex items-center gap-1 font-display text-[10px] uppercase tracking-widest text-ink-accent-cyan hover:text-white transition-all cursor-pointer shrink-0"
                  >
                    View Shelf ({collectionPieces.length})
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Shelf Content */}
                {collectionPieces.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-900 bg-ink-dark/20 p-8 text-center text-slate-600 font-serif italic text-xs">
                    No matching writings on this shelf in the chosen language.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collectionPieces.slice(0, 3).map(piece => {
                      const isHovered = hoveredCard === piece.slug;
                      const styles = getMoodStyles(piece.mood, isHovered);

                      return (
                        <article
                          key={piece.slug}
                          onMouseEnter={() => setHoveredCard(piece.slug)}
                          onMouseLeave={() => setHoveredCard(null)}
                          onClick={() => navigateTo('/read/[slug]', { slug: piece.slug })}
                          className={`group rounded-xl border p-5 flex flex-col justify-between bg-ink-dark/70 backdrop-blur-sm cursor-pointer transition-all duration-300 ease-out relative overflow-hidden ${styles.border} ${styles.glow} ${
                            isHovered
                              ? 'scale-[1.03] shadow-2xl shadow-black/60 z-20'
                              : shelfHasHover
                              ? 'opacity-60 scale-100'
                              : 'opacity-100 scale-100'
                          }`}
                        >
                          <div className="space-y-4">
                            {/* Card Top: Metadata */}
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-display font-medium uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${styles.badge}`}>
                                {piece.mood}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {piece.readingTime}
                              </span>
                            </div>

                            {/* Card Title & Summary */}
                            <div className="space-y-2">
                              <h5 className={`text-lg font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-1 ${piece.language === 'hi' ? 'font-devanagari-serif text-base leading-snug' : 'font-serif'}`}>
                                {piece.title}
                              </h5>
                              <p className={`text-xs text-slate-400 line-clamp-3 leading-relaxed ${piece.language === 'hi' ? 'font-devanagari-serif' : 'font-serif'}`}>
                                {piece.summary}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="flex justify-between items-center border-t border-slate-900/60 pt-4 mt-5">
                            <span className="text-[10px] font-mono text-slate-500">
                              {piece.publishDate}
                            </span>
                            
                            <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500 group-hover:text-ink-accent-cyan transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                              {piece.views} reads
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 3. ADDITIONAL DISCOVER ELEMENT - ARCHIVE & MAP PROMPT */}
      <section className="border border-slate-900/60 rounded-xl bg-gradient-to-r from-ink-black to-ink-deep p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h4 className="font-display font-medium text-xs uppercase tracking-widest text-ink-accent-cyan">
            Explore Chronology
          </h4>
          <h3 className="font-serif text-xl text-slate-200 mt-1">
            Walk the writer's complete lifetime chronological timeline
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse pieces by date and experience how the ink has evolved.
          </p>
        </div>

        <button
          onClick={() => navigateTo('/archive')}
          className="inline-flex items-center gap-1.5 font-display text-xs uppercase tracking-widest bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-5 py-3 rounded-full text-slate-200 hover:text-white cursor-pointer transition-all"
        >
          Open Chronological Archive
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
}
