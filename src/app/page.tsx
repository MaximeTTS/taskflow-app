'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export default function LandingPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Header */}
      <header
        className={`border-b border-[#2a2a3a] px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <div className="text-xl font-bold text-[#f0f0ff]">
          Task<span className="text-indigo-400">Flow</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Connexion
          </Button>
          <Button onClick={() => router.push('/register')}>Commencer gratuitement</Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-28">
        {/* Badge animé */}
        <div
          className={`inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 font-medium mb-10 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Projet fullstack Next.js · GraphQL · TypeScript
        </div>

        {/* Titre */}
        <h1
          className={`text-6xl font-bold text-[#f0f0ff] leading-tight mb-6 max-w-3xl transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          Gérez vos projets
          <br />
          <span className="text-indigo-400">sans friction</span>
        </h1>

        {/* Sous-titre */}
        <p
          className={`text-xl text-[#8888aa] max-w-xl mb-12 leading-relaxed transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          TaskFlow est un outil de gestion de projets collaboratif. Organisez vos tâches en kanban,
          gérez votre équipe et suivez la progression en temps réel.
        </p>

        {/* CTA */}
        <div
          className={`flex items-center gap-4 mb-24 transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <Button size="lg" onClick={() => router.push('/register')}>
            Créer un compte →
          </Button>
          <Button size="lg" variant="secondary" onClick={() => router.push('/login')}>
            Se connecter
          </Button>
        </div>

        {/* Features */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left transition-all duration-700 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {[
            {
              icon: (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              ),
              title: 'Kanban board',
              desc: 'Organisez vos tâches en colonnes : À faire, En cours, En révision, Terminé. Déplacez et gérez chaque tâche en un clic.',
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10',
            },
            {
              icon: (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              title: 'Rôles & permissions',
              desc: "Owner, Admin, Member, Viewer — chaque membre de l'équipe a exactement les droits dont il a besoin.",
              color: 'text-green-400',
              bg: 'bg-green-500/10',
            },
            {
              icon: (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: 'Collaboration',
              desc: 'Invitez votre équipe, assignez des tâches, ajoutez des images et suivez qui fait quoi en temps réel.',
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6 hover:border-[#3a3a50] transition-colors"
            >
              <div
                className={`${f.bg} ${f.color} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}
              >
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[#f0f0ff] mb-2">{f.title}</h3>
              <p className="text-sm text-[#8888aa] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          className={`grid grid-cols-3 gap-8 max-w-lg w-full mt-20 transition-all duration-700 delay-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {[
            { value: '100%', label: 'TypeScript strict' },
            { value: 'GraphQL', label: 'API moderne' },
            { value: 'Vercel', label: 'Déployé en prod' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{s.value}</div>
              <div className="text-sm text-[#55556a]">{s.label}</div>
            </div>
          ))}
        </div>
      </main>
      {/* Footer */}
      <footer
        className={`border-t border-[#2a2a3a] py-6 px-8 flex items-center justify-between max-w-6xl mx-auto w-full transition-all duration-700 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="text-sm text-[#55556a]">TaskFlow — Projet portfolio fullstack</div>

        <a
          href="https://www.maxime-turquet.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          maxime-turquet.dev
        </a>
      </footer>
    </div>
  );
}
