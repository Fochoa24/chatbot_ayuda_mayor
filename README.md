# Guía Mayor

Asistente para que personas mayores hagan trámites en internet, paso a paso.

**Principio de diseño:** la persona mayor no necesita cuenta, correo ni contraseña de Guía Mayor. Entra y sigue los pasos. Solo el familiar usa Google, para ver el progreso.

## Qué hace

- **Persona mayor (sin login):** elige un trámite (banco, hora médica, AFP), elige la institución y avanza un paso a la vez. Un botón grande abre la página oficial. Puede pedir ayuda: el pedido queda guardado para su familiar.
- **Familiar (Google):** crea un código de invitación, lo envía por WhatsApp, y ve el progreso y los pedidos de ayuda de las personas vinculadas.
- **Vinculación:** la persona mayor escribe el código (o llega con `?c=CODIGO`) y queda vinculada.

Lo que **no** hace: no pide ni guarda claves de bancos o AFP, no hace los trámites por la persona y no envía notificaciones push (el familiar ve los pedidos al abrir su panel).

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · Supabase (Postgres + Auth + RLS).

## Puesta en marcha local

```bash
npm install
cp .env.example .env      # completar con URL y clave pública de Supabase
npm run dev
```

Sin `.env` la app arranca en **modo demostración**: el flujo se ve completo, pero nada se guarda.

Otros comandos:

```bash
npm test      # pruebas de la lógica de pasos (node:test, sin dependencias extra)
npm run lint  # oxlint
npm run build
```

## Configurar Supabase

1. Crear el proyecto en Supabase.
2. **SQL Editor:** ejecutar `supabase/schema.sql` completo.
3. **Authentication > Providers:**
   - Activar **Anonymous Sign-Ins** (la persona mayor entra así, sin ver ningún login).
   - Activar **Google** (solo para familiares). Configurar el Client ID y Secret de Google Cloud y agregar la URL del sitio en *Redirect URLs*.
4. **Settings > API:** copiar la URL y la clave **publishable/anon** a `.env`. Nunca usar la `service_role` en el frontend.

## Seguridad: decisiones clave

- El cliente **no puede cambiar su rol ni sus vínculos**. Las columnas `role` y `links` se protegen con privilegios de columna y RLS. Los cambios pasan por funciones `SECURITY DEFINER` acotadas: `become_family`, `create_invite`, `redeem_invite`.
- Los códigos de invitación son aleatorios (10 caracteres) y vencen en 7 días.
- Cada tabla tiene RLS activado. El familiar solo lee a personas con un vínculo activo.
- `.env` está en `.gitignore`. No versionar claves.

## Pendientes antes de un piloto

Ver también el diagnóstico del proyecto original.

- [ ] **Verificar cada URL** de bancos, clínicas y AFP (`src/data/institutions.js`).
- [ ] **Revisar el texto de privacidad** (`src/screens/Privacy.jsx`) con un abogado. Definir contacto real.
- [ ] **Revisar la Ley 21.719** de datos personales (entra en vigencia a fines de 2026) y el registro de consentimiento (`consent_at`).
- [ ] **Limitar intentos de canje de código** (rate limit) en Supabase, para evitar fuerza bruta.
- [ ] **Probar con adultos mayores reales** en celular: tamaño de texto, orden de los pasos y claridad de los consejos.
- [ ] **Confirmar la columna `is_anonymous`** de `auth.users` en tu versión de Supabase (la usa `become_family`).
- [ ] Definir el modelo de negocio (municipio, institución o familia) antes de escalar.
