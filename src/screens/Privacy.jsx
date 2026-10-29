import { Card, Screen } from '../components/ui';

// Texto provisional. Debe revisarlo un abogado antes de difundir el servicio (ver README > Pendientes).
export default function Privacy({ onBack }) {
  return (
    <Screen title="Privacidad y datos" onBack={onBack}>
      <Card className="space-y-4 text-lg leading-relaxed">
        <p><strong>Sin cuentas:</strong> no le pedimos nombre, correo, RUT ni contraseña para usar Guía Mayor.</p>
        <p>
          <strong>Su conversación:</strong> queda guardada solo en esta pestaña de su navegador y se borra al cerrarla
          o al tocar &quot;Empezar de nuevo&quot;. Nosotros no la guardamos.
        </p>
        <p>
          <strong>Quién la procesa:</strong> para responderle, lo que escribe se envía a Anthropic, la empresa que
          provee el asistente de inteligencia artificial (Claude).
        </p>
        <p>
          <strong>Nunca escriba</strong> claves, ClaveÚnica, números de tarjeta ni códigos que le lleguen por mensaje.
          El chat no los necesita.
        </p>
        <p className="text-ink-soft">Las respuestas pueden tener errores. Ante dudas, confirme en ChileAtiende (101) o en la institución.</p>
        <p className="text-ink-soft">Contacto: pendiente de definir por el equipo.</p>
      </Card>
    </Screen>
  );
}
