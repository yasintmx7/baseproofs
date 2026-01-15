
import { keccak256 as viemKeccak256, toHex, toBytes } from 'viem';



/**
 * Generates a Keccak-256 hash of a string (Ethereum standard).
 */
export function keccak256(message: string): string {
  // Convert string to bytes, then hash
  return viemKeccak256(toBytes(message));
}

/**
 * Shortens a hash for display.
 */
export function shortenHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}
