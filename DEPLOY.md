# Déploiement Nye Cyclea (Netlify + Supabase)

Guide pour un **nouveau site Netlify** (test) sans toucher à la prod existante.

## 1. Prérequis

- Compte [GitHub](https://github.com)
- Compte [Netlify](https://netlify.com)
- Projet [Supabase](https://supabase.com) (même projet que la prod, ou un projet séparé pour les tests)

## 2. Variables d'environnement Netlify

Dans **Site settings → Environment variables**, ajouter :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet (ex. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé anon / publishable du projet |

Copier depuis `.env.example` en local — **ne jamais committer** le fichier `.env`.

## 3. Build Netlify

Le fichier `netlify.toml` configure automatiquement :

- **Build command :** `npm ci && npm run build`
- **Publish directory :** `build`
- **Node :** 20 (voir `.nvmrc`)

## 4. Supabase — URLs autorisées

Dans **Supabase → Authentication → URL Configuration** :

1. **Site URL** : laisser le domaine de production principal
2. **Redirect URLs** : ajouter le site de test, par exemple :
   - `https://votre-site-test.netlify.app/**`
   - `http://localhost:3000/**`

## 5. Lier GitHub à Netlify

1. Netlify → **Add new site** → **Import an existing project**
2. Choisir GitHub → le **nouveau dépôt**
3. Vérifier build command / publish dir (déjà dans `netlify.toml`)
4. Ajouter les variables `VITE_*`
5. **Deploy site**

## 6. Commandes locales

```bash
npm ci
npm run build    # génère le dossier build/
npm run dev      # développement local
```

## 7. Deux sites en parallèle

| Site | Rôle |
|------|------|
| Domaine actuel | Production — utilisatrices existantes |
| `*.netlify.app` | Test / prévisualisation des nouveautés |

Avec les **mêmes** clés Supabase : les comptes vont dans la **même** base auth.  
Les **cycles** restent **locaux** sur chaque appareil (IndexedDB).

## 8. NyeAI — Edge Function (IA gratuite Pro)

NyeAI Pro utilise **Google Gemini** (gratuit).

### Option rapide — script PowerShell (recommandé)

```powershell
cd C:\Users\User\Desktop\Docs\Nye_Cyclea
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\deploy-chat-ai.ps1
```

Le script : login Supabase → link projet → secret `GEMINI_API_KEY` → deploy `chat-ai`.

### Option manuelle — CLI

```powershell
$env:NODE_OPTIONS="--use-system-ca"   # si erreur certificat npm
npm install -g supabase
supabase login
supabase link --project-ref TON_PROJECT_REF
supabase secrets set GEMINI_API_KEY=AIza...
supabase functions deploy chat-ai
```

| Fournisseur | Clé Supabase |
|-------------|--------------|
| **Google Gemini** | `GEMINI_API_KEY` |

Guide détaillé : `supabase/functions/chat-ai/README.md`

**Comportement :**
- **Gratuit** → FAQ hors ligne interactive
- **Pro** → Gemini silencieux ; mode hors ligne si indisponible

---

## 9. Mise en prod (quand le test est validé)

Mettre à jour le site Netlify lié au **domaine principal** (merge ou déploiement depuis la branche stable), sans supprimer le site de test.
