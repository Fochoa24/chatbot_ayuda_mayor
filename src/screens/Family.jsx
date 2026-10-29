import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api';
import { isBackendConfigured, supabase } from '../lib/supabase';
import { getProcedure } from '../data/procedures';
import { Button, Card, Notice, Screen } from '../components/ui';

// Panel del familiar. Entra con Google (única cuenta con login en la app).
export default function Family({ onBack }) {
  // undefined = cargando sesión; null = sin sesión (o sin backend)
  const [user, setUser] = useState(isBackendConfigured ? undefined : null);
  const [role, setRole] = useState(null);
  const [overview, setOverview] = useState([]);
  const [invite, setInvite] = useState('');
  const [status, setStatus] = useState(null);

  const load = useCallback(async () => {
    try {
      setOverview(await api.getFamilyOverview());
    } catch {
      setStatus({ tone: 'error', text: 'No pudimos cargar el progreso. Intenta de nuevo.' });
    }
  }, []);

  useEffect(() => {
    if (!isBackendConfigured) return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setUser(u);
      if (u && !u.is_anonymous) {
        const profile = await api.getMyProfile();
        setRole(profile?.role ?? null);
        if (profile?.role === 'family') load();
      }
    })();
  }, [load]);

  const becomeFamily = async () => {
    try {
      await api.becomeFamily();
      setRole('family');
      load();
    } catch (err) {
      setStatus({ tone: 'error', text: err.message });
    }
  };

  const newInvite = async () => {
    try {
      setInvite(await api.createInviteCode());
    } catch (err) {
      setStatus({ tone: 'error', text: err.message });
    }
  };

  const resolve = async (id) => {
    try {
      await api.resolveHelp(id);
      load();
    } catch {
      setStatus({ tone: 'error', text: 'No pudimos marcar el pedido. Intenta de nuevo.' });
    }
  };

  if (!isBackendConfigured) {
    return (
      <Screen title="Panel del familiar" onBack={onBack}>
        <Notice tone="warn">El panel necesita conexión al servidor. Está en modo demostración.</Notice>
      </Screen>
    );
  }

  if (user === undefined) return <Screen title="Panel del familiar"><p className="text-xl">Cargando…</p></Screen>;

  if (!user || user.is_anonymous) {
    return (
      <Screen title="Panel del familiar" onBack={onBack}>
        <Card className="mb-6 space-y-3 text-lg">
          <p>Entra con tu cuenta de Google para ver el progreso de tu familiar.</p>
          <p className="text-ink-soft">Tu familiar no necesita cuenta ni contraseña.</p>
        </Card>
        <Button onClick={() => api.signInFamilyWithGoogle()}>Entrar con Google</Button>
      </Screen>
    );
  }

  if (role !== 'family') {
    return (
      <Screen title="Panel del familiar" onBack={onBack}>
        <Card className="mb-6 text-lg">Confirma que usarás esta cuenta como familiar.</Card>
        <Button onClick={becomeFamily}>Soy familiar</Button>
      </Screen>
    );
  }

  const shareLink = invite ? `${window.location.origin}/?c=${invite}` : '';

  return (
    <Screen title="Panel del familiar" onBack={onBack}>
      {status && <Notice tone={status.tone}>{status.text}</Notice>}

      <Card className="mb-6 space-y-4">
        <h2 className="text-xl font-extrabold">Invitar a alguien</h2>
        {!invite ? (
          <Button variant="secondary" onClick={newInvite}>Crear código de invitación</Button>
        ) : (
          <>
            <p className="text-center font-mono text-3xl tracking-widest">{invite}</p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Te invito a Guía Mayor para hacer tus trámites en internet. Entra aquí: ${shareLink}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex min-h-[60px] items-center justify-center rounded-2xl bg-brand px-5 text-lg font-bold text-white"
            >
              Enviar por WhatsApp
            </a>
            <p className="text-sm text-ink-soft">El código vence en 7 días.</p>
          </>
        )}
      </Card>

      {overview.length === 0 && (
        <Card className="text-lg text-ink-soft">Aún no hay personas vinculadas.</Card>
      )}

      {overview.map((person) => (
        <Card key={person.id} className="mb-6 space-y-4">
          <h2 className="text-2xl font-extrabold">{person.name}</h2>

          {person.openHelp.length > 0 && (
            <div className="space-y-3">
              <p className="font-bold text-help">Pidió ayuda:</p>
              {person.openHelp.map((h) => {
                const run = person.runs.find((r) => r.id === h.run_id);
                const proc = run ? getProcedure(run.procedure_id) : null;
                return (
                  <div key={h.id} className="rounded-2xl bg-help-soft p-4">
                    <p className="text-lg">
                      {proc ? proc.title : 'Un trámite'} · paso {h.step}
                    </p>
                    <Button variant="secondary" className="mt-3" onClick={() => resolve(h.id)}>
                      Ya la ayudé
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <p className="mb-2 font-bold">Trámites</p>
            {person.runs.length === 0 ? (
              <p className="text-ink-soft">Todavía no ha empezado ninguno.</p>
            ) : (
              <ul className="space-y-2">
                {person.runs.map((r) => {
                  const proc = getProcedure(r.procedure_id);
                  return (
                    <li key={r.id} className="flex justify-between gap-3 text-lg">
                      <span>{proc?.title ?? r.procedure_id}</span>
                      <span className={r.status === 'done' ? 'font-bold text-ok' : 'text-ink-soft'}>
                        {r.status === 'done' ? 'Terminado' : `Paso ${r.current_step} de ${r.total_steps}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      ))}

      <button type="button" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
        className="mt-4 w-full text-lg text-ink-soft underline">
        Cerrar sesión
      </button>
    </Screen>
  );
}
