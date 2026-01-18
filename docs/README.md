# Proofly Documentation

Welcome to the official Proofly documentation. Proofly is a decentralized commitment protocol built on Base blockchain that allows users to create immutable, cryptographically-sealed proofs of their promises and commitments.

## 📚 Documentation Index

- [Getting Started](./getting-started.md) - Quick start guide for new users
- [User Guide](./user-guide.md) - Complete guide to using Proofly
- [Technical Overview](./technical-overview.md) - Architecture and technical details
- [Smart Contract](./smart-contract.md) - Contract documentation and verification
- [API Reference](./api-reference.md) - Developer API documentation
- [Security](./security.md) - Security features and best practices
- [FAQ](./faq.md) - Frequently asked questions

## 🚀 Quick Links

- **Website**: [https://proofly.vercel.app](https://proofly.vercel.app)
- **Contract**: [0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06](https://basescan.org/address/0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06)
- **Network**: Base Mainnet (Chain ID: 8453)
- **GitHub**: [https://github.com/yasintmx7/baseproofs](https://github.com/yasintmx7/baseproofs)

## 🎯 What is Proofly?

Proofly is a **public ledger of human word** - a protocol that transforms your commitments into immutable, verifiable proofs anchored on the Base blockchain. Think of it as a digital notary that permanently seals your promises with cryptographic certainty.

### Core Features

- ✅ **Immutable Proofs** - Once sealed, forever on-chain
- ✅ **Privacy Controls** - Mask content from public view
- ✅ **AI-Powered Witnesses** - Automated proof authentication
- ✅ **Zero Trust** - Fully decentralized, no admin control
- ✅ **Gas Optimized** - Low-cost anchoring on Base L2
- ✅ **Transparent** - All data verifiable on BaseScan

## 🔑 Key Concepts

### Proof
A cryptographically hashed commitment anchored to the blockchain. Contains:
- **Content**: Your promise or statement
- **Hash**: Keccak-256 cryptographic fingerprint
- **Timestamp**: Immutable proof of when it was created
- **Status**: Active, Fulfilled, or Voided
- **Deadline**: Optional commitment deadline

### Anchoring
The process of sealing your proof on-chain by:
1. Hashing your content (Keccak-256)
2. Generating AI witness statement
3. Encoding metadata in transaction calldata
4. Submitting hash to smart contract
5. Receiving permanent on-chain record

### Verification
Anyone can verify a proof by:
- Checking if a hash exists on-chain
- Validating content matches the hash
- Viewing transaction on BaseScan
- Confirming timestamp and metadata

## 💡 Use Cases

### Personal
- Track goals and habits
- Create accountability for commitments
- Document important life decisions

### Professional
- Timestamp project milestones
- Create verifiable work commitments
- Document agreements

### Financial
- Track savings goals
- Document investment decisions
- Create financial accountability

### Legal/Compliance
- Timestamp important statements
- Create verifiable records
- Prove document existence

## 🛡️ Security

Proofly implements multiple security layers:

- **Smart Contract**: Immutable, no admin keys, duplicate prevention
- **Frontend**: Input sanitization, CSP headers, no private key storage
- **Privacy**: Client-side hashing, selective revelation, persistent masking
- **Blockchain**: Base L2 security, Ethereum-grade finality

## 🌟 Why Proofly?

1. **Permanent** - Your word, forever on Base
2. **Trustless** - No central authority
3. **Transparent** - Fully verifiable on-chain
4. **Private** - Control what's public
5. **Affordable** - Low gas fees on Base
6. **Fast** - Instant confirmation on L2

## 📖 Next Steps

- Read the [Getting Started Guide](./getting-started.md)
- Explore the [User Guide](./user-guide.md)
- Check out the [Technical Overview](./technical-overview.md)
- Join our [Discord](https://discord.gg/proofly)
- Follow us on [X](https://x.com/proofly)

---

**Built with ❤️ on Base** | [Website](https://proofly.vercel.app) | [GitHub](https://github.com/yasintmx7/baseproofs) | [Discord](https://discord.gg/proofly)
