/**
 * Decodifica un JWT en bsae64 de forma segura
 * @param token 
 * @returns 
 */
function decodeJwtPayload(token: string): any | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decodificando token payload', e);
        return null;
    }
}

/**
 * Obtiene el campo exp (expiración) de un JWT
 * @param token 
 * @returns 
 */
export function getTokenExp(token: string): number | null {
    try {
        const payload = decodeJwtPayload(token);
        return payload && typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
        return null;
    }
}

/**
 * Verifica si el token está expirado
 * @param token 
 * @param skewSec 
 * @returns 
 */
export function isExpired(token: string, skewSec = 30): boolean {
    const exp = getTokenExp(token);
    
    return !exp || (Date.now() / 1000) > (exp - skewSec);
}