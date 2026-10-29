import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextStep, previousStep, progressPercent, stepLabel, normalizeInviteCode } from './guide.js';

test('nextStep avanza y marca terminado en el último paso', () => {
  assert.deepEqual(nextStep(1, 3), { step: 2, finished: false });
  assert.deepEqual(nextStep(2, 3), { step: 3, finished: false });
  assert.deepEqual(nextStep(3, 3), { step: 3, finished: true });
});

test('previousStep nunca baja de 1', () => {
  assert.equal(previousStep(3), 2);
  assert.equal(previousStep(1), 1);
});

test('progressPercent cuenta solo los pasos ya superados', () => {
  assert.equal(progressPercent(1, 4), 0);
  assert.equal(progressPercent(3, 4), 50);
  assert.equal(progressPercent(5, 4), 100);
  assert.equal(progressPercent(1, 0), 0);
});

test('stepLabel muestra el paso en español sencillo', () => {
  assert.equal(stepLabel(2, 7), 'Paso 2 de 7');
});

test('normalizeInviteCode quita espacios y guiones y pasa a mayúsculas', () => {
  assert.equal(normalizeInviteCode(' ab3-cd9 f '), 'AB3CD9F');
  assert.equal(normalizeInviteCode(null), '');
});
