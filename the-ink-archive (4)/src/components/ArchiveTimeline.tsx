/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Clock, Eye, Calendar, BookOpen, ChevronRight, Hash } from 'lucide-react';

export default function ArchiveTimeline() {
  const { pieces, navigateTo } = useLibrary();
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);

  // Filter to exclude drafts
  const activePieces = pieces.filter(p => !p.isDraft);

  // Group pieces by year of publication
  const piecesByYear: { [key: string]: typeof pieces } = {};

  activePieces.forEach(piece => {
    const year = piece.publishDate ? piece.publishDate.substring(0, 4) : '2026';
    if (!piecesByYear[year]) {
      piecesByYear[year] = [];
    }
    piecesByYear[year].push(piece);
  });

  // Sort years descending
  const sortedYears = Object.keys(piecesByYear).sort((a, b) => b.localeCompare(a));

  // Sort pieces within each year descending by date
  sortedYears.forEach(year => {
    piecesByYear[year].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  });

  const formatMonthDay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div id="archive-timeline-view" className="w-full max-w-4xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="text-center space-y-2 border-b border-slate-900 pb-8">
        <div className="inline-flex items-center gap-1.5 text-ink-accent-cyan text-xs font-display font-semibold tracking-widest uppercase bg-ink-accent-cyan/5 border border-ink-accent-cyan/15 px-3 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          The Chronology
        </div>
        <h1 className="font-display font-bold text-3xl md:text-5xl text-white tracking-wide uppercase">
          Archive Journey
        </h1>
        <p className="text-slate-400 font-serif italic text-sm md:text-base max-w-xl mx-auto">
          "A writer's lifetime is written in circles of ink, expanding outwards through the years."
        </p>
      </div>

      {sortedYears.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-900 bg-ink-dark/20 p-16 text-center text-slate-500 font-serif italic space-y-2">
          <p>The archive rolls are currently empty.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-900 pl-6 md:pl-10 space-y-12 ml-4 md:ml-12 my-10">
          
          {sortedYears.map((year, yIdx) => (
            <div key={year} className="relative space-y-6">
              
              {/* Year marker badge with glowing left dot */}
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-ink-accent-purple border border-ink-black glow-card-purple z-10" />
                <div className="h-0.5 w-4 bg-slate-900 hidden md:block" />
                <h2 className="bg-slate-900 border border-slate-800 text-slate-200 font-display font-bold text-sm tracking-wider px-3 py-1 rounded-full shadow-lg ml-2">
                  {year}
                </h2>
              </div>

              {/* Spacing spacer for year header */}
              <div className="h-6" />

              {/* Pieces for this year */}
              <div className="space-y-6 pl-4 md:pl-6">
                {piecesByYear[year].map((piece, pIdx) => {
                  const uniqueKey = `${year}-${piece.slug}`;
                  const isHovered = hoveredIndex === uniqueKey;

                  return (
                    <div
                      key={piece.slug}
                      onMouseEnter={() => setHoveredIndex(uniqueKey)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => navigateTo('/read/[slug]', { slug: piece.slug })}
                      className={`group relative border rounded-xl p-5 md:p-6 bg-ink-dark/30 hover:bg-ink-dark/60 cursor-pointer transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        isHovered 
                          ? 'border-ink-accent-cyan/30 glow-card-cyan scale-[1.01]' 
                          : 'border-slate-900/80'
                      }`}
                    >
                      {/* Left Side: Date node and details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono font-semibold text-ink-accent-cyan bg-ink-accent-cyan/5 px-2 py-0.5 border border-ink-accent-cyan/15 rounded uppercase tracking-wider">
                            {formatMonthDay(piece.publishDate)}
                          </span>
                          <span className="text-slate-600 font-mono text-xs">/</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            {piece.collection}
                          </span>
                        </div>

                        <h3 className={`text-lg md:text-xl font-bold text-slate-200 group-hover:text-white transition-colors leading-tight ${piece.language === 'hi' ? 'font-devanagari-serif text-base' : 'font-serif'}`}>
                          {piece.title}
                        </h3>

                        <p className={`text-xs text-slate-400 line-clamp-2 leading-relaxed ${piece.language === 'hi' ? 'font-devanagari-serif' : 'font-serif'}`}>
                          {piece.summary}
                        </p>
                      </div>

                      {/* Right Side: Meta indicators */}
                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t md:border-t-0 border-slate-900/60 pt-3 md:pt-0 shrink-0">
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                            {piece.readingTime}
                          </span>
                          <span className="flex items-center gap-1 group-hover:text-ink-accent-cyan transition-colors">
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            {piece.views} views
                          </span>
                        </div>

                        <button className="p-1.5 rounded-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-500 group-hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}
