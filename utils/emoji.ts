/**
 * Utility for reliable Emoji detection and extraction.
 * Supports modern Unicode emojis including multi-codepoint sequences (ZWJ, flags, skin tones).
 */

/**
 * Returns true if the string contains at least one emoji.
 * Uses the Extended_Pictographic property which is the most reliable way 
 * to target visual emojis while avoiding symbols like standard numbers.
 */
export const hasEmoji = (str: string): boolean => {
    const emojiRegex = /\p{Extended_Pictographic}/u;
    return emojiRegex.test(str);
};

/**
 * Extracts all emojis from a string as an array.
 * Uses Intl.Segmenter (if available) to correctly handle 
 * complex multi-codepoint emojis (like 👨‍👩‍👧‍👦 or 🇺🇸) as single units.
 */
export const extractEmojis = (str: string): string[] => {
    if (!str) return [];

    // Fallback for environments where Intl.Segmenter is not available
    if (typeof Intl.Segmenter === 'undefined') {
        // This regex targets Emoji_Presentation and Extended_Pictographic units
        const regex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
        return str.match(regex) || [];
    }

    // Best practice: Use grapheme segmentation
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = segmenter.segment(str);
    const emojis: string[] = [];

    for (const { segment } of segments) {
        if (hasEmoji(segment)) {
            emojis.push(segment);
        }
    }

    return emojis;
};

/**
 * Examples:
 * 
 * const text = "Hello! 👨‍👩‍👧‍👦 🇺🇸 🤣🤣🤣";
 * 
 * console.log(hasEmoji(text)); // true
 * console.log(extractEmojis(text)); // ["👨‍👩‍👧‍👦", "🇺🇸", "🤣🤣🤣"]
 */
