/**
 * ShareTemplateRegistry — Catalogue of all share card templates.
 *
 * 3 free + 5 premium = 8 total.
 * Each template defines its visual identity (preview colors, icon) and which
 * content types it supports. The card renderer uses the template ID to pick
 * the right render function.
 */

import { ShareTemplate, ShareContentType } from './ShareTemplateTypes';

const ALL_TYPES: ShareContentType[] = ['verse', 'hadith', 'khatma', 'mood-verse'];

export const SHARE_TEMPLATES: ShareTemplate[] = [
    // ── Free Templates ──────────────────────────────────────────────────────
    {
        id: 'minimal-light',
        name: 'Minimal Light',
        isPremium: false,
        contentTypes: ALL_TYPES,
        previewColors: ['#FAF8FF', '#EDE5FF'],
        icon: 'weather-sunny',
    },
    {
        id: 'minimal-dark',
        name: 'Minimal Dark',
        isPremium: false,
        contentTypes: ALL_TYPES,
        previewColors: ['#18181B', '#09090B'],
        icon: 'weather-night',
    },
    {
        id: 'classic-gold',
        name: 'Classic Gold',
        isPremium: false,
        contentTypes: ALL_TYPES,
        previewColors: ['#422006', '#92400E'],
        icon: 'star-four-points',
    },

    // ── Premium Templates ───────────────────────────────────────────────────
    {
        id: 'cosmic-night',
        name: 'Cosmic Night',
        isPremium: true,
        contentTypes: ALL_TYPES,
        previewColors: ['#1E1A2E', '#6246EA'],
        icon: 'star-shooting',
    },
    {
        id: 'emerald-serenity',
        name: 'Emerald Serenity',
        isPremium: true,
        contentTypes: ALL_TYPES,
        previewColors: ['#064E3B', '#10B981'],
        icon: 'leaf',
    },
    {
        id: 'royal-calligraphy',
        name: 'Royal Calligraphy',
        isPremium: true,
        contentTypes: ALL_TYPES,
        previewColors: ['#1A1340', '#312E81'],
        icon: 'format-letter-case',
    },
    {
        id: 'sunset-warmth',
        name: 'Sunset Warmth',
        isPremium: true,
        contentTypes: ALL_TYPES,
        previewColors: ['#431407', '#9A3412'],
        icon: 'white-balance-sunny',
    },
    {
        id: 'lavender-dreams',
        name: 'Lavender Dreams',
        isPremium: true,
        contentTypes: ALL_TYPES,
        previewColors: ['#4C1D95', '#7C3AED'],
        icon: 'cloud',
    },
];

/** Get all templates that support a given content type. */
export function getTemplatesForContent(contentType: ShareContentType): ShareTemplate[] {
    return SHARE_TEMPLATES.filter(t => t.contentTypes.includes(contentType));
}

/** Get a template by ID. Returns the first free template as fallback. */
export function getTemplateById(id: string): ShareTemplate {
    return SHARE_TEMPLATES.find(t => t.id === id) ?? SHARE_TEMPLATES[0];
}
