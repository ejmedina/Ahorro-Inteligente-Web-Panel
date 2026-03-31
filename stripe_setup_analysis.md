# Análisis del Flujo de Setup de Pagos y Verificación

Tras revisar en detalle la estructura de ambos proyectos (`ahorro-inteligente-webpanel` y `ahorrointeligente`), he identificado las causas de ambos comportamientos reportados. 

Aquí te presento el análisis de ambos puntos para que entiendas exactamente cómo llegó la tester ahí y por qué le apareció el correo de otra persona en lugar del suyo.

---

## 1. ¿Cómo logró saltarse la verificación de email?

La tester esquivó la verificación del email porque utilizó el flujo de recuperación de contraseña ("Me olvidé la contraseña" / "Olvidé mi clave").

Al observar el código del admin panel en **`ahorro-inteligente-webpanel/ahorro-inteligente-web/src/app/api/auth/reset-password/route.ts`**, vemos lo siguiente a la hora de actualizar la contraseña:

```typescript
        const passwordHash = await bcrypt.hash(password, 10);
        await updateUser(record.id, {
            passwordHash,
            recoveryToken: null,
            recoveryExpiresAt: null,
            authStatus: 'active' // <--- AQUÍ ESTÁ EL TEMA
        });
```

**Conclusión:**
Si la usuaria vio el token expirado pero decidió "Recuperar contraseña", al momento de colocar una clave temporal nueva, el backend fuerza su estado a `active` y crea una sesión que le permite el ingreso de forma transparente, anulando la necesidad de verificación base que exige el endpoint `verify-email`.

---

## 2. ¿Por qué pre-cargó el email de "julivillafane99@hotmail.com"?

En la captura de pantalla se ve un móvil ejecutando iOS (Safari), un recuadro de **Apple Pay**, y más abajo el campo "Correo electrónico" ya cargado. Hay un detalle fundamental de cómo funciona Stripe:

Las pasarelas de pago de Stripe integradas con wallets como **Apple Pay / Google Pay** o los propios mecanismos de Auto-Completado de iOS en el formulario de la tarjeta (Autofill), insertan automáticamente información de contacto primaria del dispositivo por comodidad.
Es prácticamente seguro que "Julieta Villafañe" es el nombre real de la tester o de la dueña del iPhone, mientras que "glekovic@hotmail.com" fue un correo falso/de prueba utilizado. Apple Pay / Safari impuso (hizo Autofill) del correo de su propietaria.

Dependiendo en qué proyecto haya corrido la tester el test de adhesión, aquí están los análisis y riesgos en cada API de Stripe:

### Proyecto A: Panel Web Admin (`ahorro-inteligente-web`)
En la API `src/app/api/stripe/setup/route.ts`, ustedes crean la sesión pasando el ID del cliente Stripe:
```typescript
        const sessionStripe = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'setup',
            customer: customerId,  // <--- Bien hecho
            client_reference_id: subscriptionId,
            ...
        });
```
Aquí la sesión **ya está interconectada a nivel back-end con el registro en Airtable**. Aunque por medio de Apple Pay la usuaria vea su correo "julivillafane99..." incrustado visualmente (autofill), la tarjeta de crédito queda ligada a `customerId` (glekovic). No obstante, para que el email ni se vea o no sea modificable visualmente, Stripe permite pasar `customer_email: user.email` para forzar e inhabilitar esa sobreescritura, pero si pasas el `customer`, Stripe intenta bloquearlo con la configuración del cliente (algo seguro y esperable).

### Proyecto B: Panel Web de Clientes (`ahorrointeligente` vieja web)
La API separada que tienes en `src/services/checkoutService.js` tiene configuraciones **muy abiertas/peligrosas** orientadas al testeo que aún no se corrigieron, lo cual podría llevar a graves problemas si la tester estaba interactuando con este proyecto en vez del Admin:

1. **Rutas Abiertas:** En `api.js`, el endpoint `/stripe/setups` no tiene middleware de protección/autenticación (`requireAuth`).
2. **Hardcodeo Frontend:** En `src/js/panel/add-payment-method.js` los datos base salen listos para inyectarse a fuego en Airtable:
   ```javascript
      formData: {
        subscriptionId: '1234', // TODO: sacar de localStorage.
        userId: '5678' // TODO: sacar de localStorage.
      }
   ```
3. **Peligro en Webhook:** El Webhook de Stripe lee el email *que el usuario llenó en el formulario de Stripe* (que puede ser el autofill automático de Julieta Villafañe) y hace un un patch a Airtable **sobreescribiendo tu base de datos**:
   ```javascript
       const airtableUserId = session.metadata.airtableUserId // Va a venir de los campos "TODO" (5678)
       const customerEmail = session.customer_details?.email || session.customer_email // Leerá a julivillafane99
       ...
       // Hace patch en Airtable sobre el usuario y LE REEMPLAZA su correo:
       await this.patchAirtableUser(event.data.object)
   ```

## Próximos pasos a definir

Dado que el objetivo era solo análisis, confírmame si deseas que ejecutemos las siguientes correcciones para cerrar estos posibles "bordes":

1. Modificar `auth/reset-password/route.ts` para que no coloque `authStatus: 'active'` obligando primero a verificar si el mail ya había sido validado (para no bypassear).
2. Forzar que las sesiones de Stripe no tomen la dirección de Apple Pay pasando el flag apropiado o ignorando el update del email en los webhooks.
3. (Opcional) Limpiar los "TODOs" harcodeados en el proyecto de backend viejo `ahorrointeligente` si es que la plataforma aún está en uso o de lo contrario desactivarla.
