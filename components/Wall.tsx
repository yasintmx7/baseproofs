
import React, { useState, useEffect, useMemo } from 'react';
import { Receipt, ViewState } from '../types';
import { shortenHash } from '../utils/crypto';
import {
  Clock, Eye, EyeOff, Award, Quote, CheckCircle2,
  Target, Calendar, PlusCircle, ArrowRight, Zap,
  Search, Filter, SortAsc, X, SlidersHorizontal, CheckCircle, ExternalLink, User, Flame, Globe, XCircle, Share2, Check, AlertTriangle, ShieldCheck, Activity, Info
} from 'lucide-react';
import Header from './Header';

interface WallProps {
  receipts: Receipt[];
  onToggleReveal: (id: string) => void;
  onUpdateStatus?: (id: string, status: Receipt['status']) => void;
  setView?: (view: ViewState) => void;
  isPersonalView?: boolean;
  account?: string | null;
}

const Countdown: React.FC<{ date: string }> = ({ date }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(date).getTime();
      const diff = target - now;
      if (diff <= 0) return setTimeLeft('TIME UP');
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(days > 0 ? `${days}d ${hours}h left` : `${hours}h left`);
    };
    calculate();
    const timer = setInterval(calculate, 60000);
    return () => clearInterval(timer);
  }, [date]);

  return (
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border transition-all duration-300 ${timeLeft === 'TIME UP' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
      {timeLeft}
    </span>
  );
};

type SortOption = 'newest' | 'oldest' | 'hash';

