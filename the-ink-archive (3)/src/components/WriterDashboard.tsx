/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { LiteraturePiece, CollectionType, MoodType, LanguageType } from '../types';
import RenderMarkdown from './RenderMarkdown';
import { 
  ShieldAlert, Lock, Plus, Save, Eye, Trash2, Edit3, Sparkles, Check, 
  Layers, Settings, ChevronRight, BarChart2, BookOpen, AlertCircle
} from 'lucide-react';

export default function WriterDashboard() {
  const { 
    pieces, isLoggedIn, loginWriter, addPiece, deletePiece, navigateTo 
  } = useLibrary();

  // Authentication state
  const [email, setEmail] = useState('shivanant2006@gmail.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Active workspace state
  const [activeSlug, setActiveSlug] = useState<string | null>(pieces[0]?.slug || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form parameters state
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formLanguage, setFormLanguage] = useState<LanguageType>('en');
  const [formCollection, setFormCollection] = useState<CollectionType>('poems');
  const [formTags, setFormTags] = useState('');
  const [formMood, setFormMood] = useState<MoodType>('philosophical');
  const [formReadingTime, setFormReadingTime] = useState('3 min read');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsDraft, setFormIsDraft] = useState(false);

  // Active piece pointer
  const activePiece = pieces.find(p => p.slug === activeSlug);

  // Auto-slugify function
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word characters
      .replace(/[\s_]+/g, '-')  // Replace spaces/underscores with -
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
  };

  // Title change handler with auto-slugifying for new items
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (isCreatingNew) {
      setFormSlug(slugify(val));
    }
  };

  // Load a piece into the editor form
  const loadPieceIntoForm = (piece: LiteraturePiece) => {
    setIsCreatingNew(false);
    setActiveSlug(piece.slug);
    setFormTitle(piece.title);
    setFormSlug(piece.slug);
    setFormLanguage(piece.language);
    setFormCollection(piece.collection);
    setFormTags(piece.tags.join(', '));
    setFormMood(piece.mood);
    setFormReadingTime(piece.readingTime);
    setFormSummary(piece.summary);
    setFormContent(piece.content);
    setFormIsDraft(!!piece.isDraft);
    setErrorMessage('');
  };

  // Pre-fill fields for a fresh new piece
  const handleTriggerNewPiece = () => {
    setIsCreatingNew(true);
    setActiveSlug(null);
    setFormTitle('');
    setFormSlug('');
    setFormLanguage('en');
    setFormCollection('poems');
    setFormTags('');
    setFormMood('philosophical');
    setFormReadingTime('3 min read');
    setFormSummary('');
    setFormContent('');
    setFormIsDraft(true);
    setErrorMessage('');
  };

  // Initialize form with first piece on mount
  React.useEffect(() => {
    if (isLoggedIn && activePiece && !formSlug) {
      loadPieceIntoForm(activePiece);
    }
  }, [isLoggedIn, activeSlug]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginWriter(email, password);
    if (success) {
      setAuthError('');
      if (pieces.length > 0) {
        loadPieceIntoForm(pieces[0]);
      }
    } else {
      setAuthError('Invalid email or password.');
    }
  };

  const handleSave = () => {
    setErrorMessage('');
    
    if (!formTitle.trim()) {
      setErrorMessage('Writing Title is required.');
      return;
    }
    
    if (!formSlug.trim()) {
      setErrorMessage('Unique URL Slug is required.');
      return;
    }

    // Check slug duplicates when creating a new piece
    if (isCreatingNew && pieces.some(p => p.slug === formSlug)) {
      setErrorMessage('A piece with this unique slug already exists. Please choose a different slug.');
      return;
    }

    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);
    const updatedPiece: Omit<LiteraturePiece, 'views'> = {
      slug: formSlug,
      title: formTitle,
      language: formLanguage,
      collection: formCollection,
      tags: tagsArray,
      mood: formMood,
      publishDate: new Date().toISOString().substring(0, 10),
      readingTime: formReadingTime,
      summary: formSummary,
      content: formContent,
      isDraft: formIsDraft
    };

    addPiece(updatedPiece);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    // After adding, select it
    setIsCreatingNew(false);
    setActiveSlug(formSlug);
  };

  const handleDeleteConfirm = () => {
    if (formSlug) {
      deletePiece(formSlug);
      const remaining = pieces.filter(p => p.slug !== formSlug);
      if (remaining.length > 0) {
        loadPieceIntoForm(remaining[0]);
      } else {
        handleTriggerNewPiece();
      }
      setShowDeleteConfirm(false);
    }
  };

  // Compute stats
  const totalReads = pieces.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const liveCount = pieces.filter(p => !p.isDraft).length;
  const draftCount = pieces.filter(p => p.isDraft).length;

  // -----------------------------------------------------------------
  // RENDER LOCK SCREEN FOR NON-LOGGED IN USERS
  // -----------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div id="dashboard-lock-screen" className="w-full max-w-md mx-auto px-6 py-20 animate-fade-in">
        <div className="rounded-2xl border border-slate-900 bg-ink-dark/80 p-8 shadow-2xl relative overflow-hidden text-center space-y-6 glow-card-purple">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ink-accent-purple/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="mx-auto w-12 h-12 rounded-xl bg-ink-accent-purple/10 border border-ink-accent-purple/20 flex items-center justify-center text-ink-accent-purple animate-pulse">
            <Lock className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-xl uppercase tracking-widest text-slate-100">
              Writer Space
            </h2>
            <p className="text-xs text-slate-500 font-serif italic">
              Access is protected for the archivist only.
            </p>
          </div>

          {authError && (
            <div className="p-3 text-[11px] font-mono leading-relaxed text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg flex items-start gap-1 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label htmlFor="auth-email-input" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                Archivist Email
              </label>
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shivanant2006@gmail.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-ink-accent-purple rounded-lg focus:outline-none text-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-pass-input" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                Master Phrase / Password
              </label>
              <input
                id="auth-pass-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-ink-accent-purple rounded-lg focus:outline-none text-slate-200 text-sm"
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-ink-accent-purple to-ink-accent-blue text-white font-display text-xs uppercase tracking-widest rounded-lg cursor-pointer transition-all font-medium hover:opacity-90"
            >
              Verify Archivist Signature
            </button>
          </form>

          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            The Ink Archive Secure Node
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER WORKSPACE (ADMIN MODE)
  // -----------------------------------------------------------------
  return (
    <div id="writer-workspace-view" className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
      
      {/* Workspace Header & Bento Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        
        {/* Title */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-ink-accent-cyan" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Admin Workspace Active
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl uppercase tracking-widest text-white">
            Library Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-serif italic">
            Publish literary pieces, manage active drafts, and track readers analytics live.
          </p>
        </div>

        {/* Bento Stats Block */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          <div className="bg-ink-dark/60 border border-slate-900 rounded-xl p-4 text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Total Reads</span>
            <div className="text-xl font-bold font-display text-ink-accent-cyan flex justify-center items-center gap-1 mt-1">
              <Eye className="w-4 h-4 text-slate-600" />
              {totalReads}
            </div>
          </div>
          <div className="bg-ink-dark/60 border border-slate-900 rounded-xl p-4 text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Live pieces</span>
            <div className="text-xl font-bold font-display text-emerald-400 flex justify-center items-center gap-1 mt-1">
              <BookOpen className="w-4 h-4 text-slate-600" />
              {liveCount}
            </div>
          </div>
          <div className="bg-ink-dark/60 border border-slate-900 rounded-xl p-4 text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Saved Drafts</span>
            <div className="text-xl font-bold font-display text-ink-amber flex justify-center items-center gap-1 mt-1">
              <Settings className="w-4 h-4 text-slate-600" />
              {draftCount}
            </div>
          </div>
        </div>

      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMN 1: LEFT WRITINGS INDEX (COL-SPAN-3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="font-display font-semibold text-xs text-slate-300 uppercase tracking-wider">
              My Writings Index ({pieces.length})
            </h3>
            
            <button
              onClick={handleTriggerNewPiece}
              className="p-1.5 rounded-full bg-ink-accent-cyan/10 border border-ink-accent-cyan/30 text-ink-accent-cyan hover:bg-ink-accent-cyan hover:text-ink-black cursor-pointer transition-all"
              title="Compose New Piece"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {pieces.map(p => {
              const isActive = p.slug === activeSlug && !isCreatingNew;
              return (
                <div
                  key={p.slug}
                  onClick={() => loadPieceIntoForm(p)}
                  className={`w-full p-3 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-start ${
                    isActive 
                      ? 'bg-slate-900/60 border-ink-accent-cyan text-white glow-card-cyan' 
                      : 'bg-ink-dark/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate pr-2">
                    <h4 className={`text-xs font-semibold truncate ${p.language === 'hi' ? 'font-devanagari-serif' : 'font-serif'}`}>
                      {p.title}
                    </h4>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                      {p.collection}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      p.isDraft 
                        ? 'bg-ink-amber/10 text-ink-amber border border-ink-amber/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {p.isDraft ? 'Draft' : 'Live'}
                    </span>
                    <span className="text-[8px] font-mono text-slate-600">
                      {p.views || 0} reads
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: SPLIT EDITOR + PREVIEW WORKSPACE (COL-SPAN-9) */}
        <div className="lg:col-span-9 space-y-6 bg-ink-dark/30 border border-slate-900 rounded-xl p-5 md:p-6">
          
          {/* Metadata Parameters Inputs */}
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-ink-accent-purple" />
                <h3 className="font-display font-bold text-xs uppercase tracking-widest text-slate-200">
                  {isCreatingNew ? 'Composing New Piece' : 'Editing Literary Piece'}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    <Check className="w-3.5 h-3.5 animate-bounce" /> Saved successfully
                  </span>
                )}

                {!isCreatingNew && (
                  <button
                    onClick={() => {
                      setErrorMessage('');
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 border border-red-950 bg-red-950/10 text-red-400 hover:bg-red-900 hover:text-white rounded-lg cursor-pointer transition-all"
                    title="Delete Piece"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-ink-accent-cyan to-ink-accent-purple text-ink-black font-display font-medium text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Inline Error banner */}
            {errorMessage && (
              <div className="p-3 text-xs font-mono leading-relaxed text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="space-y-1.5">
                <label htmlFor="edit-title-input" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Writing Title
                </label>
                <input
                  id="edit-title-input"
                  type="text"
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Architecture of Silence"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-slug-input" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Unique URL Slug
                </label>
                <input
                  id="edit-slug-input"
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. the-architecture-of-silence"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none font-mono"
                  disabled={!isCreatingNew}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-collection-select" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Collection Room / Shelf
                </label>
                <select
                  id="edit-collection-select"
                  value={formCollection}
                  onChange={(e) => setFormCollection(e.target.value as CollectionType)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none"
                >
                  <option value="poems">Poems / कविताएं</option>
                  <option value="essays">Essays / निबंध</option>
                  <option value="stories">Stories / कहानियां</option>
                  <option value="philosophy">Philosophy / दर्शन</option>
                  <option value="journal">Journal / डायरी</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-language-select" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Language Path
                </label>
                <select
                  id="edit-language-select"
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value as LanguageType)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none"
                >
                  <option value="en">English (Cormorant Garamond)</option>
                  <option value="hi">हिन्दी (Martel Devanagari)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-mood-select" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Mood Atmosphere
                </label>
                <select
                  id="edit-mood-select"
                  value={formMood}
                  onChange={(e) => setFormMood(e.target.value as MoodType)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none"
                >
                  <option value="philosophical">Philosophical (Starfield / Space drone)</option>
                  <option value="sad">Sad (Rain sound / Cool grade)</option>
                  <option value="horror">Horror (Flicker / Wind drift)</option>
                  <option value="hopeful">Hopeful (Sunrise glow / Bird chime)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-time-input" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Est. Reading Time
                </label>
                <input
                  id="edit-time-input"
                  type="text"
                  value={formReadingTime}
                  onChange={(e) => setFormReadingTime(e.target.value)}
                  placeholder="e.g. 4 min read"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="edit-summary-input" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Summary Quote / Descriptor
                </label>
                <input
                  id="edit-summary-input"
                  type="text"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="A short emotional highlight of this writing..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-tags-input" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Tags (comma separated)
                </label>
                <input
                  id="edit-tags-input"
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="hope, silence, mind"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 focus:border-ink-accent-cyan/40 rounded-lg text-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                  Publish State
                </label>
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="publishState"
                      checked={formIsDraft}
                      onChange={() => setFormIsDraft(true)}
                      className="accent-ink-amber"
                    />
                    Save as private draft (hidden from the public rooms)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="publishState"
                      checked={!formIsDraft}
                      onChange={() => setFormIsDraft(false)}
                      className="accent-emerald-400"
                    />
                    Publish live to Library (appears in shelves & timeline instantly!)
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* SIDE-BY-SIDE EDITOR AND PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-900">
            
            {/* Editor Area */}
            <div className="space-y-2">
              <label htmlFor="edit-content-textarea" className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                Editor (Prose Markdown)
              </label>
              <textarea
                id="edit-content-textarea"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={16}
                className="w-full p-4 bg-slate-950 border border-slate-900 focus:border-ink-accent-purple rounded-xl text-slate-300 text-sm font-mono focus:outline-none leading-relaxed resize-none"
                placeholder="Write your masterpiece..."
              />
            </div>

            {/* Immersive Preview Area */}
            <div className="space-y-2 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                Live Experiential Preview (English / Devanagari)
              </span>
              
              <div className="flex-1 p-5 md:p-6 bg-slate-950/80 border border-slate-900 rounded-xl overflow-y-auto max-h-[380px] custom-scrollbar">
                <div className="text-center pb-4 border-b border-slate-900/60 mb-5">
                  <span className="text-[8px] font-mono uppercase text-slate-500">
                    {formCollection} • {formReadingTime}
                  </span>
                  <h2 className={`text-xl font-bold text-white leading-tight ${formLanguage === 'hi' ? 'font-devanagari-display' : 'font-serif'}`}>
                    {formTitle}
                  </h2>
                </div>
                <RenderMarkdown content={formContent} isHindi={formLanguage === 'hi'} />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Absolute Deletion Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-ink-dark border border-slate-800 p-6 rounded-2xl shadow-2xl text-center space-y-6 glow-card-purple">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-100">
                Permanently Delete Writing?
              </h3>
              <p className="text-xs text-slate-400 font-serif leading-relaxed">
                Are you absolutely sure you want to delete <span className="text-white font-semibold">"{formTitle || 'this piece'}"</span>? This action cannot be undone and will erase it from the public shelves permanently.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 hover:shadow-red-900/20 text-white rounded-lg text-xs font-mono uppercase tracking-widest transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
