
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
        setReceipts(JSON.parse(saved));
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
  }, []);

  const fetchGlobalEvents = async () => {
    try {
      const contractAddress = '0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06';
      const publicClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });

      // 1. Fetch Seal Logs
      const logs = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        event: parseAbiItem('event ProofAnchored(address indexed creator, bytes32 indexed proofHash, uint256 timestamp)'),
        fromBlock: 40827100n,
        toBlock: 'latest'
      });

      // 2. Separate Seals from Status Updates
      const seals: any[] = [];
      const statusUpdates: any[] = [];

      await Promise.all(logs.map(async (log: any) => {
        const tx = await publicClient.getTransaction({ hash: log.transactionHash });
        if (tx.input && tx.input.length > 74) {
          const rawHex = tx.input.slice(74);
          try {
            const bytes = new Uint8Array(rawHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
            const decoded = new TextDecoder().decode(bytes);
            if (decoded.startsWith('STATUS:')) {
              statusUpdates.push({ msg: decoded, creator: log.args.creator });
            } else {
              seals.push(log);
            }
          } catch (e) { seals.push(log); }
        } else {
          seals.push(log);
        }
      }));

      const parsedLogs: Receipt[] = await Promise.all(seals.map(async (log: any) => {
        const { creator, proofHash, timestamp } = log.args;

        let inscribedContent = "Protocol Anchored Proof";
        let inscribedName = "";
        let isAnon = true;
        let finalStatus: Receipt['status'] = 'fulfilled';

        try {
          const tx = await publicClient.getTransaction({ hash: log.transactionHash });
          if (tx.input && tx.input.length > 74) {
            const rawHex = tx.input.slice(74);
            try {
              const bytes = new Uint8Array(rawHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
              const decoded = new TextDecoder().decode(bytes);
              const meta = JSON.parse(decoded);
              inscribedContent = meta.c || inscribedContent;
              isAnon = meta.a;
              inscribedName = meta.n || "";
            } catch (e) {
              const bytes = new Uint8Array(rawHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
              inscribedContent = new TextDecoder().decode(bytes);
            }
          }

          // Apply recorded status updates for this specific proof hash
          statusUpdates.forEach(update => {
            if (update.creator.toLowerCase() === creator.toLowerCase()) {
              if (update.msg.includes(`STATUS:FULFILLED:${proofHash}`)) finalStatus = 'fulfilled';
              if (update.msg.includes(`STATUS:VOIDED:${proofHash}`)) finalStatus = 'voided';
            }
          });
        } catch (e) { }

        // Try to resolve Basename if no inscribed name and not anonymous
        let basename = "";
        if (!inscribedName && !isAnon) {
          try {
            // For production, you'd use a dedicated ENS/Basename resolver
            // For now, we'll mimic the resolution or prepare the logic for it
            // basename = await publicClient.getEnsName({ address: creator });
          } catch (e) { }
        }

        const finalDisplayName = inscribedName ? inscribedName : (isAnon ? "Anonymous" : creator as string);

        return {
          id: log.transactionHash,
          hash: proofHash,
          content: inscribedContent,
          creator: finalDisplayName,
          walletAddress: creator,
          txHash: log.transactionHash,
          timestamp: Number(timestamp) * 1000,
          deadline: '',
          isRevealed: true,
          isAnonymous: isAnon,
          witnessStatement: "This proof was discovered directly on the Base protocol.",
          category: 'Other',
          status: finalStatus
        } as Receipt;
      }));

      setGlobalReceipts(parsedLogs);
    } catch (err) {
      console.error("Global fetch failed", err);
    }
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
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-tight italic uppercase">
          {title}
        </h2>
        <p className="text-neutral-500 text-lg mb-12 leading-relaxed">
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
        return <Wall receipts={allReceipts} onToggleReveal={toggleReveal} onUpdateStatus={updateStatus} setView={setView} account={account} />;
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050506] text-neutral-300 selection:bg-blue-500/20 selection:text-blue-300 overflow-hidden">
      <nav className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40
        w-full md:w-80 border-r border-white/[0.04] bg-[#080809]/95 md:bg-[#080809]/80 backdrop-blur-3xl p-8 flex flex-col gap-10
      `}>
        <div className="flex items-center justify-between md:block">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { setView('wall'); setIsSidebarOpen(false); }}>
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/20 transition-transform group-hover:scale-105">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-white leading-tight">BaseProofs</h1>
              <p className="text-[10px] text-blue-500/80 uppercase tracking-[0.2em] font-black">BaseProof Protocol</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-neutral-400 bg-white/5 rounded-xl hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-1.5">
          <button onClick={() => { setView('wall'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'wall' ? 'bg-white/[0.04] text-white shadow-inner shadow-white/5' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]'}`}>
            {view === 'wall' && <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full active-tab-glow" />}
            <History size={20} className={view === 'wall' ? 'text-blue-500' : ''} />
            <span>Global Ledger</span>
          </button>

          <button onClick={() => { setView('personal'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'personal' ? 'bg-white/[0.04] text-white shadow-inner shadow-white/5' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]'}`}>
            {view === 'personal' && <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full active-tab-glow" />}
            <User size={20} className={view === 'personal' ? 'text-blue-500' : ''} />
            <span className="flex-1 text-left">My Vault</span>
            {!account && <Lock size={12} className="text-neutral-700" />}
          </button>

          <button onClick={() => { setView('create'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'create' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]'}`}>
            {view === 'create' && <div className="absolute left-0 w-1 h-6 bg-white/50 rounded-r-full" />}
            <PlusCircle size={20} className={view === 'create' ? 'text-white' : ''} />
            <span className="flex-1 text-left">Enshrine Proof</span>
          </button>

          <div className="pt-4 pb-2"><div className="h-px bg-white/5 mx-5" /></div>

          <button onClick={() => { setView('verify'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm relative group ${view === 'verify' ? 'bg-white/[0.04] text-white shadow-inner shadow-white/5' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]'}`}>
            {view === 'verify' && <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full active-tab-glow" />}
            <Search size={20} className={view === 'verify' ? 'text-blue-500' : ''} />
            <span>Integrity Check</span>
          </button>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest px-2">Network Control</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleNetworkSwitch(BASE_MAINNET_ID)} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[9px] font-bold transition-all ${currentChainId === BASE_MAINNET_ID ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/20'}`}><Activity size={12} />Base Main</button>
              <button onClick={() => handleNetworkSwitch(BASE_SEPOLIA_ID)} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[9px] font-bold transition-all ${currentChainId === BASE_SEPOLIA_ID ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/20'}`}><RefreshCw size={12} />Sepolia</button>
            </div>
          </div>

          <div className="relative group flex flex-col gap-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Identify</span>
              {account && <button onClick={disconnectWallet} className="text-neutral-600 hover:text-red-400 transition-colors"><LogOut size={14} /></button>}
            </div>
            <button onClick={account ? undefined : connectWallet} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest relative z-10 ${account ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-neutral-400 hover:border-blue-500/30 hover:text-white'}`}>
              <div className="flex items-center gap-3"><Wallet size={16} />{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Sign Identity'}</div>
              {account && <ShieldCheck size={14} className="text-green-500/50" />}
            </button>
          </div>

          <div className="p-6 bg-white/[0.02] rounded-[2rem] border border-white/[0.03] relative overflow-hidden group hidden md:block">
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-3 text-blue-500"><Sparkles size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Base Protocol</span></div>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-medium mb-4">Proofs are final. Once anchored, status changes are permanent.</p>
            <button onClick={() => setView('deploy')} className="w-full text-[9px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-colors border-t border-white/5 pt-4 text-left">Deploy Contracts</button>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden h-screen flex flex-col">
        <div className="md:hidden flex items-center justify-between p-6 bg-[#050506]/80 backdrop-blur-xl border-b border-white/[0.05] z-30">
          <div className="flex items-center gap-3" onClick={() => setView('wall')}><ShieldCheck className="text-blue-500" size={24} /><span className="font-bold text-lg tracking-tighter text-white">BaseProofs</span></div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-neutral-400 bg-white/5 rounded-xl hover:text-white transition-all"><Menu size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar"><div className="max-w-6xl mx-auto px-6 py-12 md:py-20">{renderContent()}</div></div>
      </main>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
};

export default App;
