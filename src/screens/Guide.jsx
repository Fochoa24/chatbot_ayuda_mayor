import { useState } from 'react';
import * as api from '../lib/api';
import { isBackendConfigured } from '../lib/supabase';
import { nextStep, previousStep, progressPercent, stepLabel } from '../lib/guide';
import { Button, Card, Notice } from '../components/ui';

// Un paso por pantalla. Cada acción se guarda para que el familiar pueda verla.
export default function Guide({ procedure, institution, run, onExit, onFinish }) {
  const total = procedure.steps.length;
  const [current, setCurrent] = useState(1);
  const [helpCount, setHelpCount] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const step = procedure.steps[current - 1];
  const isLast = current === total;

  const save = async (patch) => {
    if (!isBackendConfigured || !run) return;
    try {
      await api.updateRun(run.id, patch);
    } catch {
      setNotice({ tone: 'warn', text: 'No pudimos guardar este paso. Puedes seguir igual.' });
    }
  };

  const goNext = async () => {
    setBusy(true);
    const { step: nxt, finished } = nextStep(current, total);
    setShowTip(false);
    if (finished) {
      await save({ status: 'done', current_step: total, finished_at: new Date().toISOString() });
      onFinish();
      return;
    }
    setCurrent(nxt);
    await save({ current_step: nxt });
    setBusy(false);
  };

  const goBack = () => {
    setShowTip(false);
    setCurrent(previousStep(current));
  };

  const askHelp = async () => {
    setHelpCount((n) => n + 1);
    if (isBackendConfigured && run) {
      try {
        await api.requestHelp({ runId: run.id, step: current });
        setNotice({
          tone: 'ok',
          text: 'Guardamos tu pedido de ayuda. Tu familiar lo verá en su panel. Mientras, puedes repetir este paso.',
        });
      } catch {
        setNotice({ tone: 'error', text: 'No pudimos enviar tu pedido. Intenta de nuevo cuando tengas internet.' });
      }
    } else {
      setNotice({ tone: 'warn', text: 'En modo demostración el pedido no se envía. Repite el paso con calma.' });
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-10 pt-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={current === 1 ? onExit : goBack}
          className="flex h-14 items-center rounded-2xl border-2 border-ink/30 bg-card px-4 text-lg font-bold"
        >
          ← {current === 1 ? 'Salir' : 'Anterior'}
        </button>
        <p className="text-lg font-bold text-ink-soft" aria-live="polite">
          {stepLabel(current, total)}
        </p>
      </header>

      {/* Barra de progreso */}
      <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-ink/10" role="progressbar"
        aria-valuenow={progressPercent(current, total)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progressPercent(current, total)}%` }} />
      </div>

      <h1 className="mb-4 text-[1.9rem] font-extrabold leading-tight">{step.title}</h1>

      <Card className="mb-5 text-[1.3rem] leading-relaxed">{step.instruction}</Card>

      {step.opensSite && (
        <a
          href={institution.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 flex min-h-[68px] items-center justify-center rounded-2xl bg-brand px-6 py-4 text-center text-[1.3rem] font-bold text-white shadow-md"
        >
          Abrir {institution.name} ↗
        </a>
      )}

      <button
        type="button"
        onClick={() => setShowTip((v) => !v)}
        aria-expanded={showTip}
        className="mb-4 w-full rounded-2xl border-2 border-amber-600/40 bg-amber-50 px-5 py-4 text-left text-lg font-bold text-help"
      >
        💡 {showTip ? 'Ocultar consejo' : 'Ver consejo'}
      </button>
      {showTip && <Card className="mb-5 text-lg text-ink-soft">{step.tip}</Card>}

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <div className="mt-auto space-y-4 pt-4">
        <Button onClick={goNext} disabled={busy}>
          {isLast ? '✅ Terminar' : 'Listo, siguiente →'}
        </Button>
        <Button variant="help" onClick={askHelp}>
          🙋 Necesito ayuda{helpCount > 0 ? ` (${helpCount})` : ''}
        </Button>
      </div>
    </main>
  );
}
