// script.js

// Elements
const vcfInput = document.getElementById('vcfInput');
const uploadBtn = document.getElementById('uploadBtn');
const contactsBox = document.getElementById('contacts-box');
const contactsCount = document.getElementById('contactsCount');
const messageEl = document.getElementById('message');
const delayInput = document.getElementById('delayInput');
const antibanToggle = document.getElementById('antibanToggle');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');
const progressFill = document.getElementById('progressFill');
const progressPct = document.getElementById('progressPct');
const timerLabel = document.getElementById('timerLabel');
const successfulCountEl = document.getElementById('successfulCount');
const delayedCountEl = document.getElementById('delayedCount');

let contacts = [];
let sending = false;
let sendInterval = null;
let progressInterval = null;
let startTime = null;
const PROGRESS_DURATION_MS = 60 * 1000; // progress animates over 60s
const SUCCESS_INCREMENT = 100;
const MAX_SUCCESS = 14000;

// File upload logic
uploadBtn.addEventListener('click', () => vcfInput.click());

vcfInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.vcf')) {
    alert('Please upload a .vcf file');
    return;
  }
  const text = await file.text();
  contacts = parseVCard(text);
  contactsBox.textContent = contacts.length ? `Loaded ${contacts.length} contacts` : 'No contacts found';
  contactsCount.textContent = `Contacts: ${contacts.length}`;
});

// A simple .vcf parser: looks for TEL: lines and FN names
function parseVCard(vcfText){
  const entries = vcfText.split(/END:VCARD/ig);
  const out = [];
  for (let e of entries){
    if(!e.trim()) continue;
    // find TEL
    const telMatch = e.match(/TEL[^:]*:(.+)/i);
    const nameMatch = e.match(/FN[^:]*:(.+)/i) || e.match(/N[^:]*:(.+)/i);
    let tel = telMatch ? telMatch[1].trim() : null;
    let name = nameMatch ? nameMatch[1].trim() : tel || 'Unknown';
    if(tel){
      // basic cleanup
      tel = tel.replace(/\s+/g,'').replace(/[^+\d]/g,'');
      out.push({name, tel});
    }
  }
  // unique by tel
  const uniq = [];
  const seen = new Set();
  out.forEach(it => {
    if(!seen.has(it.tel)){
      seen.add(it.tel);
      uniq.push(it);
    }
  });
  return uniq;
}

// Send simulation logic
sendBtn.addEventListener('click', startSending);
stopBtn.addEventListener('click', stopSending);

function startSending(){
  if (sending) return;
  sending = true;
  disableControls(true);
  successfulCountEl.textContent = '0';
  delayedCountEl.textContent = '0';
  progressFill.style.width = '0%';
  progressPct.textContent = '0%';
  timerLabel.textContent = '00:00';

  const delayMs = Math.max(0, Number(delayInput.value) || 500); // user chosen delay
  const antiban = antibanToggle.checked;
  const messageText = (messageEl.value || '').trim();
  const sendBy = document.querySelector('input[name="sendBy"]:checked')?.value || 'normal';

  // Note: This is a front-end simulation only.
  startTime = Date.now();

  // Progress animator (0 -> 100% in PROGRESS_DURATION_MS)
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const pct = Math.min(100, Math.round((elapsed / PROGRESS_DURATION_MS) * 100));
    progressFill.style.width = `${pct}%`;
    progressPct.textContent = `${pct}%`;
    timerLabel.textContent = formatMs(elapsed);
    if (pct >= 100) {
      clearInterval(progressInterval);
      progressInterval = null;
      // keep running send simulation until cap or manual stop
    }
  }, 200);

  // Simulated sending increments.
  sendInterval = setInterval(() => {
    // increase successful by chunks of SUCCESS_INCREMENT
    const cur = Number(successfulCountEl.textContent.replace(/,/g,'')) || 0;
    if (cur >= MAX_SUCCESS) {
      // reached cap
      successfulCountEl.textContent = numberWithCommas(MAX_SUCCESS);
      stopSending();
      return;
    }
    const next = Math.min(MAX_SUCCESS, cur + SUCCESS_INCREMENT);
    successfulCountEl.textContent = numberWithCommas(next);
    // delayed stays zero as requested
    delayedCountEl.textContent = '0';
    // If antiban is on we can simulate a small random pause occasionally (very light)
    if (antiban && (Math.random() < 0.04)) {
      // a short random pause (100ms-700ms)
      const pause = 100 + Math.floor(Math.random()*600);
      // temporarily pause the interval
      clearInterval(sendInterval);
      setTimeout(() => {
        if (sending) {
          sendInterval = setInterval(arguments.callee, delayMs || 500);
        }
      }, pause);
    }
  }, Math.max(10, delayMs));

  // enable stop
  stopBtn.disabled = false;
  sendBtn.disabled = true;
}

// Stop sending animation (manual or auto)
function stopSending(){
  if (!sending) return;
  sending = false;
  if (sendInterval) { clearInterval(sendInterval); sendInterval = null; }
  if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
  disableControls(false);
  stopBtn.disabled = true;
  sendBtn.disabled = false;
}

// Utility helpers
function disableControls(disable){
  uploadBtn.disabled = disable;
  vcfInput.disabled = disable;
  messageEl.disabled = disable;
  delayInput.disabled = disable;
  antibanToggle.disabled = disable;
  document.querySelectorAll('input[name="sendBy"]').forEach(i => i.disabled = disable);
}
function formatMs(ms){
  const s = Math.floor(ms/1000);
  const mm = Math.floor(s/60).toString().padStart(2,'0');
  const ss = (s%60).toString().padStart(2,'0');
  return `${mm}:${ss}`;
}
function numberWithCommas(x){ return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

// make script robust to repeated starts/stops if user reloads UI
window.addEventListener('beforeunload', ()=> {
  if (sendInterval) clearInterval(sendInterval);
  if (progressInterval) clearInterval(progressInterval);
});
