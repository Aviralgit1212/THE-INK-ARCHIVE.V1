/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { useLibrary } from '../context/LibraryContext';
import RenderMarkdown, { extractHeadings, HeadingItem } from './RenderMarkdown';
import { 
  ArrowLeft, Heart, Share2, Eye, Calendar, BookOpen, Volume2, VolumeX,
  Compass, Sparkles, Check, Sun, Moon, Info
} from 'lucide-react';

export default function ReadingExperience() {
  const { routerState, navigateTo, pieces, isBookmarked, toggleBookmark, incrementViews } = useLibrary();
  
  const activeSlug = routerState.routeParams.slug;
  const piece = pieces.find(p => p.slug === activeSlug);

  // States
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Scoped reading contrast mode (light / dark content container)
  const [readingMode, setReadingMode] = useState<'dark' | 'light'>('dark');
  
  // Audio state
  const [ambientActive, setAmbientActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<any[]>([]);

  // Scroll active detection (to dim particles during reading scroll)
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Increment views on load
  useEffect(() => {
    if (piece) {
      incrementViews(piece.slug);
    }
    return () => {
      stopAmbientAudio();
    };
  }, [activeSlug]);

  // Handle scroll events: progress bar & scroll dimming
  useEffect(() => {
    const handleScroll = () => {
      // 1. Calculate reading progress
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      // 2. Highlight current heading in Table of Contents
      if (piece) {
        const headings = extractHeadings(piece.content);
        let currentActive = '';
        for (const heading of headings) {
          const el = document.getElementById(heading.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 120) {
              currentActive = heading.id;
            }
          }
        }
        if (currentActive) {
          setActiveHeadingId(currentActive);
        }
      }

      // 3. Detect active scroll to dim background atmospheres
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 400);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [piece]);

  if (!piece) {
    return (
      <div className="w-full max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <h2 className="text-xl font-serif text-slate-300">Writing Not Found</h2>
        <p className="text-slate-500 text-xs">The requested ink work has returned to the ether.</p>
        <button onClick={() => navigateTo('/library')} className="text-ink-accent-cyan font-mono text-xs uppercase tracking-wider">
          Return to Library Floor
        </button>
      </div>
    );
  }

  const headings = extractHeadings(piece.content);

  // -----------------------------------------------------------------
  // WEB AUDIO GENERATOR SYNTHESIZERS (NO MEDIA ASSETS NEEDED)
  // -----------------------------------------------------------------
  const startAmbientAudio = () => {
    try {
      stopAmbientAudio();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const nodes: any[] = [];

      if (piece.mood === 'sad') {
        // SYNTHESIZE RAIN
        // White noise generator
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Bandpass filter to make it sound like rain
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        // Rain gain
        const gain = ctx.createGain();
        gain.gain.value = 0.08;

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        whiteNoise.start();
        nodes.push(whiteNoise);

        // Gentle sub-piano drone
        const drone = ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 110; // A2 note

        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.02;

        drone.connect(droneGain);
        droneGain.connect(ctx.destination);
        drone.start();
        nodes.push(drone);

      } else if (piece.mood === 'horror') {
        // SYNTHESIZE COLD WHISTLING WIND
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 220; // low frequency hum

        // Modulator for wind gusts
        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = 0.15; // slow sweep

        const modGain = ctx.createGain();
        modGain.gain.value = 40; // modulate pitch of wind

        // White noise for leaf rustles
        const bufferSize = ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 350;
        noiseFilter.Q.value = 2.0;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.04;

        mod.connect(modGain);
        modGain.connect(noiseFilter.frequency); // wind sweep
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start();
        mod.start();
        noise.start();

        nodes.push(osc, mod, noise);

      } else if (piece.mood === 'hopeful') {
        // SYNTHESIZE GENTLE BIRDS & SUNRISE CHIMES
        // Soft ambient wind
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 146.83; // D3 note

        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.015;

        osc.connect(droneGain);
        droneGain.connect(ctx.destination);
        osc.start();
        nodes.push(osc);

        // Birds dynamic triggering timer
        const birdTimer = setInterval(() => {
          if (ctx.state === 'running') {
            const chirp = ctx.createOscillator();
            chirp.type = 'sine';
            chirp.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
            chirp.frequency.exponentialRampToValueAtTime(1400 + Math.random() * 300, ctx.currentTime + 0.15);

            const chirpGain = ctx.createGain();
            chirpGain.gain.setValueAtTime(0.005, ctx.currentTime);
            chirpGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

            chirp.connect(chirpGain);
            chirpGain.connect(ctx.destination);
            chirp.start();
            chirp.stop(ctx.currentTime + 0.2);
          }
        }, 3000);

        // Store interval reference on node list as dummy
        nodes.push({ stop: () => clearInterval(birdTimer) });

      } else if (piece.mood === 'philosophical') {
        // DEEP COSMIC SPACE SYNTH DRONE
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.value = 73.42; // D2 note

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 110; // A2 note

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.03;

        // Slow filter sweeper
        const sweep = ctx.createOscillator();
        sweep.type = 'sine';
        sweep.frequency.value = 0.05; // 20s sweep
        
        const sweepGain = ctx.createGain();
        sweepGain.gain.value = 150;

        sweep.connect(sweepGain);
        sweepGain.connect(filter.frequency);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        sweep.start();

        nodes.push(osc1, osc2, sweep);
      }

      audioNodesRef.current = nodes;
      setAmbientActive(true);
    } catch (err) {
      console.error("Web Audio synthesis failed to boot:", err);
    }
  };

  const stopAmbientAudio = () => {
    audioNodesRef.current.forEach(node => {
      try {
        if (typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    audioNodesRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAmbientActive(false);
  };

  const handleToggleAmbient = () => {
    if (ambientActive) {
      stopAmbientAudio();
    } else {
      startAmbientAudio();
    }
  };

  // -----------------------------------------------------------------
  // SHARE HANDLE
  // -----------------------------------------------------------------
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -----------------------------------------------------------------
  // MOOD-SPECIFIC VISUAL DECORATIONS
  // -----------------------------------------------------------------
  const renderAtmosphereLayer = () => {
    const opacityClass = isScrolling ? 'opacity-20' : 'opacity-100';
    
    switch (piece.mood) {
      case 'sad':
        return (
          <div className={`absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ${opacityClass}`}>
            {/* Cool teal blue vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-cyan-950/10 to-sky-950/20" />
            
            {/* CSS Rain Droplets */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="rain-drop left-[10%] duration-[2s]" style={{ animationDelay: '0.1s', animationDuration: '1.2s', height: '100px' }} />
              <div className="rain-drop left-[25%] duration-[1.5s]" style={{ animationDelay: '0.4s', animationDuration: '1.5s', height: '130px' }} />
              <div className="rain-drop left-[40%] duration-[1.8s]" style={{ animationDelay: '0.2s', animationDuration: '1.1s', height: '90px' }} />
              <div className="rain-drop left-[60%] duration-[1.4s]" style={{ animationDelay: '0.6s', animationDuration: '1.4s', height: '150px' }} />
              <div className="rain-drop left-[75%] duration-[2.2s]" style={{ animationDelay: '0.1s', animationDuration: '1.7s', height: '110px' }} />
              <div className="rain-drop left-[90%] duration-[1.6s]" style={{ animationDelay: '0.8s', animationDuration: '1.3s', height: '120px' }} />
            </div>
          </div>
        );
      case 'horror':
        return (
          <div className={`absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ${opacityClass}`}>
            {/* Shadowy dim background with flickering candles */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-slate-950/90" />
            
            {/* Fog rings and slow falling dust */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-900/40 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-96 bg-red-950/5 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />

            {/* Flickering light effect overlay */}
            <div className="absolute inset-0 bg-orange-950/5 mix-blend-color-burn animate-pulse pointer-events-none" style={{ animationDuration: '0.8s' }} />
          </div>
        );
      case 'hopeful':
        return (
          <div className={`absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ${opacityClass}`}>
            {/* Gorgeous Sunrise gold and orange vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-rose-500/5" />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-400/10 via-amber-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
            
            {/* Golden rising particles */}
            <div className="absolute inset-0 overflow-hidden opacity-40">
              <div className="absolute bottom-10 left-[15%] w-1.5 h-1.5 bg-amber-400 rounded-full blur-[1px] animate-bounce duration-[6s] infinite" />
              <div className="absolute bottom-40 left-[45%] w-2 h-2 bg-rose-400 rounded-full blur-[1px] animate-bounce duration-[9s] infinite" />
              <div className="absolute bottom-20 left-[75%] w-1.5 h-1.5 bg-orange-400 rounded-full blur-[1px] animate-bounce duration-[7s] infinite" />
            </div>
          </div>
        );
      case 'philosophical':
      default:
        return (
          <div className={`absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ${opacityClass}`}>
            {/* Deep universe starfield view */}
            <div className="absolute inset-0 bg-radial-gradient from-indigo-950/5 via-transparent to-ink-black/80" />
            
            {/* Floating faint stars / symbols */}
            <div className="absolute inset-0 overflow-hidden opacity-20 font-mono text-[10px] text-indigo-400 flex flex-wrap justify-around pointer-events-none p-12">
              <div className="floating-element p-4">Ω</div>
              <div className="floating-element p-4" style={{ animationDelay: '1s' }}>ॐ</div>
              <div className="floating-element p-4" style={{ animationDelay: '2s' }}>Ψ</div>
              <div className="floating-element p-4" style={{ animationDelay: '3s' }}>Φ</div>
              <div className="floating-element p-4" style={{ animationDelay: '4s' }}>श्री</div>
              <div className="floating-element p-4" style={{ animationDelay: '5s' }}>λ</div>
            </div>
          </div>
        );
    }
  };

  const isHindi = piece.language === 'hi';

  return (
    <div id="reading-experience" className="relative min-h-screen bg-ink-black overflow-hidden flex flex-col pb-20 animate-fade-in">
      {/* Top Reading Progress Bar */}
      <div 
        id="reading-progress-bar"
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-ink-accent-cyan via-ink-accent-purple to-ink-amber z-50 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Embedded Ambient Atmosphere Visual Decoration */}
      {renderAtmosphereLayer()}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Navigation Breadcrumbs & Controls Row */}
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-900/60 pb-5">
          <button
            id="read-back-btn"
            onClick={() => navigateTo('/library')}
            className="flex items-center gap-1.5 group font-display text-xs uppercase tracking-widest text-slate-500 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Library Floor
          </button>

          {/* Quick Controls */}
          <div className="flex items-center gap-3">
            {/* Dynamic Soundscape Player */}
            <button
              id="soundscape-toggle-btn"
              onClick={handleToggleAmbient}
              className={`flex items-center gap-1.5 text-xs font-display tracking-widest uppercase border rounded-full px-4 py-1.5 cursor-pointer transition-all ${
                ambientActive 
                  ? 'border-ink-accent-cyan bg-ink-accent-cyan/10 text-ink-accent-cyan glow-card-cyan' 
                  : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-white'
              }`}
              title={`Toggle ${piece.mood} soundscape`}
            >
              {ambientActive ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
              {ambientActive ? 'Sound ON' : 'Ambient sound'}
            </button>

            {/* Reading Settings: High Contrast toggle */}
            <button
              id="contrast-mode-btn"
              onClick={() => setReadingMode(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 border border-slate-800 rounded-full hover:border-slate-700 text-slate-400 hover:text-white cursor-pointer hover:bg-slate-900/40 transition-all"
              title="Toggle reading paper contrast"
            >
              {readingMode === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Bookmark button */}
            <button
              id="bookmark-toggle-btn"
              onClick={() => toggleBookmark(piece.slug)}
              className={`p-2 border rounded-full cursor-pointer transition-all ${
                isBookmarked(piece.slug)
                  ? 'border-pink-500/30 bg-pink-500/10 text-pink-400 shadow-sm'
                  : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
              title="Add to saved readings"
            >
              <Heart className={`w-3.5 h-3.5 ${isBookmarked(piece.slug) ? 'fill-pink-500' : ''}`} />
            </button>

            {/* Copy Shareable Link */}
            <button
              id="share-link-btn"
              onClick={handleShare}
              className={`flex items-center gap-1.5 text-xs font-display tracking-widest uppercase border rounded-full px-3.5 py-1.5 cursor-pointer transition-all ${
                copied 
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                  : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>

        {/* Cinematic Header Block */}
        <div className="max-w-3xl mx-auto text-center space-y-4 my-8">
          <div className="flex justify-center items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ink-accent-cyan" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Room / {piece.collection} • {piece.readingTime}
            </span>
          </div>

          <h1 className={`text-4xl md:text-6xl font-bold text-white tracking-wide leading-tight ${isHindi ? 'font-devanagari-display leading-relaxed' : 'font-serif'}`}>
            {piece.title}
          </h1>

          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-mono text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Published {piece.publishDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {piece.views} reads
            </span>
            <span>•</span>
            <span className="capitalize px-2 py-0.5 rounded border border-slate-800 bg-slate-900/30 text-[10px]">
              Mood: {piece.mood}
            </span>
          </div>

          <p className={`text-slate-400 text-sm md:text-base max-w-xl mx-auto pt-4 leading-relaxed border-t border-slate-900/60 mt-4 ${isHindi ? 'font-devanagari-serif' : 'font-serif italic'}`}>
            "{piece.summary}"
          </p>
        </div>

        {/* Main Content Layout with Sidebars on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start mt-4">
          
          {/* LEFT: Sticky Table of Contents */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-24 self-start space-y-5 border-l border-slate-900/80 pl-4 py-1" aria-label="Table of Contents">
            <h3 className="font-display font-semibold text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Table of Contents
            </h3>
            {headings.length === 0 ? (
              <p className="text-xs text-slate-600 font-serif italic">This work is structured continuously.</p>
            ) : (
              <ul className="space-y-3">
                {headings.map(heading => (
                  <li 
                    key={heading.id}
                    style={{ paddingLeft: `${(heading.level - 1) * 8}px` }}
                  >
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(heading.id);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                          setActiveHeadingId(heading.id);
                        }
                      }}
                      className={`block text-xs transition-colors cursor-pointer ${
                        activeHeadingId === heading.id 
                          ? 'text-ink-accent-cyan font-semibold border-l border-ink-accent-cyan pl-2 -ml-2.5' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* Quick Tips Box */}
            <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-4 mt-8 space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                <Info className="w-3.5 h-3.5 text-ink-accent-purple" />
                Reading Tips
              </div>
              <p className="text-[10px] text-slate-500 font-serif leading-relaxed">
                Background animations automatically dim and pause while you scroll to protect eye focus.
              </p>
            </div>
          </aside>

          {/* CENTER: Premium reading canvas */}
          <main className={`col-span-1 lg:col-span-2 rounded-2xl p-6 md:p-12 transition-all duration-300 shadow-2xl ${
            readingMode === 'dark' 
              ? 'bg-ink-dark/80 text-slate-300 border border-slate-900/60' 
              : 'bg-white text-slate-800 border border-slate-200'
          }`}>
            <RenderMarkdown content={piece.content} isHindi={isHindi} />
            
            {/* Ink drop flourish signature */}
            <div className="flex justify-center items-center gap-1.5 my-10 opacity-30">
              <span className="h-px w-10 bg-slate-500" />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-slate-500 rounded-full" />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              <span className="h-px w-10 bg-slate-500" />
            </div>

            {/* Tag lists */}
            <div className="flex flex-wrap items-center gap-1.5 pt-4">
              {piece.tags.map(tag => (
                <span key={tag} className={`text-[10px] font-mono border px-2.5 py-1 rounded-md flex items-center gap-0.5 ${
                  readingMode === 'dark'
                    ? 'bg-slate-950 border-slate-800/80 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  # {tag}
                </span>
              ))}
            </div>
          </main>

          {/* RIGHT: Quick Information block */}
          <aside className="col-span-1 space-y-6">
            <div className="rounded-xl border border-slate-900 bg-ink-dark/50 p-5 space-y-4">
              <h4 className="font-display font-medium text-[10px] uppercase tracking-widest text-slate-400">
                Atmosphere Details
              </h4>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Tone Class</span>
                  <span className="capitalize text-slate-300 font-mono font-medium">{piece.mood}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Sensation</span>
                  <span className="text-slate-300 font-serif italic text-right">
                    {piece.mood === 'sad' ? 'Rain & Solitude' :
                     piece.mood === 'horror' ? 'Flicker & Mist' :
                     piece.mood === 'hopeful' ? 'Sunrise Chime' :
                     'Celestial Stars'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Language Path</span>
                  <span className="text-slate-300 font-mono">
                    {piece.language === 'en' ? 'English (En)' : 'हिन्दी (Hindi)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quote of the Piece */}
            <div className="rounded-xl border border-slate-900 bg-gradient-to-br from-slate-950/40 to-ink-deep p-5 border-l-2 border-ink-accent-cyan/80">
              <p className="font-serif italic text-xs text-slate-400 leading-relaxed">
                "Writing is the only room where the clock does not tick, and the mind is completely free to outline its own galaxies."
              </p>
              <span className="text-[9px] font-mono uppercase text-slate-600 block mt-2 text-right">— Writer's Log</span>
            </div>
          </aside>

        </div>

      </div>
    </div>
  );
}
