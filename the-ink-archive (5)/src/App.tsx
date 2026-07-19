/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import Navbar from './components/Navbar';
import ParticleField from './components/ParticleField';
import LibraryFloor from './components/LibraryFloor';
import LibraryCollection from './components/LibraryCollection';
import ReadingExperience from './components/ReadingExperience';
import ArchiveTimeline from './components/ArchiveTimeline';
import GlobalSearch from './components/GlobalSearch';
import WriterDashboard from './components/WriterDashboard';

function MainAppContent() {
  const { routerState, transitionPhase, navigateTo } = useLibrary();

  const renderActiveView = () => {
    switch (routerState.currentRoute) {
      case '/':
        return null; // Landing UI is handled inside the always-mounted ParticleField
      case '/library':
        return <LibraryFloor />;
      case '/library/[collection]':
        return <LibraryCollection />;
      case '/read/[slug]':
        return <ReadingExperience />;
      case '/archive':
        return <ArchiveTimeline />;
      case '/search':
        return <GlobalSearch />;
      case '/dashboard':
        return <WriterDashboard />;
      default:
        return <LibraryFloor />;
    }
  };

  const isLanding = routerState.currentRoute === '/';

  // Apply cinematic critically damped easing curves for phase transitions
  let transitionClass = '';
  if (transitionPhase === 'phase1') {
    // Old scene dissolving
    transitionClass = 'opacity-0 scale-[0.97] -translate-y-4 blur-sm transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)]';
  } else if (transitionPhase === 'phase2') {
    // Traveling
    transitionClass = 'opacity-0 scale-[0.93] translate-y-8 blur-md transition-all duration-[1200ms]';
  } else if (transitionPhase === 'phase3') {
    // New scene settling (critically damped spring with overshoot!)
    transitionClass = 'opacity-100 scale-100 translate-y-0 blur-none transition-all duration-[1000ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]';
  } else {
    // Idle normal state
    transitionClass = 'opacity-100 scale-100 translate-y-0 blur-none transition-all duration-700 ease-out';
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-black text-slate-100 selection:bg-ink-accent-cyan/20 selection:text-ink-accent-cyan relative overflow-hidden">
      {/* 3D Spatial Particle World */}
      <div className={`fixed inset-0 ${isLanding ? 'z-20 pointer-events-auto' : 'z-0 pointer-events-none'}`}>
        <ParticleField />
      </div>

      {/* Cinematic Film Grain & Vignette Overlays */}
      <div className="fixed inset-0 pointer-events-none z-30 bg-radial-vignette opacity-70" />
      <div className="fixed inset-0 pointer-events-none z-30 film-grain opacity-[0.035]" />

      {/* Cinematic Navigation bar */}
      <Navbar />

      {/* Primary experiential viewport frame */}
      <main className={`flex-grow relative z-10 ${isLanding ? 'pointer-events-none' : 'w-full pb-16'} ${transitionClass}`}>
        {renderActiveView()}
      </main>

      {/* Tiny subtle aesthetic credit footer in the page footer margins */}
      {!isLanding && (
        <footer className="w-full py-8 border-t border-slate-950 bg-ink-black/40 text-center select-none relative z-10" aria-label="Footer">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
            THE INK ARCHIVE • IMAGINED AS AN ANCIENT-FUTURISTIC DIGITAL LIBRARY • © 2026
          </p>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <MainAppContent />
    </LibraryProvider>
  );
}

