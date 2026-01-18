# Technical Overview

This document provides a technical deep-dive into Proofly's architecture, smart contracts, and implementation details.

## Architecture

Proofly is built as a decentralized application (dApp) with three main layers:

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  - UI/UX Layer                      │
│  - Wallet Integration               │
│  - Client-side Hashing              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Blockchain Layer (Base)        │
│  - Smart Contract                   │
│  - Event Emission                   │
│  - Immutable Storage                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Indexing Layer                │
│  - Event Parsing                    │
│  - Local Caching                    │
│  - Global Sync                      │
└─────────────────────────────────────┘
```

## Smart Contract

### Contract Details

- **Name**: Proofly
- **Address**: `0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06`
- **Network**: Base Mainnet (Chain ID: 8453)
- **Language**: Solidity ^0.8.0
- **License**: MIT

### Core Functions

#### `anchorProof(bytes32 proofHash)`

Anchors a proof hash to the blockchain.

**Parameters**:
- `proofHash`: Keccak-256 hash of the proof content

**Returns**: None (emits event)

**Reverts if**:
- Hash is zero (`0x0`)
- Hash already exists (duplicate)

**Gas Cost**: ~45,000 gas (~$0.01 USD)

**Example**:
```solidity
bytes32 hash = keccak256(abi.encodePacked("My commitment"));
proofly.anchorProof(hash);
```

#### `proofExists(bytes32 proofHash)`

Checks if a proof hash exists on-chain.

**Parameters**:
- `proofHash`: Hash to verify

**Returns**: `bool` - true if exists, false otherwise

**Example**:
```solidity
bool exists = proofly.proofExists(hash);
```

### Events

#### `ProofAnchored`

Emitted when a proof is successfully anchored.

```solidity
event ProofAnchored(
    bytes32 indexed proofHash,
    address indexed creator,
    uint256 timestamp
);
```

**Parameters**:
- `proofHash`: The anchored hash (indexed)
- `creator`: Wallet address of creator (indexed)
- `timestamp`: Block timestamp

### Security Features

1. **Immutability**: No functions to modify or delete proofs
2. **No Owner**: Contract has no admin or owner functions
3. **Duplicate Prevention**: Reverts if hash already exists
4. **Zero Hash Protection**: Prevents anchoring empty hashes
5. **Gas Optimization**: Minimal storage, efficient operations

## Frontend Architecture

### Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Web3**: viem library
- **AI**: Google Gemini 1.5 Flash
- **State**: React hooks (useState, useEffect, useRef)

### Key Components

#### `App.tsx`
Main application component handling:
- Wallet connection
- View routing
- Global state management
- Event fetching and caching

#### `PromiseForm.tsx`
Proof creation interface:
- Content input and validation
- Template selection
- AI witness generation
- Transaction submission

#### `Wall.tsx`
Proof display component:
- Receipt rendering
- Status updates
- Masking controls
- Share functionality

#### `Verifier.tsx`
Integrity checking tool:
- Hash verification
- Content validation
- On-chain confirmation

### Data Flow

```
User Input → Client Hash → AI Witness → Metadata Encoding
     ↓
Transaction Creation → Wallet Signature → Blockchain Submit
     ↓
Event Emission → Event Parsing → Local Cache → UI Update
```

## Cryptography

### Hashing Algorithm

Proofly uses **Keccak-256** (same as Ethereum):

```typescript
import { keccak256, toBytes } from 'viem';

