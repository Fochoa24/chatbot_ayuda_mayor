import { Card, Screen } from '../components/ui';

// Texto provisional. Debe revisarlo un abogado antes de un piloto (ver README > Pendientes).
export default function Privacy({ onBack }) {
  return (
    <Screen title="Privacidad y datos" onBack={onBack}>
      <Card className="space-y-4 text-lg leading-relaxed">
        <p><strong>Qué guardamos:</strong> tu nombre (si lo escribes), los trámites que empiezas o terminas, y los pedidos de ayuda.</p>
        <p><strong>Qué no guardamos:</strong> claves de banco, claves de AFP, RUT ni datos de tu cuenta bancaria.</p>
        <p><strong>Quién lo ve:</strong> solo tú y el familiar que vincules con tu código.</p>
        <p><strong>Cómo dejar de compartir:</strong> pide a tu familiar que quite el vínculo, o escríbenos para borrar tus datos.</p>
        <p className="text-ink-soft">Contacto: pendiente de definir por el equipo.</p>
      </Card>
    </Screen>
  );
}
