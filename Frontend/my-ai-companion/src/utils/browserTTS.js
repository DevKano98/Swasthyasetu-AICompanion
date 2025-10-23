// Web Speech API helper to pick a warm female en-US voice and speak text empathetically

function loadVoicesOnce() {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing && existing.length) return resolve(existing);
    const onChange = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) {
        window.speechSynthesis.removeEventListener('voiceschanged', onChange);
        resolve(v);
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChange);
    window.speechSynthesis.getVoices();
  });
}

function pickFemaleEnUSVoice(voices) {
  const femaleNameHints = [
    'Samantha',
    'Google US English',
    'Zira',
    'Jenny',
    'Aria',
    'Female',
    'FEMALE',
  ];
  const enUS = voices.filter(v => (v.lang || '').toLowerCase().startsWith('en-us'));
  for (const hint of femaleNameHints) {
    const found = enUS.find(v => (v.name || '').toLowerCase().includes(hint.toLowerCase()));
    if (found) return found;
  }
  if (enUS.length) return enUS[0];
  return voices[0] || null;
}

export async function browserTTS(text, { rate = 0.95, pitch = 0.1 } = {}) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  const voices = await loadVoicesOnce();
  const voice = pickFemaleEnUSVoice(voices);
  // Stop any ongoing speech to avoid overlap/echo
  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = pitch;
    if (voice) utter.voice = voice;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}


