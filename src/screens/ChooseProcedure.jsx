import { PROCEDURES } from '../data/procedures';
import { Button, Screen } from '../components/ui';

export default function ChooseProcedure({ onPick, onBack }) {
  return (
    <Screen title="¿Qué trámite quieres hacer?" onBack={onBack}>
      <div className="space-y-4">
        {PROCEDURES.map((p) => (
          <Button key={p.id} variant="secondary" align="start" onClick={() => onPick(p.id)}>
            <span className="text-4xl" aria-hidden="true">{p.icon}</span>
            <span className="flex flex-col items-start">
              <span>{p.title}</span>
              <span className="text-base font-normal text-ink-soft">
                {p.subtitle} · {p.estimatedTime}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </Screen>
  );
}
