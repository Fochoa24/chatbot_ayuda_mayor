import { useState } from 'react';
import * as api from '../lib/api';
import { isBackendConfigured } from '../lib/supabase';
import { normalizeInviteCode } from '../lib/guide';
import { Button, Notice, Screen } from '../components/ui';

// La persona mayor escribe (o llega con) el código que le envió su familiar.
export default function Invite({ initialCode, onBack, onDone }) {
  const [code, setCode] = useState(normalizeInviteCode(initialCode));
  const [status, setStatus] = useState(null); // { tone, text }
  const [busy, setBusy] = useState(false);

  const link = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const familyName = await api.redeemInvite(normalizeInviteCode(code));
      setStatus({ tone: 'ok', text: `Listo. Quedaste vinculada con ${familyName}.` });
      setTimeout(onDone, 2200);
    } catch (err) {
      setStatus({
        tone: 'error',
        text: err?.message?.includes('vencido') || err?.message?.includes('válido')
          ? 'Ese código no es válido o ya venció. Pide a tu familiar uno nuevo.'
          : 'No pudimos vincularte. Revisa tu internet e intenta de nuevo.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Vincularme con mi familiar" onBack={onBack}>
      <p className="mb-6 text-xl leading-relaxed">
        Escribe el código que te envió tu familiar. Son 10 letras o números.
      </p>

      <label htmlFor="code" className="mb-2 block text-lg font-bold">Código</label>
      <input
        id="code"
        value={code}
        onChange={(e) => setCode(normalizeInviteCode(e.target.value))}
        maxLength={14}
        autoCapitalize="characters"
        autoComplete="off"
        className="mb-6 w-full rounded-2xl border-[3px] border-ink/30 bg-card px-5 py-4 text-center font-mono text-2xl tracking-widest"
      />

      {status && <Notice tone={status.tone}>{status.text}</Notice>}

      {isBackendConfigured ? (
        <Button onClick={link} disabled={busy || code.length < 6}>
          {busy ? 'Vinculando…' : 'Vincular'}
        </Button>
      ) : (
        <Notice tone="warn">La vinculación no está disponible en modo demostración.</Notice>
      )}
    </Screen>
  );
}
