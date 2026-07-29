'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

export type TfVariant = 'verdant' | 'astral';

export type GlassSettings = {
  blur: number; // px — panels / pills / nav
  cardBlur: number; // px — the white cards
  sat: number; // %
  radius: number; // scale multiplier
};

export const GLASS_DEFAULT: GlassSettings = { blur: 36, cardBlur: 24, sat: 160, radius: 1 };

export const GLASS_PRESETS: Record<string, GlassSettings> = {
  Subtil: { blur: 16, cardBlur: 10, sat: 130, radius: 0.9 },
  Standard: { blur: 36, cardBlur: 24, sat: 160, radius: 1 },
  Intense: { blur: 52, cardBlur: 40, sat: 200, radius: 1.2 },
  Net: { blur: 8, cardBlur: 4, sat: 110, radius: 0.7 },
};

/** Available backgrounds. `src: null` = the animated mesh gradient. */
export type TfBackgroundOption = { id: string; label: string; src: string | null };

export const TF_BACKGROUNDS: TfBackgroundOption[] = [
  { id: 'mesh', label: 'Dégradé animé', src: null },
  { id: 'v1', label: 'Vidéo 1', src: '/videos/210240_medium.mp4' },
  { id: 'v2', label: 'Vidéo 2', src: '/videos/210244_medium.mp4' },
  { id: 'v3', label: 'Vidéo 3', src: '/videos/272514_medium.mp4' },
  { id: 'v4', label: 'Vidéo 4', src: '/videos/14205-255658030_medium.mp4' },
  { id: 'v5', label: 'Vidéo 5', src: '/videos/7348-199627499_medium.mp4' },
];

export const DEFAULT_BG = 'mesh';

/** Accent palette — user-selectable. */
export type TfAccent = { id: string; label: string; color: string; solid: string; text: string };

// `solid` is a flat color (no gradient) used as the button background.
export const TF_ACCENTS: TfAccent[] = [
  { id: 'blue', label: 'Bleu', color: '#3b82f6', solid: '#3b82f6', text: '#ffffff' },
  { id: 'indigo', label: 'Indigo', color: '#6366f1', solid: '#6366f1', text: '#ffffff' },
  { id: 'violet', label: 'Violet', color: '#8b5cf6', solid: '#8b5cf6', text: '#ffffff' },
  { id: 'teal', label: 'Sarcelle', color: '#0d9488', solid: '#0d9488', text: '#ffffff' },
  { id: 'emerald', label: 'Émeraude', color: '#059669', solid: '#059669', text: '#ffffff' },
  { id: 'amber', label: 'Ambre', color: '#d97706', solid: '#d97706', text: '#ffffff' },
  { id: 'rose', label: 'Rose', color: '#e11d48', solid: '#e11d48', text: '#ffffff' },
  { id: 'graphite', label: 'Graphite', color: '#475569', solid: '#475569', text: '#ffffff' },
];

export const DEFAULT_ACCENT = 'blue';

/** Font palette — user-selectable (all loaded in layout.tsx). */
export type TfFont = { id: string; label: string; stack: string };

export const TF_FONTS: TfFont[] = [
  { id: 'jakarta', label: 'Jakarta', stack: 'var(--font-jakarta)' },
  { id: 'inter', label: 'Inter', stack: 'var(--font-inter)' },
  { id: 'sora', label: 'Sora', stack: 'var(--font-sora)' },
  { id: 'mono', label: 'Mono', stack: 'var(--font-geist-mono)' },
];

export const DEFAULT_FONT = 'jakarta';

type TfThemeValue = {
  variant: TfVariant;
  isDark: boolean;
  toggle: () => void;
  setVariant: (v: TfVariant) => void;
  glass: GlassSettings;
  setGlass: (g: Partial<GlassSettings>) => void;
  resetGlass: () => void;
  bg: string;
  setBg: (id: string) => void;
  accent: string;
  setAccent: (id: string) => void;
  font: string;
  setFont: (id: string) => void;
};

const TfThemeContext = createContext<TfThemeValue>({
  variant: 'verdant',
  isDark: false,
  toggle: () => {},
  setVariant: () => {},
  glass: GLASS_DEFAULT,
  setGlass: () => {},
  resetGlass: () => {},
  bg: DEFAULT_BG,
  setBg: () => {},
  accent: DEFAULT_ACCENT,
  setAccent: () => {},
  font: DEFAULT_FONT,
  setFont: () => {},
});

export function useTfTheme() {
  return useContext(TfThemeContext);
}

function applyVariant(v: TfVariant) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.tfVariant = v;
}

