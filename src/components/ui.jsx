// Componentes compartidos. Pensados para adultos mayores:
// botones grandes, texto grande, una sola acción principal por pantalla.

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-md',
  secondary: 'bg-card text-brand border-[3px] border-brand hover:bg-brand-soft',
  help: 'bg-help-soft text-help border-[3px] border-help hover:bg-amber-100',
  ghost: 'bg-transparent text-ink-soft underline underline-offset-4 hover:text-ink',
};

export function Button({ variant = 'primary', align = 'center', className = '', children, ...props }) {
  const alignment = align === 'start' ? 'justify-start text-left' : 'justify-center';
  return (
    <button
      type="button"
      className={`flex min-h-[68px] w-full items-center gap-3 rounded-2xl px-6 py-4 text-[1.35rem] font-bold transition active:scale-[0.98] disabled:opacity-50 ${alignment} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Screen({ title, onBack, children }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-10 pt-4">
      <header className="mb-6 flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 border-ink-soft/30 bg-card px-4 text-lg font-bold text-ink"
          >
            ← Volver
          </button>
        ) : null}
        {title ? <h1 className="text-[1.6rem] font-extrabold leading-tight">{title}</h1> : null}
      </header>
      {children}
    </div>
  );
}

export function Notice({ tone = 'info', children }) {
  const tones = {
    info: 'bg-brand-soft text-brand-dark border-brand/30',
    ok: 'bg-ok-soft text-ok border-ok/30',
    error: 'bg-danger-soft text-danger border-danger/30',
    warn: 'bg-help-soft text-help border-help/30',
  };
  return (
    <div role="status" className={`mb-5 rounded-2xl border-2 px-5 py-4 text-lg ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-3xl border border-ink/10 bg-card p-6 shadow-sm ${className}`}>{children}</div>;
}
