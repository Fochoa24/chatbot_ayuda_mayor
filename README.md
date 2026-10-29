# Guía Mayor

Chat que acompaña a personas mayores a hacer cualquier trámite por internet, paso a paso.

**Principios:** sin cuentas, sin contraseñas de Guía Mayor y sin panel de control familiar. La persona entra, escribe (o dicta) lo que necesita y el asistente la guía.

## Qué hace

- **Chat con letra grande**, un paso a la vez, en lenguaje simple y tratando de "usted".
- **Botones de inicio** para los trámites más comunes: ClaveÚnica, banco, hora médica, pensión/AFP, cuentas y mensajes sospechosos.
- **Voz:** dictar el mensaje (🎤) y escuchar las respuestas (🔊), si el navegador lo permite.
- **Enlaces oficiales como botones grandes.** Si un dato cambia con el tiempo, el asistente lo confirma con búsqueda web, limitada a sitios oficiales (`server/systemPrompt.js` > `OFFICIAL_DOMAINS`).
- **Protección de datos:** antes de enviar, el navegador bloquea lo que parezca un número de tarjeta o una clave. El asistente tiene instrucciones de nunca pedirlos y de advertir sobre estafas.

Lo que **no** hace: no guarda conversaciones en un servidor, no entra a cuentas ni hace trámites por la persona, no pide claves.

## Arquitectura

```
Navegador (React)  ──POST /api/chat──▶  Función de Vercel (api/chat.js)  ──▶  Claude API
   conversación en                        valida, limita y transmite
   sessionStorage                         la respuesta en streaming
```

- `src/`: interfaz (React 19, Vite 8, Tailwind 4). `src/lib/chat.js` tiene la lógica pura, compartida con el servidor.
- `server/chatHandler.js`: llama a Claude (`claude-opus-5-5`, esfuerzo `low`, búsqueda web, fallback ante rechazos) y transmite el texto como líneas JSON.
- `server/systemPrompt.js`: instrucciones del asistente.
- La clave `ANTHROPIC_API_KEY` vive solo en el servidor.

## Puesta en marcha local

```bash
npm install
cp .env.example .env      # completar ANTHROPIC_API_KEY
npm run dev               # la misma función /api/chat corre dentro de Vite
```

Otros comandos: `npm test` (node:test), `npm run lint` (oxlint), `npm run build`.

## Despliegue (Vercel)

```bash
npx vercel env add ANTHROPIC_API_KEY production
npx vercel deploy --prod
```

Recomendado en el panel de Vercel: **Firewall > Rate limiting** para `/api/chat` (por ejemplo, 30 solicitudes cada 5 minutos por IP). El límite en memoria de `chatHandler.js` es solo una primera barrera. También conviene fijar un **límite de gasto mensual** en la consola de Anthropic.

## Pendientes antes de difundir

- [ ] Revisar el texto de privacidad (`src/screens/Privacy.jsx`) con un abogado (Ley 19.628 y Ley 21.719) y definir un contacto real. Informar que los mensajes se procesan con Anthropic.
- [ ] Probar el asistente con adultos mayores reales y con casos difíciles: estafas, claves escritas en el chat, trámites poco comunes y preguntas fuera de tema.
- [ ] Armar un set de evaluación con conversaciones reales (anonimizadas) antes de cambiar el prompt o el modelo.
- [ ] Configurar el rate limit en Vercel y el límite de gasto en Anthropic.
- [ ] Revisar el costo por conversación y, si hace falta, el modelo o el esfuerzo.
