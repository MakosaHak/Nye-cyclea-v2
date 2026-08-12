# Edge Function `chat-ai` — NyeAI Pro

Répond aux questions des utilisatrices **Pro** via **Google Gemini** (gratuit).

> **Gemini seul suffit.** Groq est un secours optionnel côté serveur — tu n’es pas obligée de le configurer.

## Fournisseur principal (recommandé)

| Clé Supabase | Modèle par défaut | Où obtenir la clé |
|--------------|-------------------|-------------------|
| `GEMINI_API_KEY` | `gemini-2.0-flash` | [Google AI Studio](https://aistudio.google.com/apikey) — **gratuit** |

Secours optionnel (si Gemini est indisponible) :
| `GROQ_API_KEY` | `llama-3.3-70b-versatile` | [Groq Console](https://console.groq.com/keys) |

## Limites Gemini (free tier)

Les quotas évoluent — vérifier [ai.google.dev/pricing](https://ai.google.dev/pricing). En pratique pour Nye Cyclea :

- **Gratuit** avec Google AI Studio (pas de carte bancaire)
- Limites **quotidiennes** de requêtes / tokens (largement suffisant pour démarrer et tester)
- Modèle `gemini-2.0-flash` : rapide et économique en quota
- Si quota dépassé un jour → l’app bascule automatiquement en **mode hors ligne** (FAQ intégrée)

Pour une app avec peu d’utilisatrices Pro au début, **Gemini seul est largement suffisant**.

## Étapes de branchement (à faire une fois)

### Étape 1 — Clé Gemini (recommandé, principal)

1. Va sur https://aistudio.google.com/apikey
2. Connecte-toi avec un compte Google
3. Clique **Create API key**
4. Copie la clé (commence souvent par `AIza...`)

### Étape 2 — Clé Groq (secours, optionnel mais conseillé)

1. Va sur https://console.groq.com
2. Crée un compte gratuit
3. **API Keys** → **Create API Key**
4. Copie la clé (commence par `gsk_...`)

### Étape 3 — Installer Supabase CLI

```bash
npm install -g supabase
supabase login
```

### Étape 4 — Lier ton projet Supabase

Le **Project ref** est dans l’URL du dashboard :  
`https://supabase.com/dashboard/project/XXXXXXXX` → ref = `XXXXXXXX`

```bash
cd C:\Users\User\Desktop\Docs\Nye_Cyclea
supabase link --project-ref TON_PROJECT_REF
```

### Étape 5 — Configurer le secret Gemini (minimum)

```bash
supabase secrets set GEMINI_API_KEY=AIza...
```

(Groq est **optionnel** — uniquement si tu veux un secours serveur.)

### Étape 6 — Déployer la function

```bash
supabase functions deploy chat-ai
```

### Étape 7 — Tester dans l’app

1. `npm run build` puis redéploie sur Netlify (drag-drop `build/`)
2. Connecte-toi avec un compte **Pro**
3. Ouvre **NyeAI**, pose une question
4. Sous la réponse : **« IA en ligne »** = ça marche

## Test manuel (curl)

Récupère un access token : Supabase Dashboard → Authentication → Users → ou depuis l’app (session).

```bash
curl -i --request POST "https://TON_PROJECT.supabase.co/functions/v1/chat-ai" \
  --header "Authorization: Bearer TON_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"prompt\":\"Qu est-ce que l ovulation ?\",\"context\":\"Cycles enregistrés: 3.\"}"
```

Réponse attendue :

```json
{
  "response": "...",
  "provider": "gemini",
  "model": "gemini-2.0-flash"
}
```

## Coûts

- **Gemini** : free tier Google AI Studio (limites quotidiennes, suffisant pour démarrer)
- **Groq** : free tier avec rate limits
- **Aucune carte bancaire** requise pour commencer avec ces deux services
