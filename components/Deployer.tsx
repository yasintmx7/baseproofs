
import React, { useState } from 'react';
import { Rocket, Check, AlertCircle, Copy, ArrowLeft } from 'lucide-react';
import contractArtifact from '../src/contract.json';

interface DeployerProps {
    onBack: () => void;
}

const Deployer: React.FC<DeployerProps> = ({ onBack }) => {
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deployStep, setDeployStep] = useState<string>('');

    const handleDeploy = async () => {
        setError(null);
        setIsDeploying(true);
        setDeployStep('Connecting to wallet...');

        try {
            const ethereum = (window as any).ethereum;
            if (!ethereum) {
                throw new Error('No wallet found. Please install MetaMask or Coinbase Wallet.');
            }

            await ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            const account = accounts[0];

            setDeployStep('Sending deployment transaction...');

            // Prepare deployment transaction
            const bytecode = '0x' + contractArtifact.bytecode;
            const abi = contractArtifact.abi; // Not strictly needed for deploy via eth_sendTransaction if we construct data manually, but good to have.

            // Actually, standard deployment is just sending a transaction with 'data' = bytecode (plus constructor args if any).
            // BaseProofs has no constructor arguments.

            const txHash = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: account,
                        data: bytecode,
                    },
                ],
            });

            setDeployStep('Waiting for confirmation...');
            console.log('Deploy tx hash:', txHash);

            // Poll for receipt
            let receipt = null;
            while (receipt === null) {
                receipt = await ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                });
                if (receipt === null) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }

            if (receipt.contractAddress) {
                setDeployedAddress(receipt.contractAddress);
                setDeployStep('Deployment Complete!');
            } else {
                throw new Error('Deployment failed: No contract address in receipt.');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Deployment failed.');
        } finally {
            setIsDeploying(false);
        }
    };

    const copyToClipboard = () => {
        if (deployedAddress) {
            navigator.clipboard.writeText(deployedAddress);
            alert('Address copied to clipboard!');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors font-mono text-sm uppercase tracking-widest">
                <ArrowLeft size={16} /> Back to App
            </button>

            <div className="glass-card p-10 rounded-[3rem] border border-white/10 text-center space-y-8">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                    <Rocket className="text-blue-400" size={40} />
                </div>

                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Deploy Contract</h2>
                <p className="text-neutral-400 max-w-md mx-auto">
                    Deploy `BaseProofs.sol` directly to the blockchain using your connected wallet. No private keys stored.
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3 text-left">
                        <AlertCircle size={20} className="shrink-0" />
                        {error}
                    </div>
                )}

                {!deployedAddress ? (
                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] py-6 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeploying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {deployStep}
                            </>
                        ) : (
                            'Deploy Now'
                        )}
                    </button>
                ) : (
                    <div className="space-y-6 animate-in zoom-in duration-500">
                        <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                            <div className="flex flex-col items-center gap-2 text-green-400 mb-2">
                                <Check size={32} />
                                <span className="font-bold uppercase tracking-widest text-xs">Deployment Successful</span>
                            </div>
                            <div className="text-white text-xl font-mono break-all bg-black/40 p-4 rounded-xl border border-white/5 select-all">
                                {deployedAddress}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Copy size={16} /> Copy Address
                            </button>
                        </div>

                        <p className="text-neutral-500 text-xs">
                            IMPORTANT: Copy this address and paste it into `components/PromiseForm.tsx` (Line 17).
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Deployer;
