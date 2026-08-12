# CONTEXTE PROJET — Nye Cyclea

> **Document maître de continuité.**  
> Au début de **toute** nouvelle session (Cursor, VS Code, autre IA), dire :  
> **« Lis `CONTEXTE_PROJET.md` et continue le développement. »**

---

## RÈGLE OBLIGATOIRE — Mise à jour de ce fichier

**Chaque modification du code** (feature, fix, refonte UI, config, déploiement) **doit être reflétée dans ce document** dans la même session :

1. Ajouter une entrée datée dans **§16 Journal des modifications**
2. Mettre à jour **§12 Fonctionnalités** (fait / partiel / à faire) si pertinent
3. Mettre à jour **§15 Travail restant** si une tâche est terminée ou ajoutée
4. Mettre à jour **Dernière mise à jour** en en-tête
5. Committer `CONTEXTE_PROJET.md` avec le code (repo `v2`)

---

**Dernière mise à jour :** 12 août 2026 (IA gratuite Gemini + Groq)  
**Version app :** 0.1.0  
**Workspace :** `C:\Users\User\Desktop\Docs\Nye_Cyclea`  
**Développeuse / product owner :** MakosaHak — abonnement **Pro** active en test

---

## 1. Qu’est-ce que Nye Cyclea ?

### 1.1 Mission

**Nye Cyclea** est une application web progressive (PWA) de **suivi du cycle menstruel** et de **bien-être féminin**, pensée pour :

- Un usage **mobile-first** (smartphone)
- Un contexte **Afrique de l’Ouest** (connectivité variable, souveraineté des données)
- Une approche **éducative** (pas de diagnostic médical)
- Des contenus en **français**

### 1.2 Public cible

Femmes et personnes ayant un cycle menstruel, souhaitant :
- Enregistrer leurs règles et cycles
- Visualiser phases (règles, ovulation, fenêtre fertile, jours calmes)
- Recevoir des **prédictions** basées sur l’historique
- Poser des questions via **NyeAI** (assistante éducative)
- Accéder à des **analyses** et **exports PDF** (Pro)

### 1.3 Proposition de valeur

| Gratuit | Pro |
|---------|-----|
| Suivi cycles, calendrier, prédictions de base | NyeAI enrichie (cloud si Edge Function déployée) |
| NyeAI mode éducatif local (FAQ) | Rapports PDF par cycle |
| Espace Santé (analyse algorithmique) | Analyses avancées (prévu / partiel) |
| Conseils médicaux généraux | Pas de pub (prévu) |

### 1.4 Positionnement légal / éthique

- Informations **éducatives** — ne remplace pas un avis médical
- Politique de confidentialité : `PrivacyPolicyContent.tsx` (RGPD + IPDCP Togo mentionnés)
- Données de cycle **locales** sur l’appareil par défaut

---

## 2. Stack technique complète

### 2.1 Cœur application

| Technologie | Version / détail | Rôle |
|-------------|------------------|------|
| **React** | 18.3 | UI |
| **TypeScript** | 5.9 | Typage strict |
| **Vite** | 6.3.5 | Build, dev server |
| **React Router** | 6.22 | Navigation — **`HashRouter`** dans `main.tsx` (URLs `/#/chat`) |
| **Tailwind CSS** | via index.css + utilities | Design system rose/glass |
| **Radix UI** | multiples packages | Composants accessibles (`src/components/ui/`) |
| **Lucide React** | 0.487 | Icônes |
| **Sonner** | 2.0 | Toasts notifications |
| **Recharts** | 2.15 | Graphiques Espace Santé |
| **jsPDF** | 2.5 | Export PDF Pro |
| **Supabase JS** | 2.90 | Auth + profils + Edge Functions |

### 2.2 PWA

