'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TfBackground } from '@/components/tf/Backgrounds';
import { BrandMark, Wordmark, ThemeToggle, TfAvatar, TF_PRIORITIES } from '@/components/tf/atoms';
import { stagger, fadeUp, EASE } from '@/components/tf/motion';

const TEAM = ['Maxime', 'Gucio', 'Alice', 'Léa'];

const FEATURES = [
  {
    title: 'Kanban fluide',
    desc: 'Quatre colonnes, glisser-déposer instantané. Vos tâches se déplacent comme sur du papier, avec un retour visuel immédiat.',
    hue: 245,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="6" height="16" rx="1.5" />
        <rect x="11" y="4" width="6" height="11" rx="1.5" />
        <rect x="19" y="4" width="2" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Rôles & permissions',
    desc: 'Owner, Admin, Member, Viewer. Invitez votre équipe et donnez à chacun exactement les droits dont il a besoin.',
    hue: 270,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 11a4 4 0 1 0-4-4" />
        <circle cx="9" cy="8" r="4" />
        <path d="M3 21c1.5-4 4-6 8-6s6.5 2 8 6" />
      </svg>
    ),
  },
  {
    title: 'Collaboration temps réel',
    desc: 'Avatars vivants, présence en ligne, deadlines partagées. Toute l’équipe voit la même chose, au même instant.',
    hue: 212,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    ),
  },
];

const PERKS = [
  { t: 'Glisser-déposer', d: 'Réorganisez en un geste.' },
  { t: 'Deadlines', d: 'Dates d’échéance & rappels visuels.' },
  { t: 'Images & fichiers', d: 'Pièces jointes via Cloudinary.' },
  { t: 'Avatars & présence', d: 'Voyez qui est en ligne.' },
  { t: 'Sécurité JWT', d: 'Auth robuste, mots de passe chiffrés.' },
  { t: '100% TypeScript', d: 'GraphQL · Prisma · Next.js.' },
];

