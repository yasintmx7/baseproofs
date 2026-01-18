
import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, ShieldCheck, History, Menu, X, Search, Sparkles, Wallet, Globe, ArrowRight, User, Lock, LogOut, ChevronDown, Activity, RefreshCw } from 'lucide-react';
import { checkIsOnBase, switchToBase, BASE_MAINNET_ID, BASE_SEPOLIA_ID, LOCALHOST_ID, TARGET_CHAIN_ID } from './utils/network';
import { createPublicClient, http, parseAbiItem, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import PromiseForm from './components/PromiseForm';
import Wall from './components/Wall';
import Verifier from './components/Verifier';
import Header from './components/Header';
import Deployer from './components/Deployer';
import Docs from './components/Docs';
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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

    const saved = localStorage.getItem('proofly_receipts_v1');
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

    // Back to top button scroll detection
    setTimeout(() => {
      const handleScroll = () => {
        if (scrollContainerRef.current) {
          setShowBackToTop(scrollContainerRef.current.scrollTop > 300);
        }
      };

      if (scrollContainerRef.current) {
        scrollContainerRef.current.addEventListener('scroll', handleScroll);
      }

      return () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }, 100);

    // Periodic refresh every 60 seconds
    const interval = setInterval(fetchGlobalEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchGlobalEvents = async () => {
    if (isGlobalLoading) return;
    setIsGlobalLoading(true);

    // 1. Instant Cache Load
    const cached = localStorage.getItem('proofly_global_cache');
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

        // Preserve isRevealed state from existing cache and local receipts
        const existingCache = localStorage.getItem('proofly_global_cache');
        const existingReceipts = localStorage.getItem('proofly_receipts_v1');
        let existingStates: { [key: string]: boolean } = {};

        if (existingCache) {
          try {
            const cached = JSON.parse(existingCache);
            cached.forEach((r: Receipt) => {
              existingStates[r.id] = r.isRevealed;
            });
          } catch (e) { }
        }

        if (existingReceipts) {
          try {
            const local = JSON.parse(existingReceipts);
            local.forEach((r: Receipt) => {
              existingStates[r.id] = r.isRevealed;
            });
          } catch (e) { }
        }

        const finalResults = (parsedLogs.filter(r => r !== null) as Receipt[]).map(r => {
          const update = statusUpdates.find(u =>
            u.creator?.toLowerCase() === r.walletAddress?.toLowerCase() &&
            (u.msg.includes(`FULFILLED:${r.hash}`) || u.msg.includes(`VOIDED:${r.hash}`))
          );
          if (update) {
            r.status = update.msg.includes('FULFILLED') ? 'fulfilled' : 'voided';
          }

          // Preserve isRevealed state if it exists
          if (existingStates[r.id] !== undefined) {
            r.isRevealed = existingStates[r.id];
          }

          return r;
        }).sort((a, b) => b.timestamp - a.timestamp);

        setGlobalReceipts(finalResults);
        localStorage.setItem('proofly_global_cache', JSON.stringify(finalResults));
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
    localStorage.setItem('proofly_receipts_v1', JSON.stringify(newReceipts));
  };

  const updateStatus = async (id: string, status: Receipt['status']) => {
    // 1. Update Local Storage
    const newReceipts = receipts.map(r => r.id === id ? { ...r, status } : r);
    setReceipts(newReceipts);
    localStorage.setItem('proofly_receipts_v1', JSON.stringify(newReceipts));

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
    // Update local receipts
    const newReceipts = receipts.map(r => r.id === id ? { ...r, isRevealed: !r.isRevealed } : r);
    setReceipts(newReceipts);
    localStorage.setItem('proofly_receipts_v1', JSON.stringify(newReceipts));

    // Also update global receipts if the item exists there
    const newGlobalReceipts = globalReceipts.map(r => r.id === id ? { ...r, isRevealed: !r.isRevealed } : r);
    setGlobalReceipts(newGlobalReceipts);
    localStorage.setItem('proofly_global_cache', JSON.stringify(newGlobalReceipts));
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
          Proofly
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
            Proofly Protocol v1.0
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
        // Combine local receipts with global receipts filtered by wallet address
        const personalReceipts = [...receipts, ...globalReceipts].filter(r => r.walletAddress?.toLowerCase() === account.toLowerCase());
        // Remove duplicates based on id
        const uniquePersonalReceipts = personalReceipts.filter((receipt, index, self) =>
          index === self.findIndex((r) => r.id === receipt.id)
        );
        return <Wall receipts={uniquePersonalReceipts} onToggleReveal={toggleReveal} onUpdateStatus={updateStatus} setView={setView} isPersonalView={true} account={account} />;
      case 'create':
        if (!account) return renderConnectGate("Forge New Proof", "Anchoring a promise to the Global Ledger requires a cryptographic signature. Please connect your wallet to proceed.");
        return <PromiseForm onSave={saveReceipt} setView={setView} account={account} connectWallet={connectWallet} />;
      case 'deploy':
        return <Deployer onBack={() => setView('wall')} />;
      case 'docs':
        return <Docs onBack={() => setView('wall')} />;
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
            <img src="/icon.png" alt="Proofly" className="w-16 h-16 object-contain transition-transform group-hover:scale-105" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-tight">Proofly</h1>
              <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">Built on Base</p>
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

          <button onClick={() => { if (account) { setView('personal'); setIsSidebarOpen(false); } else { connectWallet(); } }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'personal' ? 'bg-[var(--brand-navy-accent)] text-white shadow-xl border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'}`}>
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

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/5">
          <a href="https://x.com/proofly" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors" title="X (Twitter)">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          </a>
          <a href="https://discord.gg/proofly" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-400 transition-colors" title="Discord">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" /></svg>
          </a>
          <a onClick={() => setView('docs')} className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer" title="Documentation">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </a>
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden h-screen flex flex-col">
        <div className="md:hidden sticky top-0 flex items-center justify-between p-5 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-30">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => window.location.reload(), 300);
          }}>
            <img src="/icon.png" alt="Proofly" className="h-8 w-auto object-contain rounded-lg" />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tighter text-slate-900 leading-none">Proofly</span>
              <span className="text-[7px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Built on Base</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"><Menu size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollContainerRef}>
          <div className="max-w-[1300px] mx-auto px-4 md:px-10 py-4 md:py-10">
            {renderContent()}
          </div>
        </div>

        {/* Floating Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-4"
            title="Back to Top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </main>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
};

export default App;