| Élément | Fichier |
|---------|---------|
| Plugin | `vite-plugin-pwa` v1.2 |
| Service Worker | `src/sw.ts` (injectManifest) |
| Manifest | généré dans `build/manifest.webmanifest` |
| Icônes | `public/icons/` (192, 512, maskable) |
| Install prompt | `SettingsInstallSection`, `usePWAInstall.ts` |
| Mise à jour SW | Toast « nouvelle version » dans `main.tsx` |

### 2.3 Tests & qualité

| Outil | Usage |
|-------|--------|
| Vitest | `npm run test` |
| Tests existants | `predictionService.test.ts`, `storageService.test.ts` |
| ESLint + Prettier | `npm run lint`, `npm run format` |

### 2.4 Backend / services externes

| Service | Usage |
|---------|--------|
| **Supabase Auth** | Inscription / connexion (email shadow) |
| **Supabase DB** | Table `profiles` (subscription_type, subscription_expiry) |
| **Supabase Edge Functions** | `chat-ai` (appelée en Pro — **non versionnée dans le repo**) |
| **Netlify** | Hébergement statique (drag & drop `build/` pour staging) |
| **IndexedDB** | Stockage local principal (cycles, settings, auth cache) |

### 2.5 Variables d’environnement

Fichier **`.env`** (local, **gitignored**) — copier depuis `.env.example` :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Injectées au **build** Vite dans le bundle JS. **Jamais** committer `.env`.

---

## 3. Architecture logicielle

### 3.1 Schéma des flux

```
Utilisatrice (navigateur / PWA)
        │
        ▼
┌───────────────────────────────────────┐
│  React App (HashRouter)               │
│  ├─ App.tsx (auth gate, routes)       │
│  ├─ Layout.tsx (header + nav)         │
│  └─ Pages lazy-loaded                 │
└───────────────┬───────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
CyclesContext  StorageService  Supabase
 (React)       (IndexedDB)     (Auth/Pro)
    │               │
    ▼               ▼
PredictionService   cycles[], settings, auth cache
CycleAnalysisService
nyeAiService (local KB + cloud)
pdfService
notificationService
```

### 3.2 Point important : HashRouter

L’app utilise **`HashRouter`** (`main.tsx`), pas `BrowserRouter`.

- URLs réelles : `https://site.com/#/chat`, `/#/hub`, etc.
- Les fichiers `_redirects` Netlify restent utiles pour servir `index.html`, mais le routing client est hash-based.
- Ne pas migrer vers BrowserRouter sans tester Netlify + Supabase redirects.

### 3.3 IndexedDB — `StorageService`

- **Nom DB :** `menstrual_cycle_app` (version **3**)
- **Stores :**
  - `auth` — session utilisatrice locale
  - `cycles` — entrées de cycle (index `startDate`)
  - `settings` — préférences

- **Supprimé en v3 :** stores `knowledge_base` et `fallback_messages` (ancien chat `female_health_bot`)
- **Cache mémoire** synchronisé pour accès sync (`getAuth()`, `getCycles()`)
- Migration depuis localStorage v1 incluse

### 3.4 Types principaux (`src/types/index.ts`)

- `CycleEntry` — id, userId, startDate, endDate?, symptoms?, notes?, source
- `UserStats` — moyennes cycle/règles, confiance prédiction
- `Prediction` — prochaines règles, ovulation, fenêtre fertile, ranges incertitude
- `UserSettings` — notifications, durées par défaut, privacy
- `AuthData` — id, username, subscriptionType, isAnonymous
- `ChatMessage` — messages NyeAI (user | assistant, `source?: online | local`)

---

## 4. Structure des dossiers

