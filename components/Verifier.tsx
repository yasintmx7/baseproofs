
import React, { useState } from 'react';
import { Receipt, VerificationResult } from '../types';
import { keccak256, shortenHash } from '../utils/crypto';
import { CheckCircle2, XCircle, Search, ShieldCheck, Loader2, Database, AlertCircle } from 'lucide-react';
import Header from './Header';

interface VerifierProps {
  receipts: Receipt[];
}

const Verifier: React.FC<VerifierProps> = ({ receipts }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsVerifying(true);
    setResult(null);

    // Smooth timing for better "processing" feel
    await new Promise(r => setTimeout(r, 1500));

    const hash = keccak256(input.trim());
    const matched = receipts.find(r => r.hash === hash);

    setResult({
      match: !!matched,
      receipt: matched
    });
    setIsVerifying(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <Header
        title="Integrity Check"
        subtitle="Validate the authenticity of a claim against the public record."
      />

      <div className="space-y-8">
        <form onSubmit={handleVerify} className="glass-card p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-600">Claim for Verification</label>
              <Database size={16} className="text-blue-500 group-hover:rotate-12 transition-transform" />
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setResult(null);
              }}
              placeholder="Paste the original word exactly as it was posten..."
              className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] p-6 text-white text-base focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[160px] resize-none"
            />
            <button
              disabled={isVerifying || !input}
              className="w-full bg-white text-black font-black text-xs uppercase tracking-[0.3em] py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-50 transition-all disabled:opacity-50 shadow-2xl shadow-white/5 active:scale-95"
            >
              {isVerifying ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Execute Integrity Check
            </button>
          </div>
        </form>

        {result && (
          <div className={`p-8 rounded-[2.5rem] border animate-in zoom-in-95 duration-500 ${result.match ? 'bg-green-500/[0.03] border-green-500/20 shadow-2xl shadow-green-500/5' : 'bg-red-500/[0.03] border-red-500/20 shadow-2xl shadow-red-500/5'}`}>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="shrink-0">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${result.match ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                  {result.match ? (
                    <CheckCircle2 className="text-green-500" size={32} />
                  ) : (
                    <XCircle className="text-red-500" size={32} />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 tracking-tight ${result.match ? 'text-green-500' : 'text-red-500'}`}>
                  {result.match ? 'AUTHENTICITY VERIFIED' : 'INTEGRITY BREACH'}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                  {result.match
                    ? `Input detected. Cryptographic match successful with a record created by ${result.receipt?.creator} on ${new Date(result.receipt?.timestamp || 0).toLocaleDateString()}.`
                    : 'The provided text does not match any known entry. A single character difference (space, capital, symbol) will invalidate the verification.'}
                </p>

                {result.match && result.receipt && (
                  <div className="bg-black/60 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Creator</span>
                      <span className="text-xs text-white font-bold">{result.receipt.creator}</span>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Keccak-256 Digest</span>
                      <div className="p-3 bg-neutral-900/50 rounded-xl text-[10px] text-blue-400 font-mono break-all border border-white/[0.03]">
                        {result.receipt.hash}
                      </div>
                    </div>
                  </div>
                )}

                {!result.match && (
                  <div className="flex items-center gap-2 text-red-500/50 text-[10px] font-bold uppercase tracking-widest mt-4">
                    <AlertCircle size={14} /> Critical Match Failure
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verifier;
