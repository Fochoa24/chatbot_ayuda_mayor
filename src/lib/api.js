// Envía la conversación al asistente y entrega el texto a medida que llega.

export async function streamReply(messages, { onText, onReset, signal }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    // Un 429 del firewall de Vercel no trae nuestro JSON.
    const fallback = res.status === 429
      ? 'Envió muchos mensajes seguidos. Espere unos minutos y siga.'
      : 'No pudimos conectarnos. Revise su internet e intente de nuevo.';
    throw new Error(data.error || fallback);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.t === 'text') onText(event.v);
      else if (event.t === 'reset') onReset();
      else if (event.t === 'error') throw new Error(event.v);
    }
  }
}