```
Nye_Cyclea/
├── public/              # Assets statiques, _redirects, _headers, icons PWA
├── src/
│   ├── App.tsx          # Routes, auth, modals
│   ├── main.tsx         # HashRouter, PWA SW, CyclesProvider
│   ├── index.css        # Design system global + .nye-ai-composer CSS
│   ├── sw.ts            # Service worker PWA
│   ├── components/      # UI métier + ui/ (Radix shadcn-like)
│   ├── contexts/        # CyclesContext
│   ├── hooks/           # useCycles, usePredictions, usePWAInstall
│   ├── services/        # Logique métier
│   ├── lib/supabase.ts  # Client Supabase
│   └── types/           # TypeScript interfaces
├── supabase/
│   ├── config.toml
│   └── functions/chat-ai/   # Edge Function Gemini + Groq (Pro, gratuit)
├── build/               # Sortie production (gitignored) — drag Netlify
├── netlify.toml         # Config build Netlify (si connexion Git)
├── DEPLOY.md            # Guide déploiement
├── CONTEXTE_PROJET.md   # CE FICHIER
├── .env.example         # Template env
├── .env                 # SECRETS — gitignored
└── vite.config.ts       # Vite + PWA, outDir: build, host: true dev
```

---

## 5. Pages et fonctionnalités détaillées

### 5.1 Authentification — `AuthScreen.tsx`

| Fonction | Détail |
|----------|--------|
| Inscription | `supabase.auth.signUp` avec email shadow `user.{username}@nyecyclea.com` |
| Connexion | `signInWithPassword` même format |
| Politique | Modal privacy obligatoire à l’inscription |
| Offline | Auth restaurée depuis IndexedDB puis Supabase session si online |
| Mot de passe min | 6 caractères |

**Non fait :** vrai email, reset password UI, OAuth social.

### 5.2 Accueil — `Dashboard.tsx`

- Carte phase actuelle (`PhaseCard`) — jour du cycle, phase
- Résumé stats + prochaine prédiction (`CycleSummaryCard`)
- Bouton ajouter cycle (modal `AddCycle`)
- Alerte si < 3 cycles enregistrés

### 5.3 Calendrier — `Calendar.tsx`

- Grille mensuelle colorée par phase (`PredictionService.getDayInfo`)
- Classes CSS : `cal-day-period`, `cal-day-ovulation`, `cal-day-fertile`, etc.
- Légende : `CalendarLegend.tsx`
- Navigation mois précédent / suivant

### 5.4 NyeAI — `NyeAiChat.tsx` + `nyeAiService.ts`

| Aspect | Détail |
|--------|--------|
| Free | KB locale (mots-clés) dans `nyeAiService.ts` |
| Pro | **Gemini** (principal) + **Groq** (secours) via Edge Function `chat-ai` ; fallback local si cloud down |
| Stockage chat | `localStorage` clé `nye_ai_chat_v2` |
| Contexte cycles | Tri DESC par `startDate` (corrigé) |
| UI | Badge « IA en ligne » / « Mode local » sur les réponses |
| UI Hero | Bot icon, badge Pro, reset conversation |
| Suggestions | `NYE_AI_SUGGESTIONS` chips |
| Input | `<input>` une ligne, bouton envoi rond, sans contour focus mobile |
| Bulles user | Rose adouci `#f472b6 → #ec4899` |
| Disclaimer | Sous input, gris 25% opacité, fond transparent |
| Bandeau upgrade | Lien `/subscribe` si free |

**Non fait :** streaming réponses, indicateur source local/cloud, Edge Function dans repo.

### 5.5 Espace Santé — `HealthHub.tsx`

- Onglet **Analyse** → `DashboardAnalytique.tsx`
- Onglet **Historique** → `CycleHistory.tsx` (query `?tab=history`)
- En-tête gradient rose/violet

#### Analyse — `DashboardAnalytique.tsx` + `cycleAnalysisService.ts`

- Nécessite **≥ 2 cycles**
- Score régularité /100, variance, tendances
- Graphiques Recharts (longueur cycle, durée règles)
- Bloc « Analyse IA » = **heuristiques**, pas LLM
- Types irrégularité : length_variance, period_variance, very_long, very_short

#### Historique — `CycleHistory.tsx`

- Liste cycles triés (récent → ancien)
- Suppression avec confirmation
- **Export PDF Pro** : `PDFService.generateCyclePDF(cycle)` — cadenas si free

