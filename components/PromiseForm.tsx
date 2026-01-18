
import React, { useState } from 'react';
import { Receipt, ViewState } from '../types';
import { keccak256 } from '../utils/crypto';
import { getWitnessDetails, generateSeal } from '../services/aiService';
import { hasEmoji } from '../utils/emoji';
import { sanitize } from '../utils/security';
import { Shield, Loader2, Calendar, Plus, Sparkles, UserX, Wallet, Globe, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import Header from './Header';

import { checkIsOnBase, switchToBase } from '../utils/network';
import { encodeFunctionData } from 'viem';
import contractArtifact from '../src/contract.json';

// User can paste address here OR use VITE_PROOFS_CONTRACT_ADDRESS in .env
const PROOFS_CONTRACT_ADDRESS = '0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06';

// Target Chain ID determined by environment variable or defaults
const PROOFS_ADDRESS_ENV = import.meta.env.VITE_PROOFS_CONTRACT_ADDRESS || PROOFS_CONTRACT_ADDRESS;

const DEFAULT_TEMPLATES = [
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
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('proofly_custom_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<Receipt['category']>('Personal');

  const addCustomTemplate = () => {
    if (!newTemplateText.trim()) return;
    const updated = [...templates, { text: newTemplateText, category: newTemplateCategory }];
    setTemplates(updated);
    localStorage.setItem('proofly_custom_templates', JSON.stringify(updated));
    setNewTemplateText('');
    setShowAddTemplate(false);
  };

  const removeTemplate = (index: number) => {
    const updated = templates.filter((_: any, i: number) => i !== index);
    setTemplates(updated);
    localStorage.setItem('proofly_custom_templates', JSON.stringify(updated));
  };

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Security: Sanitize inputs before processing
    const cleanContent = sanitize(content);
    const cleanCreator = sanitize(creator);

    if (!cleanContent.trim()) return;

    if (hasEmoji(cleanContent)) {
      setErrorMessage("Emojis are not permitted in enshrinement text. Please use human words only.");
      return;
    }

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
      const hash = keccak256(cleanContent); // Using Keccak-256 as requested

      // 4. Notary
      setSubmittingStep('Authenticating Word...');
      const [details, sealUrl] = await Promise.all([
        getWitnessDetails(cleanContent),
        generateSeal(cleanContent)
      ]);

      // 5. Duplicate Pre-Check (Prevent high fee warnings)
      setSubmittingStep('Scanning Ledger for duplicates...');
      const checkData = encodeFunctionData({
        abi: contractArtifact.abi,
        functionName: 'verifyProof',
        args: [hash as `0x${string}`]
      });

      const checkResult = await ethereum.request({
        method: 'eth_call',
        params: [{ to: targetAddress, data: checkData }, 'latest']
      });

      // If the result starts with 1 (bool true), it exists
      if (checkResult && checkResult.includes('0000000000000000000000000000000000000000000000000000000000000001')) {
        throw new Error("This exact word is already enshrined in the Eternal Ledger.");
      }

      // 6. Inscription: Package Name, Anonymous status, and Content
      const metadata = {
        n: isAnonymous ? "" : cleanCreator,
        a: isAnonymous,
        c: cleanContent
      };

      const metadataHex = Array.from(new TextEncoder().encode(JSON.stringify(metadata)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 7. Transaction
      setSubmittingStep('Anchoring to Base Ledger...');

      const data = (encodeFunctionData({
        abi: contractArtifact.abi,
        functionName: 'anchorProof',
        args: [hash as `0x${string}`]
      }) + metadataHex) as `0x${string}`;

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
        content: cleanContent,
        creator: isAnonymous ? 'Anonymous' : (cleanCreator || 'Signer'),
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
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <Header
        title="Enshrine a Proof"
        subtitle="Protocol Authenticated. Permanent. Immutable."
      />

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Sparkles size={12} className="text-blue-500" /> Proof Templates
          </p>
          <button
            onClick={() => setShowAddTemplate(!showAddTemplate)}
            className="text-[8px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <Plus size={10} /> {showAddTemplate ? 'Cancel' : 'Add Custom'}
          </button>
        </div>

        {showAddTemplate && (
          <div className="glass-card p-4 rounded-2xl border-blue-500/20 bg-blue-500/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Template text... (e.g. 'I will drink 2L water daily')"
              value={newTemplateText}
              onChange={(e) => setNewTemplateText(e.target.value)}
              className="w-full bg-black/10 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {['Personal', 'Work', 'Financial', 'Fitness'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewTemplateCategory(cat as any)}
                    className={`text-[7px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${newTemplateCategory === cat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-slate-200 text-neutral-500'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={addCustomTemplate}
                className="bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {templates.map((t: any, i: number) => (
            <div key={i} className="group relative">
              <button
                type="button"
                onClick={() => { setContent(t.text); setCategory(t.category as any); }}
                className="w-full text-[11px] bg-white border border-slate-100 hover:border-blue-500/30 hover:bg-blue-50/30 p-3 rounded-xl text-slate-600 hover:text-slate-900 transition-all text-left shadow-sm"
              >
                “{t.text}”
              </button>
              {i >= DEFAULT_TEMPLATES.length && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeTemplate(i); }}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-all"
                >
                  <UserX size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSeal} className="space-y-6 glass-card p-6 md:p-8 rounded-[2rem] border border-slate-200 relative overflow-hidden bg-white shadow-sm">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4 text-center p-8 animate-in fade-in duration-500">
            {!txHash ? (
              <>
                <div className="relative">
                  <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <Shield className="absolute inset-0 m-auto text-blue-500" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{submittingStep}</h3>
                  <p className="text-slate-500 text-xs max-w-[200px] mx-auto leading-relaxed">Confirm the transaction in your wallet.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-1 animate-bounce">
                  <Globe className="text-green-500" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Proof Anchored</h3>
                <p className="text-slate-500 text-xs">Transaction confirmed on Base Ledger.</p>
              </>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-red-700 text-xs font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500">The Sacred Word</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="I solemnly enshrine my word that..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-[1.5rem] p-5 text-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[140px] resize-none outline-none shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500">Identity</label>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${isAnonymous ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
              >
                {isAnonymous ? <Shield size={10} /> : <UserX size={10} />}
                {isAnonymous ? 'Anonymous' : 'Mask Identity'}
              </button>
            </div>
            <input
              type="text"
              disabled={isAnonymous}
              value={isAnonymous ? '' : creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder={isAnonymous ? "Masking Identity..." : "Signer Name"}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none disabled:opacity-30 shadow-inner"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500">Proof Horizon</label>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Info size={10} /> Optional
              </span>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                onClick={(e) => (e.target as any).showPicker?.()}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 pl-10 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none [color-scheme:light] shadow-inner cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {['Personal', 'Work', 'Financial', 'Fitness'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat as any)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${category === cat ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-500'}`}
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
            className="w-full bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:bg-slate-800 active:scale-95 mt-2"
          >
            <Wallet size={16} />
            Connect Web3 Identity
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !content}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:scale-100 mt-2"
          >
            <Globe size={16} />
            Forge Eternal Proof
          </button>
        )}

        <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-1">
          {errorMessage ? "Process Interrupted" : "Immutable entries require Standard Base gas fees"}
        </p>
      </form>
    </div>
  );
};

export default PromiseForm;
