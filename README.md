# 📊 TaskFlow App

> Une plateforme moderne et collaborative de gestion de projets et de tâches avec une architecture GraphQL avancée

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)

---

## 🎯 À Propos

**TaskFlow** est une application web complète de gestion de projets conçue pour les équipes modernes. Elle permet de :

- 📋 Organiser vos tâches en colonnes (À faire, En cours, En révision, Terminé)
- 👥 Collaborer en temps réel avec les membres de votre équipe
- 🎨 Gérer les priorités et les statuts des tâches
- 👤 Assigner des tâches à des membres spécifiques
- 📅 Définir des deadlines et suivre les échéances
- 🖼️ Ajouter des images et des descriptions aux tâches
- 🔐 Système de rôles avec permissions granulaires
- 🌙 Interface sombre élégante et intuitive

---

## 🛠️ Stack Technologique

### Frontend

- **Framework** : [Next.js 14](https://nextjs.org/) - React avec SSR/SSG
- **Language** : [TypeScript](https://www.typescriptlang.org/) - Typage statique
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **State Management** : [Apollo Client](https://www.apollographql.com/docs/react/) - GraphQL client
- **Animations** : [Framer Motion](https://www.framer.com/motion/) - Smooth animations
- **Drag & Drop** : [@dnd-kit](https://docs.dndkit.com/) - React drag and drop
- **Date Picker** : [react-datepicker](https://reactdatepicker.com/) - Date selection

### Backend

- **API** : [GraphQL](https://graphql.org/) - API moderne et flexible
- **ORM** : [Prisma](https://www.prisma.io/) - Type-safe database client
- **Database** : [SQLite/PostgreSQL](https://www.postgresql.org/) - Persistent data storage
- **Authentication** : JWT - Secure token-based auth
- **File Upload** : [Cloudinary](https://cloudinary.com/) - Image hosting

### DevOps & Tools

- **Package Manager** : [npm](https://www.npmjs.com/) / [pnpm](https://pnpm.io/)
- **Testing** : [Jest](https://jestjs.io/) - Unit testing
- **Linting** : [ESLint](https://eslint.org/) - Code quality
- **Build** : [TypeScript Compiler](https://www.typescriptlang.org/) - Type checking

---

## ✨ Fonctionnalités Principales

### 📌 Gestion des Tâches

- ✅ Créer, modifier, supprimer des tâches
- 🎯 Système de priorités (Basse, Moyenne, Haute, Urgente)
- 📊 Statuts personnalisables avec drag & drop
- 👥 Assigner des tâches aux membres
- 📅 Dates limites avec indicateurs visuels
- 🖼️ Galerie d'images pour chaque tâche
- 📝 Descriptions enrichies avec éditeur texte

### 👨‍💼 Gestion d'Équipe

- 🔑 Système de rôles (Owner, Admin, Member, Viewer)
- 👤 Invitations d'équipe par email
- 🛡️ Permissions granulaires par rôle
- 👁️ Aperçu des profils utilisateurs avec avatars

### 💼 Gestion de Projets

- 📁 Créer et gérer plusieurs projets
- 🎨 Descriptions précises pour chaque projet
- 🔄 Historique et versioning intégré
- 📊 Vue d'ensemble Kanban intuitive

### 🔐 Sécurité & Authentification

- 🔒 Authentification sécurisée avec JWT
- 🛡️ Permissions basées sur les rôles (RBAC)
- 📧 Vérification email
- 🔑 Gestion des sessions utilisateur

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou pnpm
- Base de données (SQLite pour développement, PostgreSQL pour production)
- Compte Cloudinary pour les uploads d'images

### Étapes

1. **Cloner le repository**

```bash
git clone https://github.com/MaximeTTS/taskflow-app.git
cd taskflow-app
```

2. **Installer les dépendances**

```bash
npm install
# ou
pnpm install
```

3. **Configuration de l'environnement**

```bash
cp .env.example .env.local
```

Remplissez les variables d'environnement :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

4. **Initialiser la base de données**

```bash
npx prisma migrate dev
```

5. **Lancer le serveur de développement**

```bash
npm run dev
# ou
pnpm dev
```

L'application est accessible à `http://localhost:3000`

---

## 📖 Structure du Projet

```
taskflow-app/
├── public/                    # Assets statiques
├── prisma/
│   ├── schema.prisma         # Schéma base de données
│   └── migrations/           # Historique des migrations
├── src/
│   ├── app/                  # Routes Next.js
│   │   ├── api/              # Endpoints GraphQL
│   │   ├── dashboard/        # Pages protégées
│   │   ├── login/            # Authentification
│   │   ├── register/         # Inscription
│   │   └── layout.tsx        # Layout global
│   ├── components/           # Composants réutilisables
│   │   ├── ui/              # Composants UI primitifs
│   │   └── layout/          # Composants d'en-tête
│   ├── graphql/              # Définitions GraphQL
│   │   ├── mutations/       # Mutations GraphQL
│   │   ├── queries/         # Requêtes GraphQL
│   │   └── schema/          # Schéma GraphQL
│   ├── lib/                  # Utilitaires
│   │   ├── auth.ts          # Logique d'authentification
│   │   ├── permissions.ts   # Système de permissions
│   │   └── prisma.ts        # Client Prisma
│   └── store/               # Gestion d'état (Zustand)
├── jest.config.ts           # Configuration Jest
├── tsconfig.json            # Configuration TypeScript
└── package.json             # Dépendances du projet
```

---

## 🎮 Utilisation

### Créer un compte

1. Accédez à `/register`
2. Remplissez le formulaire avec vos données
3. Vous êtes automatiquement connecté

### Créer un projet

1. Depuis le dashboard, cliquez sur "Nouveau Projet"
2. Donnez un nom et une description
3. Invitez des membres via email

### Gérer les tâches

1. Ouvrez un projet
2. Cliquez sur "Nouvelle Tâche" dans la colonne appropriée
3. Remplissez les détails (titre, description, priorité, deadline)
4. Déplacez les tâches entre colonnes en drag & drop
5. Cliquez sur une tâche pour éditer ses détails

### Gérer les membres

1. Dans les paramètres du projet, accédez à "Membres"
2. Invitez des membres ou modifiez leurs rôles
3. Les rôles définissent les permissions

---

## 🧪 Tests

Exécuter les tests unitaires :

```bash
npm run test
```

Exécuter les tests avec coverage :

```bash
npm run test:coverage
```

Exécuter les tests en mode watch :

```bash
npm run test:watch
```

---

## 📝 Scripts Disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Construire pour la production
npm run start        # Démarrer le serveur production
npm run lint         # Vérifier la qualité du code
npm run test         # Exécuter les tests
npm run format       # Formater le code avec Prettier
```

---

## 🔐 Système de Rôles

| Rôle          | Permissions                                               |
| ------------- | --------------------------------------------------------- |
| **Owner** 👑  | Accès complet, gestion des membres, suppression du projet |
| **Admin** 🔧  | Modification des tâches et du projet, gestion des membres |
| **Member** 👤 | Création et modification de tâches                        |
| **Viewer** 👁️ | Lecture seule                                             |

---

## 🐛 Signaler un Bug

Vous avez trouvé un bug ? Créez une [issue GitHub](https://github.com/MaximeTTS/taskflow-app/issues/new)

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE) - Vous êtes libre de l'utiliser, le modifier et le distribuer.

---

## 👥 Auteur

**Maxime** - [@MaximeTTS](https://github.com/MaximeTTS)

---

## 📞 Support

Pour toute question ou support :

- 📧 Email: [support@taskflow.com](mailto:support@taskflow.com)
- 💬 Issues GitHub: [GitHub Issues](https://github.com/MaximeTTS/taskflow-app/issues)
- 🐦 Twitter: [@MaximeTTS](https://twitter.com/MaximeTTS)

---

<div align="center">

⭐ **Si vous trouvez ce projet utile, n'oubliez pas de le mettre en favori !**

Fait avec ❤️ par [Maxime](https://github.com/MaximeTTS)

</div>
