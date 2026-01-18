# Getting Started with Proofly

This guide will help you create your first proof on Proofly in just a few minutes.

## Prerequisites

- A Web3 wallet (MetaMask or Coinbase Wallet)
- Small amount of ETH on Base Mainnet for gas fees (~$0.01)
- A commitment you want to seal on-chain

## Step 1: Connect Your Wallet

1. Visit [https://proofly.vercel.app](https://proofly.vercel.app)
2. Click **"Connect Identity"** in the sidebar
3. Approve the connection in your wallet
4. Ensure you're on **Base Mainnet** (Chain ID: 8453)
   - If not, Proofly will prompt you to switch networks

## Step 2: Create Your First Proof

1. Click **"Enshrine Proof"** in the sidebar
2. Choose a template or select "Custom"
3. Write your commitment in the text field
4. (Optional) Set a deadline for your commitment
5. (Optional) Click **"Mask Identity"** to create anonymously

### Example Commitments

```
Work: "I will launch my product by March 31, 2026"
Personal: "I will exercise 4 times per week for the next 3 months"
Financial: "I will save $10,000 by December 2026"
Fitness: "I will run a marathon by June 2026"
```

## Step 3: Review & Seal

1. Review your commitment
2. Check the AI-generated witness statement
3. Click **"Seal on Base"**
4. Approve the transaction in your wallet
5. Wait for confirmation (~2 seconds on Base)

### Transaction Details

- **Gas Cost**: ~$0.01 USD
- **Confirmation Time**: 1-2 seconds
- **Network**: Base Mainnet
- **Contract**: `0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06`

## Step 4: View Your Proof

After sealing, you can:

- **View on Global Ledger**: See your proof in the public stream
- **Access My Vault**: View all your personal proofs
- **Share**: Copy the proof link to share with others
- **Verify**: Check your proof on BaseScan

## Understanding Your Proof

Each proof contains:

- **Content**: Your original commitment
- **Hash**: Cryptographic fingerprint (Keccak-256)
- **Timestamp**: When it was created
- **Status**: Active, Fulfilled, or Voided
- **Transaction**: Link to BaseScan
- **Deadline**: Optional commitment deadline

## Privacy Features

### Masking Content

1. Go to **"My Vault"**
2. Find the proof you want to mask
3. Click **"Mask"** button
4. Content is now hidden from global viewers
5. You can still see it with a purple badge

### Anonymous Proofs

- Toggle **"Mask Identity"** before creating
- Your wallet address won't be shown publicly
- Proof is still verifiable on-chain

## Updating Proof Status

You can update your proof status at any time:

1. Go to **"My Vault"**
2. Find your proof
3. Click the status dropdown
4. Select:
   - **Active**: Still working on it
   - **Fulfilled**: Commitment completed ✅
   - **Voided**: Commitment cancelled ❌

## Verifying Proofs

### Verify Your Own Proof

1. Click **"Integrity Check"** in sidebar
2. Enter your proof content or hash
3. Click **"Verify Integrity"**
4. See on-chain confirmation

### Verify Someone Else's Proof

1. Get the proof hash or content
2. Use the Integrity Checker
3. Confirm it exists on-chain
4. View transaction on BaseScan

## Best Practices

### Writing Good Commitments

✅ **DO:**
- Be specific and measurable
- Set realistic deadlines
- Use clear, concise language
- Include success criteria

❌ **DON'T:**
- Use vague language
- Include sensitive personal information
- Make impossible commitments
- Use emojis (they're blocked for security)

### Security Tips

- ✅ Never share your private keys
- ✅ Verify you're on the correct network
- ✅ Double-check commitments before sealing
- ✅ Keep your wallet secure
- ✅ Use strong passwords

## Common Issues

### "Wrong Network" Error

**Solution**: Click the network prompt to switch to Base Mainnet

### Transaction Failed

**Possible causes**:
- Insufficient ETH for gas
- Network congestion
- Duplicate hash (commitment already exists)

**Solution**: Check your ETH balance and try again

### Wallet Not Connecting

**Solution**:
1. Refresh the page
2. Ensure wallet extension is unlocked
3. Try a different browser
4. Clear cache and cookies

## Next Steps

- Explore the [User Guide](./user-guide.md) for advanced features
- Read about [Security](./security.md) best practices
- Check the [FAQ](./faq.md) for common questions
- Join our [Discord](https://discord.gg/proofly) community

## Need Help?

- 📖 Read the [FAQ](./faq.md)
- 💬 Join our [Discord](https://discord.gg/proofly)
- 🐦 Follow us on [X](https://x.com/proofly)
- 📧 Email: support@proofly.io

---

**Ready to seal your word on-chain?** [Start Now →](https://proofly.vercel.app)
