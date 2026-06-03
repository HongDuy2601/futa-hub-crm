// ============================================================
// FUTA Live Translator — POC
// Pipeline: STT (Web Speech) → Translate (MyMemory) → TTS (Web Speech)
// Mô phỏng cuộc gọi 2 chiều giữa Sale FUTA và Khách hàng nước ngoài.
// ============================================================

const $ = (id) => document.getElementById(id);

const state = {
  inCall: false,
  callStart: null,
  timerInterval: null,
  activeRecognizer: null,
  busy: false,
};

const PARTY_A = {
  id: 'A',
  lang: 'vi-VN',
  langName: 'Tiếng Việt',
  micBtn: $('micA'),
  ring: $('ringA'),
  origEl: $('origA'),
  transEl: $('transA'),
  partyEl: $('partyA'),
};

const PARTY_B = {
  id: 'B',
  lang: $('langB').value,
  langName: $('langB').selectedOptions[0].text,
  micBtn: $('micB'),
  ring: $('ringB'),
  origEl: $('origB'),
  transEl: $('transB'),
  partyEl: $('partyB'),
};

// ============================================================
// Logging
// ============================================================
function log(msg, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `entry ${type}`;
  const ts = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  entry.innerHTML = `<span class="ts">${ts}</span>${msg}`;
  $('log').appendChild(entry);
  $('log').scrollTop = $('log').scrollHeight;
}

$('clearLog').onclick = () => { $('log').innerHTML = ''; };

// ============================================================
// Call lifecycle
// ============================================================
function startCall() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Trình duyệt không hỗ trợ Web Speech API. Vui lòng dùng Google Chrome hoặc Edge.');
    return;
  }

  state.inCall = true;
  state.callStart = Date.now();
  state.timerInterval = setInterval(updateTimer, 1000);

  $('startCall').disabled = true;
  $('endCall').disabled = false;
  PARTY_A.micBtn.disabled = false;
  PARTY_B.micBtn.disabled = false;
  $('langB').disabled = true;

  $('statusDot').classList.add('active');
  $('statusText').textContent = 'Đang trong cuộc gọi';
  document.querySelector('.bridge-anim').classList.add('active');

  log(`📞 Cuộc gọi bắt đầu — Sale (VN) ↔ Khách (${PARTY_B.langName})`, 'ok');
}

function endCall() {
  state.inCall = false;
  clearInterval(state.timerInterval);
  stopRecognition();

  $('startCall').disabled = false;
  $('endCall').disabled = true;
  PARTY_A.micBtn.disabled = true;
  PARTY_B.micBtn.disabled = true;
  $('langB').disabled = false;

  $('statusDot').classList.remove('active');
  $('statusText').textContent = 'Đã kết thúc cuộc gọi';
  document.querySelector('.bridge-anim').classList.remove('active');

  log(`📵 Cuộc gọi kết thúc. Thời lượng: ${$('callTimer').textContent}`, 'warn');
}

function updateTimer() {
  const sec = Math.floor((Date.now() - state.callStart) / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  $('callTimer').textContent = `${mm}:${ss}`;
}

$('startCall').onclick = startCall;
$('endCall').onclick = endCall;

// ============================================================
// Language change
// ============================================================
$('langB').onchange = (e) => {
  PARTY_B.lang = e.target.value;
  PARTY_B.langName = e.target.selectedOptions[0].text;
  log(`🌐 Đổi ngôn ngữ khách: ${PARTY_B.langName}`, 'info');
};

// ============================================================
// Push-to-talk
// ============================================================
function attachMic(party, otherParty) {
  const start = (e) => {
    e.preventDefault();
    if (!state.inCall || state.busy) return;
    startRecognition(party, otherParty);
  };
  const stop = (e) => {
    e.preventDefault();
    stopRecognition();
  };
  party.micBtn.addEventListener('mousedown', start);
  party.micBtn.addEventListener('touchstart', start);
  party.micBtn.addEventListener('mouseup', stop);
  party.micBtn.addEventListener('mouseleave', stop);
  party.micBtn.addEventListener('touchend', stop);
}
attachMic(PARTY_A, PARTY_B);
attachMic(PARTY_B, PARTY_A);

// ============================================================
// STT — Web Speech Recognition
// ============================================================
function startRecognition(speaker, listener) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = speaker.lang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  const t0 = performance.now();
  speaker.partyEl.classList.add('speaking');
  speaker.ring.classList.add('active');
  speaker.micBtn.classList.add('active');
  speaker.origEl.textContent = '… đang nghe …';
  log(`🎤 [${speaker.id}] STT bắt đầu (${speaker.lang})`, 'info');

  let finalText = '';

  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    speaker.origEl.textContent = finalText + interim;
  };

  rec.onerror = (e) => {
    log(`❌ STT error: ${e.error}`, 'err');
    cleanup();
  };

  rec.onend = async () => {
    const sttMs = Math.round(performance.now() - t0);
    $('lat-stt').textContent = sttMs + ' ms';
    cleanup();

    const text = finalText.trim();
    if (!text) {
      log(`⚠️ Không bắt được audio`, 'warn');
      return;
    }
    log(`✅ [${speaker.id}] STT: "${text}" (${sttMs}ms)`, 'ok');
    await translateAndSpeak(text, speaker, listener, sttMs);
  };

  function cleanup() {
    speaker.partyEl.classList.remove('speaking');
    speaker.ring.classList.remove('active');
    speaker.micBtn.classList.remove('active');
    state.activeRecognizer = null;
  }

  state.activeRecognizer = rec;
  try { rec.start(); } catch (e) { log(`❌ STT start failed: ${e.message}`, 'err'); }
}