### 5.6 Conseils — `MedicalInfo.tsx`

- Contenu éducatif santé / cycle
- Accès via **Réglages → Conseils** (plus dans nav basse)

### 5.7 Paramètres — `Settings.tsx`

Sections :
| Section | Fichier | Contenu |
|---------|---------|---------|
| Installation PWA | `SettingsInstallSection` | Aide install écran d’accueil |
| Compte | `SettingsAccountSection` | Carte upgrade Pro, infos compte |
| Cycle | `SettingsCycleSection` | Durées par défaut cycle/règles |
| Sauvegarde | `SettingsBackupSection` | Export/import JSON (Pro) |
| Notifications | `SettingsNotificationsSection` | Toggle + permission navigateur |
| Conseils | lien | → `/medical` |
| Confidentialité | accordion | `PrivacyPolicyContent` |
| Déconnexion / Suppression | | clearAllData + reload |

**Dette :** `window.location.reload()` après import JSON et suppression totale.

### 5.8 Abonnement — `SubscriptionScreen.tsx`

- Plans mensuel / annuel (UI complète)
- **Paiement NON implémenté** — mock 2s puis toast « Paiement bientôt disponible »
- Tableau comparatif Free vs Premium
- Features listées : IA, PDF, fertilité, sans pub

### 5.9 Ajout cycle — `AddCycle.tsx`

- Modal overlay depuis header (+) ou Dashboard
- Dates début/fin, notes, symptômes
- Persiste via `CyclesContext.addCycle` → IndexedDB

### 5.10 Layout — `Layout.tsx`

- Header : logo, « Nye Cyclea », badge **ProBadge** si premium, bouton +
- Nav basse 5 onglets (voir §6)
- `main` padding bottom pour nav fixe

### 5.11 Badge Pro — `ProBadge.tsx`

- Fond blanc, texte or, bordure `2px solid #f59e0b` inline
- Halo `box-shadow` or
- Tailles `sm` | `md`, option couronne

---

## 6. Navigation (validée — ne pas changer sans accord)

Barre blanche, 5 boutons égaux, icône + label :

| # | Label | Icône Lucide | Route hash |
|---|-------|--------------|------------|
| 1 | Accueil | Home | `/#/` |
| 2 | Calendrier | CalendarDays | `/#/calendar` |
| 3 | NyeAI | MessageSquare | `/#/chat` |
| 4 | Espace Santé | HeartPulse | `/#/hub` |
| 5 | Réglages | Settings | `/#/settings` |

**Conseils** : Réglages → `/medical` uniquement.

Historique des tentatives UI **rejetées** :
- Nav bouton central AI surélevé + 4 carrés bordés (croquis papier)
- Nav originale avec Historique + Conseils séparés dans la barre

---

## 7. Services métier — référence

### `predictionService.ts` (CŒUR MÉTIER)

- `calculateUserStats(cycles)` — moyennes, confiance
- `predictNextCycle(cycles)` — prochain cycle, ovulation, fertile
- `predictNext6Months(cycles)` — calendrier prévisions
- `getDayInfo(date, cycles, predictions)` — type jour pour calendrier/PDF
- `getCurrentPhase(cycles)` — phase actuelle Dashboard
- Gestion sigma / cycles irréguliers, ranges incertitude

### `cycleAnalysisService.ts`

- `analyzeCycles()` — irrégularités heuristiques
- `generateDashboardAnalysis()` — summary + monthlyData graphiques

### `nyeAiService.ts`

- `askNyeAi(prompt, history, { isPremium, stats, cycles })`
- `LOCAL_KB`, `EMERGENCY_KEYWORDS`, `SYSTEM_PROMPT`

### `pdfService.ts`

- `generateCyclePDF(targetCycle?)` — calendrier mois + résumé + étapes + légende

### `notificationService.ts`

- Permissions, rappels quotidiens, periodic sync SW

### `subscriptionService.ts`

