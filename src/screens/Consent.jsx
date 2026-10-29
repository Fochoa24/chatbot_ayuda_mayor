import { useState } from 'react';
import { Button, Card, Notice, Screen } from '../components/ui';

// Consentimiento informado antes del primer trámite (Ley 19.628 y futura Ley 21.719).
export default function Consent({ onAccept, onBack }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    setSaving(true);
    setError('');
    try {
      await onAccept(name.trim());
    } catch {
      setError('No pudimos guardar tu respuesta. Intenta de nuevo.');
      setSaving(false);
    }
  };

  return (
    <Screen title="Antes de empezar" onBack={onBack}>
      <Card className="mb-6 space-y-4 text-lg leading-relaxed">
        <p>Guía Mayor guarda lo que haces en cada trámite: qué pasos completas y cuándo pides ayuda.</p>
        <p>
          Si vinculas a un familiar, esa persona podrá ver tu progreso y tus pedidos de ayuda.
          Puedes dejar de compartirlo cuando quieras.
        </p>
        <p>Nunca guardamos tus claves de banco ni de AFP.</p>
      </Card>

      <label htmlFor="name" className="mb-2 block text-lg font-bold">
        ¿Cómo te llamas? (opcional)
      </label>
      <input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        autoComplete="given-name"
        className="mb-6 w-full rounded-2xl border-[3px] border-ink/30 bg-card px-5 py-4 text-xl"
      />

      {error && <Notice tone="error">{error}</Notice>}

      <Button onClick={accept} disabled={saving}>
        {saving ? 'Guardando…' : 'Sí, acepto y quiero continuar'}
      </Button>
    </Screen>
  );
}
