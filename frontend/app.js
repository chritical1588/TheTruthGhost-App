const personaPrompts = {
  default: 'Du bist TheTruthGhost, antworte freundlich, knapp und auf Deutsch. Wenn du unsicher bist, sage das offen.',
  wise: 'Du bist ein weiser Mentor, hilf Schritt für Schritt und gib Beispiele.',
  sarcastic: 'Du bist leicht sarkastisch und humorvoll, aber nie beleidigend.',
  detailed: 'Du antwortest ausführlich, lieferst Quellen wenn möglich und markiere Unsicherheit. Verwende klare Abschnitte.'
};

const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const form = document.getElementById('composer');
const personaEl = document.getElementById('persona');
const statusEl = document.getElementById('status');
const useRagEl = document.getElementById('useRag');
const uploadEl = document.getElementById('docUpload');

let sessionId = localStorage.getItem('ttg_session') || Math.random().toString(36).slice(2);
localStorage.setItem('ttg_session', sessionId);
let history = JSON.parse(localStorage.getItem('ttg_history_'+sessionId) || '[]');
let ragText = localStorage.getItem('ttg_rag_'+sessionId) || '';

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMessages(){
  messagesEl.innerHTML = '';
  history.forEach(m => {
    const li = document.createElement('li');
    li.className = 'message ' + (m.role==='user'?'user':'assistant');
    const content = escapeHtml(m.content).replace(/\n/g,'<br>');
    li.innerHTML = '<div>'+content+'</div>';
    messagesEl.appendChild(li);
  });
  window.scrollTo(0,document.body.scrollHeight);
}

// load initial
renderMessages();
if (ragText) statusEl.textContent = 'RAG-Dokument geladen (wird als Kontext genutzt).';

uploadEl.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    ragText = reader.result;
    localStorage.setItem('ttg_rag_'+sessionId, ragText);
    statusEl.textContent = 'RAG-Dokument geladen ('+f.name+').';
  };
  reader.readAsText(f);
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  // append user message
  const userMsg = {role:'user', content: text};
  history.push(userMsg);
  localStorage.setItem('ttg_history_'+sessionId, JSON.stringify(history));
  renderMessages();
  inputEl.value = '';

  statusEl.textContent = 'Den Geist befragen...';
  try {
    const payload = {
      sessionId,
      persona: personaEl.value,
      rag: useRagEl.checked,
      ragDocs: useRagEl.checked && ragText ? [ragText] : [],
      messages: history
    };
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    const assistantMsg = {role:'assistant', content: data.assistant || data.content || JSON.stringify(data)};
    history.push(assistantMsg);
    localStorage.setItem('ttg_history_'+sessionId, JSON.stringify(history));
    renderMessages();
    statusEl.textContent = 'Antwort erhalten.';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Fehler: '+err.message;
  }
});

document.getElementById('clear').addEventListener('click', () => {
  history = [];
  localStorage.removeItem('ttg_history_'+sessionId);
  localStorage.removeItem('ttg_rag_'+sessionId);
  ragText = '';
  renderMessages();
  statusEl.textContent = 'Konversation neu gestartet.';
});

// simple welcome
if (!history.length) {
  history.push({role:'assistant', content:'Willkommen bei TheTruthGhost — stell mir eine Frage!'});
  localStorage.setItem('ttg_history_'+sessionId, JSON.stringify(history));
  renderMessages();
}