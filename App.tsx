
import React, { useState, useEffect } from 'react';
import { PlusCircle, ShieldCheck, History, Menu, X, Search, Sparkles, Wallet, Globe, ArrowRight, User, Lock, LogOut, ChevronDown, Activity, RefreshCw } from 'lucide-react';
import { checkIsOnBase, switchToBase, BASE_MAINNET_ID, BASE_SEPOLIA_ID, LOCALHOST_ID, TARGET_CHAIN_ID } from './utils/network';
import { createPublicClient, http, parseAbiItem, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import PromiseForm from './components/PromiseForm';
import Wall from './components/Wall';
import Verifier from './components/Verifier';
import Header from './components/Header';
import Deployer from './components/Deployer';
import { Receipt, ViewState } from './types';
import { validateReceipts } from './utils/security';
import contractArtifact from './src/contract.json';
// @ts-ignore
import sdk from '@farcaster/frame-sdk';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('wall');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [globalReceipts, setGlobalReceipts] = useState<Receipt[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const updateChainId = async () => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      setCurrentChainId(chainId);
    }
  };

  useEffect(() => {
    // Signal readiness to Farcaster/Base
    sdk.actions.ready();

    const saved = localStorage.getItem('baseproofs_receipts_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReceipts(validateReceipts(parsed));
      } catch (e) {
        console.error("Failed to load receipts", e);
      }
    }

    const ethereum = (window as any).ethereum;
    if (ethereum) {
      ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      });

      ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) setAccount(accounts[0]);
        });

      updateChainId();
    }
    fetchGlobalEvents();

    // Periodic refresh every 60 seconds
    const interval = setInterval(fetchGlobalEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchGlobalEvents = async () => {
    if (isGlobalLoading) return;
    setIsGlobalLoading(true);

    // 1. Instant Cache Load
    const cached = localStorage.getItem('baseproofs_global_cache');
    if (cached && globalReceipts.length === 0) {
      try {
        const parsed = JSON.parse(cached);
        setGlobalReceipts(validateReceipts(parsed));
      } catch (e) { }
    }

    const rpcUrls = [
      'https://base.llamarpc.com',
      'https://1rpc.io/base',
      'https://mainnet.base.org',
      'https://base-mainnet.public.blastapi.io'
    ];

    let success = false;
    for (const rpcUrl of rpcUrls) {
      if (success) break;
      try {
        const contractAddress = '0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06';
        const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });

        // 2. Optimized Log Fetch (last 500k blocks)
        const currentBlock = await publicClient.getBlockNumber();
        const logs = await publicClient.getLogs({
          address: contractAddress as `0x${string}`,
          event: parseAbiItem('event ProofAnchored(address indexed creator, bytes32 indexed proofHash, uint256 timestamp)'),
          fromBlock: currentBlock - 500000n,
          toBlock: 'latest'
        });

        // 3. Ultra-Fast Parallel Processing
        const statusUpdates: any[] = [];
        const parsedLogs: (Receipt | null)[] = await Promise.all(logs.map(async (log: any) => {
          const { creator, proofHash, timestamp } = log.args;

          // Re-use current memory if exists
          const existing = globalReceipts.find(r => r.hash === proofHash);
          if (existing) return existing;

          let inscribedContent = "Protocol Anchored Proof";
          let isAnon = true;
          let inscribedName = "";
          let finalStatus: Receipt['status'] = 'active';

          try {
            const tx = await publicClient.getTransaction({ hash: log.transactionHash });
            if (tx.input && tx.input.length > 74) {
              const rawHex = tx.input.slice(74);
              const bytes = new Uint8Array(rawHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
              const decoded = new TextDecoder().decode(bytes);

              if (decoded.includes('STATUS:')) {
                statusUpdates.push({ msg: decoded, creator });
                return null;
              }

              try {
                const meta = JSON.parse(decoded);
                inscribedContent = meta.c || inscribedContent;
                isAnon = meta.a;
                inscribedName = meta.n || "";
              } catch (e) {
                const jsonMatches = decoded.match(/\{[\s\S]*?\}/g);
                if (jsonMatches) {
                  try {
                    const meta = JSON.parse(jsonMatches[0].trim());
                    inscribedContent = meta.c || inscribedContent;
                    isAnon = meta.a !== undefined ? meta.a : isAnon;
                    inscribedName = meta.n || inscribedName;
                  } catch (err) { }
                } else {
                  const cleaned = decoded.replace(/[\x00-\x1F\x7F-\x9F\uFFFD\u200B-\u200D\uFEFF]/g, '').trim();
                  if (cleaned.length > 5) inscribedContent = cleaned;
                }
              }
            }
          } catch (e) { }

          // FILTER JUNK
          const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u;
          const symbolDensity = (inscribedContent.match(/[^\w\s\u00C0-\u017F]/g) || []).length / (inscribedContent.length || 1);
          if (emojiRegex.test(inscribedContent) || inscribedContent.includes("🤣") || (inscribedContent.length > 250 && symbolDensity > 0.3) || inscribedContent.includes('\uFFFD')) return null;

          return {
            id: log.transactionHash,
            hash: proofHash,
            content: inscribedContent,
            creator: inscribedName || (isAnon ? "Anonymous" : creator),
            walletAddress: creator,
            txHash: log.transactionHash,
            timestamp: Number(timestamp) * 1000,
            deadline: '',
            isRevealed: true,
            isAnonymous: isAnon,
            witnessStatement: "Protocol Authenticated Proof",
            category: 'Other',
            status: finalStatus
          } as Receipt;
        }));

        const finalResults = (parsedLogs.filter(r => r !== null) as Receipt[]).map(r => {
          const update = statusUpdates.find(u =>
            u.creator?.toLowerCase() === r.walletAddress?.toLowerCase() &&
            (u.msg.includes(`FULFILLED:${r.hash}`) || u.msg.includes(`VOIDED:${r.hash}`))
          );
          if (update) {
            r.status = update.msg.includes('FULFILLED') ? 'fulfilled' : 'voided';
          }
          return r;
        }).sort((a, b) => b.timestamp - a.timestamp);

        setGlobalReceipts(finalResults);
        localStorage.setItem('baseproofs_global_cache', JSON.stringify(finalResults));
        success = true;
      } catch (err) {
        console.warn(`RPC Fail: ${rpcUrl}`);
      }
    }
    setIsGlobalLoading(false);
  };

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) {
        console.error("User rejected connection");
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  const handleNetworkSwitch = async (id: string) => {
    try {
      await switchToBase(id);
    } catch (err) {
      console.error("Switch failed", err);
    }
  };

  const saveReceipt = (receipt: Receipt) => {
    const newReceipts = [receipt, ...receipts];
    setReceipts(newReceipts);
    localStorage.setItem('baseproofs_receipts_v1', JSON.stringify(newReceipts));
  };

  const updateStatus = async (id: string, status: Receipt['status']) => {
    // 1. Update Local Storage
    const newReceipts = receipts.map(r => r.id === id ? { ...r, status } : r);
    setReceipts(newReceipts);
    localStorage.setItem('baseproofs_receipts_v1', JSON.stringify(newReceipts));

    // 2. Broadcast to Blockchain (Global Sync) - Low Gas (<$0.01)
    const proof = receipts.find(r => r.id === id);
    if (proof && account) {
      // Inscribe a new anchor with the status update
      const statusUpdate = `STATUS:${status.toUpperCase()}:${proof.hash}:${Date.now()}`;
      const hexUpdate = Array.from(new TextEncoder().encode(statusUpdate))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create a UNIQUE random hash for this transaction so it NEVER reverts
      const uniqueStatusId = '0x' + Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const data = (encodeFunctionData({
        abi: contractArtifact.abi,
        functionName: 'anchorProof',
        args: [uniqueStatusId as `0x${string}`]
      }) + hexUpdate) as `0x${string}`;

      const ethereum = (window as any).ethereum;
      if (ethereum) {
        try {
          await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: account,
              to: '0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06',
              data,
              value: '0x0'
            }]
          });
        } catch (e) {
          console.error("Global status broadcast failed", e);
        }
      }
    }
  };

  const toggleReveal = (id: string) => {
    const newReceipts = receipts.map(r => r.id === id ? { ...r, isRevealed: !r.isRevealed } : r);
    setReceipts(newReceipts);
    localStorage.setItem('baseproofs_receipts_v1', JSON.stringify(newReceipts));
  };

  const renderConnectGate = (title: string, desc: string) => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 animate-in fade-in zoom-in-95 duration-1000">
      <div className="relative mb-10">
        <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 float-anim relative z-10">
          <Lock className="text-blue-500" size={32} />
        </div>
        <div className="absolute -inset-4 bg-blue-600/10 blur-2xl rounded-full animate-pulse -z-0" />
      </div>

      <div className="max-w-md text-center">
        <h2 className="text-3xl md:text-5xl font-black text-[var(--brand-navy)] mb-6 tracking-tighter leading-tight italic uppercase">
          {title}
        </h2>
        <p className="text-slate-500 text-lg mb-12 leading-relaxed">
          {desc}
        </p>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={connectWallet}
            className="group relative flex items-center gap-4 bg-white text-black px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-50 transition-all shadow-2xl shadow-white/10 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Wallet size={20} className="relative z-10" />
            <span className="relative z-10">Connect Identity</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform relative z-10" />
          </button>

          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em]">
            Immutable Ledger Protocol v1.0
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    const allReceipts = [...receipts];
    globalReceipts.forEach(global => {
      const exists = allReceipts.find(r => r.hash === global.hash);
      if (!exists) allReceipts.push(global);
    });

    switch (view) {
      case 'wall':
        return <Wall receipts={allReceipts} onToggleReveal={toggleReveal} onUpdateStatus={updateStatus} setView={setView} account={account} isGlobalLoading={isGlobalLoading} />;
      case 'verify':
        return <Verifier receipts={receipts} />;
      case 'personal':
        if (!account) return renderConnectGate("Your Private Vault", "To view your personal commitments and finalize your results, you must connect your Web3 identity.");
        return <Wall receipts={receipts.filter(r => r.walletAddress.toLowerCase() === account.toLowerCase())} onToggleReveal={toggleReveal} onUpdateStatus={updateStatus} setView={setView} isPersonalView={true} account={account} />;
      case 'create':
        if (!account) return renderConnectGate("Forge New Proof", "Anchoring a promise to the Global Ledger requires a cryptographic signature. Please connect your wallet to proceed.");
        return <PromiseForm onSave={saveReceipt} setView={setView} account={account} connectWallet={connectWallet} />;
      case 'deploy':
        return <Deployer onBack={() => setView('wall')} />;
      default:
        return <Wall receipts={receipts} onToggleReveal={toggleReveal} onUpdateStatus={updateStatus} setView={setView} account={account} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--brand-gray)] text-slate-700 selection:bg-[var(--brand-blue-glow)] selection:text-[var(--brand-blue)] overflow-hidden">
      <nav className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40
        w-full md:w-80 border-r border-white/5 bg-[var(--brand-navy)] p-8 flex flex-col gap-10
      `}>
        <div className="flex items-center justify-between md:block">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { setView('wall'); setIsSidebarOpen(false); }}>
            <div className="w-12 h-12 bg-[var(--brand-blue)] rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--brand-blue-glow)] transition-transform group-hover:scale-105">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-tight">BaseProofs</h1>
              <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">Protocol Core</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 bg-white/5 rounded-xl hover:text-white transition-all"><X size={24} /></button>
        </div>

        <div className="space-y-1.5">
          <button onClick={() => { setView('wall'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'wall' ? 'bg-[var(--brand-navy-accent)] text-white shadow-xl border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'}`}>
            {view === 'wall' && <div className="absolute left-0 w-1 h-6 bg-[var(--brand-blue)] rounded-r-full shadow-[0_0_15px_var(--brand-blue)]" />}
            <History size={20} className={view === 'wall' ? 'text-[var(--brand-blue)]' : ''} />
            <span>Global Ledger</span>
          </button>

          <button onClick={() => { setView('personal'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'personal' ? 'bg-[var(--brand-navy-accent)] text-white shadow-xl border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'}`}>
            {view === 'personal' && <div className="absolute left-0 w-1 h-6 bg-[var(--brand-blue)] rounded-r-full shadow-[0_0_15px_var(--brand-blue)]" />}
            <User size={20} className={view === 'personal' ? 'text-[var(--brand-blue)]' : ''} />
            <span className="flex-1 text-left">My Vault</span>
            {!account && <Lock size={12} className="text-slate-500" />}
          </button>

          <button onClick={() => { setView('create'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'create' ? 'bg-[var(--brand-navy-accent)] text-white shadow-xl border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'}`}>
            {view === 'create' && <div className="absolute left-0 w-1 h-6 bg-[var(--brand-blue)] rounded-r-full shadow-[0_0_15px_var(--brand-blue)]" />}
            <PlusCircle size={20} className={view === 'create' ? 'text-[var(--brand-blue)]' : ''} />
            <span className="flex-1 text-left">Enshrine Proof</span>
          </button>

          <div className="pt-4 pb-2"><div className="h-px bg-white/5 mx-5" /></div>

          <button onClick={() => { setView('verify'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'verify' ? 'bg-[var(--brand-navy-accent)] text-white shadow-xl border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'}`}>
            {view === 'verify' && <div className="absolute left-0 w-1 h-6 bg-[var(--brand-blue)] rounded-r-full shadow-[0_0_15px_var(--brand-blue)]" />}
            <Search size={20} className={view === 'verify' ? 'text-[var(--brand-blue)]' : ''} />
            <span>Integrity Check</span>
          </button>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 opacity-80">Network Control</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleNetworkSwitch(BASE_MAINNET_ID)} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[9px] font-bold transition-all ${currentChainId === BASE_MAINNET_ID ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/20'}`}><Activity size={12} />Base Main</button>
              <button onClick={() => handleNetworkSwitch(BASE_SEPOLIA_ID)} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[9px] font-bold transition-all ${currentChainId === BASE_SEPOLIA_ID ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/20'}`}><RefreshCw size={12} />Sepolia</button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">Identity</span>
            {account && <button onClick={disconnectWallet} className="text-neutral-600 hover:text-red-400 transition-colors"><LogOut size={14} /></button>}
          </div>
          <button onClick={account ? undefined : connectWallet} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest relative z-10 ${account ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[var(--brand-blue)] text-white border-none shadow-xl shadow-[var(--brand-blue-glow)] hover:brightness-110'}`}>
            <div className="flex items-center gap-3"><Wallet size={16} />{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Identity'}</div>
            {account && <ShieldCheck size={14} className="text-emerald-500/50" />}
          </button>
        </div>

        <div className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/[0.03] relative overflow-hidden group hidden md:block">
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-2 text-blue-400"><ShieldCheck size={14} /><span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Protocol Status</span></div>
          <p className="text-[10px] text-neutral-500 leading-relaxed font-medium mb-3">Proofs are final. Once anchored, status changes are permanent and immutable.</p>
          <button onClick={() => setView('deploy')} className="w-full text-[8px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-colors border-t border-white/5 pt-3 text-left">Internal Console</button>
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden h-screen flex flex-col">
        <div className="md:hidden flex items-center justify-between p-5 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-30">
          <div className="flex items-center gap-2" onClick={() => setView('wall')}><ShieldCheck className="text-blue-600" size={20} /><span className="font-bold text-base tracking-tighter text-slate-900">BaseProofs</span></div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"><Menu size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1300px] mx-auto px-4 md:px-10 py-4 md:py-10">
            {renderContent()}
          </div>
        </div>
      </main>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
};

export default App;
