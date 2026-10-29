// Lógica pura del flujo guiado. Sin React ni red: fácil de probar.

/** Paso siguiente, sin pasarse del último. Devuelve { step, finished }. */
export function nextStep(current, total) {
  if (current >= total) return { step: total, finished: true };
  return { step: current + 1, finished: false };
}

/** Paso anterior, sin bajar de 1. */
export function previousStep(current) {
  return Math.max(1, current - 1);
}

/** Porcentaje completado al estar en `current` de `total` (paso actual no cuenta hasta avanzar). */
export function progressPercent(current, total) {
  if (total <= 0) return 0;
  const done = Math.min(Math.max(current - 1, 0), total);
  return Math.round((done / total) * 100);
}

/** Texto amable para el encabezado, ej. "Paso 2 de 7". */
export function stepLabel(current, total) {
  return `Paso ${current} de ${total}`;
}

/** Normaliza un código de invitación tal como lo escribe la persona. */
export function normalizeInviteCode(raw) {
  return String(raw ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
