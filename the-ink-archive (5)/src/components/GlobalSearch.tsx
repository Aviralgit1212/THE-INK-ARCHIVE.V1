/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Search, Hash, BookOpen, Eye, ArrowRight, X } from 'lucide-react';

export default function GlobalSearch() {
  const { pieces, navigateTo, searchQuery, setSearchQuery } = useLibrary();
  const [results, setResults] = useState<typeof pieces>([]);

  // Collect all unique tags across all published pieces for quick exploration
  const activePieces = pieces.filter(p => !p.isDraft);
  const allTags: string[] = Array.from(new Set(activePieces.flatMap(p => p.tags))).slice(0, 12) as string[];

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = activePieces.filter(piece => {
      const matchTitle = piece.title.toLowerCase().includes(query);
      const matchSummary = piece.summary.toLowerCase().includes(query);
      const matchContent = piece.content.toLowerCase().includes(query);
      const matchCollection = piece.collection.toLowerCase().includes(query);
      const matchTags = piece.tags.some(t => t.toLowerCase().includes(query));
      const matchLanguage = piece.language.toLowerCase().includes(query);

      return matchTitle || matchSummary || matchContent || matchCollection || matchTags || matchLanguage;
    });

    setResults(filtered);
  }, [searchQuery, pieces]);

  const handleClear = () => {
    setSearchQuery('');
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  return (
    <div id="global-search-view" className="w-full max-w-4xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-2 border-b border-slate-900 pb-8">
        <div className="inline-flex items-center gap-1.5 text-ink-accent-cyan text-xs font-display font-semibold tracking-widest uppercase bg-ink-accent-cyan/5 border border-ink-accent-cyan/15 px-3 py-1 rounded-full">
          <Search className="w-3.5 h-3.5" />
          The Search Registry
        </div>
        <h1 className="font-display font-bold text-3xl md:text-5xl text-white tracking-wide uppercase">
          Library Search
        </h1>
        <p className="text-slate-400 font-serif italic text-sm md:text-base max-w-xl mx-auto">
          "Seek and you shall trace. Search for titles, keywords, emotional moods, tags, or languages."
        </p>
      </div>

      {/* Large Input Box */}
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-5 h-5 group-focus-within:text-ink-accent-cyan transition-colors" />
        </div>
        
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search poems, essays, stories, tags (e.g. hope, solitude)..."
          className="w-full pl-14 pr-12 py-4 bg-ink-dark/80 border border-slate-800 rounded-full focus:outline-none focus:border-ink-accent-cyan/60 text-white font-serif text-base placeholder-slate-500 shadow-2xl transition-all focus:ring-1 focus:ring-ink-accent-cyan/10"
          autoFocus
        />

        {searchQuery !== '' && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-5 flex items-center text-slate-500 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggested Quick Tags */}
      {searchQuery === '' && (
        <div className="max-w-xl mx-auto space-y-3.5 text-center bg-slate-950/20 border border-slate-900/60 p-6 rounded-2xl">
          <h3 className="font-display font-semibold text-[10px] uppercase tracking-widest text-slate-500">
            Or explore popular theme keywords
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-900 hover:border-slate-800 bg-ink-black/80 hover:bg-slate-900 text-xs font-mono text-slate-400 hover:text-ink-accent-cyan cursor-pointer transition-all"
              >
                <Hash className="w-3 h-3 text-slate-600" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results metrics */}
      {searchQuery !== '' && (
        <div className="text-center font-mono text-xs text-slate-500">
          Found <span className="text-ink-accent-cyan font-bold">{results.length}</span> pieces matching "{searchQuery}"
        </div>
      )}

      {/* Grid of Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {results.map(piece => (
            <article
              key={piece.slug}
              onClick={() => navigateTo('/read/[slug]', { slug: piece.slug })}
              className="group border border-slate-900/80 hover:border-slate-800/80 bg-ink-dark/30 hover:bg-ink-dark/60 rounded-xl p-5 cursor-pointer flex flex-col justify-between transition-all duration-300 relative"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="uppercase text-slate-500">{piece.collection}</span>
                  <span className="text-slate-500">{piece.readingTime}</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className={`text-lg font-bold text-slate-200 group-hover:text-white transition-colors leading-tight ${piece.language === 'hi' ? 'font-devanagari-serif text-base' : 'font-serif'}`}>
                    {piece.title}
                  </h3>
                  <p className={`text-xs text-slate-400 leading-relaxed line-clamp-2 ${piece.language === 'hi' ? 'font-devanagari-serif' : 'font-serif'}`}>
                    {piece.summary}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-900/40 pt-3 mt-4 text-[9px] font-mono text-slate-500">
                <span>{piece.publishDate}</span>
                <span className="flex items-center gap-1 group-hover:text-ink-accent-cyan transition-all">
                  Read Piece
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {searchQuery !== '' && results.length === 0 && (
        <div className="text-center space-y-2 py-10 max-w-sm mx-auto">
          <p className="font-serif italic text-sm text-slate-500">"No scrolls match your inquiry."</p>
          <p className="text-xs text-slate-600 font-mono">Check spelling or search for another literary tag.</p>
        </div>
      )}
    </div>
  );
}
