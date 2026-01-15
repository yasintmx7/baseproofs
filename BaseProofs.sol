// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BaseProofs - The Public Ledger of Human Word
 * @dev Optimized for Base Mainnet. Permanent, immutable word anchoring.
 */
contract BaseProofs {
    // Mapping to store the timestamp of when a hash was locked
    mapping(bytes32 => uint256) public anchors;

    // Event for indexing - now includes the actual word for public visibility
    event ProofAnchored(address indexed creator, bytes32 indexed proofHash, string content, uint256 timestamp);

    /**
     * @dev Anchors a hash and the clear-text word to the ledger. 
     * @param _proofHash The 32-byte hash of the promise.
     * @param _content The clear-text word/promise being anchored.
     */
    function anchorProof(bytes32 _proofHash, string calldata _content) external {
        require(anchors[_proofHash] == 0, "This word has already been enshrined");
        
        anchors[_proofHash] = block.timestamp;
        emit ProofAnchored(msg.sender, _proofHash, _content, block.timestamp);
    }

    /**
     * @dev Check if a word is on the ledger.
     */
    function verifyProof(bytes32 _proofHash) external view returns (bool exists, uint256 timestamp) {
        timestamp = anchors[_proofHash];
        exists = (timestamp > 0);
    }
}
