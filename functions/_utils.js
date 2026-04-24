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

export function calculateAttributes(birthday, gender, occupation) {
    const birthYear = parseInt(birthday.split('-')[0]);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    const baseStats = {
        luckiness: 50,
        charm: 50,
        wisdom: 50,
        courage: 50,
        wealth: 50,
        health: 50
    };

    if (age < 25) {
        baseStats.courage += 10;
        baseStats.wisdom -= 5;
    } else if (age < 40) {
        baseStats.wisdom += 10;
        baseStats.wealth += 5;
    } else if (age < 60) {
        baseStats.wisdom += 15;
        baseStats.courage -= 5;
    } else {
        baseStats.wisdom += 20;
        baseStats.health -= 10;
    }

    const genderMod = gender === 'male' ? { courage: 5, health: 5, charm: -5 } :
                     gender === 'female' ? { charm: 10, health: -5 } : {};

    const occupationMods = {
        '教师': { wisdom: 15, charm: 5 },
        '医生': { health: 15, wisdom: 5 },
        '工程师': { wisdom: 10, courage: 5 },
        '设计师': { charm: 15, wisdom: 5 },
        '销售': { charm: 10, courage: 10 },
        '公务员': { wealth: 10, wisdom: 5 },
        '学生': { courage: 10, wisdom: 5 },
        '自由职业': { courage: 10, charm: 5 },
        '企业家': { wealth: 15, courage: 10 },
        '艺术家': { charm: 15, wisdom: 5 }
    };

    const occMod = occupationMods[occupation] || { wisdom: 5 };

    for (const [key, value] of Object.entries(genderMod)) {
        baseStats[key] = Math.min(100, Math.max(0, baseStats[key] + value));
    }
    for (const [key, value] of Object.entries(occMod)) {
        baseStats[key] = Math.min(100, Math.max(0, baseStats[key] + value));
    }

    return baseStats;
}

export function calculateTags(birthday, gender, occupation) {
    const tags = [];
    const birthMonth = parseInt(birthday.split('-')[1]);

    const zodiacSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    const seasonMap = { 12: '冬季', 1: '冬季', 2: '冬季', 3: '春季', 4: '春季', 5: '春季', 6: '夏季', 7: '夏季', 8: '夏季', 9: '秋季', 10: '秋季', 11: '秋季' };

    tags.push(zodiacSigns[Math.floor((birthMonth - 1) / 1) % 12]);
    tags.push(seasonMap[birthMonth]);

    if (gender === 'male') tags.push('男性');
    else if (gender === 'female') tags.push('女性');

    tags.push(occupation);

    return [...new Set(tags)];
}

export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
}
