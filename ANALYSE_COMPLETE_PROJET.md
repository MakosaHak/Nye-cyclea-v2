# 📊 Analyse Complète du Projet Nye Cyclea

## Points d'Amélioration Généraux et Détaillés

**Date d'analyse** : [Date actuelle]  
**Version du projet** : 0.1.0  
**Type** : Application PWA React/TypeScript pour suivi du cycle menstruel

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture et Structure](#architecture-et-structure)
3. [Qualité du Code](#qualité-du-code)
4. [Performance](#performance)
5. [Sécurité](#sécurité)
6. [Accessibilité](#accessibilité)
7. [Expérience Utilisateur](#expérience-utilisateur)
8. [Tests et Qualité](#tests-et-qualité)
9. [Documentation](#documentation)
10. [Déploiement et DevOps](#déploiement-et-devops)
11. [Fonctionnalités Manquantes](#fonctionnalités-manquantes)
12. [Recommandations Prioritaires](#recommandations-prioritaires)

---

## 🎯 VUE D'ENSEMBLE

### Points Forts ✅

- Architecture React moderne avec TypeScript
- PWA configurée avec Vite
- IndexedDB pour stockage local performant
- UI moderne avec Tailwind CSS et Radix UI
- Design responsive et soigné
- Code organisé en composants et services

### Points Faibles ❌

- Aucun test automatisé
- Gestion d'erreurs basique
- Accessibilité non conforme
- Performance non optimisée
- Documentation minimale

**Score Global** : 4.5/10

---

## 🏗️ ARCHITECTURE ET STRUCTURE

### ✅ Points Positifs

1. **Séparation des responsabilités** : Services séparés (storage, prediction, PDF)
2. **Types TypeScript** : Interface bien définies dans `types/index.ts`
3. **Composants modulaires** : Structure claire avec composants UI réutilisables
4. **Routing** : React Router bien configuré

### ❌ Points d'Amélioration

#### 1.1 Gestion d'État

**Problème** : Pas de state management centralisé

- Chaque composant gère son propre état avec `useState`
- Pas de synchronisation entre composants
- Duplication de logique (chargement des cycles dans plusieurs composants)

**Impact** :

- Code dupliqué
- Bugs potentiels de synchronisation
- Difficulté de maintenance

**Solution recommandée** :

```typescript
// Option 1: Context API
const CyclesContext = createContext<CyclesContextType>();

// Option 2: Zustand (plus léger)
import { create } from 'zustand';

// Option 3: React Query (pour cache et sync)
import { useQuery } from '@tanstack/react-query';
```

**Fichiers concernés** :

- `src/components/Dashboard.tsx` (lignes 21-35)
- `src/components/Calendar.tsx` (lignes 17-29)
- `src/components/CycleHistory.tsx` (lignes 12-26)

#### 1.2 Polling Inefficace

**Problème** : Polling toutes les 2 secondes dans `CycleHistory.tsx`

```typescript
// Ligne 21 - CycleHistory.tsx
const interval = setInterval(handleStorageChange, 2000);
```

**Impact** :

- Consommation CPU inutile
- Batterie drainée sur mobile
- Performance dégradée

**Solution recommandée** :

- Utiliser des événements personnalisés
- Implémenter un système de pub/sub
- Utiliser React Query avec refetch automatique

#### 1.3 Rechargement de Page

**Problème** : `window.location.reload()` utilisé dans plusieurs endroits

```typescript
// AddCycle.tsx ligne 47
window.location.reload();

// Settings.tsx ligne 38
window.location.reload();
```

**Impact** :

- Perte d'état de l'application
- Expérience utilisateur dégradée
- Performance médiocre

**Solution recommandée** :

- Utiliser un state management global
- Émettre des événements pour notifier les composants
- Utiliser React Query invalidation

---

## 💻 QUALITÉ DU CODE

### ❌ Problèmes Identifiés

#### 2.1 Gestion d'Erreurs Basique

**Problème** : Utilisation de `alert()` et `console.error()` partout

**Occurrences** :

- `AddCycle.tsx` : 2 `alert()`
- `Settings.tsx` : 1 `alert()`, 2 `confirm()`
- `App.tsx` : 1 `confirm()`
- `pdfService.ts` : 1 `alert()`
- 20+ `console.error()` dans les services

**Impact** :

- UX dégradée (alertes natives)
- Pas de logging structuré
- Difficile à déboguer en production

**Solution recommandée** :

```typescript
// Créer un Error Boundary
class ErrorBoundary extends React.Component {
  // Gestion centralisée des erreurs
}

// Utiliser un système de toast (Sonner est déjà installé)
import { toast } from 'sonner';

// Logger structuré
import { logger } from './utils/logger';
```

#### 2.2 Pas de Validation de Schéma

**Problème** : Validation manuelle basique

```typescript
// AuthScreen.tsx - validation manuelle
if (!email || !password) {
  setError('Veuillez remplir tous les champs');
  return;
}
```

**Impact** :

- Code répétitif
- Validation inconsistante
- Pas de validation côté runtime

**Solution recommandée** :

```typescript
// Utiliser Zod (déjà compatible avec TypeScript)
import { z } from 'zod';

const cycleSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  // ...
});
```

#### 2.3 Magic Numbers et Strings

**Problème** : Valeurs hardcodées partout

```typescript
// Dashboard.tsx
const cycleLen = stats?.averageCycleLength || 28; // Magic number
const periodLen = nextPrediction ? daysBetween(...) : (stats?.averagePeriodLength || 5);

// Calendar.tsx
estimatedEnd.setDate(estimatedEnd.getDate() + 4); // Magic number
```

**Solution recommandée** :

```typescript
// constants/cycle.ts
export const CYCLE_CONSTANTS = {
  DEFAULT_CYCLE_LENGTH: 28,
  DEFAULT_PERIOD_LENGTH: 5,
  OVULATION_OFFSET: 14,
  FERTILE_WINDOW_BEFORE: 4,
  FERTILE_WINDOW_AFTER: 1,
} as const;
```

#### 2.4 Code Dupliqué

**Problème** : Logique de formatage de dates répétée

- Formatage de dates dans plusieurs composants
- Calculs de durées dupliqués
- Logique de chargement des cycles répétée

**Solution recommandée** :

```typescript
// utils/date.ts
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short') => {
  // Logique centralisée
};

// hooks/useCycles.ts
export const useCycles = () => {
  // Logique centralisée de chargement
};
```

#### 2.5 Pas de Hooks Personnalisés

**Problème** : Logique métier dans les composants

- Chargement des cycles dans chaque composant
- Calculs de prédictions répétés
- Gestion d'état locale partout

**Solution recommandée** :

```typescript
// hooks/useCycleData.ts
export const useCycleData = () => {
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // ...
};

// hooks/usePredictions.ts
export const usePredictions = (cycles: CycleEntry[]) => {
  // Logique de prédiction
};
```

---

## ⚡ PERFORMANCE

### ❌ Problèmes Identifiés

#### 3.1 Pas de Lazy Loading

**Problème** : Tous les composants chargés au démarrage

```typescript
// App.tsx - tous les composants importés directement
import { Dashboard } from './components/Dashboard';
import { Calendar } from './components/Calendar';
// ...
```

**Impact** :

- Bundle initial volumineux
- Temps de chargement initial long
- Consommation mémoire inutile

**Solution recommandée** :

```typescript
// Lazy loading avec React.lazy
const Dashboard = lazy(() => import('./components/Dashboard'));
const Calendar = lazy(() => import('./components/Calendar'));

// Avec Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>...</Routes>
</Suspense>
```

#### 3.2 Pas de Memoization

**Problème** : Re-renders inutiles

- Composants qui se re-rendent même si props inchangées
- Calculs répétés à chaque render
- Fonctions recréées à chaque render

**Exemple** :

```typescript
// Dashboard.tsx - fonctions recréées à chaque render
const formatLong = (iso?: string) => {
  /* ... */
};
const formatShort = (iso?: string) => {
  /* ... */
};
```

**Solution recommandée** :

```typescript
// Utiliser useMemo pour les calculs coûteux
const stats = useMemo(() => PredictionService.calculateUserStats(cycles), [cycles]);

// Utiliser useCallback pour les fonctions
const handleAddCycle = useCallback(() => {
  // ...
}, [dependencies]);

// Utiliser React.memo pour les composants
export const CycleCard = React.memo(({ cycle }) => {
  // ...
});
```

#### 3.3 Pas de Virtualisation

**Problème** : Liste complète rendue dans `CycleHistory`

- Tous les cycles rendus même si non visibles
- Performance dégradée avec beaucoup de cycles

**Solution recommandée** :

```typescript
// Utiliser react-window ou react-virtual
import { FixedSizeList } from 'react-window';
```

#### 3.4 Images Non Optimisées

**Problème** : Images chargées sans optimisation

- Pas de lazy loading
- Pas de formats modernes (WebP, AVIF)
- Pas de responsive images

**Solution recommandée** :

- Utiliser `<img loading="lazy">`
- Implémenter un composant Image optimisé
- Utiliser des formats modernes

#### 3.5 Recalculs Inutiles

**Problème** : Prédictions recalculées à chaque render

```typescript
// Dashboard.tsx - recalculé à chaque render
const nextPrediction = PredictionService.predictNextCycle(cycles);
```

**Solution recommandée** :

- Mettre en cache les prédictions
- Utiliser useMemo
- Invalider le cache seulement quand nécessaire

---

## 🔒 SÉCURITÉ

### ❌ Problèmes Identifiés

#### 4.1 Authentification Basique

**Problème** : Pas de vraie authentification

```typescript
// AuthScreen.tsx - mot de passe stocké en clair
const authData: AuthData = {
  id: crypto.randomUUID(),
  email,
  isAnonymous: false,
  createdAt: new Date().toISOString(),
};
```

**Impact** :

- Pas de sécurité réelle
- Mot de passe non utilisé (stocké mais pas vérifié)
- Pas de session management

**Solution recommandée** :

- Implémenter un vrai système d'auth (si backend)
- Ou documenter que c'est une app locale uniquement
- Ajouter un hashage même pour stockage local

#### 4.2 Pas de Validation d'Import

**Problème** : Import JSON sans validation

```typescript
// storageService.ts ligne 292
static importData(jsonString: string): boolean {
  const data = JSON.parse(jsonString);
  // Pas de validation du schéma
}
```

**Impact** :

- Risque d'injection de données malveillantes
- Corruption de données
- Erreurs runtime

**Solution recommandée** :

```typescript
import { z } from 'zod';

const importSchema = z.object({
  cycles: z.array(cycleSchema),
  settings: settingsSchema.optional(),
});

static importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    const validated = importSchema.parse(data);
    // ...
  } catch (error) {
    // Gestion d'erreur
  }
}
```

#### 4.3 Cloudflare Analytics

**Problème** : Token hardcodé dans HTML

```html
<!-- index.html ligne 16 -->
<script
  defer
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "f6d83f37dc85479bb0c8362e369a81fa"}'
></script>
```

**Impact** :

- Conformité RGPD à vérifier
- Token exposé publiquement

**Solution recommandée** :

- Utiliser une variable d'environnement
- Ajouter un consentement utilisateur (RGPD)
- Documenter la collecte de données

#### 4.4 Pas de Sanitization

**Problème** : Données utilisateur non sanitizées

- Notes des cycles
- Emails
- Pas de protection XSS

**Solution recommandée** :

- Sanitizer les inputs
- Échapper le HTML si nécessaire
- Utiliser des bibliothèques comme DOMPurify

---

## ♿ ACCESSIBILITÉ

### ❌ Problèmes Critiques

#### 5.1 Pas d'Attributs ARIA

**Problème** : Éléments interactifs sans labels ARIA

```typescript
// Calendar.tsx - boutons sans aria-label
<button onClick={previousMonth}>
  <ChevronLeft className="w-5 h-5" />
</button>
```

**Impact** :

- Non utilisable avec lecteurs d'écran
- Non conforme WCAG 2.1

**Solution recommandée** :

```typescript
<button
  onClick={previousMonth}
  aria-label="Mois précédent"
>
  <ChevronLeft className="w-5 h-5" />
</button>
```

#### 5.2 Navigation Clavier

**Problème** : Focus management incomplet

- Pas de trap de focus dans les modals
- Ordre de tabulation non optimisé
- Pas d'indicateurs de focus visibles

**Solution recommandée** :

- Ajouter `tabIndex` appropriés
- Implémenter focus trap dans modals
- Améliorer les styles de focus

#### 5.3 Contraste des Couleurs

**Problème** : Contraste non vérifié

- Textes sur fonds colorés
- États de focus peu visibles

**Solution recommandée** :

- Vérifier avec outils (WAVE, axe DevTools)
- Ajuster les couleurs pour ratio 4.5:1 minimum
- Tester avec simulateurs de daltonisme

#### 5.4 Langue HTML

**Problème** : `lang="en"` alors que l'app est en français

```html
<!-- index.html ligne 2 -->
<html lang="en"></html>
```

**Solution** :

```html
<html lang="fr"></html>
```

#### 5.5 Labels Manquants

**Problème** : Inputs sans labels appropriés

- Certains inputs ont des labels visuels mais pas de `<label>`
- Pas de `aria-describedby` pour les erreurs

**Solution recommandée** :

```typescript
<label htmlFor="startDate">
  Date de début <span className="text-pink-500">*</span>
</label>
<input
  id="startDate"
  type="date"
  aria-describedby="startDate-error"
  aria-invalid={hasError}
/>
```

---

## 🎨 EXPÉRIENCE UTILISATEUR

### ❌ Problèmes Identifiés

#### 6.1 Pas d'Indicateurs de Chargement

**Problème** : Pas de feedback pendant les opérations

- Ajout de cycle : pas de loading
- Génération PDF : pas de feedback
- Chargement initial : pas de skeleton

**Solution recommandée** :

```typescript
const [isLoading, setIsLoading] = useState(false);

// Utiliser Sonner pour les toasts
import { toast } from 'sonner';

toast.promise(saveCycle(), {
  loading: 'Enregistrement...',
  success: 'Cycle enregistré !',
  error: "Erreur lors de l'enregistrement",
});
```

#### 6.2 États Vides Basiques

**Problème** : Messages d'état vides peu engageants

```typescript
// CycleHistory.tsx
<h2 className="text-gray-800 mb-2">Aucun cycle enregistré</h2>
```

**Solution recommandée** :

- Illustrations
- Actions suggérées
- Messages plus engageants

#### 6.3 Pas d'Animations de Transition

**Problème** : Changements de page brusques

- Pas de transitions entre routes
- Pas d'animations de chargement

**Solution recommandée** :

- Utiliser Framer Motion (déjà installé)
- Transitions de page
- Animations micro-interactions

#### 6.4 Gestion d'Erreurs UX

**Problème** : Alertes natives peu engageantes

- `alert()` et `confirm()` natifs
- Pas de design cohérent

**Solution recommandée** :

- Utiliser des composants de dialogue (Radix UI déjà installé)
- Toasts avec Sonner
- Messages d'erreur contextuels

#### 6.5 Mode Sombre Non Implémenté

**Problème** : `next-themes` installé mais non utilisé

- Variables CSS pour dark mode présentes
- Pas de toggle dans l'UI

**Solution recommandée** :

```typescript
import { useTheme } from 'next-themes';

// Ajouter toggle dans Settings
```

---

## 🧪 TESTS ET QUALITÉ

### ❌ Problèmes Critiques

#### 7.1 Aucun Test

**Problème** : Aucun fichier de test dans le projet

**Impact** :

- Risque élevé de régression
- Pas de confiance pour refactoring
- Bugs non détectés

**Solution recommandée** :

```typescript
// Tests unitaires avec Vitest
import { describe, it, expect } from 'vitest';
import { PredictionService } from './predictionService';

describe('PredictionService', () => {
  it('should calculate average cycle length', () => {
    // ...
  });
});

// Tests de composants avec React Testing Library
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';

// Tests E2E avec Playwright
```

#### 7.2 Pas de Linting

**Problème** : Pas de configuration ESLint

**Solution recommandée** :

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ]
}
```

#### 7.3 Pas de Formatage

**Problème** : Pas de Prettier configuré

**Solution recommandée** :

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

#### 7.4 Pas de Pre-commit Hooks

**Problème** : Pas de vérification avant commit

**Solution recommandée** :

```json
// package.json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src",
    "test": "vitest"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  }
}
```

---

## 📚 DOCUMENTATION

### ❌ Problèmes Identifiés

#### 8.1 README Minimal

**Problème** : Seulement instructions de base

**Solution recommandée** :

- Description du projet
- Architecture
- Guide d'installation détaillé
- Guide de contribution
- Changelog

#### 8.2 Pas de JSDoc

**Problème** : Fonctions sans documentation

**Solution recommandée** :

```typescript
/**
 * Calcule les statistiques utilisateur à partir de l'historique des cycles
 * @param cycles - Tableau des cycles enregistrés
 * @returns Statistiques calculées (moyennes, confiance, etc.)
 * @throws {Error} Si les données sont invalides
 */
static calculateUserStats(cycles: CycleEntry[]): UserStats {
  // ...
}
```

#### 8.3 Pas de Storybook

**Problème** : Composants UI non documentés

**Solution recommandée** :

- Storybook pour documenter les composants
- Exemples d'utilisation
- Props documentées

---

## 🚀 DÉPLOIEMENT ET DEVOPS

### ❌ Problèmes Identifiés

#### 9.1 Pas de CI/CD

**Problème** : Pas de pipeline automatisé

**Solution recommandée** :

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

#### 9.2 Pas de Variables d'Environnement

**Problème** : Configuration hardcodée

**Solution recommandée** :

```typescript
// .env.example
VITE_APP_NAME=Nye Cyclea
VITE_ANALYTICS_TOKEN=your_token_here

// vite.config.ts
export default defineConfig({
  envPrefix: 'VITE_',
});
```

#### 9.3 Pas de Versioning

**Problème** : Version manuelle dans package.json

**Solution recommandée** :

- Semantic versioning automatique
- Changelog automatique
- Tags Git automatiques

---

## 🎯 FONCTIONNALITÉS MANQUANTES

### Fonctionnalités Promises mais Non Implémentées

#### 10.1 Notifications

**Problème** : Option dans Settings mais non fonctionnelle

```typescript
// Settings.tsx ligne 119
<input
  type="checkbox"
  checked={settings.notificationsOn}
  // Mais pas d'implémentation
/>
```

**Solution recommandée** :

- Service Worker pour notifications push
- Notifications locales
- Rappels pour cycles à venir

#### 10.2 Export Multi-format

**Problème** : Seulement PDF

- Pas d'export CSV
- Pas d'export Excel
- Pas d'export JSON structuré

#### 10.3 Recherche et Filtres

**Problème** : Pas de recherche dans l'historique

- Impossible de filtrer par date
- Pas de recherche par symptômes
- Pas de tri avancé

#### 10.4 Graphiques Avancés

**Problème** : Recharts installé mais peu utilisé

- Pas de graphiques de tendances
- Pas de comparaisons de cycles
- Pas de visualisations de symptômes

#### 10.5 Synchronisation Cloud

**Problème** : Données uniquement locales

- Pas de backup automatique
- Pas de sync multi-appareils
- Risque de perte de données

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### 🔴 PRIORITÉ CRITIQUE (À faire immédiatement)

1. **Tests unitaires** (2-3 jours)
   - Tests des services (prediction, storage)
   - Tests des utilitaires
   - Couverture minimale 60%

2. **Error Boundary** (1 jour)
   - Composant ErrorBoundary
   - Gestion centralisée des erreurs
   - Remplacement des alert() par toasts

3. **Suppression window.location.reload()** (1 jour)
   - State management ou Context API
   - Événements personnalisés
   - Invalidation de cache

4. **Accessibilité de base** (2 jours)
   - Attributs ARIA
   - Navigation clavier
   - Correction langue HTML

5. **ESLint + Prettier** (0.5 jour)
   - Configuration
   - Correction des erreurs
   - Pre-commit hooks

### 🟡 PRIORITÉ HAUTE (À planifier cette semaine)

6. **Lazy Loading** (1 jour)
   - React.lazy pour routes
   - Code splitting
   - Suspense boundaries

7. **Memoization** (1 jour)
   - useMemo pour calculs
   - useCallback pour fonctions
   - React.memo pour composants

8. **Hooks personnalisés** (2 jours)
   - useCycles
   - usePredictions
   - useCycleData

9. **Validation Zod** (1 jour)
   - Schémas de validation
   - Validation runtime
   - Messages d'erreur

10. **Documentation** (2 jours)
    - README complet
    - JSDoc sur fonctions
    - Guide de contribution

### 🟢 PRIORITÉ MOYENNE (À planifier ce mois)

11. **State Management** (3 jours)
    - Context API ou Zustand
    - Centralisation de l'état
    - Synchronisation composants

12. **Notifications** (3 jours)
    - Service Worker
    - Notifications push
    - Rappels cycles

13. **Internationalisation** (5 jours)
    - i18next ou react-intl
    - Traductions
    - Format dates localisé

14. **Performance avancée** (3 jours)
    - Virtualisation listes
    - Optimisation images
    - Cache intelligent

15. **CI/CD** (2 jours)
    - GitHub Actions
    - Tests automatisés
    - Déploiement automatique

---

## 📈 MÉTRIQUES DE QUALITÉ

| Catégorie          | Score Actuel | Score Cible | Écart     |
| ------------------ | ------------ | ----------- | --------- |
| **Tests**          | 0/10         | 7/10        | -7        |
| **Documentation**  | 2/10         | 8/10        | -6        |
| **Accessibilité**  | 2/10         | 8/10        | -6        |
| **Performance**    | 5/10         | 8/10        | -3        |
| **Sécurité**       | 4/10         | 7/10        | -3        |
| **Maintenabilité** | 5/10         | 8/10        | -3        |
| **UX**             | 6/10         | 9/10        | -3        |
| **Architecture**   | 6/10         | 8/10        | -2        |
| **MOYENNE**        | **3.75/10**  | **7.9/10**  | **-4.15** |

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Semaine 1 : Fondations

- [ ] ESLint + Prettier
- [ ] Error Boundary
- [ ] Suppression reload()
- [ ] Tests unitaires services

### Semaine 2 : Qualité

- [ ] Accessibilité de base
- [ ] Hooks personnalisés
- [ ] Validation Zod
- [ ] Documentation README

### Semaine 3 : Performance

- [ ] Lazy loading
- [ ] Memoization
- [ ] Optimisations

### Semaine 4 : Fonctionnalités

- [ ] Notifications
- [ ] State management
- [ ] Améliorations UX

**Estimation totale** : 4 semaines pour atteindre un niveau production-ready

---

## 📝 NOTES FINALES

Le projet **Nye Cyclea** est une application **fonctionnelle** avec une **base solide**, mais nécessite des **améliorations significatives** pour être **production-ready**.

**Forces principales** :

- ✅ Architecture moderne et propre
- ✅ TypeScript bien utilisé
- ✅ UI soignée et responsive
- ✅ PWA configurée

**Faiblesses principales** :

- ❌ Aucun test
- ❌ Accessibilité non conforme
- ❌ Performance non optimisée
- ❌ Documentation minimale

**Recommandation** : Prioriser les corrections critiques (tests, accessibilité, gestion d'erreurs) avant d'ajouter de nouvelles fonctionnalités.

---

_Document généré le [Date] - Analyse complète du projet Nye Cyclea v0.1.0_
