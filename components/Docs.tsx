import React, { useState } from 'react';
import { Book, ChevronRight, Home, Rocket, Code, Shield, HelpCircle, ArrowLeft } from 'lucide-react';

interface DocsProps {
    onBack: () => void;
}

const Docs: React.FC<DocsProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState<string>('overview');

    const sections = [
        { id: 'overview', title: 'Overview', icon: Home },
        { id: 'getting-started', title: 'Getting Started', icon: Rocket },
        { id: 'technical', title: 'Technical Details', icon: Code },
        { id: 'security', title: 'Security', icon: Shield },
        { id: 'faq', title: 'FAQ', icon: HelpCircle },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black text-slate-900">Welcome to Proofly</h1>
                        <p className="text-lg text-slate-600">Proofly is a decentralized commitment protocol built on Base blockchain that allows users to create immutable, cryptographically-sealed proofs of their promises and commitments.</p>

                        <div className="grid md:grid-cols-2 gap-4 mt-8">
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                                <h3 className="text-xl font-bold text-blue-900 mb-2">🎯 What is Proofly?</h3>
                                <p className="text-blue-700">A public ledger of human word - transforming commitments into immutable, verifiable proofs anchored on Base blockchain.</p>
                            </div>
                            <div className="p-6 bg-purple-50 border border-purple-200 rounded-2xl">
                                <h3 className="text-xl font-bold text-purple-900 mb-2">🔑 Key Features</h3>
                                <ul className="text-purple-700 space-y-1 text-sm">
                                    <li>✅ Immutable on-chain proofs</li>
                                    <li>✅ Privacy controls & masking</li>
                                    <li>✅ AI-powered witnesses</li>
                                    <li>✅ Zero trust architecture</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">📊 Quick Stats</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-2xl font-black text-blue-600">~$0.01</div>
                                    <div className="text-xs text-slate-600">Gas Cost</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-blue-600">1-2s</div>
                                    <div className="text-xs text-slate-600">Confirmation</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-blue-600">Base</div>
                                    <div className="text-xs text-slate-600">Network</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-blue-600">∞</div>
                                    <div className="text-xs text-slate-600">Permanence</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'getting-started':
                return (
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black text-slate-900">Getting Started</h1>
                        <p className="text-lg text-slate-600">Create your first proof in just a few minutes.</p>

                        <div className="space-y-6 mt-8">
                            <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                                    <h3 className="text-xl font-bold text-slate-900">Connect Your Wallet</h3>
                                </div>
                                <ul className="text-slate-600 space-y-2 ml-11">
                                    <li>• Click "Connect Identity" in the sidebar</li>
                                    <li>• Approve the connection in your wallet</li>
                                    <li>• Ensure you're on Base Mainnet (Chain ID: 8453)</li>
                                </ul>
                            </div>

                            <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                                    <h3 className="text-xl font-bold text-slate-900">Create Your Proof</h3>
                                </div>
                                <ul className="text-slate-600 space-y-2 ml-11">
                                    <li>• Click "Enshrine Proof" in the sidebar</li>
                                    <li>• Choose a template or select "Custom"</li>
                                    <li>• Write your commitment</li>
                                    <li>• (Optional) Set a deadline</li>
                                    <li>• (Optional) Toggle "Mask Identity" for anonymity</li>
                                </ul>
                            </div>

                            <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                                    <h3 className="text-xl font-bold text-slate-900">Seal on Base</h3>
                                </div>
                                <ul className="text-slate-600 space-y-2 ml-11">
                                    <li>• Review your commitment</li>
                                    <li>• Click "Seal on Base"</li>
                                    <li>• Approve the transaction (~$0.01 gas)</li>
                                    <li>• Wait for confirmation (1-2 seconds)</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
                            <h3 className="text-xl font-bold text-emerald-900 mb-3">✨ Example Commitments</h3>
                            <div className="space-y-2 text-emerald-700">
                                <div className="p-3 bg-white rounded-lg text-sm">"I will launch my product by March 31, 2026"</div>
                                <div className="p-3 bg-white rounded-lg text-sm">"I will exercise 4 times per week for 3 months"</div>
                                <div className="p-3 bg-white rounded-lg text-sm">"I will save $10,000 by December 2026"</div>
                            </div>
                        </div>
                    </div>
                );

            case 'technical':
                return (
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black text-slate-900">Technical Details</h1>
                        <p className="text-lg text-slate-600">Deep dive into Proofly's architecture and implementation.</p>

                        <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl">
                            <h3 className="text-xl font-bold mb-4">Smart Contract</h3>
                            <div className="space-y-2 font-mono text-sm">
                                <div><span className="text-slate-400">Address:</span> <span className="text-blue-400">0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06</span></div>
                                <div><span className="text-slate-400">Network:</span> <span className="text-blue-400">Base Mainnet (8453)</span></div>
                                <div><span className="text-slate-400">Language:</span> <span className="text-blue-400">Solidity ^0.8.0</span></div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                                <h3 className="text-lg font-bold text-slate-900 mb-3">🔐 Cryptography</h3>
                                <div className="text-slate-600 space-y-2 text-sm">
                                    <div><strong>Algorithm:</strong> Keccak-256</div>
                                    <div><strong>Hash Length:</strong> 32 bytes</div>
                                    <div><strong>Format:</strong> 0x + 64 hex chars</div>
                                    <div><strong>Properties:</strong> Deterministic, one-way, collision-resistant</div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                                <h3 className="text-lg font-bold text-slate-900 mb-3">⚡ Performance</h3>
                                <div className="text-slate-600 space-y-2 text-sm">
                                    <div><strong>Gas Cost:</strong> ~45,000 gas</div>
                                    <div><strong>USD Cost:</strong> ~$0.01</div>
                                    <div><strong>Confirmation:</strong> 1-2 seconds</div>
                                    <div><strong>Finality:</strong> Ethereum-grade</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">📦 Data Storage</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="font-bold text-slate-900">On-Chain</div>
                                    <div className="text-slate-600">Only the Keccak-256 hash is stored in the smart contract mapping</div>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Calldata</div>
                                    <div className="text-slate-600">Full metadata (content, category, deadline, witness) encoded in transaction calldata</div>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Local Cache</div>
                                    <div className="text-slate-600">Browser localStorage for instant loading and offline access</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black text-slate-900">Security</h1>
                        <p className="text-lg text-slate-600">Proofly implements multiple security layers to protect your commitments.</p>

                        <div className="grid md:grid-cols-3 gap-4 mt-8">
                            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
                                <h3 className="text-lg font-bold text-red-900 mb-3">🔒 Smart Contract</h3>
                                <ul className="text-red-700 space-y-2 text-sm">
                                    <li>✅ Immutable storage</li>
                                    <li>✅ No admin keys</li>
                                    <li>✅ Duplicate prevention</li>
                                    <li>✅ Gas optimized</li>
                                    <li>✅ Event emission</li>
                                </ul>
                            </div>

                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                                <h3 className="text-lg font-bold text-blue-900 mb-3">🛡️ Frontend</h3>
                                <ul className="text-blue-700 space-y-2 text-sm">
                                    <li>✅ Input sanitization</li>
                                    <li>✅ XSS prevention</li>
                                    <li>✅ CSP headers</li>
                                    <li>✅ No key storage</li>
                                    <li>✅ HTTPS only</li>
                                </ul>
                            </div>

                            <div className="p-6 bg-purple-50 border border-purple-200 rounded-2xl">
                                <h3 className="text-lg font-bold text-purple-900 mb-3">🔐 Privacy</h3>
                                <ul className="text-purple-700 space-y-2 text-sm">
                                    <li>✅ Client-side hashing</li>
                                    <li>✅ Selective revelation</li>
                                    <li>✅ Persistent masking</li>
                                    <li>✅ Anonymous mode</li>
                                    <li>✅ Owner controls</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                            <h3 className="text-lg font-bold text-amber-900 mb-3">⚠️ Best Practices</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="font-bold text-amber-900 mb-2">DO:</div>
                                    <ul className="text-amber-700 space-y-1">
                                        <li>✅ Verify network before transactions</li>
                                        <li>✅ Double-check commitments</li>
                                        <li>✅ Keep wallet secure</li>
                                        <li>✅ Use strong passwords</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="font-bold text-amber-900 mb-2">DON'T:</div>
                                    <ul className="text-amber-700 space-y-1">
                                        <li>❌ Share private keys</li>
                                        <li>❌ Include sensitive info</li>
                                        <li>❌ Trust unverified contracts</li>
                                        <li>❌ Ignore security warnings</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'faq':
                return (
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black text-slate-900">Frequently Asked Questions</h1>

                        <div className="space-y-4 mt-8">
                            {[
                                {
                                    q: "What is Proofly?",
                                    a: "Proofly is a decentralized protocol that allows you to create immutable, cryptographically-sealed proofs of your commitments on the Base blockchain."
                                },
                                {
                                    q: "How much does it cost?",
                                    a: "Creating a proof costs approximately $0.01 USD in gas fees on Base Mainnet. There are no platform fees."
                                },
                                {
                                    q: "Can I delete a proof?",
                                    a: "No. Once sealed on-chain, proofs are permanent and cannot be deleted. This is by design to ensure immutability."
                                },
                                {
                                    q: "What is masking?",
                                    a: "Masking allows you to hide the content of your proof from public viewers while keeping it visible in your private vault."
                                },
                                {
                                    q: "Is my data private?",
                                    a: "Your content is hashed client-side before being sent on-chain. You can also use anonymous mode or mask content for additional privacy."
                                },
                                {
                                    q: "What blockchain does Proofly use?",
                                    a: "Proofly is built on Base Mainnet, an Ethereum L2 that offers fast, cheap transactions with Ethereum-grade security."
                                },
                                {
                                    q: "Can I update my proof status?",
                                    a: "Yes! You can mark proofs as Active, Fulfilled, or Voided from your private vault at any time."
                                },
                                {
                                    q: "How do I verify a proof?",
                                    a: "Use the Integrity Check feature to verify any proof by entering its hash or content. You can also view the transaction on BaseScan."
                                }
                            ].map((faq, i) => (
                                <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
                                    <p className="text-slate-600">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-bold">Back to App</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Book className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Documentation</h1>
                            <p className="text-sm text-slate-600">Learn everything about Proofly</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 sticky top-4">
                            <nav className="space-y-1">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeSection === section.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={18} />
                                                <span className="font-bold text-sm">{section.title}</span>
                                            </div>
                                            {activeSection === section.id && <ChevronRight size={16} />}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-2xl p-8">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Docs;