const Wall: React.FC<WallProps> = ({ receipts, onToggleReveal, onUpdateStatus, setView, isPersonalView = false, account }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [sortBy, setBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<{ id: string, status: Receipt['status'] } | null>(null);

  const stats = {
    total: receipts.length,
    active: receipts.filter(r => r.status === 'active').length,
    integrity: receipts.length ? Math.round((receipts.filter(r => r.status === 'fulfilled').length / receipts.length) * 100) : 100,
    fulfilled: receipts.filter(r => r.status === 'fulfilled').length
  };

  const categories = ['All', 'Personal', 'Work', 'Financial', 'Fitness', 'Other'];
  const statuses = ['All', 'active', 'fulfilled', 'voided'];

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?proof=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const initiateStatusUpdate = (id: string, status: Receipt['status']) => {
    setConfirmingId({ id, status });
  };

  const confirmStatusUpdate = () => {
    if (confirmingId && onUpdateStatus) {
      onUpdateStatus(confirmingId.id, confirmingId.status);
      setConfirmingId(null);
    }
  };

  const filteredReceipts = useMemo(() => {
    let result = [...receipts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.creator.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.hash.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'All') result = result.filter(r => r.category === activeCategory);
    if (activeStatus !== 'All') result = result.filter(r => r.status === activeStatus);

    result.sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'hash') return a.hash.localeCompare(b.hash);
      return 0;
    });
    return result;
  }, [receipts, searchQuery, activeCategory, activeStatus, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setActiveStatus('All');
    setBy('newest');
  };

  const renderReceiptCard = (receipt: Receipt, isFeatured: boolean = false) => {
    const isOwner = account?.toLowerCase() === receipt.walletAddress.toLowerCase();
    const isCopied = copiedId === receipt.id;

    return (
      <div
        key={receipt.id}
        id={`proof-${receipt.id}`}
        className={`group glass-card rounded-[2rem] p-5 md:p-6 transition-all duration-700 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 ${isFeatured ? 'md:col-span-2 border-blue-500/30 ring-1 ring-blue-500/10 shadow-2xl shadow-blue-500/5' : ''}`}
      >
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-15 transition-all duration-700 pointer-events-none ${receipt.status === 'fulfilled' ? 'bg-green-500' : receipt.status === 'voided' ? 'bg-red-500' : 'bg-blue-500'}`} />

        {isFeatured && (
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 animate-pulse z-20">
            <Flame size={12} />
            Latest Proof
          </div>
        )}

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {receipt.sealUrl ? (
                <img src={receipt.sealUrl} className={`${isFeatured ? 'w-12 h-12' : 'w-9 h-9'} rounded-full border border-white/10 bg-black object-cover shadow-sm transition-all`} alt="Seal" />
              ) : (
                <div className={`${isFeatured ? 'w-12 h-12' : 'w-9 h-9'} rounded-full bg-neutral-900 flex items-center justify-center border border-white/5 transition-all`}><Award className="text-neutral-700" size={18} /></div>
              )}
              {receipt.status === 'fulfilled' && <CheckCircle size={10} className="absolute -bottom-0.5 -right-0.5 text-white bg-green-500 rounded-full p-0.5 border border-[#050506]" />}
              {receipt.status === 'voided' && <XCircle size={10} className="absolute -bottom-0.5 -right-0.5 text-white bg-red-500 rounded-full p-0.5 border border-[#050506]" />}
            </div>
            <div className="flex flex-col">
              <h4 className={`${isFeatured ? 'text-sm' : 'text-xs'} font-bold text-white leading-none mb-1.5 flex items-center gap-2`}>
                {receipt.isAnonymous ? 'Anonymous' : receipt.creator}
                {isOwner && (
                  <span className="flex items-center gap-1.5 bg-blue-500 text-white text-[7px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest shadow-lg shadow-blue-500/20">
                    <User size={8} /> Me
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-neutral-500 font-black mono tracking-tight">
                  {receipt.walletAddress.slice(0, 6)}...{receipt.walletAddress.slice(-4)}
                </span>
                <span className="text-[8px] text-neutral-600 font-bold tracking-widest uppercase">/ {receipt.category}</span>
              </div>
            </div>
          </div>
          {!isFeatured && (
            <div className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all ${receipt.status === 'fulfilled' ? 'bg-green-500/10 border-green-500/20 text-green-500' : receipt.status === 'voided' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-neutral-500'}`}>
              {receipt.status === 'active' ? 'Commitment Live' : receipt.status === 'fulfilled' ? 'Delivered' : 'Failed'}
            </div>
          )}
        </div>

        <div className="mb-6 relative z-10">
          {receipt.isRevealed ? (
            <p className={`${isFeatured ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} text-white font-medium leading-tight italic tracking-tight`}>"{receipt.content}"</p>
          ) : (
            <div className="flex flex-col gap-2.5 reveal-text opacity-30">
              <div className="h-4 bg-white/5 rounded-full w-full" />
              <div className="h-4 bg-white/5 rounded-full w-3/4" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
          {receipt.status === 'active' && receipt.deadline && <Countdown date={receipt.deadline} />}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/5 rounded-md">
            <Clock size={10} className="text-neutral-600" />
            <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">{new Date(receipt.timestamp).toLocaleDateString()}</span>
          </div>
          {receipt.txHash && (
            <a
              href={`https://basescan.org/tx/${receipt.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[8px] text-blue-400 font-bold uppercase hover:bg-blue-500/20 transition-all"
            >
              Protocol Proof <ExternalLink size={10} />
            </a>
          )}
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleReveal(receipt.id)}
              className="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-blue-400 flex items-center gap-2 transition-colors"
            >
              {receipt.isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
              {receipt.isRevealed ? 'Mask' : 'Reveal'}
            </button>
            <button
              onClick={() => handleCopyLink(receipt.id)}
              className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isCopied ? 'text-green-500' : 'text-neutral-500 hover:text-white'}`}
            >
              {isCopied ? <Check size={14} /> : <Share2 size={14} />}
              {isCopied ? 'Link Copied' : 'Share Proof'}
            </button>
          </div>

          <div className="flex gap-2">
            {isOwner && onUpdateStatus && receipt.status === 'active' && (
              <>
                <button
                  onClick={() => initiateStatusUpdate(receipt.id, 'voided')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 active:scale-95"
                >
                  <XCircle size={14} />
                  I Failed
                </button>
                <button
                  onClick={() => initiateStatusUpdate(receipt.id, 'fulfilled')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/5 active:scale-95"
                >
                  <CheckCircle size={14} />
                  I Delivered
                </button>
              </>
            )}

            {(receipt.status !== 'active' || (!isOwner && !isPersonalView)) && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic ${receipt.status === 'fulfilled' ? 'text-green-500 bg-green-500/5' : receipt.status === 'voided' ? 'text-red-500 bg-red-500/5' : 'text-blue-500 bg-blue-500/5'}`}>
                {receipt.status === 'fulfilled' ? <CheckCircle size={12} /> : receipt.status === 'voided' ? <XCircle size={12} /> : <Globe size={12} />}
                {receipt.status === 'active' ? 'Live Proof' : receipt.status.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Confirmation Modal */}
      {confirmingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setConfirmingId(null)} />
          <div className="relative glass-card max-w-sm w-full p-8 rounded-[2.5rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${confirmingId.status === 'fulfilled' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                {confirmingId.status === 'fulfilled' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase italic">Finalize Outcome?</h3>
              <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
                Marking this promise as <span className={confirmingId.status === 'fulfilled' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{confirmingId.status.toUpperCase()}</span> is an immutable entry in your public integrity ledger. This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => setConfirmingId(null)} className="px-6 py-3 rounded-2xl bg-white/5 text-neutral-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={confirmStatusUpdate} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${confirmingId.status === 'fulfilled' ? 'bg-green-600 hover:bg-green-500 shadow-green-600/20' : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'}`}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section for Onboarding */}
      {!isPersonalView && receipts.length > 0 && (
        <div className="relative glass-card p-10 md:p-14 rounded-[3.5rem] overflow-hidden border-blue-500/20 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition-all duration-1000" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} /> Protocol Identity: BaseProofs v1.0
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
                Word is <span className="text-blue-500">Law.</span>
              </h1>
              <p className="text-neutral-400 text-lg md:text-xl max-w-xl leading-relaxed">
                Enshrine your promises on the public ledger. AI-witnessed, cryptographically hashed, and forever anchored to history. No deletions. No excuses.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                <button onClick={() => setView?.('create')} className="bg-white text-black px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-50 transition-all active:scale-95 shadow-2xl shadow-white/5 flex items-center gap-3">
                  Enshrine Now <ArrowRight size={18} />
                </button>
                <div className="flex items-center gap-3 text-neutral-500 hover:text-white transition-colors cursor-help group/info">
                  <Info size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">How it Works</span>
                  <div className="absolute bottom-full left-0 mb-4 w-64 p-4 bg-neutral-900 border border-white/10 rounded-2xl text-[11px] text-neutral-400 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none shadow-2xl z-40 leading-relaxed">
                    Your promise is hashed (SHA-256) locally, then witnessed by our Grand Notary AI, and finally a proof transaction is sent to Base Mainnet.
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex w-72 h-72 items-center justify-center bg-white/[0.02] border border-white/10 rounded-[4rem] relative float-anim">
              <div className="absolute inset-0 shimmer opacity-20" />
              <Activity className="text-blue-500 animate-pulse" size={80} strokeWidth={1} />
              <div className="absolute -bottom-4 -right-4 bg-blue-600 text-white p-4 rounded-3xl shadow-2xl shadow-blue-600/40">
                <CheckCircle2 size={32} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Pulse Bar */}
      {receipts.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 md:gap-10 py-6 px-10 glass-card rounded-[2rem] border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Protocol Live</span>
          </div>
          <div className="h-4 w-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-4">
            <span className="text-[9px] uppercase text-neutral-600 font-black tracking-widest">Total Words Anchored</span>
            <span className="text-lg font-bold text-white mono">{stats.total.toString().padStart(3, '0')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] uppercase text-neutral-600 font-black tracking-widest">Global Integrity</span>
            <span className="text-lg font-bold text-blue-500 mono">{stats.integrity}%</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-[9px] uppercase text-neutral-600 font-black tracking-widest">Words Delivered</span>
            <span className="text-lg font-bold text-green-500 mono">{stats.fulfilled}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <Header
          title={isPersonalView ? "Your Private Vault" : "Global Word Ledger"}
          subtitle={isPersonalView ? "Your private sanctuary of immutable word and outcome." : "The public stream of every commitment anchored to history."}
        />
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-4 rounded-3xl backdrop-blur-md shadow-2xl shadow-black/20">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest mb-1">Vault Status</span>
            <span className="text-xl font-bold text-white leading-none">{isPersonalView ? receipts.length : stats.total} Records</span>
          </div>
          {setView && (
            <button onClick={() => setView('create')} className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
              <PlusCircle size={22} />
            </button>
          )}
        </div>
      </div>

      {receipts.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Locate word in ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-700"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${showFilters || activeCategory !== 'All' || activeStatus !== 'All' ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-white/[0.02] border-white/[0.05] text-neutral-500'}`}>
                <SlidersHorizontal size={14} /> Filters
              </button>
              <div className="relative flex-1 md:flex-none group min-w-[140px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"><SortAsc size={14} /></div>
                <select value={sortBy} onChange={(e) => setBy(e.target.value as SortOption)} className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl py-3 pl-10 pr-4 text-[9px] text-white appearance-none cursor-pointer focus:border-blue-500/50 outline-none font-black uppercase tracking-widest">
                  <option value="newest">Chronological Top</option>
                  <option value="oldest">Historical Archive</option>
                  <option value="hash">Hash Alignment</option>
                </select>
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="p-5 glass-card rounded-[2rem] border-white/[0.05] animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Category Filter</span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Proof Status</span>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(stat => (
                      <button key={stat} onClick={() => setActiveStatus(stat)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeStatus === stat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'}`}>{stat === 'active' ? 'Live' : stat === 'fulfilled' ? 'Delivered' : stat === 'voided' ? 'Failed' : 'All'}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 glass-card rounded-[3.5rem] text-center group">
          <div className="w-24 h-24 bg-white/[0.03] rounded-[2.5rem] flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-700">
            {isPersonalView ? <User size={40} className="text-neutral-700 group-hover:text-blue-500 transition-colors" /> : <Globe size={40} className="text-neutral-700 group-hover:text-blue-500 transition-colors" />}
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 italic">
            {isPersonalView ? "Your Legacy Begins Now" : "The Ledger Awaits its First Word"}
          </h3>
          <p className="text-neutral-500 text-base max-w-sm mb-12 leading-relaxed">
            {isPersonalView
              ? "You haven't anchored any words yet. Your integrity starts with the first enshrinement."
              : "No words have been anchored yet. Be the first to enshrine history on the Base Protocol."}
          </p>
          <div className="flex flex-col gap-4">
            <button onClick={() => setView?.('create')} className="group flex items-center gap-4 bg-white text-black px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-50 transition-all active:scale-95 shadow-2xl shadow-white/5">Forge First Proof <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></button>
            {!account && isPersonalView && (
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-700">Connect wallet to view private records</p>
            )}
          </div>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 glass-card rounded-[3rem] text-center">
          <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-6"><Filter className="text-neutral-700" size={24} /></div>
          <h3 className="text-xl font-bold text-white mb-3 italic">No matches in current view</h3>
          <button onClick={resetFilters} className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-8 py-3 rounded-2xl hover:bg-blue-50 transition-all mt-4">Reset Parameters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {filteredReceipts.map((receipt, idx) => {
            const isLatest = sortBy === 'newest' && idx === 0 && searchQuery === '' && activeCategory === 'All' && activeStatus === 'All';
            return renderReceiptCard(receipt, isLatest);
          })}
        </div>
      )}
    </div>
  );
};

export default Wall;
