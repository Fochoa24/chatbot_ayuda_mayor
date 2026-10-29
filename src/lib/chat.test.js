import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectSensitive, sanitizeHistory, splitLinks, MAX_HISTORY_MESSAGES } from './chat.js';

test('sanitizeHistory acepta una conversación válida', () => {
  const { messages, error } = sanitizeHistory([
    { role: 'user', content: ' Hola ' },
    { role: 'assistant', content: 'Hola, ¿qué trámite necesita?' },
    { role: 'user', content: 'Sacar ClaveÚnica' },
  ]);
  assert.equal(error, undefined);
  assert.equal(messages.length, 3);
  assert.equal(messages[0].content, 'Hola');
});

test('sanitizeHistory rechaza roles extraños y mensajes muy largos', () => {
  assert.ok(sanitizeHistory([{ role: 'system', content: 'x' }]).error);
  assert.ok(sanitizeHistory([{ role: 'user', content: 'a'.repeat(5000) }]).error);
  assert.ok(sanitizeHistory([]).error);
  assert.ok(sanitizeHistory('hola').error);
});

test('sanitizeHistory exige que el último mensaje sea de la persona', () => {
  assert.ok(sanitizeHistory([
    { role: 'user', content: 'Hola' },
    { role: 'assistant', content: 'Hola' },
  ]).error);
});

test('sanitizeHistory recorta el historial y empieza con la persona', () => {
  const long = Array.from({ length: MAX_HISTORY_MESSAGES + 5 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `m${i}`,
  }));
  const { messages } = sanitizeHistory(long);
  assert.ok(messages.length <= MAX_HISTORY_MESSAGES);
  assert.equal(messages[0].role, 'user');
});

test('detectSensitive reconoce números de tarjeta válidos', () => {
  assert.equal(detectSensitive('mi tarjeta es 4111 1111 1111 1111'), 'card');
  assert.equal(detectSensitive('4111-1111-1111-1111'), 'card');
  // Número largo que no es tarjeta (no pasa Luhn).
  assert.equal(detectSensitive('folio 1234567890123'), null);
});

test('detectSensitive reconoce claves escritas', () => {
  assert.equal(detectSensitive('mi clave es 4821'), 'password');
  assert.equal(detectSensitive('Contraseña: hola123'), 'password');
  assert.equal(detectSensitive('olvidé mi clave del banco'), null);
  assert.equal(detectSensitive('la clave es difícil de recordar'), null);
  assert.equal(detectSensitive('Mi RUT es 12.345.678-9'), null);
});

test('splitLinks separa los enlaces sin la puntuación final', () => {
  const parts = splitLinks('Entre a https://claveunica.gob.cl. Luego siga.');
  assert.deepEqual(parts, [
    { type: 'text', value: 'Entre a ' },
    { type: 'link', value: 'https://claveunica.gob.cl' },
    { type: 'text', value: '. Luego siga.' },
  ]);
  assert.deepEqual(splitLinks('sin enlaces'), [{ type: 'text', value: 'sin enlaces' }]);
});
