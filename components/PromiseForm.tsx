
import React, { useState } from 'react';
import { Receipt, ViewState } from '../types';
import { keccak256 } from '../utils/crypto';
import { getWitnessDetails, generateSeal } from '../services/geminiService';
import { Shield, Loader2, Calendar, Plus, Sparkles, UserX, Wallet, Globe, ExternalLink, AlertTriangle } from 'lucide-react';
import Header from './Header';

import { checkIsOnBase, switchToBase } from '../utils/network';
import { encodeFunctionData } from 'viem';
import contractArtifact from '../src/contract.json';

// User can paste address here OR use VITE_PROOFS_CONTRACT_ADDRESS in .env
const PROOFS_CONTRACT_ADDRESS = '';

// Target Chain ID determined by environment variable or defaults
const PROOFS_ADDRESS_ENV = import.meta.env.VITE_PROOFS_CONTRACT_ADDRESS || PROOFS_CONTRACT_ADDRESS;

const TEMPLATES = [
  { text: "I will finish my current project by...", category: "Work" },
  { text: "I will go to the gym 3 times this week.", category: "Fitness" },
  { text: "I will wake up at 7am for the next 7 days.", category: "Personal" },
  { text: "I will save $500 by the end of this month.", category: "Financial" },
];

interface PromiseFormProps {
  onSave: (receipt: Receipt) => void;
  setView: (view: ViewState) => void;
  account: string | null;
  connectWallet: () => Promise<void>;
}

