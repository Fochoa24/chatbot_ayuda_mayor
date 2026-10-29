// Voz del navegador: dictar (reconocimiento) y escuchar (lectura en voz alta).
// No todos los navegadores lo tienen; la UI esconde los botones si falta.

const Recognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : undefined;

export const canDictate = Boolean(Recognition);
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Empieza a escuchar. Devuelve una función para detener. */
export function dictate({ onResult, onEnd }) {
  const rec = new Recognition();
  rec.lang = 'es-CL';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => onResult(e.results[0][0].transcript);
  rec.onend = onEnd;
  rec.onerror = onEnd;
  rec.start();
  return () => rec.stop();
}

export function speak(text, { onEnd } = {}) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, 'el enlace'));
  utterance.lang = 'es-CL';
  utterance.rate = 0.9;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel();
}
