/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CollectionType = 'poems' | 'essays' | 'stories' | 'philosophy' | 'journal';
export type MoodType = 'sad' | 'horror' | 'hopeful' | 'philosophical';
export type LanguageType = 'en' | 'hi';

export interface LiteraturePiece {
  slug: string;
  title: string;
  content: string;
  language: LanguageType;
  collection: CollectionType;
  tags: string[];
  mood: MoodType;
  publishDate: string;
  readingTime: string;
  isDraft?: boolean;
  views: number;
  summary: string;
}

export interface Bookmark {
  slug: string;
  bookmarkedAt: string;
}

export interface ReadingProgress {
  slug: string;
  percent: number;
  updatedAt: string;
}

export interface AppState {
  currentRoute: '/' | '/library' | '/library/[collection]' | '/read/[slug]' | '/archive' | '/search' | '/dashboard';
  routeParams: {
    collection?: CollectionType;
    slug?: string;
  };
}
