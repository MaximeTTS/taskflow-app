'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  useTfTheme,
  GLASS_PRESETS,
  TF_BACKGROUNDS,
  TF_ACCENTS,
  TF_FONTS,
  type GlassSettings as GS,
} from './theme';
import { Icon } from './atoms';

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span style={{ color: 'var(--tf-text-muted)' }}>{label}</span>
        <span style={{ color: 'var(--tf-text)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tf-range"
        style={{
          background: `linear-gradient(90deg, var(--tf-accent) ${pct}%, var(--tf-soft) ${pct}%)`,
        }}
      />
    </div>
  );
}

export function GlassSettings() {
  const { variant, setVariant, glass, setGlass, resetGlass, bg, setBg, accent, setAccent, font, setFont } =
    useTfTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activePreset = (Object.keys(GLASS_PRESETS) as string[]).find((k) => {
    const p = GLASS_PRESETS[k] as GS;
    return (
      p.blur === glass.blur &&
      p.cardBlur === glass.cardBlur &&
      p.sat === glass.sat &&
      p.radius === glass.radius
    );
  });

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="tf-blur w-[300px] p-5"
            style={{
              transformOrigin: 'bottom right',
              borderRadius: 24,
              background: 'var(--tf-modal-bg)',
              border: '1px solid var(--tf-card-border)',
              boxShadow: '0 30px 70px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
              color: 'var(--tf-text)',
              maxHeight: 'min(82vh, 720px)',
              overflowY: 'auto',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold" style={{ letterSpacing: '-0.01em' }}>
                Apparence
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--tf-text-faint)' }}>
                Liquid Glass
              </span>
            </div>

            {/* Theme segmented */}
            <div className="text-[12px] mb-1.5" style={{ color: 'var(--tf-text-muted)' }}>
              Thème
            </div>
            <div
              className="flex p-1 rounded-full mb-4"
              style={{ background: 'var(--tf-soft)', border: '1px solid var(--tf-hairline)' }}
            >
              {(['verdant', 'astral'] as const).map((v) => {
                const active = variant === v;
                return (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className="flex-1 h-8 rounded-full inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold transition-all"
                    style={{
                      background: active ? 'var(--tf-card-bg)' : 'transparent',
                      color: active ? 'var(--tf-text)' : 'var(--tf-text-muted)',
                      boxShadow: active ? 'var(--tf-card-shadow)' : 'none',
                    }}
                  >
                    {v === 'verdant' ? <Icon.Sun width={14} height={14} /> : <Icon.Moon width={14} height={14} />}
                    {v === 'verdant' ? 'Clair' : 'Sombre'}
                  </button>
                );
              })}
            </div>

            {/* Accent color */}
            <div className="text-[12px] mb-1.5" style={{ color: 'var(--tf-text-muted)' }}>
              Couleur d’accent
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {TF_ACCENTS.map((a) => {
                const active = accent === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.id)}
                    title={a.label}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{
                      background: a.solid,
                      transform: active ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: active
                        ? `0 0 0 2px var(--tf-modal-bg), 0 0 0 4px ${a.color}`
                        : 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 5px rgba(0,0,0,0.2)',
                    }}
                  />
                );
              })}
            </div>

            {/* Font */}
            <div className="text-[12px] mb-1.5" style={{ color: 'var(--tf-text-muted)' }}>
              Police
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {TF_FONTS.map((f) => {
                const active = font === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFont(f.id)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      fontFamily: f.stack,
                      background: active ? 'var(--tf-accent)' : 'var(--tf-soft)',
                      color: active ? 'var(--tf-accent-text)' : 'var(--tf-text-muted)',
                      border: '1px solid var(--tf-hairline)',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Background */}
            <div className="text-[12px] mb-1.5" style={{ color: 'var(--tf-text-muted)' }}>
              Fond du site
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {TF_BACKGROUNDS.map((o) => {
                const active = bg === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setBg(o.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all"
                    style={{
                      background: active ? 'var(--tf-accent)' : 'var(--tf-soft)',
                      color: active ? 'var(--tf-accent-text)' : 'var(--tf-text-muted)',
                      border: '1px solid var(--tf-hairline)',
                    }}
                  >
                    {o.src ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                    {o.label}
                  </button>
                );
              })}
            </div>

            {/* Presets */}
            <div className="text-[12px] mb-1.5" style={{ color: 'var(--tf-text-muted)' }}>
              Préréglages
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Object.keys(GLASS_PRESETS).map((name) => {
                const active = activePreset === name;
                return (
                  <button
                    key={name}
                    onClick={() => setGlass(GLASS_PRESETS[name] as GS)}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all"
                    style={{
                      background: active ? 'var(--tf-accent)' : 'var(--tf-soft)',
                      color: active ? 'var(--tf-accent-text)' : 'var(--tf-text-muted)',
                      border: '1px solid var(--tf-hairline)',
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-3.5">
              <Slider label="Flou — barres & panneaux" value={glass.blur} min={0} max={60} step={1} suffix="px" onChange={(v) => setGlass({ blur: v })} />
              <Slider label="Flou — cartes blanches" value={glass.cardBlur} min={0} max={60} step={1} suffix="px" onChange={(v) => setGlass({ cardBlur: v })} />
              <Slider label="Saturation" value={glass.sat} min={100} max={220} step={5} suffix="%" onChange={(v) => setGlass({ sat: v })} />
              <Slider label="Arrondi" value={glass.radius} min={0.6} max={1.6} step={0.05} onChange={(v) => setGlass({ radius: v })} />
            </div>

            <button
              onClick={resetGlass}
              className="mt-4 w-full h-9 rounded-full text-[12.5px] font-semibold transition-colors"
              style={{ background: 'var(--tf-soft)', color: 'var(--tf-text-muted)' }}
            >
              Réinitialiser
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        title="Réglages d'apparence"
        className="tf-blur rounded-full flex items-center justify-center"
        style={{
          width: 52,
          height: 52,
          background: 'var(--tf-pill-bg)',
          border: '1px solid var(--tf-pill-border)',
          boxShadow: 'var(--tf-panel-shadow)',
          color: 'var(--tf-text)',
        }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          {open ? <Icon.Close /> : <SlidersIcon />}
        </motion.span>
      </motion.button>
    </div>
  );
}

function SlidersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </svg>
  );
}