function stopRecognition() {
  if (state.activeRecognizer) {
    try { state.activeRecognizer.stop(); } catch (e) {}
  }
}

// ============================================================
// Translation — MyMemory free API (no key required)
// ============================================================
async function translateText(text, fromLang, toLang) {
  // MyMemory expects "en|vi" format using base language code
  const src = fromLang.split('-')[0];
  const tgt = toLang.split('-')[0];
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.responseStatus !== 200 && data.responseStatus !== '200') {
    throw new Error(data.responseDetails || 'Translation failed');
  }
  return data.responseData.translatedText;
}

async function translateAndSpeak(text, speaker, listener, sttMs) {
  state.busy = true;

  // ---- Translate ----
  const t1 = performance.now();
  let translated;
  try {
    translated = await translateText(text, speaker.lang, listener.lang);
  } catch (e) {
    log(`❌ Translate error: ${e.message}`, 'err');
    state.busy = false;
    return;
  }
  const trMs = Math.round(performance.now() - t1);
  $('lat-tr').textContent = trMs + ' ms';
  speaker.transEl.textContent = translated;
  listener.origEl.textContent = translated; // hiển thị bên người nghe
  log(`🌐 Translate: "${translated}" (${trMs}ms)`, 'ok');

  // ---- TTS ----
  const t2 = performance.now();
  await speak(translated, listener.lang, listener);
  const ttsMs = Math.round(performance.now() - t2);
  $('lat-tts').textContent = ttsMs + ' ms';

  // ---- Total ----
  const total = sttMs + trMs + ttsMs;
  $('lat-total').textContent = total + ' ms';
  log(`🔊 TTS done (${ttsMs}ms) — Tổng pipeline: ${total}ms`, 'ok');

  state.busy = false;
}

// ============================================================
// TTS — Web Speech Synthesis
// ============================================================
function speak(text, lang, listener) {
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 1.0;
    utter.pitch = 1.0;

    // Cố gắng chọn voice phù hợp
    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utter.voice = match;

    utter.onstart = () => {
      listener.partyEl.classList.add('speaking');
      listener.ring.classList.add('active');
    };
    utter.onend = () => {
      listener.partyEl.classList.remove('speaking');
      listener.ring.classList.remove('active');
      resolve();
    };
    utter.onerror = (e) => {
      log(`❌ TTS error: ${e.error}`, 'err');
      listener.partyEl.classList.remove('speaking');
      listener.ring.classList.remove('active');
      resolve();
    };

    speechSynthesis.speak(utter);
  });
}

// Preload voices
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    const count = speechSynthesis.getVoices().length;
    if (count > 0) log(`🔈 ${count} giọng đọc khả dụng`, 'info');
  };
}

// ============================================================
// Init
// ============================================================
log('💡 POC sẵn sàng. Nhấn "Bắt đầu cuộc gọi" để thử.', 'info');
log('💡 Pipeline: STT (browser) → Translate (MyMemory free) → TTS (browser). Latency thực tế hiển thị bên phải.', 'info');
