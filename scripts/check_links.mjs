#!/usr/bin/env node
/**
 * Link health checker for DOI Link Hub
 * - Reads assets/statePortals.json
 * - HEAD/GET each link and writes assets/health.json
 * - Intended to run in CI (GitHub Actions) on a schedule
 */
import fs from 'fs/promises';

const STATE_FILE = new URL('../assets/statePortals.json', import.meta.url);
const HEALTH_FILE = new URL('../assets/health.json', import.meta.url);

const concurrency = 8;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2; // total attempts = 1 + retries
const DEFAULT_BACKOFF_MS = 750;

async function loadStates() {
  const raw = await fs.readFile(STATE_FILE, 'utf8');
  return JSON.parse(raw).states;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOnce(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      'user-agent': 'doi-link-hub-link-checker/1.0 (+https://github.com/knlmagic/doi-link-hub)',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9'
    };
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function attemptCheck(url) {
  let res;
  // Try HEAD first (many servers support it)
  try {
    res = await fetchOnce(url, { method: 'HEAD' });
  } catch (e) {
    // Timeout or network error on HEAD; fall through to GET
  }
  if (!res || !res.ok || res.status >= 400 || res.status === 405) {
    try {
      res = await fetchOnce(url, { method: 'GET' });
    } catch (e) {
      return { ok: false, status: 0, err: e.message };
    }
  }
  return { ok: res.ok, status: res.status, err: '' };
}

async function checkUrl(url, retries = DEFAULT_RETRIES) {
  let last = { ok: false, status: 0, err: '' };
  for (let attempt = 0; attempt <= retries; attempt++) {
    last = await attemptCheck(url);
    if (last.ok) return last;
    const backoff = DEFAULT_BACKOFF_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
    await delay(backoff);
  }
  return last;
}

async function pool(items, worker, size) {
  const results = [];
  let i = 0;
  async function next() {
    if (i >= items.length) return;
    const idx = i++;
    results[idx] = await worker(items[idx], idx);
    await next();
  }
  const starters = Array.from({ length: Math.min(size, items.length) }, next);
  await Promise.all(starters);
  return results;
}

const states = await loadStates();
const links = states.flatMap(s => s.links.map(l => l.url));

const out = { updatedAt: new Date().toISOString(), results: {} };

await pool(links, async (url) => {
  const r = await checkUrl(url);
  out.results[url] = r;
}, concurrency);

await fs.writeFile(HEALTH_FILE, JSON.stringify(out, null, 2));
console.log('Wrote health:', HEALTH_FILE.pathname);