const STATS = [
  { v: '4', l: 'colonnes Kanban' },
  { v: '4', l: 'niveaux de rôle' },
  { v: '100%', l: 'TypeScript strict' },
  { v: '∞', l: 'projets & tâches' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--tf-text)' }}>
      <TfBackground />

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative z-20 flex justify-center pt-6 px-4"
      >
        <div className="tf-pill flex items-center gap-1.5 rounded-full pl-3.5 pr-1.5 h-14">
          <BrandMark size={32} />
          <span className="ml-1 mr-3 sm:mr-6">
            <Wordmark size={16} />
          </span>
          <div className="hidden lg:flex items-center gap-1">
            {['Produit', 'Fonctionnalités', 'Tarifs', 'À propos'].map((l) => (
              <button
                key={l}
                className="tf-press px-3 h-10 rounded-full text-[13px] font-medium"
                style={{ color: 'var(--tf-text-muted)' }}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="h-7 w-px mx-1.5" style={{ background: 'var(--tf-hairline)' }} />
          <ThemeToggle />
          <button
            onClick={() => router.push('/login')}
            className="tf-press px-4 h-10 rounded-full text-[13px] font-semibold"
            style={{ color: 'var(--tf-text)' }}
          >
            Connexion
          </button>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            onClick={() => router.push('/register')}
            className="px-4 h-10 rounded-full text-[13px] font-semibold inline-flex items-center gap-1"
            style={{
              background: 'var(--tf-accent-solid)',
              color: 'var(--tf-accent-text)',
              boxShadow: '0 6px 16px -8px rgba(0,0,0,0.3)',
            }}
          >
            Commencer <span>→</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <motion.section
        variants={stagger(0.09, 0.12)}
        initial="hidden"
        animate="visible"
        className="relative z-[2] flex flex-col items-center text-center px-6 pt-16 sm:pt-20 max-w-4xl mx-auto"
      >
        <motion.div
          variants={fadeUp}
          className="tf-pill inline-flex items-center gap-2 rounded-full pl-3.5 pr-4 py-2 text-[12.5px] font-medium"
          style={{ color: 'var(--tf-text-muted)' }}
        >
          <span className="w-[7px] h-[7px] rounded-full bg-[#4ade80]" style={{ boxShadow: '0 0 8px #4ade80' }} />
          v2.0 — Liquid Glass · Next.js · GraphQL · Prisma
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-7 text-5xl sm:text-6xl lg:text-[80px] font-bold leading-[0.98]"
          style={{ letterSpacing: '-0.04em' }}
        >
          Gérez vos projets
          <br />
          <span style={{ color: 'var(--tf-accent)', fontStyle: 'italic', fontWeight: 600 }}>
            sans friction.
          </span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: 'var(--tf-text-muted)' }}>
          L’outil de gestion collaboratif pour les équipes qui aiment le détail. Kanban fluide,
          rôles fins, collaboration en temps réel — le tout dans une interface en verre dépoli.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            onClick={() => router.push('/register')}
            className="h-[52px] px-7 rounded-full text-[15px] font-semibold inline-flex items-center gap-2.5"
            style={{
              background: 'var(--tf-accent-solid)',
              color: 'var(--tf-accent-text)',
              boxShadow: '0 12px 28px -12px rgba(0,0,0,0.35)',
            }}
          >
            Créer un compte gratuitement <span>→</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            onClick={() => router.push('/login')}
            className="tf-pill h-[52px] px-6 rounded-full text-[15px] font-semibold inline-flex items-center gap-2"
            style={{ color: 'var(--tf-text)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Se connecter
          </motion.button>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-7 flex items-center gap-3 text-[12.5px]" style={{ color: 'var(--tf-text-faint)' }}>
          <div className="flex">
            {TEAM.map((m, i) => (
              <div key={m} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <TfAvatar name={m} size={28} ring />
              </div>
            ))}
          </div>
          <span>Rejoint par 200+ équipes — sans carte bancaire</span>
        </motion.div>
      </motion.section>

      {/* ── Product preview — keynote stage ── */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-[2] max-w-5xl mx-auto px-4 mt-16 sm:mt-24"
        style={{ perspective: '1800px' }}
      >
        {/* glow behind the product */}
        <div
          className="absolute left-1/2 -top-10 -translate-x-1/2 w-[80%] h-64 pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(99,102,241,0.28), transparent)', filter: 'blur(20px)' }}
        />
        <motion.div
          initial={{ rotateX: 14 }}
          whileInView={{ rotateX: 7 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: EASE }}
          style={{ transformOrigin: 'center top', transformStyle: 'preserve-3d' }}
        >
          <ProductWindow />
        </motion.div>
        {/* reflection */}
        <div
          className="mx-auto mt-1 h-24 w-[88%] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(99,102,241,0.12), transparent 70%)',
            filter: 'blur(8px)',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)',
            transform: 'scaleY(-1)',
          }}
        />
      </motion.section>

      {/* ── Stats band ── */}
      <section className="relative z-[2] max-w-4xl mx-auto px-6 mt-20">
        <div className="tf-panel rounded-[28px] grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden">
          {STATS.map((s) => (
            <div key={s.l} className="px-6 py-7 text-center">
              <div
                className="text-3xl sm:text-4xl font-bold"
                style={{ color: 'var(--tf-accent)', letterSpacing: '-0.03em' }}
              >
                {s.v}
              </div>
              <div className="mt-1 text-[13px]" style={{ color: 'var(--tf-text-muted)' }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-[2] max-w-5xl mx-auto px-6 mt-24">
        <SectionHeading
          kicker="Fonctionnalités"
          title="Pensé pour le flow d’équipe"
          subtitle="Tout ce qu’il faut pour organiser, suivre et livrer — sans la friction des outils classiques."
        />
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="tf-panel relative overflow-hidden p-6 rounded-[28px]"
            >
              <div
                className="absolute -top-10 -right-10 w-40 h-40 pointer-events-none"
                style={{ background: `radial-gradient(closest-side, hsla(${f.hue},80%,60%,0.35), transparent)` }}
              />
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white relative"
                style={{
                  background: `linear-gradient(135deg, hsl(${f.hue},75%,60%), hsl(${(f.hue + 30) % 360},70%,48%))`,
                  boxShadow: `0 8px 18px hsla(${f.hue},75%,50%,0.4)`,
                }}
              >
                {f.icon}
              </div>
              <h3 className="text-[17px] font-semibold relative" style={{ letterSpacing: '-0.01em' }}>
                {f.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed relative" style={{ color: 'var(--tf-text-muted)' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Perks grid ── */}
      <section className="relative z-[2] max-w-5xl mx-auto px-6 mt-20">
        <div className="tf-panel rounded-[28px] p-8 sm:p-10">
          <SectionHeading kicker="Et aussi" title="Tout ce qu’il vous faut" align="left" />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {PERKS.map((p) => (
              <div key={p.t} className="flex gap-3">
                <span
                  className="mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'var(--tf-accent-solid)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                </span>
                <div>
                  <div className="text-[14px] font-semibold">{p.t}</div>
                  <div className="text-[13px]" style={{ color: 'var(--tf-text-muted)' }}>
                    {p.d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="relative z-[2] max-w-3xl mx-auto px-6 mt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="tf-panel rounded-[32px] p-10 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-x-0 -top-24 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(closest-side, rgba(124,95,255,0.35), transparent)' }}
          />
          <h2 className="text-3xl sm:text-4xl font-bold relative" style={{ letterSpacing: '-0.02em' }}>
            Prêt à organiser votre prochain projet ?
          </h2>
          <p className="mt-3 text-[15px] relative" style={{ color: 'var(--tf-text-muted)' }}>
            Créez votre espace en quelques secondes. Gratuit, sans carte bancaire.
          </p>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            onClick={() => router.push('/register')}
            className="mt-7 h-[52px] px-8 rounded-full text-[15px] font-semibold inline-flex items-center gap-2.5 relative"
            style={{
              background: 'var(--tf-accent-solid)',
              color: 'var(--tf-accent-text)',
              boxShadow: '0 12px 28px -12px rgba(0,0,0,0.35)',
            }}
          >
            Commencer gratuitement <span>→</span>
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-[2] border-t mt-20 py-8 px-8 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-6xl mx-auto w-full" style={{ borderColor: 'var(--tf-hairline)' }}>
        <div className="flex items-center gap-2.5">
          <BrandMark size={28} />
          <span className="text-sm" style={{ color: 'var(--tf-text-faint)' }}>
            TaskFlow — Projet portfolio fullstack
          </span>
        </div>
        <a
          href="https://www.maxime-turquet.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium"
          style={{ color: 'var(--tf-accent)' }}
        >
          maxime-turquet.dev
        </a>
      </footer>

      <div className="h-10" />
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  subtitle,
  align = 'center',
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'center' ? 'text-center max-w-2xl mx-auto' : 'text-left'}>
      <div className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--tf-accent)' }}>
        {kicker}
      </div>
      <h2 className="mt-2 text-3xl sm:text-4xl font-bold" style={{ letterSpacing: '-0.025em' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--tf-text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* Floating glass "app window" showing a mini kanban — the product as hero. */
function ProductWindow() {
  const cols = [
    { name: 'À faire', dot: '#94a3b8', cards: [{ t: 'Maquettes v2', p: 'MEDIUM', who: 'Léa' }, { t: 'Recherche utilisateur', p: 'LOW', who: null }] },
    { name: 'En cours', dot: '#3b82f6', cards: [{ t: 'API GraphQL', p: 'URGENT', who: 'Maxime' }] },
    { name: 'En révision', dot: '#f59e0b', cards: [{ t: 'Page de profil', p: 'MEDIUM', who: 'Gucio' }] },
    { name: 'Terminé', dot: '#22c55e', cards: [{ t: 'Auth JWT', p: 'HIGH', who: 'Maxime' }] },
  ];
  return (
    <div
      className="tf-panel rounded-[24px] p-3 sm:p-4"
      style={{ boxShadow: '0 40px 90px -30px rgba(18,38,78,0.45), var(--tf-panel-shadow)' }}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-3 text-[12px] font-medium" style={{ color: 'var(--tf-text-faint)' }}>
          Projet TaskFlow — Tableau
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {cols.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl p-2.5"
            style={{ background: 'var(--tf-soft)', border: '1px solid var(--tf-hairline)' }}
          >
            <div className="flex items-center gap-1.5 px-1 pb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}99` }} />
              <span className="text-[12px] font-semibold">{c.name}</span>
              <span className="ml-auto text-[10px] px-1.5 rounded-full" style={{ background: 'var(--tf-soft-hover)', color: 'var(--tf-text-muted)' }}>
                {c.cards.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {c.cards.map((card) => (
                <div
                  key={card.t}
                  className="rounded-xl p-2.5"
                  style={{ background: 'var(--tf-card-bg)', border: '1px solid var(--tf-card-border)', boxShadow: 'var(--tf-card-shadow)' }}
                >
                  <div className="text-[12px] font-semibold leading-snug">{card.t}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full"
                      style={{ background: TF_PRIORITIES[card.p]?.bg }}
                    >
                      {TF_PRIORITIES[card.p]?.label}
                    </span>
                    {card.who ? (
                      <TfAvatar name={card.who} size={18} ring={false} />
                    ) : (
                      <span className="w-[18px] h-[18px] rounded-full" style={{ border: '1px dashed var(--tf-text-faint)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
