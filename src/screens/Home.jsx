import { Button, Card } from '../components/ui';

export default function Home({ name, onProcedures, onInvite, onFamily, onPrivacy }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-10 pt-8">
      <div className="mb-8 text-center">
        <div className="mb-3 text-7xl" aria-hidden="true">🤝</div>
        <h1 className="text-[2rem] font-extrabold leading-tight">Guía Mayor</h1>
        <p className="mt-2 text-xl text-ink-soft">
          {name ? `Hola, ${name}. ` : ''}Aprende a hacer tus trámites en internet, paso a paso.
        </p>
      </div>

      <div className="space-y-4">
        <Button onClick={onProcedures}>Quiero hacer un trámite</Button>
        <Button variant="secondary" onClick={onInvite}>Mi familiar me envió un código</Button>
      </div>

      <Card className="mt-8 space-y-3 text-lg">
        <p className="font-bold">Sin cuenta, sin contraseñas de Guía Mayor.</p>
        <p className="text-ink-soft">Solo sigues los pasos. Nunca te pediremos tu clave.</p>
      </Card>

      <div className="mt-auto flex flex-col items-center gap-2 pt-10">
        <button type="button" onClick={onFamily} className="text-lg font-semibold text-brand underline underline-offset-4">
          Soy familiar: ver el progreso
        </button>
        <button type="button" onClick={onPrivacy} className="text-base text-ink-soft underline underline-offset-4">
          Privacidad y datos
        </button>
      </div>
    </main>
  );
}
