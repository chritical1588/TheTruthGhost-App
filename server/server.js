const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json({limit: '200kb'}));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('ERROR: OPENAI_API_KEY not set in env');
}

const limiter = rateLimit({ windowMs: 30*1000, max: 10 });
app.use(limiter);

const personaPrompts = {
  default: 'Du bist TheTruthGhost, antworte freundlich, knapp und auf Deutsch. Wenn du unsicher bist, sage das offen.',
  wise: 'Du bist ein weiser Mentor, hilf Schritt für Schritt und gib Beispiele.',
  sarcastic: 'Du bist leicht sarkastisch und humorvoll, aber nie beleidigend.',
  detailed: 'Du antwortest ausführlich, liefere Quellen wenn möglich und markiere Unsicherheit. Verwende klare Abschnitte.'
};

async function callModeration(text){
  try{
    const resp = await axios.post('https://api.openai.com/v1/moderations', {input: text}, {
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' }
    });
    return resp.data;
  } catch(e){
    console.error('moderation error', e?.response?.data || e.message);
    return null;
  }
}

app.post('/api/ask', async (req, res) => {
  try{
    const { sessionId, persona='default', messages, rag, ragDocs } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages required' });
    const lastUser = [...messages].reverse().find(m => m.role==='user');
    const userText = lastUser ? lastUser.content : '';
    if (userText.length > 2000) return res.status(400).json({ error: 'message too long' });

    // moderation
    const mod = await callModeration(userText);
    if (mod && mod.results && mod.results[0] && mod.results[0].flagged) {
      return res.status(403).json({ error: 'content flagged by moderation' });
    }

    // build final messages
    const systemPrompt = personaPrompts[persona] || personaPrompts.default;
    const finalMessages = [{ role: 'system', content: systemPrompt }];
    if (rag && Array.isArray(ragDocs) && ragDocs.length) {
      const combined = ragDocs.join('\n\n---\n\n');
      finalMessages.push({ role: 'system', content: 'Nimm die folgenden Dokumente als Kontext für die Antwort:\n\n' + combined });
    }
    // append conversation
    messages.forEach(m => finalMessages.push(m));

    // call OpenAI ChatCompletion
    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: finalMessages,
      temperature: 0.7,
      max_tokens: 800
    }, {
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' }
    });

    const assistant = resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message ? resp.data.choices[0].message.content : '';
    return res.json({ assistant });
  } catch (err) {
    console.error('ask error', err?.response?.data || err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server listening on', port));