function applyGlass(g: GlassSettings) {
  if (typeof document === 'undefined') return;
  const r = document.documentElement.style;
  r.setProperty('--tf-blur', `${g.blur}px`);
  r.setProperty('--tf-card-blur', `${g.cardBlur}px`);
  r.setProperty('--tf-sat', `${g.sat}%`);
  r.setProperty('--tf-radius-scale', String(g.radius));

  // Chromium does NOT repaint `backdrop-filter` when a CSS variable inside it
  // changes, so the sliders appear to do nothing. We force a real re-evaluation
  // by writing the literal filters into a dedicated stylesheet — and split the
  // panels/pills blur from the cards blur so they can be tuned independently.
  let tag = document.getElementById('tf-glass-style') as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'tf-glass-style';
    document.head.appendChild(tag);
  }
  const base = `blur(${g.blur}px) saturate(${g.sat}%)`;
  const card = `blur(${g.cardBlur}px) saturate(${g.sat}%)`;
  tag.textContent =
    `.tf-blur,.tf-pill,.tf-panel{backdrop-filter:${base} !important;-webkit-backdrop-filter:${base} !important;}` +
    `.tf-card-glass{backdrop-filter:${card} !important;-webkit-backdrop-filter:${card} !important;}`;
}

function applyAccent(id: string) {
  if (typeof document === 'undefined') return;
  const a = TF_ACCENTS.find((x) => x.id === id) ?? TF_ACCENTS[0]!;
  const r = document.documentElement.style;
  r.setProperty('--tf-accent', a.color);
  r.setProperty('--tf-accent-solid', a.solid);
  r.setProperty('--tf-accent-text', a.text);
}

function applyFont(id: string) {
  if (typeof document === 'undefined') return;
  // Use a data attribute + explicit CSS rules (bulletproof) instead of a
  // nested CSS variable, which resolved unreliably across html/body scopes.
  const valid = TF_FONTS.some((x) => x.id === id) ? id : TF_FONTS[0]!.id;
  document.documentElement.dataset.tfFont = valid;
}

export function TfThemeProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<TfVariant>('verdant');
  const [glass, setGlassState] = useState<GlassSettings>(GLASS_DEFAULT);
  const [bg, setBgState] = useState<string>(DEFAULT_BG);
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);
  const [font, setFontState] = useState<string>(DEFAULT_FONT);

  useEffect(() => {
    // Read persisted prefs after mount to avoid SSR hydration mismatch.
    const storedVariant = (localStorage.getItem('tf-variant') as TfVariant | null) ?? 'verdant';
    let storedGlass = GLASS_DEFAULT;
    try {
      const raw = localStorage.getItem('tf-glass');
      if (raw) storedGlass = { ...GLASS_DEFAULT, ...(JSON.parse(raw) as Partial<GlassSettings>) };
    } catch {
      /* ignore */
    }
    const storedBg = localStorage.getItem('tf-bg') ?? DEFAULT_BG;
    const storedAccent = localStorage.getItem('tf-accent') ?? DEFAULT_ACCENT;
    const storedFont = localStorage.getItem('tf-font') ?? DEFAULT_FONT;
    /* eslint-disable react-hooks/set-state-in-effect */
    setVariantState(storedVariant);
    setGlassState(storedGlass);
    setBgState(storedBg);
    setAccentState(storedAccent);
    setFontState(storedFont);
    /* eslint-enable react-hooks/set-state-in-effect */
    applyVariant(storedVariant);
    applyGlass(storedGlass);
    applyAccent(storedAccent);
    applyFont(storedFont);
  }, []);

  const setBg = (id: string) => {
    setBgState(id);
    localStorage.setItem('tf-bg', id);
  };

  const setAccent = (id: string) => {
    setAccentState(id);
    localStorage.setItem('tf-accent', id);
    applyAccent(id);
  };

  const setFont = (id: string) => {
    setFontState(id);
    localStorage.setItem('tf-font', id);
    applyFont(id);
  };

  const setVariant = (v: TfVariant) => {
    setVariantState(v);
    localStorage.setItem('tf-variant', v);
    applyVariant(v);
  };

  const toggle = () => setVariant(variant === 'astral' ? 'verdant' : 'astral');

  const setGlass = (patch: Partial<GlassSettings>) => {
    setGlassState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('tf-glass', JSON.stringify(next));
      applyGlass(next);
      return next;
    });
  };

  const resetGlass = () => {
    setGlassState(GLASS_DEFAULT);
    localStorage.setItem('tf-glass', JSON.stringify(GLASS_DEFAULT));
    applyGlass(GLASS_DEFAULT);
  };

  return (
    <TfThemeContext.Provider
      value={{
        variant,
        isDark: variant === 'astral',
        toggle,
        setVariant,
        glass,
        setGlass,
        resetGlass,
        bg,
        setBg,
        accent,
        setAccent,
        font,
        setFont,
      }}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </TfThemeContext.Provider>
  );
}
