# TheTruthGhost-App

Frage/Antwort – TheTruthGhost mit OpenAI

Dieses Branch enthält eine private, lokal testbare Integration mit OpenAI (gpt-3.5-turbo). Features:
- Chat UI mit Personas (freundlich, weise, sarkastisch, ausführlich)
- RAG‑Toggle: lade .txt/.md Dokumente hoch und nutze sie als Kontext
- Moderation‑Check vor Anfrage
- Session‑History im Browser (localStorage)


## Setup (lokal)
1. Repository klonen und zum neuen Branch wechseln:
   git checkout -b feature/thetruthghost-by-chritical1588
2. Server installieren:
   cd server
   npm install
3. Kopiere `.env.example` nach `.env` in `server/` und setze deinen OPENAI_API_KEY.
4. Server starten:
   npm run dev
5. Öffne die Frontendseite:
   - Entweder: öffne `frontend/index.html` in deinem Browser (Backend CORS erforderlich),
   - Oder: starte einen kleinen static file server (z.B. `npx serve frontend`) und wähle den Server‑Port so, dass `/api/ask` an `http://localhost:3000/api/ask` geroutet wird.


## Sicherheit & Hinweise
- Niemals den API‑Key ins Frontend oder in Commits pushen.
- Dieser Branch ist für private Tests gedacht. Vor öffentlicher Veröffentlichung:
  - Auth einbauen (z. B. Auth0, GitHub OAuth)
  - Rate‑Limiting & Abuse Protection erweitern
  - Optional: Streamen von Antworten, Vector DB für RAG (Pinecone/pgvector)
