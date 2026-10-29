import { useEffect, useRef, useState } from 'react';
import { streamReply } from './lib/api';
import { detectSensitive, MAX_MESSAGE_CHARS } from './lib/chat';
import { canDictate, dictate, speak, stopSpeaking } from './lib/speech';
import { Notice } from './components/ui';
import ChatMessage from './components/ChatMessage';
import Privacy from './screens/Privacy';

// Sin cuentas: la conversación vive solo en esta pestaña del navegador.
const STORAGE_KEY = 'guia-mayor-chat';

const WELCOME = {
  role: 'assistant',
  content: 'Hola, soy Guía Mayor. Le ayudo a hacer trámites por internet, paso a paso y con calma.\n\n¿Qué trámite necesita hacer? Puede escribirlo con sus palabras o tocar una de las opciones de abajo.',
};

const SUGGESTIONS = [
  { icon: '🔑', text: 'Sacar o recuperar mi ClaveÚnica' },
  { icon: '🏦', text: 'Ver mi cuenta del banco' },
  { icon: '🩺', text: 'Pedir una hora médica' },
  { icon: '👵', text: 'Ver mi pensión o mi AFP' },
  { icon: '💡', text: 'Pagar una cuenta de luz o agua' },
  { icon: '⚠️', text: 'Me llegó un mensaje o llamada rara' },
];

const SENSITIVE_WARNING = {
  card: 'Eso parece un número de tarjeta. No lo escriba aquí ni se lo dé a nadie: no lo necesitamos para ayudarle.',
  password: 'Eso parece una clave. Sus claves son solo suyas: escríbalas únicamente en la página oficial, nunca en este chat.',
};

function loadMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    // Sin almacenamiento disponible: se empieza de cero.
  }
  return [WELCOME];
}

export default function App() {
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const endRef = useRef(null);
  const stopDictation = useRef(null);

  useEffect(() => {
    try {
      const done = messages.filter((m) => !m.pending);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      // Ignorar: guardar es solo una comodidad.
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const ask = async (history) => {
    setBusy(true);
    setError('');
    setMessages([...history, { role: 'assistant', content: '', pending: true }]);

    const updateReply = (fn) => setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, content: fn(last.content) };
      return next;
    });

    try {
      await streamReply(history.map(({ role, content }) => ({ role, content })), {
        onText: (text) => updateReply((c) => c + text),
        onReset: () => updateReply(() => ''),
      });
      setMessages((prev) => prev.map((m) => (m.pending ? { role: m.role, content: m.content } : m)));
    } catch (err) {
      // Se quita la respuesta incompleta para poder reintentar.
      setMessages(history);
      setError(err.message || 'No pudimos responder. Intente de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const send = (text) => {
    const value = text.trim();
    if (!value || busy) return;
    const sensitive = detectSensitive(value);
    if (sensitive) {
      setWarning(SENSITIVE_WARNING[sensitive]);
      return;
    }
    setWarning('');
    setInput('');
    stopSpeaking();
    setSpeakingIndex(null);
    ask([...messages, { role: 'user', content: value }]);
  };

  const retry = () => {
    if (messages[messages.length - 1]?.role === 'user') ask(messages);
  };

  const restart = () => {
    if (messages.length > 1 && !window.confirm('¿Quiere borrar la conversación y empezar de nuevo?')) return;
    stopSpeaking();
    setSpeakingIndex(null);
    setMessages([WELCOME]);
    setError('');
    setWarning('');
    setInput('');
  };

  const toggleDictation = () => {
    if (listening) {
      stopDictation.current?.();
      return;
    }
    setListening(true);
    stopDictation.current = dictate({
      onResult: (text) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
      onEnd: () => setListening(false),
    });
  };

  const toggleSpeak = (index) => {
    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
      return;
    }
    setSpeakingIndex(index);
    speak(messages[index].content, { onEnd: () => setSpeakingIndex(null) });
  };

  if (showPrivacy) return <Privacy onBack={() => setShowPrivacy(false)} />;

  const lastIsUser = messages[messages.length - 1]?.role === 'user';

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-paper px-4 py-3">
        <h1 className="text-[1.5rem] font-extrabold">🤝 Guía Mayor</h1>
        <button
          type="button"
          onClick={restart}
          className="rounded-2xl border-2 border-ink/20 bg-card px-4 py-2 text-base font-bold"
        >
          Empezar de nuevo
        </button>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.map((m, i) => (
          <ChatMessage
            key={i}
            message={m}
            speaking={speakingIndex === i}
            onSpeak={() => toggleSpeak(i)}
          />
        ))}

        {messages.length === 1 && (
          <div className="grid gap-3 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => send(s.text)}
                className="flex min-h-[64px] items-center gap-3 rounded-2xl border-[3px] border-brand bg-card px-5 py-3 text-left text-[1.15rem] font-bold text-brand"
              >
                <span className="text-3xl" aria-hidden="true">{s.icon}</span>
                {s.text}
              </button>
            ))}
            <p className="pt-2 text-center text-base text-ink-soft">
              Nunca le pediremos claves ni números de tarjeta.{' '}
              <button type="button" onClick={() => setShowPrivacy(true)} className="underline underline-offset-4">
                Privacidad
              </button>
            </p>
          </div>
        )}

        {error && (
          <div>
            <Notice tone="error">{error}</Notice>
            {lastIsUser && (
              <button
                type="button"
                onClick={retry}
                className="w-full rounded-2xl border-[3px] border-brand bg-card px-5 py-3 text-lg font-bold text-brand"
              >
                Intentar de nuevo
              </button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </main>

      <footer className="border-t border-ink/10 bg-paper px-4 pb-4 pt-3">
        {warning && <Notice tone="warn">🔒 {warning}</Notice>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="message" className="sr-only">Escriba su mensaje</label>
          <textarea
            id="message"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (warning) setWarning('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            maxLength={MAX_MESSAGE_CHARS}
            placeholder={listening ? 'Le escucho…' : 'Escriba aquí su pregunta'}
            className="min-h-[64px] flex-1 resize-none rounded-2xl border-[3px] border-ink/30 bg-card px-4 py-3 text-[1.2rem]"
          />
          {canDictate && (
            <button
              type="button"
              onClick={toggleDictation}
              aria-label={listening ? 'Dejar de escuchar' : 'Hablar en vez de escribir'}
              className={`flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-2xl border-[3px] text-3xl ${
                listening ? 'border-help bg-help-soft' : 'border-brand bg-card'
              }`}
            >
              {listening ? '⏹' : '🎤'}
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-[64px] shrink-0 rounded-2xl bg-brand px-5 text-[1.2rem] font-bold text-white disabled:opacity-50"
          >
            {busy ? '…' : 'Enviar'}
          </button>
        </form>
      </footer>
    </div>
  );
}
