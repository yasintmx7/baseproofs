// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BaseProofs - The Public Ledger of Human Word
 * @dev Optimized for Base Mainnet. Permanent, immutable word anchoring.
 */
contract BaseProofs {
    // Protocol Manifest (on-chain metadata)
    string public constant NAME = "BaseProofs";
    string public constant VERSION = "1.0.0";
    string public constant DESCRIPTION = "The Public Ledger of Human Word";
    string public constant MANIFEST_URI = "ipfs://Qm... (Add final manifest IPFS hash if needed)";

    // Mapping to store the timestamp of when a hash was locked
    mapping(bytes32 => uint256) public anchors;

    // Event for indexing - includes the actual word for public visibility
    event ProofAnchored(address indexed creator, bytes32 indexed proofHash, uint256 timestamp);

    /**
     * @dev Anchors a hash to the ledger. 
     * @param _proofHash The 32-byte hash of the promise.
     * Note: Full metadata is usually appended to calldata for off-chain indexing (Transaction Inscriptions).
     */
    function anchorProof(bytes32 _proofHash) external {
        require(anchors[_proofHash] == 0, "This word has already been enshrined");
        
        anchors[_proofHash] = block.timestamp;
        emit ProofAnchored(msg.sender, _proofHash, block.timestamp);
    }

    /**
     * @dev Check if a word is on the ledger.
     */
    function verifyProof(bytes32 _proofHash) external view returns (bool exists, uint256 timestamp) {
        timestamp = anchors[_proofHash];
        exists = (timestamp > 0);
    }

    /**
     * @dev Returns protocol metadata for on-chain identity.
     */
    function getManifest() external pure returns (
        string memory name, 
        string memory version, 
        string memory description
    ) {
        return (NAME, VERSION, DESCRIPTION);
    }
}

