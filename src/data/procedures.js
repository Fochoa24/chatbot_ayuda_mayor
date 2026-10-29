// Trámites guiados. Cada paso es UNA sola acción, con lenguaje simple.
// `opensSite: true` muestra el botón grande que abre la página de la institución elegida.

export const PROCEDURES = [
  {
    id: 'cartola-bancaria',
    title: 'Ver mi cuenta del banco',
    subtitle: 'Saldo y últimos movimientos',
    icon: '🏦',
    institutionKey: 'bank',
    estimatedTime: '5 minutos',
    steps: [
      {
        title: 'Abre tu navegador',
        instruction: 'Toca el ícono de internet de tu celular. Puede ser Chrome, Safari o Edge.',
        tip: 'Es el ícono de una esfera de colores o una brújula.',
      },
      {
        title: 'Entra a la página de tu banco',
        instruction: 'Toca el botón azul de abajo. Se abrirá la página oficial de tu banco.',
        tip: 'Revisa que la dirección diga el nombre de tu banco.',
        opensSite: true,
      },
      {
        title: 'Busca "Personas"',
        instruction: 'En la página del banco, busca el botón que dice "Personas" o "Banca personal" y tócalo.',
        tip: 'Suele estar arriba a la derecha. Si no lo ves, desliza el dedo hacia abajo.',
      },
      {
        title: 'Escribe tu RUT',
        instruction: 'Escribe tu RUT en el recuadro, con guión. Por ejemplo: 12345678-9. Luego toca "Continuar".',
        tip: 'Si te equivocas, borra con la flecha de retroceso del teclado.',
      },
      {
        title: 'Escribe tu clave',
        instruction: 'Escribe tu clave del banco y toca "Ingresar".',
        tip: 'Nunca le des tu clave a nadie, aunque diga que es del banco. El banco nunca te la pide por teléfono.',
      },
      {
        title: 'Busca "Cartola" o "Movimientos"',
        instruction: 'Dentro del banco, busca "Cartola" o "Últimos movimientos" y tócalo.',
        tip: 'No toques opciones que no conozcas. Si te equivocas, toca la flecha de volver.',
      },
      {
        title: '¡Listo! Revisa tu cuenta',
        instruction: 'Ahí puedes ver tu saldo y tus últimos movimientos. Cuando termines, toca "Terminar".',
        tip: 'Si quieres guardarlo, pide a tu familiar que te enseñe a sacar una captura de pantalla.',
      },
    ],
  },
  {
    id: 'hora-medica',
    title: 'Pedir hora médica',
    subtitle: 'Agendar una consulta con tu médico',
    icon: '🏥',
    institutionKey: 'clinic',
    estimatedTime: '7 minutos',
    steps: [
      {
        title: 'Abre tu navegador',
        instruction: 'Toca el ícono de internet de tu celular.',
        tip: 'Puede ser Chrome, Safari o Edge.',
      },
      {
        title: 'Entra a la página de tu clínica',
        instruction: 'Toca el botón azul de abajo. Se abrirá la página oficial de tu clínica o de Hospital Digital.',
        tip: 'Si no sabes cuál es tu clínica, pregúntalo en tu consultorio o CESFAM.',
        opensSite: true,
      },
      {
        title: 'Busca "Agendar hora"',
        instruction: 'Busca el botón que dice "Agendar hora" o "Sacar hora" y tócalo.',
        tip: 'Suele ser un botón grande en la pantalla principal.',
      },
      {
        title: 'Elige el tipo de consulta',
        instruction: 'Si es tu primera vez, elige "Consulta general". Si es un control, elige "Control médico".',
        tip: 'Si tienes dudas, pregunta a tu médico qué tipo de hora necesitas.',
      },
      {
        title: 'Elige el día y la hora',
        instruction: 'Verás un calendario. Toca un día que esté en color. Luego elige la hora que te convenga.',
        tip: 'Los días en gris no están disponibles.',
      },
      {
        title: 'Confirma tus datos',
        instruction: 'Revisa tu nombre, RUT y teléfono. Si todo está bien, toca "Confirmar".',
        tip: 'Si algo está mal, toca "Editar" antes de confirmar.',
      },
      {
        title: '¡Listo! Tu hora está pedida',
        instruction: 'Anota el día y la hora. Si la página te muestra un comprobante, guárdalo.',
        tip: 'Te recomendamos anotarla en un papel o en tu calendario del celular.',
      },
    ],
  },
  {
    id: 'consulta-afp',
    title: 'Ver mi AFP',
    subtitle: 'Saldo de mi ahorro para la pensión',
    icon: '💰',
    institutionKey: 'afp',
    estimatedTime: '6 minutos',
    steps: [
      {
        title: 'Abre tu navegador',
        instruction: 'Toca el ícono de internet de tu celular.',
        tip: 'Puede ser Chrome, Safari o Edge.',
      },
      {
        title: 'Entra a la página de tu AFP',
        instruction: 'Toca el botón azul de abajo. Se abrirá la página oficial de tu AFP.',
        tip: 'Si no sabes cuál es tu AFP, revisa tu última liquidación de sueldo.',
        opensSite: true,
      },
      {
        title: 'Busca "Afiliados"',
        instruction: 'Busca el botón que dice "Afiliados" o "Personas" y tócalo.',
        tip: 'Suele estar en el menú principal.',
      },
      {
        title: 'Escribe tu RUT y tu clave',
        instruction: 'Escribe tu RUT con guión y luego tu clave. Toca "Ingresar".',
        tip: 'Si no recuerdas la clave, toca "Olvidé mi clave" y sigue las instrucciones.',
      },
      {
        title: 'Busca tu saldo',
        instruction: 'En el menú, busca "Saldo" o "Movimientos de cuenta".',
        tip: 'Ahí verás cuánto tienes ahorrado.',
      },
      {
        title: '¡Listo! Revisa tu información',
        instruction: 'Aquí está tu saldo. Cuando termines, toca "Terminar".',
        tip: 'Si tienes preguntas sobre tu pensión, la AFP te atiende por su página o sus oficinas.',
      },
    ],
  },
];

export function getProcedure(id) {
  return PROCEDURES.find((p) => p.id === id) ?? null;
}
