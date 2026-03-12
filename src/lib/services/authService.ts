/**
 * authService.ts
 *
 * Auth real implementada en los API routes:
 *   - POST /api/auth/register
 *   - POST /api/auth/login
 *   - GET  /api/auth/me
 *   - POST /api/auth/logout
 *
 * Este archivo se conserva solo para métodos que el resto del sistema
 * aún pueda requerir (sin relación con auth).
 *
 * Métodos de auth mock eliminados:
 *   - loginWithPassword    → reemplazado por POST /api/auth/login
 *   - registerUser         → reemplazado por POST /api/auth/register
 *   - sendMagicLink        → TODO: pendiente forgot-password real
 *   - verifyMagicLinkAndLogin → TODO: pendiente forgot-password real
 *   - logout               → reemplazado por POST /api/auth/logout (en AuthContext)
 *   - getCurrentUser       → reemplazado por GET /api/auth/me (en AuthContext)
 *   - updateProfile        → TODO: pendiente endpoint /api/auth/update-profile
 */

// Este archivo puede eliminarse en el futuro cuando se migren todos los módulos.
export { };
