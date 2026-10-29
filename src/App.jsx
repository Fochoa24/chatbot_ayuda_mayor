import { useEffect, useState, useCallback } from 'react';
import { isBackendConfigured } from './lib/supabase';
import * as api from './lib/api';
import { getProcedure } from './data/procedures';
import { INSTITUTIONS } from './data/institutions';
import { Button, Card, Notice, Screen } from './components/ui';
import Home from './screens/Home';
import ChooseProcedure from './screens/ChooseProcedure';
import Consent from './screens/Consent';
import Guide from './screens/Guide';
import Done from './screens/Done';
import Invite from './screens/Invite';
import Family from './screens/Family';
import Privacy from './screens/Privacy';

// Navegación simple por estado. Sin librería de rutas: pocas pantallas.
// Rutas reales: "/familia" (panel del familiar) y "/?c=CODIGO" (invitación).

export default function App() {
  const isFamilyPath = window.location.pathname.startsWith('/familia');
  const inviteParam = new URLSearchParams(window.location.search).get('c') || '';

  const [screen, setScreen] = useState(() => {
    if (isFamilyPath) return 'family';
    if (inviteParam) return 'invite';
    return 'home';
  });
  const [profile, setProfile] = useState(null);
  const [procedureId, setProcedureId] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [run, setRun] = useState(null);
  const [booting, setBooting] = useState(isBackendConfigured && !isFamilyPath);
  const [bootError, setBootError] = useState('');

  const procedure = procedureId ? getProcedure(procedureId) : null;

  // Arranque: la persona mayor entra en silencio, sin pantalla de login.
  useEffect(() => {
    if (!isBackendConfigured || isFamilyPath) return;
    (async () => {
      try {
        await api.ensureElderSession();
        setProfile(await api.getMyProfile());
      } catch {
        setBootError('No pudimos conectarnos. Revisa tu internet e intenta de nuevo.');
      } finally {
        setBooting(false);
      }
    })();
  }, [isFamilyPath]);

  const hasConsent = !isBackendConfigured || Boolean(profile?.consent_at);

  const startProcedure = useCallback((id) => {
    setProcedureId(id);
    setInstitution(null);
    setScreen(hasConsent ? 'institution' : 'consent');
  }, [hasConsent]);

  const goHome = useCallback(() => {
    setScreen('home');
    setProcedureId(null);
    setInstitution(null);
    setRun(null);
  }, []);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-2xl font-bold">Preparando la guía…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!isBackendConfigured && (
        <div className="mx-auto max-w-xl px-4 pt-3">
          <Notice tone="warn">
            Modo demostración: los trámites no se guardan y la vinculación con familiares no está disponible.
          </Notice>
        </div>
      )}
      {bootError && (
        <Screen>
          <Notice tone="error">{bootError}</Notice>
        </Screen>
      )}

      {!bootError && screen === 'home' && (
        <Home
          name={profile?.display_name}
          onProcedures={() => setScreen('procedures')}
          onInvite={() => setScreen('invite')}
          onFamily={() => { window.location.href = '/familia'; }}
          onPrivacy={() => setScreen('privacy')}
        />
      )}

      {!bootError && screen === 'procedures' && (
        <ChooseProcedure onBack={goHome} onPick={startProcedure} />
      )}

      {!bootError && screen === 'consent' && (
        <Consent
          onBack={() => setScreen('procedures')}
          onAccept={async (name) => {
            if (isBackendConfigured) {
              const updated = await api.updateMyProfile({
                consent_at: new Date().toISOString(),
                display_name: name,
              });
              setProfile(updated);
            }
            setScreen('institution');
          }}
        />
      )}

      {!bootError && screen === 'institution' && procedure && (
        <InstitutionPick
          procedure={procedure}
          onBack={() => setScreen('procedures')}
          onPick={async (inst) => {
            setInstitution(inst);
            const newRun = isBackendConfigured
              ? await api.createRun({
                  procedureId: procedure.id,
                  institutionId: inst.id,
                  totalSteps: procedure.steps.length,
                }).catch(() => null)
              : null;
            setRun(newRun);
            setScreen('guide');
          }}
        />
      )}

      {!bootError && screen === 'guide' && procedure && institution && (
        <Guide
          procedure={procedure}
          institution={institution}
          run={run}
          onExit={goHome}
          onFinish={() => setScreen('done')}
        />
      )}

      {!bootError && screen === 'done' && procedure && (
        <Done
          procedure={procedure}
          name={profile?.display_name}
          onAgain={goHome}
        />
      )}

      {!bootError && screen === 'invite' && (
        <Invite
          initialCode={inviteParam}
          onBack={goHome}
          onDone={goHome}
        />
      )}

      {!bootError && screen === 'family' && (
        <Family onBack={() => { window.location.href = '/'; }} />
      )}

      {!bootError && screen === 'privacy' && <Privacy onBack={goHome} />}
    </div>
  );
}

// Pantalla de elección de institución (pequeña; vive aquí para mantener el flujo a la vista).
function InstitutionPick({ procedure, onPick, onBack }) {
  const list = INSTITUTIONS[procedure.institutionKey];
  const question = {
    bank: '¿En qué banco tienes tu cuenta?',
    clinic: '¿En qué clínica o red te atiendes?',
    afp: '¿En qué AFP estás?',
  }[procedure.institutionKey];

  return (
    <Screen title={question} onBack={onBack}>
      <div className="space-y-3">
        {list.map((inst) => (
          <Button key={inst.id} variant="secondary" onClick={() => onPick(inst)}>
            {inst.name}
          </Button>
        ))}
      </div>
      <Card className="mt-6 text-lg text-ink-soft">
        Si no encuentras tu institución, pide ayuda a tu familiar para revisar la página oficial.
      </Card>
    </Screen>
  );
}