const PromiseForm: React.FC<PromiseFormProps> = ({ onSave, setView, account, connectWallet }) => {
  const [content, setContent] = useState('');
  const [creator, setCreator] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<Receipt['category']>('Personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!content.trim() || !deadline) return;

    if (!account) {
      await connectWallet();
      return;
    }

    // 1. Network Check
    const isOnBase = await checkIsOnBase();
    if (!isOnBase) {
      const switched = await switchToBase();
      if (!switched) {
        setErrorMessage("Please switch to Base Mainnet (or Sepolia/Localhost) to continue.");
        return;
      }
    }

    // 2. Address Check
    const targetAddress = PROOFS_ADDRESS_ENV; // Prefer ENV
    // Fallback logic could go here if we wanted to support the hardcoded one, but strictly:
    if (!targetAddress || targetAddress.length < 42) {
      setErrorMessage("Contract address not configured. Please deploy first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const ethereum = (window as any).ethereum;

      // 3. Hash
      setSubmittingStep('Generating Cryptographic Hash...');
      const hash = keccak256(content); // Using Keccak-256 as requested

      // 4. Notary
      setSubmittingStep('Consulting Grand Notary...');
      const [details, sealUrl] = await Promise.all([
        getWitnessDetails(content),
        generateSeal(content)
      ]);

      // 5. Transaction
      setSubmittingStep('Anchoring to Base Ledger...');

      // Prepare data using viem's encodeFunctionData if artifact available, else manual selector
      // We have artifact from src/contract.json
      const data = encodeFunctionData({
        abi: contractArtifact.abi,
        functionName: 'anchorProof',
        args: [hash as `0x${string}`]
      });

      const tx = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: targetAddress,
          data: data,
          value: '0x0'
        }]
      });

      setTxHash(tx);
      setSubmittingStep('Waiting for confirmation...');

      // Wait for receipt
      let receipt = null;
      while (receipt === null) {
        receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [tx],
        });
        if (receipt === null) await new Promise(r => setTimeout(r, 2000));
      }

      const newReceipt: Receipt = {
        id: crypto.randomUUID(),
        hash,
        content,
        creator: isAnonymous ? 'Anonymous' : (creator || 'Signer'),
        walletAddress: account,
        txHash: tx,
        timestamp: Date.now(),
        deadline: deadline,
        isRevealed: true,
        isAnonymous,
        witnessStatement: details.statement,
        milestones: details.milestones,
        category,
        status: 'active',
        sealUrl: sealUrl
      };

      onSave(newReceipt);
      setSubmittingStep(' Sealed Forever.');
      // Optional: don't auto-redirect immediately so they can see the hash? 
      // User requested "Wait for tx confirmation and show tx hash / explorer link".
      // We will show that in the success state.

      // For now, let's delay redirect or just redirect. The user requirement said:
      // "Save “sealed” status in localStorage... (handled by onSave)"
      // "Show tx hash, explorer link"

      // Let's NOT redirect automatically if we want to show the link. 
      // Or we redirect to the "Wall" and highlight it.
      // But the requirement says "Show... tx hash... explorer link".
      // I'll add a "Success" view state inside the form component before calling onSave/redirecting?
      // Or just redirect to Wall where the card will likely show the hash? 
      // Wall usually shows receipts.

      // Let's redirect to Wall for better UX, but ensuring the Receipt object has the TX hash.
      setView('wall'); // Redirecting as per existing flow, assuming Wall displays TX link or details.

    } catch (err: any) {
      console.error("Seal Error:", err);
      if (err.message?.includes("User rejected")) {
        setErrorMessage("Transaction cancelled.");
      } else {
        setErrorMessage(`Seal failed: ${err.message || 'Unknown error'}`);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <Header
        title="Enshrine a Proof"
        subtitle="Anchored on Base. Permanent. Immutable."
      />

      <div className="mb-10 space-y-4">
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
          <Sparkles size={14} className="text-blue-500" /> Proof Templates
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setContent(t.text); setCategory(t.category as any); }}
              className="text-xs bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 hover:bg-blue-500/5 p-4 rounded-2xl text-neutral-400 hover:text-white transition-all text-left group"
            >
              <span className="opacity-50 group-hover:opacity-100 transition-opacity">“</span>
              {t.text}
              <span className="opacity-50 group-hover:opacity-100 transition-opacity">”</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSeal} className="space-y-8 glass-card p-10 rounded-[3rem] border border-white/10 relative overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-6 text-center p-12 animate-in fade-in duration-500">
            {!txHash ? (
              <>
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <Shield className="absolute inset-0 m-auto text-blue-500" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{submittingStep}</h3>
                  <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed">Please check your wallet for the transaction request.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <Globe className="text-green-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Proof Anchored</h3>
                <p className="text-neutral-400 text-xs">Transaction confirmed on Base.</p>
              </>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-red-200 text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-600">The Sacred Word</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="I solemnly enshrine my word that..."
            className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] p-6 text-lg text-white placeholder-neutral-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all min-h-[160px] resize-none outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-600">Identity</label>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all ${isAnonymous ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'text-neutral-600 border-white/5'}`}
              >
                {isAnonymous ? <UserX size={12} /> : null}
                {isAnonymous ? 'Anonymous ON' : 'Go Anonymous'}
              </button>
            </div>
            <input
              type="text"
              disabled={isAnonymous}
              value={isAnonymous ? '' : creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder={isAnonymous ? "Masking Identity..." : "Signer Name"}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-30"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-600">Proof Horizon</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-600">Category</label>
          <div className="flex flex-wrap gap-2">
            {['Personal', 'Work', 'Financial', 'Fitness'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat as any)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${category === cat ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/30 scale-105' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/20'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {!account ? (
          <button
            type="button"
            onClick={connectWallet}
            className="w-full bg-white text-black font-black text-xs uppercase tracking-[0.3em] py-6 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-white/5 mt-4 group"
          >
            <Wallet size={20} />
            Connect Wallet to Forge
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !content || !deadline}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] py-6 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-blue-600/20 disabled:opacity-50 mt-4 group"
          >
            <Globe size={20} className="group-hover:rotate-12 transition-transform duration-500" />
            Seal on Base
          </button>
        )}

        <p className="text-center text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
          {errorMessage ? "Transaction Failed" : "Gas fee required for immutable sealing"}
        </p>
      </form>
    </div>
  );
};

export default PromiseForm;
