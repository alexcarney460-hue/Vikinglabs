const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
require('dotenv').config({ path: './.env' });
const { formatISO } = require('date-fns');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:3b';
const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL || 300) * 1000; // seconds -> ms
const SITE_URL = process.env.SITE_URL || 'https://vikinglabs.co';
const LOG_PATH = process.env.LOG_PATH || './logs/agent.log';

if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

function log(...args) {
  const line = new Date().toISOString() + ' ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n';
  fs.appendFileSync(LOG_PATH, line);
  console.log(line.trim());
}

async function askOllama(prompt) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, max_tokens: 256 })
    });
    const data = await res.json();
    if (data?.results && Array.isArray(data.results) && data.results[0]?.content) {
      return data.results.map(r=>r.content).join('\n').slice(0,2000);
    }
    if (data?.text) return data.text.slice(0,2000);
    return JSON.stringify(data).slice(0,2000);
  } catch (e) {
    return `Ollama error: ${e.message}`;
  }
}

async function httpCheck() {
  try {
    const r = await fetch(SITE_URL, { method: 'GET' });
    return { ok: r.ok, status: r.status, date: formatISO(new Date()) };
  } catch (e) {
    return { ok: false, error: e.message, date: formatISO(new Date()) };
  }
}

async function mainLoop() {
  log('Agent starting. Model:', OLLAMA_MODEL, 'OLLAMA_URL:', OLLAMA_URL);
  while (true) {
    try {
      const http = await httpCheck();
      log('HTTP check:', http.status ?? 'ERR', http.ok ? 'OK' : http.error || 'NOT_OK');
      if (!http.ok) {
        log('Site down. Asking Ollama for advice...');
        const advice = await askOllama(`Site ${SITE_URL} returned bad status: ${JSON.stringify(http)}. Suggest remedial actions.`);
        log('Ollama advice:', advice);
      }
    } catch (e) {
      log('Main loop error:', e.message);
    }
    await new Promise(r => setTimeout(r, CHECK_INTERVAL));
  }
}

mainLoop().catch(e => { console.error('Agent crashed', e); process.exit(1); });
