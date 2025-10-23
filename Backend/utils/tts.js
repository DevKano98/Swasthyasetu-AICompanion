require('dotenv').config();
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');

function createClient() {
  // Prefer ADC via GOOGLE_APPLICATION_CREDENTIALS. Fallback to keyFilename if TTS_KEY_FILE is set.
  const keyFile = process.env.TTS_KEY_FILE;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || !keyFile) {
    return new textToSpeech.TextToSpeechClient();
  }
  return new textToSpeech.TextToSpeechClient({ keyFilename: path.resolve(keyFile) });
}

function detectLanguage(text) {
  // Naive check – if text has Hindi Unicode range, assume Hindi
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text) ? 'hi-IN' : 'en-US';
}

async function synthesizeSpeech({
  text,
  language,
  speakingRate = 0.95,
  pitch = 0.0,
  audioEncoding = 'MP3',
}) {
  // Determine language code: explicit override wins, then auto-detect
  let languageCode;
  if (language) {
    const norm = String(language).toLowerCase();
    if (norm.startsWith('hi')) languageCode = 'hi-IN';
    else if (norm.startsWith('en')) languageCode = 'en-US';
    else languageCode = detectLanguage(text);
  } else {
    languageCode = detectLanguage(text);
  }

  // Pick female voices explicitly
  let voiceName;
  if (languageCode === 'hi-IN') {
    voiceName = 'hi-IN-Standard-A'; // Stable female Hindi voice
  } else {
    voiceName = 'en-US-Neural2-F'; // Stable female English voice
  }

  const request = {
    input: { text },
    voice: { languageCode, name: voiceName, ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding, speakingRate, pitch },
  };

  const client = createClient();
  const [response] = await client.synthesizeSpeech(request);
  return response.audioContent.toString('base64');
}

module.exports = { synthesizeSpeech };
