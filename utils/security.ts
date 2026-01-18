/**
 * Security Utility for Proofly
 * Handles input sanitization, cache validation, and XSS prevention.
 */

import { Receipt } from '../types';

/**
 * Validates whether an object is a valid Receipt.
 * Prevents malicious data injection from localStorage.
 */
export function validateReceipt(data: any): data is Receipt {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.id === 'string' &&
        typeof data.hash === 'string' &&
        typeof data.content === 'string' &&
        typeof data.walletAddress === 'string' &&
        typeof data.timestamp === 'number' &&
        ['active', 'fulfilled', 'voided'].includes(data.status)
    );
}

/**
 * Sanitizes strings for UI display.
 * Strips script tags and basic XSS vectors.
 */
export function sanitize(text: string): string {
    if (!text) return '';
    return text
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/on\w+="[^"]*"/gmi, '')
        .replace(/javascript:[^"]*/gmi, '')
        .trim();
}

/**
 * Validates a batch of receipts from cache.
 */
export function validateReceipts(data: any): Receipt[] {
    if (!Array.isArray(data)) return [];
    return data.filter(validateReceipt);
}
