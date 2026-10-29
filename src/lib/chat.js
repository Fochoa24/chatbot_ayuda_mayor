// Lógica pura del chat. Sin React ni red: se usa en el navegador y en el servidor.

export const MAX_MESSAGE_CHARS = 1500;
export const MAX_HISTORY_MESSAGES = 40;

/**
 * Valida y recorta el historial que llega del navegador.
 * Devuelve { messages } o { error } con un texto para mostrar.
 */
export function sanitizeHistory(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return { error: 'No llegó ningún mensaje.' };

  const messages = [];
  for (const m of raw) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return { error: 'El mensaje no tiene el formato esperado.' };
    }
    const content = m.content.trim();
    if (!content) continue;
    if (content.length > MAX_MESSAGE_CHARS) {
      return { error: 'El mensaje es muy largo. Intente escribirlo más corto.' };
    }
    messages.push({ role: m.role, content });
  }

  // Solo los últimos mensajes; la conversación debe empezar y terminar con la persona.
  let recent = messages.slice(-MAX_HISTORY_MESSAGES);
  while (recent.length && recent[0].role !== 'user') recent = recent.slice(1);
  if (!recent.length || recent[recent.length - 1].role !== 'user') {
    return { error: 'Falta la pregunta.' };
  }
  return { messages: recent };
}

/** Suma de Luhn: distingue un número de tarjeta real de cualquier número largo. */
function passesLuhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Detecta datos que nunca deberían escribirse en el chat.
 * Devuelve 'card', 'password' o null.
 */
export function detectSensitive(text) {
  const value = String(text ?? '');

  for (const match of value.matchAll(/(?:\d[ -]?){13,19}/g)) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length >= 13 && passesLuhn(digits)) return 'card';
  }

  // "mi clave es 1234", "contraseña: ab12": la palabra, un conector y un valor con algún número.
  if (/(clave|contrase[ñn]a|password|pin)\s*(es|:|=)\s*(?=\S*\d)\S{3,}/i.test(value)) {
    return 'password';
  }
  return null;
}

/** Divide un texto en trozos de texto y enlaces, para mostrar los enlaces tocables. */
export function splitLinks(text) {
  const parts = [];
  const re = /https?:\/\/[^\s)<>"]+/g;
  let last = 0;
  for (const match of String(text ?? '').matchAll(re)) {
    // No incluir puntuación final en el enlace.
    const url = match[0].replace(/[.,;:!?]+$/, '');
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    parts.push({ type: 'link', value: url });
    last = match.index + url.length;
  }
  if (last < String(text ?? '').length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}
