
interface ChainConfig {
    chainId: string; // Hex string for window.ethereum
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls: string[];
}

export const BASE_MAINNET_ID = '0x2105'; // 8453
export const BASE_SEPOLIA_ID = '0x14a34'; // 84532
export const LOCALHOST_ID = '0x7a69'; // 31337

const BASE_MAINNET_CONFIG: ChainConfig = {
    chainId: BASE_MAINNET_ID,
    chainName: 'Base Mainnet',
    nativeCurrency: { name: 'Base ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
};

const BASE_SEPOLIA_CONFIG: ChainConfig = {
    chainId: BASE_SEPOLIA_ID,
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'Base Sepolia ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
};

const LOCALHOST_CONFIG: ChainConfig = {
    chainId: LOCALHOST_ID,
    chainName: 'Localhost',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: [],
};

// Target Chain ID determined by environment variable (default to Mainnet)
export const TARGET_CHAIN_ID = import.meta.env.VITE_TARGET_CHAIN_ID || BASE_MAINNET_ID;

export async function switchToBase(targetChainId: string = TARGET_CHAIN_ID): Promise<boolean> {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("No crypto wallet found. Please install MetaMask.");

    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
        });
        return true;
    } catch (switchError: any) {
        // This error code 4902 indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            const config = targetChainId === BASE_MAINNET_ID ? BASE_MAINNET_CONFIG : (targetChainId === BASE_SEPOLIA_ID ? BASE_SEPOLIA_CONFIG : LOCALHOST_CONFIG);
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [config],
                });
                return true;
            } catch (addError) {
                console.error("Failed to add network:", addError);
                return false;
            }
        }
        console.error("Failed to switch network:", switchError);
        return false;
    }
}

export async function checkIsOnBase(): Promise<boolean> {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return chainId === BASE_MAINNET_ID || chainId === BASE_SEPOLIA_ID || chainId === LOCALHOST_ID;
}
