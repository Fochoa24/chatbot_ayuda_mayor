import Anthropic from '@anthropic-ai/sdk';
import { sanitizeHistory } from '../src/lib/chat.js';
import { OFFICIAL_DOMAINS, SYSTEM_PROMPT } from './systemPrompt.js';

// Respuesta en streaming como líneas JSON:
//   {"t":"text","v":"..."}   trozo de texto
//   {"t":"reset"}            descartar lo recibido (p. ej. una respuesta cortada)
//   {"t":"error","v":"..."}  mensaje para mostrar a la persona
//   {"t":"done"}

const MODEL = 'claude-opus-5-5';
const MAX_CONTINUATIONS = 3; // reanudaciones tras pause_turn (búsqueda web larga)

// Límite simple por IP. Vive en memoria de cada instancia: es una primera barrera,
// no reemplaza una regla de rate limit en el firewall de Vercel.
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 30;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_MAX;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function friendlyError(err) {
  if (err instanceof Anthropic.RateLimitError) {
    return 'Hay muchas personas usando la guía en este momento. Espere un minuto e intente de nuevo.';
  }
  if (err instanceof Anthropic.APIConnectionError || err instanceof Anthropic.InternalServerError) {
    return 'No pudimos conectarnos. Intente de nuevo en un momento.';
  }
  return 'Tuvimos un problema para responder. Intente de nuevo en un momento.';
}

let client;

export async function handleChat(request) {
  if (request.method !== 'POST') return json(405, { error: 'Método no permitido.' });

  // Solo desde nuestra propia página.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json(403, { error: 'Origen no permitido.' });
  }

  const ip = (request.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  if (rateLimited(ip)) {
    return json(429, { error: 'Envió muchos mensajes seguidos. Espere unos minutos y siga.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(503, { error: 'El asistente todavía no está configurado.' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'El mensaje no tiene el formato esperado.' });
  }
  const { messages, error } = sanitizeHistory(body?.messages);
  if (error) return json(400, { error });

  client ??= new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const conversation = [...messages];

      try {
        for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
          const response = client.beta.messages.stream({
            model: MODEL,
            max_tokens: 8000, // respuestas cortas; acota el costo de un endpoint público
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            output_config: { effort: 'low' },
            cache_control: { type: 'ephemeral' },
            system: SYSTEM_PROMPT,
            tools: [{
              type: 'web_search_20260209',
              name: 'web_search',
              max_uses: 3,
              allowed_domains: OFFICIAL_DOMAINS,
              user_location: { type: 'approximate', country: 'CL', timezone: 'America/Santiago' },
            }],
            messages: conversation,
          });

          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send({ t: 'text', v: event.delta.text });
            }
          }
          const final = await response.finalMessage();

          if (final.stop_reason === 'refusal') {
            send({ t: 'reset' });
            send({ t: 'error', v: 'No puedo ayudar con eso. Si necesita un trámite, cuénteme cuál y lo vemos paso a paso.' });
            break;
          }
          if (final.stop_reason !== 'pause_turn') break;
          // La búsqueda web quedó a medias: se reanuda con lo que ya respondió.
          conversation.push({ role: 'assistant', content: final.content });
        }
        send({ t: 'done' });
      } catch (err) {
        console.error('chat error', err?.status ?? '', err?.message ?? err);
        send({ t: 'error', v: friendlyError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