- `getSubscriptionStatus(userId)` → profiles Supabase
- `isPremium(type)` → monthly | yearly

---

## 8. Design system

- **Police brand :** `--font-brand` (Parisienne) titres ; DM Sans corps
- **Couleurs :** rose `#f43f5e`, pink gradients, glass cards (`.glass-card`)
- **Fond app :** gradient animé `bg-drift` dans `body` (`index.css`)
- **Calendrier :** classes `cal-day-*` dans index.css
- **Chat composer :** `.nye-ai-composer` — anti-focus mobile

Fichiers design annexes (hors app) :
- `modellisation-nye-cyclea.html` — maquette HTML
- `AUDIT_STYLE.md` — audit UI ancien

---

## 9. Git & déploiement

### 9.1 Dépôts

| Remote | URL | Usage |
|--------|-----|-----|
| `origin` | https://github.com/MakosaHak/Nye_Cyclea.git | **PRODUCTION** — domaine réel, utilisatrices |
| `v2` | https://github.com/MakosaHak/Nye-cyclea-v2.git | **STAGING v2** — nouvelles features |

**Règle :** ne pas push v2 vers origin sans validation explicite de la product owner.

Branche v2 : `main`  
Dernier commit v2 : `a6f956a feat: NyeAI v2, Espace Sante, PDF calendrier et config Netlify pour staging`

### 9.2 Déploiement staging (méthode actuelle)

**Drag & drop Netlify** — pas de connexion Git obligatoire :

1. `.env` local avec clés Supabase
2. `npm run build`
3. Glisser dossier `build/` sur https://app.netlify.com/drop
4. Supabase Redirect URLs : `https://xxx.netlify.app/**`

Voir `DEPLOY.md` pour détails.

### 9.3 Production existante

- Site Netlify + **domaine custom** déjà en ligne
- **Ne pas remplacer** tant que staging v2 non validé
- Les deux sites peuvent coexister (même Supabase si mêmes clés)

---

## 10. Sécurité & confidentialité

| Sujet | État |
|-------|------|
| `.env` gitignored | ✅ |
| `.env` absent de `build/` | ✅ |
| Clé anon dans bundle JS | Normal côté client ; RLS Supabase requis |
| Données cycles chiffrées | ❌ clair dans IndexedDB |
| CSP | `public/_headers` — Supabase autorisé |
| XSS notes cycles | Texte brut React (pas dangerouslySetInnerHTML) |
| Paiement | Non implémenté — pas de Stripe/PayPal yet |

---

## 11. Intelligence artificielle — état honnête

### Ce qui EST de l’IA / algo

| Composant | Réalité technique |
|-----------|-------------------|
| NyeAI Free | Matching mots-clés + FAQ statique |
| NyeAI Pro | LLM **Gemini / Groq** (gratuit) via `supabase/functions/chat-ai` — **à déployer** |
| Dashboard « Analyse IA » | Statistiques + seuils (variance, tendances) |
| PredictionService | Algorithmes cycles (sigma, moyennes) — pas ML |

### Ce qui MANQUE (demande product owner)

- [ ] **Déployer** Edge Function `chat-ai` + secrets `GEMINI_API_KEY` (+ `GROQ_API_KEY` secours)
- [ ] Analyse **LLM** cycles irréguliers temps réel dans Espace Santé
- [ ] Streaming chat
- [ ] Commentaire IA dans export PDF

### Résolu (12 août 2026)

- ✅ Edge Function `chat-ai` **versionnée dans le repo** (`supabase/functions/chat-ai/`)
- ✅ Contexte cycles **triés** dans `buildUserContext()`
- ✅ UI badge « IA en ligne » vs « Mode local »
- ✅ Suppression code chat legacy (IndexedDB KB, `SplashScreen.tsx`)

---

## 12. Matrice fonctionnalités (fait / partiel / non fait)

