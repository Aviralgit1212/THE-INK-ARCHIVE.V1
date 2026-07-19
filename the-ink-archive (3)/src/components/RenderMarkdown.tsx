/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface RenderMarkdownProps {
  content: string;
  isHindi: boolean;
}

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts headings from a markdown string to build a Table of Contents.
 */
export function extractHeadings(content: string): HeadingItem[] {
  const lines = content.split('\n');
  const headings: HeadingItem[] = [];
  let headingCounter = 0;

  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headingCounter++;
      const level = match[1].length;
      const text = match[2].trim().replace(/\*\*|\*/g, ''); // strip bold/italics in TOC
      const id = `heading-${headingCounter}`;
      headings.push({ id, text, level });
    }
  });

  return headings;
}

export default function RenderMarkdown({ content, isHindi }: RenderMarkdownProps) {
  const lines = content.split('\n');
  let headingIndex = 0;

  const renderTextWithStyles = (text: string) => {
    // Basic bold and italic parsing
    let elements: React.ReactNode[] = [];
    let currentText = text;
    let index = 0;

    // Bold-italic matcher (***text*** or **text** or *text*)
    // Splitting line content recursively to handle nested bold/italics
    const parts = currentText.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
    
    return parts.map((part, pIdx) => {
      if (part.startsWith('***') && part.endsWith('***')) {
        return <strong key={pIdx} className="font-bold italic">{part.slice(3, -3)}</strong>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={pIdx} className="italic text-slate-300">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const parsedElements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      parsedElements.push(
        <ul key={`list-${keyCounter++}`} className="list-disc pl-6 space-y-2 my-5 text-slate-300">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      flushList();
      continue;
    }

    // 1. Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      headingIndex++;
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = `heading-${headingIndex}`;

      if (level === 1) {
        parsedElements.push(
          <h1 id={id} key={`h-${i}`} className={`text-3xl md:text-4xl font-bold text-white mt-10 mb-5 scroll-mt-24 ${isHindi ? 'font-devanagari-display leading-relaxed' : 'font-serif tracking-wide'}`}>
            {renderTextWithStyles(text)}
          </h1>
        );
      } else if (level === 2) {
        parsedElements.push(
          <h2 id={id} key={`h-${i}`} className={`text-2xl md:text-3xl font-semibold text-slate-100 mt-8 mb-4 scroll-mt-24 ${isHindi ? 'font-devanagari-display leading-relaxed' : 'font-serif tracking-wide'}`}>
            {renderTextWithStyles(text)}
          </h2>
        );
      } else {
        parsedElements.push(
          <h3 id={id} key={`h-${i}`} className={`text-xl md:text-2xl font-semibold text-slate-200 mt-6 mb-3 scroll-mt-24 ${isHindi ? 'font-devanagari-serif' : 'font-serif'}`}>
            {renderTextWithStyles(text)}
          </h3>
        );
      }
      continue;
    }

    // 2. Blockquotes
    if (line.startsWith('>')) {
      flushList();
      const text = line.slice(1).trim();
      parsedElements.push(
        <blockquote key={`quote-${i}`} className={`border-l-4 border-ink-accent-cyan/60 pl-5 my-6 py-1 bg-ink-dark/30 rounded-r-lg text-slate-300 ${isHindi ? 'font-devanagari-serif leading-relaxed text-base' : 'font-serif italic text-lg'}`}>
          {renderTextWithStyles(text)}
        </blockquote>
      );
      continue;
    }

    // 3. Bullet points
    if (line.startsWith('*') || line.startsWith('-')) {
      const text = line.slice(1).trim();
      listBuffer.push(
        <li key={`li-${i}`} className={`text-base ${isHindi ? 'font-devanagari-serif leading-relaxed' : 'font-serif leading-relaxed'}`}>
          {renderTextWithStyles(text)}
        </li>
      );
      continue;
    }

    // Default: paragraph
    flushList();
    parsedElements.push(
      <p
        key={`p-${i}`}
        className={`my-5 leading-relaxed text-slate-300 ${
          isHindi 
            ? 'font-devanagari-serif text-lg md:text-xl leading-loose tracking-wide' 
            : 'font-serif text-base md:text-lg leading-relaxed md:leading-loose font-light'
        }`}
      >
        {renderTextWithStyles(line)}
      </p>
    );
  }

  flushList(); // Make sure any remaining list items are rendered

  return (
    <div className="reading-content-blocks space-y-4">
      {parsedElements}
    </div>
  );
}
