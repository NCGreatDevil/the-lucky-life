export const SALT_LENGTH = 16;
export const TOKEN_LENGTH = 32;
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const PBKDF2_ITERATIONS = 100000;
export const PBKDF2_KEY_LENGTH = 256;

export function generateSalt() {
    const array = new Uint8Array(SALT_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        PBKDF2_KEY_LENGTH
    );
    return Array.from(new Uint8Array(derivedBits), b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, salt, expectedHash) {
    const actualHash = await hashPassword(password, salt);
    return actualHash === expectedHash;
}

export function generateToken() {
    const array = new Uint8Array(TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

export function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function generateUserId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function calculateLuckLevel(luck) {
    if (luck >= 96) return 6;
    if (luck >= 86) return 5;
    if (luck >= 76) return 4;
    if (luck >= 26) return 3;
    if (luck >= 6) return 2;
    return 1;
}

export function getLuckLabel(level) {
    const labels = {
        1: '倒霉',
        2: '不顺',
        3: '平常',
        4: '顺遂',
        5: '好运',
        6: '爆棚'
    };
    return labels[level] || '平常';
}

export function corsHeaders(context) {
    const allowedOrigins = context?.env?.ALLOWED_ORIGINS?.split(',') || ['*'];
    const requestOrigin = context?.request?.headers?.get('Origin');
    
    let origin = '*';
    if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
            origin = requestOrigin;
        } else if (!requestOrigin) {
            origin = allowedOrigins[0];
        } else {
            origin = allowedOrigins[0];
        }
    }
    
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    };
}

export function getNowISO() {
    return new Date().toISOString();
}

export function getNowTimestamp() {
    return Math.floor(Date.now() / 1000);
}

export function isoToTimestamp(isoString) {
    if (!isoString) return 0;
    return Math.floor(new Date(isoString).getTime() / 1000);
}

export function timestampToISO(timestamp) {
    if (!timestamp) return getNowISO();
    return new Date(timestamp * 1000).toISOString();
}

export function addSecondsToISO(isoString, seconds) {
    const date = new Date(isoString);
    date.setSeconds(date.getSeconds() + seconds);
    return date.toISOString();
}

export function isISOExpired(isoString) {
    if (!isoString) return true;
    const expiryTime = new Date(isoString).getTime();
    const now = Date.now();
    return now > expiryTime;
}

export function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}