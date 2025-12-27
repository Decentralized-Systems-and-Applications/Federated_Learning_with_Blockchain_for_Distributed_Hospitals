// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ModelRegistry {
    struct ModelMeta {
        uint256 round;
        string cid;              // IPFS CID (e.g. Qm...)
        string modelSha256;      // SHA-256 hash of the model file (string form)
        string modelFile;        // e.g. global_round5.pt
        string description;      // optional text
        address uploader;        // who submitted the model
        uint256 timestamp;       // block timestamp
    }

    // round => ModelMeta
    mapping(uint256 => ModelMeta) private models;

    uint256 public latestRound;
    address public owner;

    event ModelSubmitted(
        uint256 indexed round,
        address indexed uploader,
        string cid,
        string modelSha256
    );

    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Submit metadata for a federated learning round
     * @dev Owner-only (aggregator pattern)
     */
    function submitModel(
        uint256 round,
        string calldata cid,
        string calldata modelSha256,
        string calldata modelFile,
        string calldata description
    ) external onlyOwner {
        require(round > 0, "Round must be > 0");
        require(bytes(cid).length > 0, "CID empty");
        require(bytes(modelSha256).length > 0, "Hash empty");
        require(bytes(models[round].cid).length == 0, "Round already exists");

        models[round] = ModelMeta({
            round: round,
            cid: cid,
            modelSha256: modelSha256,
            modelFile: modelFile,
            description: description,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        if (round > latestRound) {
            latestRound = round;
        }

        emit ModelSubmitted(round, msg.sender, cid, modelSha256);
    }

    /// @notice Get metadata for a specific round
    function getModel(uint256 round)
        external
        view
        returns (ModelMeta memory)
    {
        require(bytes(models[round].cid).length > 0, "Round not found");
        return models[round];
    }

    /// @notice Get metadata for the latest round
    function getLatestModel()
        external
        view
        returns (ModelMeta memory)
    {
        require(latestRound > 0, "No models submitted");
        return models[latestRound];
    }
}