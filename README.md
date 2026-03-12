# Ahorro Inteligente — Web Panel

Panel web para la plataforma de Ahorro Inteligente. Construido con **Next.js 13 App Router**, **TypeScript** y **Tailwind CSS**.

---

## Autenticación Real con Airtable

La autenticación usa **email + contraseña** con Airtable como fuente de verdad.

- Las contraseñas se guardan como **hash bcrypt** (nunca en texto plano)
- La sesión se maneja con una **cookie httpOnly firmada con JWT** (via `jose`)
- Airtable se accede **solo desde el servidor** (API routes de Next.js), nunca desde el cliente
- El frontend solo consume endpoints internos `/api/auth/...`

### Endpoints de auth
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro de usuario nuevo |
| `POST` | `/api/auth/login` | Login con email + contraseña |
| `GET` | `/api/auth/me` | Usuario autenticado actual |
| `POST` | `/api/auth/logout` | Cerrar sesión |

---

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```bash
cp .env.example .env.local
```

Variables requeridas:

```env
# Airtable
AIRTABLE_API_KEY=patXXXXXX
AIRTABLE_BASE_ID=appXXXXXX

# Sesión (mínimo 32 caracteres aleatorios)
# Generá uno con: openssl rand -base64 32
SESSION_SECRET=tu_secreto_largo_aqui
```

Las variables con Field IDs ya tienen valores por defecto en el código y solo necesitás sobreescribirlas si cambian en Airtable.

---

## Correr local

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Cómo probar

### 1. Registro de usuario nuevo
1. Ir a `/register`
2. Completar nombre, email nuevo, contraseña (mín. 8 caracteres)
3. Esperar redirección a `/app/gestiones` → sesión iniciada ✅

### 2. Registro con email existente sin contraseña (cuenta no activada)
Si hay un usuario en Airtable con ese email pero sin `Password Hash`:
1. Ir a `/register` y usar ese email
2. El sistema **rechaza el intento** por seguridad
3. Error: *"Ya existe una cuenta con ese email, pero todavía no fue activada..."* ✅

> **⚠️ Nota de seguridad:** La activación automática de cuentas sin contraseña fue deshabilitada
> para evitar que alguien tome control de una cuenta ajena solo con conocer el email.
> La activación segura (OTP / magic link) queda pendiente de implementación.

### 3. Email ya registrado con contraseña
1. Ir a `/register` con un email que ya tiene contraseña configurada
2. Error: *"Ya existe una cuenta con ese email. Iniciá sesión."* ✅

### 4. Login normal
1. Ir a `/login`
2. Ingresar email y contraseña correctos
3. Redirección a `/app/gestiones` ✅

### 5. Login con credenciales inválidas
1. Ir a `/login` con contraseña equivocada
2. Error genérico: *"Credenciales inválidas."* ✅

### 6. Logout
1. Click en "Salir" en la barra superior o "Cerrar sesión" en Mi Cuenta
2. Redirección a `/login`, cookie eliminada ✅

### 7. Persistencia de sesión
1. Iniciar sesión
2. Cerrar y reabrir el navegador (o recargar la página)
3. La sesión persiste (cookie Max-Age 7 días) ✅

---

## Pendientes futuros

- **Activación segura de cuentas**: Implementar envío de OTP o magic link para activar cuentas que ya existen en Airtable sin `Password Hash` (la activación automática desde el formulario de registro fue deshabilitada por seguridad)
- **Forgot password**: endpoint `/api/auth/forgot-password` + envío de email con token firmado
- **Verificación de email**: endpoint `/api/auth/verify-email` con token de un solo uso
- **Actualización de perfil**: endpoint `/api/auth/update-profile` para guardar cambios en Airtable
- **Hardening de sesión**: rotación de tokens, revocación de sesiones activas
- **Stripe**: integración de medios de pago (pendiente de etapa siguiente)
