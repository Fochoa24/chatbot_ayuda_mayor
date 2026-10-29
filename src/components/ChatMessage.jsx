import { splitLinks } from '../lib/chat';
import { canSpeak } from '../lib/speech';

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Una burbuja del chat. Los enlaces se muestran como botones grandes debajo del texto.
export default function ChatMessage({ message, speaking, onSpeak }) {
  const isUser = message.role === 'user';
  const parts = splitLinks(message.content);
  const links = [...new Set(parts.filter((p) => p.type === 'link').map((p) => p.value))].filter(hostOf);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] rounded-3xl px-5 py-4 text-[1.2rem] leading-relaxed shadow-sm ${
          isUser ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md border border-ink/10 bg-card'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">
          {parts.map((p, i) => (p.type === 'link'
            ? <span key={i} className={isUser ? '' : 'font-semibold text-brand'}>{p.value}</span>
            : <span key={i}>{p.value}</span>))}
          {message.pending && !message.content && <span className="text-ink-soft">Escribiendo…</span>}
        </p>

        {!isUser && links.length > 0 && (
          <div className="mt-4 space-y-2">
            {links.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[56px] items-center justify-center rounded-2xl bg-brand px-4 py-3 text-center text-lg font-bold text-white"
              >
                Abrir {hostOf(url)} ↗
              </a>
            ))}
          </div>
        )}

        {!isUser && canSpeak && message.content && !message.pending && (
          <button
            type="button"
            onClick={onSpeak}
            className="mt-3 rounded-xl border-2 border-ink/20 px-4 py-2 text-base font-bold text-ink-soft"
          >
            {speaking ? '⏹ Detener' : '🔊 Escuchar'}
          </button>
        )}
      </div>
    </div>
  );
}
