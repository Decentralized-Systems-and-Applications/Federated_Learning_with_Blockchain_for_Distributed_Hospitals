// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ModelRegistry (FL + IPFS)
 * - Hospitals submit local model update CIDs per round
 * - Aggregator publishes the global model CID per round
 * - Stores only metadata (CID + hash) on-chain, not the model itself
 */
contract ModelRegistry2 {
    // --- roles ---
    address public owner;
    address public aggregator; // can be owner or a server address

    // Optional: simple allowlist for hospitals
    mapping(address => bool) public isHospital;

    // --- config ---
    uint256 public requiredSubmissions; // e.g., 3 hospitals must submit per round

    // --- data structures ---
    struct ModelPointer {
        string cid;        // IPFS CID (string)
        bytes32 fileHash;  // e.g., sha256(fileBytes) computed off-chain
        uint256 timestamp;
        address submitter;
    }

    // round => hospital => local update
    mapping(uint256 => mapping(address => ModelPointer)) private localUpdateByHospital;

    // round => list of hospitals who submitted (for easy enumeration)
    mapping(uint256 => address[]) private roundSubmitters;
    mapping(uint256 => mapping(address => bool)) private hasSubmitted; // round => hospital => bool

    // round => global model pointer
    mapping(uint256 => ModelPointer) private globalModelByRound;

    // track current/latest global round
    uint256 public latestGlobalRound;

    // --- events ---
    event HospitalAdded(address hospital);
    event HospitalRemoved(address hospital);
    event AggregatorChanged(address aggregator);
    event RequiredSubmissionsChanged(uint256 required);

    event LocalUpdateSubmitted(
        uint256 indexed round,
        address indexed hospital,
        string cid,
        bytes32 fileHash
    );

    event GlobalModelPublished(
        uint256 indexed round,
        address indexed publisher,
        string cid,
        bytes32 fileHash
    );

    // --- modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAggregator() {
        require(msg.sender == aggregator, "Not aggregator");
        _;
    }

    modifier onlyHospital() {
        require(isHospital[msg.sender], "Not hospital");
        _;
    }

    constructor(uint256 _requiredSubmissions) {
        require(_requiredSubmissions > 0, "requiredSubmissions=0");
        owner = msg.sender;
        aggregator = msg.sender;
        requiredSubmissions = _requiredSubmissions;

        // (Optional) treat deployer as a hospital for quick testing
        isHospital[msg.sender] = true;
        emit HospitalAdded(msg.sender);
    }

    // --- admin ---
    function setAggregator(address _aggregator) external onlyOwner {
        require(_aggregator != address(0), "zero addr");
        aggregator = _aggregator;
        emit AggregatorChanged(_aggregator);
    }

    function setRequiredSubmissions(uint256 n) external onlyOwner {
        require(n > 0, "n=0");
        requiredSubmissions = n;
        emit RequiredSubmissionsChanged(n);
    }

    function addHospital(address h) external onlyOwner {
        require(h != address(0), "zero addr");
        isHospital[h] = true;
        emit HospitalAdded(h);
    }

    function removeHospital(address h) external onlyOwner {
        isHospital[h] = false;
        emit HospitalRemoved(h);
    }

    // --- hospital action ---
    function submitLocalUpdate(
        uint256 round,
        string calldata cid,
        bytes32 fileHash
    ) external onlyHospital {
        require(bytes(cid).length > 0, "empty cid");
        require(!hasSubmitted[round][msg.sender], "already submitted");

        hasSubmitted[round][msg.sender] = true;
        roundSubmitters[round].push(msg.sender);

        localUpdateByHospital[round][msg.sender] = ModelPointer({
            cid: cid,
            fileHash: fileHash,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        emit LocalUpdateSubmitted(round, msg.sender, cid, fileHash);
    }

    // --- aggregator action ---
    function publishGlobalModel(
        uint256 round,
        string calldata cid,
        bytes32 fileHash
    ) external onlyAggregator {
        require(bytes(cid).length > 0, "empty cid");
        require(roundSubmitters[round].length >= requiredSubmissions, "not enough submissions");

        globalModelByRound[round] = ModelPointer({
            cid: cid,
            fileHash: fileHash,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        if (round > latestGlobalRound) {
            latestGlobalRound = round;
        }

        emit GlobalModelPublished(round, msg.sender, cid, fileHash);
    }

    // --- reads ---
    function getRoundSubmitters(uint256 round) external view returns (address[] memory) {
        return roundSubmitters[round];
    }

    function getLocalUpdate(uint256 round, address hospital)
        external
        view
        returns (string memory cid, bytes32 fileHash, uint256 timestamp, address submitter)
    {
        ModelPointer memory p = localUpdateByHospital[round][hospital];
        return (p.cid, p.fileHash, p.timestamp, p.submitter);
    }

    function getGlobalModel(uint256 round)
        external
        view
        returns (string memory cid, bytes32 fileHash, uint256 timestamp, address publisher)
    {
        ModelPointer memory p = globalModelByRound[round];
        return (p.cid, p.fileHash, p.timestamp, p.submitter);
    }

    function getLatestGlobalModel()
        external
        view
        returns (uint256 round, string memory cid, bytes32 fileHash, uint256 timestamp, address publisher)
    {
        uint256 r = latestGlobalRound;
        ModelPointer memory p = globalModelByRound[r];
        return (r, p.cid, p.fileHash, p.timestamp, p.submitter);
    }
}
