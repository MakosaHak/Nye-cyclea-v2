# Edge Function `chat-ai` — NyeAI Pro

Appelle OpenAI pour répondre aux questions des utilisatrices **Pro** (vérification table `profiles`).

## Secrets Supabase (Dashboard → Project Settings → Edge Functions)

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | Clé API OpenAI |
| `OPENAI_MODEL` | Optionnel — défaut `gpt-4o-mini` |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement par Supabase.

## Déploiement

```bash
npm install -g supabase
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy chat-ai
```

## Test manuel

```bash
curl -i --location --request POST 'https://VOTRE_PROJECT.supabase.co/functions/v1/chat-ai' \
  --header 'Authorization: Bearer VOTRE_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Qu est-ce que l ovulation ?","context":"Cycles enregistrés: 3."}'
```

Réponse attendue : `{ "response": "...", "model": "gpt-4o-mini" }`