| Feature | Statut | Notes |
|---------|--------|-------|
| Suivi cycles local | ✅ Fait | IndexedDB |
| Calendrier phases | ✅ Fait | |
| Prédictions ovulation/fertile | ✅ Fait | PredictionService |
| Auth Supabase | ✅ Fait | Email shadow |
| PWA installable | ✅ Fait | |
| Notifications | ⚠️ Partiel | Permission + SW |
| NyeAI chat local | ✅ Fait | |
| NyeAI cloud Pro | ⚠️ Partiel | Code + Edge Function prêts — **déploiement Supabase requis** |
| Espace Santé analyse | ✅ Fait | Heuristiques |
| Espace Santé historique | ✅ Fait | |
| Export PDF Pro | ✅ Fait | Refonte calendrier |
| Badge Pro UI | ✅ Fait | ProBadge |
| Paiement abonnement | ❌ Non fait | Mock UI seulement |
| Sync cycles cloud | ❌ Non fait | Volontairement local |
| Sync multi-appareils | ❌ Non fait | |
| Import/export JSON | ⚠️ Partiel | Pro, reload après import |
| Splash screen démarrage | ❌ Retiré | Loading spinner ; `SplashScreen.tsx` supprimé |
| Ancien Chat.tsx | ❌ Supprimé | Remplacé NyeAI |
| Chat IndexedDB legacy | ❌ Supprimé | DB v3, stores KB retirés |
| Tests unitaires complets | ❌ Non fait | 2 fichiers seulement |

---

## 13. Audit qualité (référence)

**Note globale : 76/100** (session audit juillet 2026)

| Axe | Score |
|-----|-------|
| Produit & parcours | 20/25 |
| UX / UI mobile | 21/25 |
| Architecture & code | 16/25 |
| Fiabilité & tests | 11/20 |
| Sécurité & données | 14/20 |
| IA réelle vs affichée | 14/25 |

Dettes majeures : reload(), déploiement Edge Function sur Supabase, tests insuffisants, paiement mock.

---

## 14. Commandes développeur

```bash
npm install          # ou npm ci
npm run dev          # localhost:3000 + LAN (host: true)
npm run build        # → build/ (pour Netlify drag-drop)
npm run test         # vitest
npm run lint         # eslint
npm run format       # prettier
```

Test mobile même WiFi : `http://IP_PC:3000` (affiché par Vite).

---

## 15. Travail restant (priorisé)

### P0 — Avant mise en prod v2
- [ ] Déployer staging Netlify (drag-drop) + tester auth Pro
- [ ] **Déployer** Edge Function `chat-ai` + `GEMINI_API_KEY` (et `GROQ_API_KEY` optionnel)
- [ ] Tester NyeAI Pro : réponses « IA en ligne » (pas « Mode local »)

### P1 — Produit
- [ ] Intégration paiement réelle (Stripe / Mobile Money — à décider)
- [ ] IA analyse irrégularités LLM dans DashboardAnalytique (Pro)

### P2 — Qualité
- [ ] Remplacer `window.location.reload()` par refresh CyclesContext
- [ ] Tests cycleAnalysisService, nyeAiService, pdfService
- [ ] Fusion v2 validée → déploiement domaine principal

---

## 16. Journal des modifications

> **Ajouter ici chaque session.** Format : `YYYY-MM-DD — description`

### 2026-08-12 — IA gratuite : Gemini + Groq (remplace OpenAI)

- Edge Function `chat-ai` : **Google Gemini** (principal) + **Groq/Llama** (secours automatique)
- Secrets Supabase : `GEMINI_API_KEY`, `GROQ_API_KEY` — plus de clé OpenAI payante
- UI NyeAI : badge « IA en ligne (Gemini) » ou « (Groq) »
- Guides : `DEPLOY.md` §8, `supabase/functions/chat-ai/README.md`

### 2026-08-12 — Nettoyage chat legacy + IA cloud NyeAI

