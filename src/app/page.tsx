'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2a3a] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="text-lg font-bold text-[#f0f0ff]">
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
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs text-indigo-400 font-medium mb-8">
          ✦ Projet fullstack Next.js + GraphQL
        </div>

        <h1 className="text-5xl font-bold text-[#f0f0ff] leading-tight mb-6 max-w-2xl">
          Gérez vos projets
          <span className="text-indigo-400"> sans friction</span>
        </h1>

        <p className="text-lg text-[#8888aa] max-w-xl mb-10 leading-relaxed">
          TaskFlow est un outil de gestion de projets collaboratif. Créez des projets, organisez vos
          tâches en kanban, invitez votre équipe.
        </p>

        <div className="flex items-center gap-4">
          <Button size="lg" onClick={() => router.push('/register')}>
            Créer un compte →
          </Button>
          <Button size="lg" variant="secondary" onClick={() => router.push('/login')}>
            Se connecter
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full text-left">
          {[
            {
              icon: '⬡',
              title: 'Kanban board',
              desc: 'Organisez vos tâches en colonnes : À faire, En cours, En révision, Terminé.',
            },
            {
              icon: '◈',
              title: 'Rôles & permissions',
              desc: "Owner, Admin, Member, Viewer — chaque membre a exactement les droits qu'il faut.",
            },
            {
              icon: '◎',
              title: 'Temps réel',
              desc: 'Invitez votre équipe, assignez des tâches, suivez la progression ensemble.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6">
              <div className="text-2xl mb-4 text-indigo-400">{f.icon}</div>
              <h3 className="text-sm font-semibold text-[#f0f0ff] mb-2">{f.title}</h3>
              <p className="text-sm text-[#8888aa] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3a] py-6 text-center text-xs text-[#55556a]">
        TaskFlow — Projet portfolio fullstack
      </footer>
    </div>
  );
}
