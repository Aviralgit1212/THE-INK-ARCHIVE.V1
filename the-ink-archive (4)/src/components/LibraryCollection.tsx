/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { CollectionType } from '../types';
import { ArrowLeft, Eye, Calendar, BookOpen, Star, Sparkles } from 'lucide-react';

export default function LibraryCollection() {
  const { routerState, navigateTo, pieces } = useLibrary();
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'en' | 'hi'>('all');

  const activeCollection = routerState.routeParams.collection as CollectionType;

  // Filter pieces matching the collection and exclude drafts
  const collectionPieces = pieces.filter(p => p.collection === activeCollection && !p.isDraft);

  // Filter by language
  const filteredPieces = collectionPieces.filter(p => {
    if (selectedLanguage === 'all') return true;
    return p.language === selectedLanguage;
  });

  const getCollectionMeta = (col: CollectionType) => {
    switch (col) {
      case 'poems':
        return { title: 'Poems & Verses', titleHi: 'कविता और छंद', desc: 'Syllables of the soul, exploring time, space, and memory in tight meter.' };
      case 'essays':
        return { title: 'Essays & Musings', titleHi: 'निबंध और विचार', desc: 'Formal and informal critical analysis of architecture, nature, and psychology.' };
      case 'stories':
        return { title: 'Stories & Tales', titleHi: 'कहानियां', desc: 'Rich, immersive narratives exploring complex human thresholds.' };
      case 'philosophy':
        return { title: 'Philosophy & Wisdom', titleHi: 'दर्शनशास्त्र', desc: 'Discourses on consciousness, existence, truth, and non-duality.' };
      case 'journal':
        return { title: 'Personal Journal', titleHi: 'निजी डायरी', desc: 'Raw transcripts, late-night reflections, and letters to the self.' };
      default:
        return { title: 'The Archive Room', titleHi: 'संग्रह कक्ष', desc: 'A shelf of original literary writings.' };
    }
  };

  const meta = getCollectionMeta(activeCollection);

  return (
    <div id="library-collection-view" className="w-full max-w-7xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
      {/* Top Breadcrumb / Back button */}
      <button
        id="collection-back-btn"
        onClick={() => navigateTo('/library')}
        className="flex items-center gap-2 group font-display text-xs uppercase tracking-widest text-slate-500 hover:text-white cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Library Floor
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-900 pb-8 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-ink-accent-cyan glow-card-cyan" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Collection Room / {activeCollection}
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-display font-bold text-3xl md:text-5xl text-white tracking-wide uppercase">
              {meta.title}
            </h1>
            <span className="text-slate-600 font-mono text-xl">/</span>
            <span className="font-devanagari-serif font-bold text-xl md:text-2xl text-slate-400">
              {meta.titleHi}
            </span>
          </div>

          <p className="text-slate-400 font-serif italic text-sm md:text-base max-w-2xl leading-relaxed">
            {meta.desc}
          </p>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-800/80 p-1 rounded-full self-stretch md:self-auto">
          <button
            onClick={() => setSelectedLanguage('all')}
            className={`flex-1 md:flex-none text-[10px] font-display tracking-widest uppercase px-3.5 py-1.5 rounded-full cursor-pointer transition-all ${
              selectedLanguage === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedLanguage('en')}
            className={`flex-1 md:flex-none text-[10px] font-display tracking-widest uppercase px-3.5 py-1.5 rounded-full cursor-pointer transition-all ${
              selectedLanguage === 'en' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setSelectedLanguage('hi')}
            className={`flex-1 md:flex-none text-[10px] font-display tracking-widest uppercase px-3.5 py-1.5 rounded-full cursor-pointer transition-all ${
              selectedLanguage === 'hi' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Grid of Collection Pieces */}
      {filteredPieces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-900 bg-ink-dark/20 p-16 text-center text-slate-500 font-serif italic max-w-xl mx-auto space-y-2">
          <Sparkles className="w-6 h-6 text-slate-700 mx-auto" />
          <p className="text-sm">This shelf stands empty in the chosen language.</p>
          <p className="text-xs text-slate-600">Consider exploring a different category or adding new writings via the Admin Dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPieces.map((piece) => (
            <article
              key={piece.slug}
              onClick={() => navigateTo('/read/[slug]', { slug: piece.slug })}
              className="group border border-slate-900/80 hover:border-slate-800 bg-ink-dark/30 hover:bg-ink-dark/60 rounded-xl p-6 cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className={`px-2.5 py-0.5 rounded-full uppercase ${
                    piece.mood === 'sad' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                    piece.mood === 'horror' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    piece.mood === 'hopeful' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {piece.mood}
                  </span>
                  <span className="text-slate-500">{piece.readingTime}</span>
                </div>

                <div className="space-y-2">
                  <h3 className={`text-xl font-bold text-slate-200 group-hover:text-white transition-colors leading-tight ${piece.language === 'hi' ? 'font-devanagari-serif leading-relaxed text-base' : 'font-serif'}`}>
                    {piece.title}
                  </h3>
                  <p className={`text-xs text-slate-400 leading-relaxed line-clamp-4 ${piece.language === 'hi' ? 'font-devanagari-serif' : 'font-serif'}`}>
                    {piece.summary}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-900/60 pt-4 mt-6 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  {piece.publishDate}
                </span>

                <span className="flex items-center gap-1 group-hover:text-ink-accent-cyan transition-colors">
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  {piece.views} reads
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
