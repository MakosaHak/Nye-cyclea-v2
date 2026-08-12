# Edge Function `chat-ai` — NyeAI Pro

Répond aux questions des utilisatrices **Pro** via des IA **gratuites** (quota free tier).

## Fournisseurs (gratuits)

| Priorité | Fournisseur | Clé Supabase | Modèle par défaut | Où obtenir la clé |
|----------|-------------|--------------|-------------------|-------------------|
| 1 | **Google Gemini** | `GEMINI_API_KEY` | `gemini-2.0-flash` | [Google AI Studio](https://aistudio.google.com/apikey) |
| 2 | **Groq** (secours) | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | [Groq Console](https://console.groq.com/keys) |

Si Gemini échoue (quota, panne), Groq prend le relais automatiquement.

Variables optionnelles :
- `GEMINI_MODEL` — ex. `gemini-2.0-flash`, `gemini-1.5-flash`
- `GROQ_MODEL` — ex. `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`
- `AI_PROVIDER_ORDER` — ex. `gemini,groq` (défaut)

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.

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

### Étape 5 — Configurer les secrets

```bash
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set GROQ_API_KEY=gsk_...
```

(Groq est optionnel ; au minimum configure **GEMINI_API_KEY**.)

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