**Suppression ancien chat :**
- Retrait `initChatDB`, `searchChatKB`, `getChatFallback` de `storageService.ts`
- IndexedDB v3 : suppression stores `knowledge_base` / `fallback_messages`
- Suppression `SplashScreen.tsx` (non utilisé)
- `clearAllData()` efface aussi `nye_ai_chat_v2`

**IA réelle Pro :**
- Nouvelle Edge Function `supabase/functions/chat-ai/index.ts` (Gemini/Groq, vérif Pro via `profiles`)
- `nyeAiService.ts` : historique conversation, contexte cycles trié, appel cloud amélioré
- UI : badge « IA en ligne » / « Mode local » sur les réponses assistant
- Guide déploiement dans `DEPLOY.md` §8 et `supabase/functions/chat-ai/README.md`

### 2026-08-12 — Enrichissement CONTEXTE_PROJET.md
- Document réécrit en profondeur (stack, architecture, pages, matrice features)
- Règle obligatoire de mise à jour à chaque modification code
- Push GitHub v2 prévu

### 2026-07-27 — Session majeure UI + v2 staging (résumé)

**Navigation :**
- Nav finale 5 boutons : Accueil, Calendrier, NyeAI (centre), Espace Santé, Réglages
- Conseils déplacés dans Réglages

**NyeAI :**
- Nouveau `NyeAiChat.tsx` + `nyeAiService.ts`
- Suppression ancien stack : Chat.tsx, chatAiService, chatLocalKB, chatModeService, chatSafetyService, chatSearchService, types/chat.ts
- UX input : une ligne, bouton rond, sans contour focus, disclaimer sous input gris 25%
- Bulles user rose adouci, avatar Bot agrandi, hero icône Bot

**Espace Santé :**
- `HealthHub.tsx` + `DashboardAnalytique.tsx` + `cycleAnalysisService.ts`

**Pro :**
- `ProBadge.tsx` — blanc, bordure or, halo
- Carte upgrade Settings restylée

**PDF :**
- `pdfService.ts` refonte — calendrier mois + étapes + résumé

**App :**
- Splash screen retiré (`App.tsx`)
- `vite.config.ts` host:true pour test mobile
- `tsconfig.json` exclude node_modules/build/dist
- CSP Supabase dans `_headers`

**Déploiement :**
- `netlify.toml`, `.nvmrc`, `DEPLOY.md`
- Repo v2 créé : github.com/MakosaHak/Nye-cyclea-v2
- Commit `a6f956a` poussé sur v2/main
- Stratégie : drag-drop `build/` pour staging, prod inchangée

**Documentation :**
- Première version `CONTEXTE_PROJET.md`

### 2026-07 (antérieur) — Commits repo origin
- `62136fb` Fix cycle saving + auth Supabase session
- `cbec656` Offline-first auth persistence
- `3b80ff9` Refactor CyclesContext, stabilisation architecture

---

## 17. Instructions pour un nouvel assistant IA

1. **Lire ce fichier en entier** avant toute modification
2. Vérifier branche / remote (`v2` vs `origin`)
3. **Ne jamais** committer `.env` ou dossier `build/` avec secrets
4. Respecter nav §6 et design rose/glass existant
5. Cycles = **local** ; ne pas sync cloud sans spec
6. Après **chaque** changement code → mettre à jour **§16 Journal** (+ §12/§15 si besoin)
7. Committer `CONTEXTE_PROJET.md` avec le code sur `v2`
8. Product owner est **Pro** — tester features Pro (PDF, NyeAI cloud)
9. HashRouter — routes en `/#/...`
10. Paiement abonnement = mock — ne pas promettre paiement live

---

## 18. Liens utiles

| Ressource | URL |
|-----------|-----|
| GitHub staging v2 | https://github.com/MakosaHak/Nye-cyclea-v2 |
| GitHub prod | https://github.com/MakosaHak/Nye_Cyclea |
| Netlify drop | https://app.netlify.com/drop |
| Supabase dashboard | (projet configuré dans `.env` local) |

---

*Fin du document — maintenir à jour en permanence.*
