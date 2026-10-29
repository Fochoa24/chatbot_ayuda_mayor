import { Button, Card } from '../components/ui';

export default function Done({ procedure, name, onAgain }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-10 pt-12 text-center">
      <div className="mb-4 text-8xl" aria-hidden="true">🎉</div>
      <h1 className="mb-3 text-[2rem] font-extrabold">
        ¡Lo lograste{name ? `, ${name}` : ''}!
      </h1>
      <p className="mb-8 text-xl text-ink-soft">
        Terminaste: <strong className="text-ink">{procedure.title}</strong>
      </p>
      <Card className="mb-8 text-lg">
        Ya sabes hacerlo. La próxima vez será más fácil.
      </Card>
      <Button onClick={onAgain}>Hacer otro trámite</Button>
    </main>
  );
}