const hash = keccak256(toBytes(content));
// Returns: 0x... (32-byte hash)
```

### Why Keccak-256?

- ✅ Industry standard (Ethereum native)
- ✅ Collision resistant
- ✅ Deterministic (same input = same hash)
- ✅ One-way function (irreversible)
- ✅ Fast computation

### Hash Properties

- **Length**: 32 bytes (64 hex characters)
- **Format**: `0x` + 64 hex digits
- **Example**: `0x7465737...48617368`

## Data Storage

### On-Chain Storage

Only the **hash** is stored on-chain:

```solidity
mapping(bytes32 => bool) public proofs;
```

**Storage Cost**: ~20,000 gas per proof

### Off-Chain Metadata

Full metadata is stored in **transaction calldata**:

```typescript
{
  content: string,      // Original commitment
  category: string,     // Template category
  deadline: string,     // Optional deadline
  isAnonymous: boolean, // Privacy flag
  witnessStatement: string // AI witness
}
```

**Encoding**: UTF-8 string in calldata

### Local Caching

```typescript
localStorage.setItem('proofly_receipts_v1', JSON.stringify(receipts));
localStorage.setItem('proofly_global_cache', JSON.stringify(globalReceipts));
```

**Cache Invalidation**: 60-second refresh interval

## Event Indexing

### Fetching Events

```typescript
const logs = await publicClient.getLogs({
  address: CONTRACT_ADDRESS,
  event: parseAbiItem('event ProofAnchored(bytes32 indexed, address indexed, uint256)'),
  fromBlock: 0n,
  toBlock: 'latest'
});
```

### Parsing Metadata

```typescript
const tx = await publicClient.getTransaction({ hash: log.transactionHash });
const decoded = decodeCalldata(tx.input);
const metadata = JSON.parse(decoded);
```

### Status Updates

Status changes are tracked via special calldata messages:

```typescript
`FULFILLED:${proofHash}` // Marks proof as fulfilled
`VOIDED:${proofHash}`    // Marks proof as voided
```

## Network Configuration

### Base Mainnet

```typescript
{
  chainId: 8453,
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  }
}
```

### RPC Endpoints (Fallback Order)

1. `https://mainnet.base.org`
2. `https://base-mainnet.public.blastapi.io`
3. `https://1rpc.io/base`
4. `https://base.llamarpc.com`

## Security Implementation

### Input Sanitization

```typescript
export const sanitize = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .trim()
    .slice(0, 1000); // Max 1000 chars
};
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self' https:; 
           script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com;
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;">
```

### Wallet Security

- ✅ No private key storage
- ✅ All signing via wallet
- ✅ Transaction preview before signing
- ✅ Network validation

## Performance Optimization

### Gas Optimization

- Minimal on-chain storage (hash only)
- Efficient mapping structure
- No loops or complex operations
- Optimized event emission

### Frontend Optimization

- Lazy loading components
- Debounced search
- Cached global events
- Optimistic UI updates
- Virtual scrolling for large lists

### Caching Strategy

```typescript
// Instant cache load
const cached = localStorage.getItem('proofly_global_cache');
if (cached) setGlobalReceipts(JSON.parse(cached));

// Background refresh
fetchGlobalEvents();

// Periodic sync (60s)
setInterval(fetchGlobalEvents, 60000);
```

## API Integration

### Google Gemini AI

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  }
);
```

**Purpose**: Generate witness statements

**Model**: gemini-1.5-flash

**Rate Limit**: 15 RPM (free tier)

## Deployment

### Build Process

```bash
npm run build
# Outputs to /dist
```

### Environment Variables

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### Hosting

- **Platform**: Vercel
- **Domain**: proofly.vercel.app
- **SSL**: Automatic (Vercel)
- **CDN**: Global edge network

## Testing

### Local Development

```bash
npm run dev
# Runs on http://localhost:3004
```

### Network Testing

- Use Base Sepolia testnet for testing
- Get test ETH from Base faucet
- Deploy test contract if needed

## Future Enhancements

- [ ] IPFS integration for metadata
- [ ] Multi-chain support
- [ ] Proof templates marketplace
- [ ] Social features (likes, comments)
- [ ] Proof collections/categories
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Proof NFT minting

---

**Questions?** Join our [Discord](https://discord.gg/proofly) or check the [FAQ](./faq.md)
