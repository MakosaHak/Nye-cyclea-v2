# 🌸 Nye Cyclea — Application de Suivi du Cycle Menstruel

**Nye Cyclea** est une application mobile **PWA (Progressive Web App)** de santé féminine, conçue spécifiquement pour les femmes d'Afrique de l'Ouest. Elle offre un suivi précis du cycle menstruel, des prédictions intelligentes et des conseils de santé, le tout fonctionnant **entièrement hors-ligne**.

---

## ✨ Fonctionnalités Principales

### 📅 Suivi du Cycle
- Enregistrement des dates de début et de fin des règles
- Historique complet de tous les cycles passés
- Calendrier mensuel interactif pour visualiser les cycles

### 🔮 Prédictions Intelligentes
- Prévision des prochaines règles basée sur l'historique personnel
- Détection automatique de la durée habituelle du cycle
- Alertes et notifications de rappel (le jour J)

### 💬 IA & Conseils de Santé
- Chatbot intégré avec base de connaissances locale (100% hors-ligne)
- Conseils médicaux généraux sur la santé reproductive
- Réponses adaptées à la culture et au contexte ouest-africain

### 📊 Tableau de Bord Personnel
- Vue d'ensemble des statistiques du cycle (durée moyenne, régularité)
- Export du dossier médical en PDF
- Journal de symptômes et d'humeurs

### 👤 Profil & Paramètres
- Compte personnel sécurisé (authentification via Supabase)
- Mode anonyme (utilisation sans compte)
- Gestion de l'abonnement (Gratuit / Premium)

### 📴 Mode Hors-Ligne (Offline-First)
- L'application fonctionne **sans connexion internet**
- Toutes les données sont stockées localement (IndexedDB sur l'appareil)
- Synchronisation automatique quand le réseau est disponible

---

## 🛠️ Stack Technologique

| Catégorie | Technologie |
| :--- | :--- |
| **Framework** | React 18 + TypeScript |
| **Build** | Vite |
| **PWA** | Vite PWA Plugin + Workbox |
| **Stockage Local** | IndexedDB (via service personnalisé) |
| **Backend / Auth** | Supabase (PostgreSQL + Auth) |
| **UI** | Radix UI + CSS Personnalisé |
| **Notifications** | Service Worker (Push Notifications) |
| **IA locale** | Base de connaissances embarquée (chatLocalKB) |
| **Export** | PDF via pdfService |

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js `v18+`
- npm `v9+`

### 1. Cloner le dépôt
```bash
git clone https://github.com/VOTRE_NOM/Nye_Cyclea.git
cd Nye_Cyclea
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Copiez le fichier exemple et remplissez vos clés Supabase :
```bash
cp .env.example .env
```

Ouvrez `.env` et renseignez :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 4. Démarrer le serveur de développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

### 5. Build de production
```bash
npm run build
```

---

## 🗂️ Structure du Projet

```
src/
├── components/     # Composants UI (Dashboard, Calendar, Chat, etc.)
├── hooks/          # Hooks personnalisés (useCycles, usePredictions)
├── services/       # Services métier (storageService, predictionService, chatLocalKB)
├── lib/            # Clients tiers (supabase)
├── types/          # Types TypeScript
├── pages/          # Pages de l'application
└── sw.ts           # Service Worker (gestion offline & notifications)
```

---

## 🌍 Cibles & Marchés

- **Marché principal** : Togo, Bénin, Côte d'Ivoire, Sénégal (Zone UEMOA)
- **Audience** : Femmes de 15 à 49 ans
- **Modèle** : Freemium (fonctions de base gratuites, abonnement Premium)

---

## ⚠️ Avertissements & Limites (À lire attentivement)

> **L'application Nye Cyclea N'EST PAS un dispositif médical.**

Les informations et prédictions fournies par Nye Cyclea sont uniquement à titre éducatif et informatif. Elles ne remplacent en aucun cas l'avis d'un médecin ou d'un professionnel de la santé.

### ❌ Ce que Nye Cyclea NE FAIT PAS :
- **Ne diagnostique aucune maladie** (endométriose, SOPK, troubles hormonaux, etc.)
- **Ne constitue pas une méthode contraceptive.** Les prédictions de fertilité sont des estimations et ne doivent **JAMAIS** être utilisées pour éviter une grossesse.
- **Ne remplace pas un suivi gynécologique.** Consultez toujours un professionnel de santé pour tout symptôme inhabituel ou préoccupant.
- **Ne fournit pas de prescriptions médicales** ni de recommandations de médicaments.

---

## 🔐 Confidentialité & Données

- Les données personnelles (cycles, symptômes) sont stockées **localement sur votre appareil**.
- Aucune donnée personnelle de santé n'est transmise à des tiers sans votre consentement.
- L'application est conçue dans le respect de la **Loi n°2019-014 du Togo** sur la protection des données personnelles.

---

## 📄 Licence

Ce projet est propriétaire. Toute reproduction, distribution ou utilisation commerciale est interdite sans autorisation explicite de l'auteur.

© 2026 Nye Cyclea. Tous droits réservés.
