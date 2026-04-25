export const SALT_LENGTH = 16;
export const TOKEN_LENGTH = 32;
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const HASH_ITERATIONS = 100000;

export function generateSalt() {
    const array = new Uint8Array(SALT_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    let hashValue = await crypto.subtle.digest('SHA-256', data);
    for (let i = 0; i < HASH_ITERATIONS; i++) {
        const iterationData = new Uint8Array(hashValue);
        const combined = new Uint8Array(iterationData.length + 1);
        combined.set(iterationData);
        combined[iterationData.length] = i & 0xff;
        hashValue = await crypto.subtle.digest('SHA-256', combined);
    }
    return Array.from(new Uint8Array(hashValue), b => b.toString(16).padStart(2, '0')).join('');
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

export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
}