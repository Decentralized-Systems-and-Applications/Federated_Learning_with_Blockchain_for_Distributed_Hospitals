// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ModelUpdateTracker
 * @dev Smart contract for tracking federated learning model updates from hospitals
 * This contract stores model updates, IPFS hashes, and contribution records
 */
contract ModelUpdateTracker {
    // Struct to store model update information
    struct ModelUpdate {
        address hospitalAddress;
        uint256 round;
        string ipfsHash;
        uint256 timestamp;
        bool isValid;
    }

    // Struct to store hospital contribution statistics
    struct HospitalContribution {
        address hospitalAddress;
        uint256 totalContributions;
        uint256 lastContributionRound;
        bool isRegistered;
    }

    // Contract owner
    address public owner;

    // Mapping from round number to model updates
    mapping(uint256 => ModelUpdate[]) public roundUpdates;

    // Mapping from hospital address to their contribution stats
    mapping(address => HospitalContribution) public hospitalContributions;

    // Array of all registered hospitals
    address[] public registeredHospitals;

    // Current federated learning round
    uint256 public currentRound;

    // Events
    event HospitalRegistered(address indexed hospital, uint256 timestamp);
    event ModelUpdateSubmitted(
        address indexed hospital,
        uint256 indexed round,
        string ipfsHash,
        uint256 timestamp
    );
    event RoundCompleted(uint256 indexed round, uint256 totalUpdates, uint256 timestamp);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyRegisteredHospital() {
        require(
            hospitalContributions[msg.sender].isRegistered,
            "Hospital not registered"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        currentRound = 0;
    }

    /**
     * @dev Register a new hospital
     * @param hospitalAddress Address of the hospital to register
     */
    function registerHospital(address hospitalAddress) public onlyOwner {
        require(
            !hospitalContributions[hospitalAddress].isRegistered,
            "Hospital already registered"
        );

        hospitalContributions[hospitalAddress] = HospitalContribution({
            hospitalAddress: hospitalAddress,
            totalContributions: 0,
            lastContributionRound: 0,
            isRegistered: true
        });

        registeredHospitals.push(hospitalAddress);
        emit HospitalRegistered(hospitalAddress, block.timestamp);
    }

    /**
     * @dev Submit a model update for the current round
     * @param ipfsHash IPFS hash of the model update stored on IPFS (via Pinata)
     * @param round Round number for this update
     */
    function submitModelUpdate(string memory ipfsHash, uint256 round)
        public
        onlyRegisteredHospital
    {
        require(round <= currentRound + 1, "Round number too high");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");

        // Create model update
        ModelUpdate memory update = ModelUpdate({
            hospitalAddress: msg.sender,
            round: round,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            isValid: true
        });

        // Store the update
        roundUpdates[round].push(update);

        // Update hospital contribution stats
        HospitalContribution storage contribution = hospitalContributions[msg.sender];
        contribution.totalContributions++;
        contribution.lastContributionRound = round;

        emit ModelUpdateSubmitted(msg.sender, round, ipfsHash, block.timestamp);
    }

    /**
     * @dev Get all updates for a specific round
     * @param round Round number
     * @return Array of ModelUpdate structs
     */
    function getRoundUpdates(uint256 round)
        public
        view
        returns (ModelUpdate[] memory)
    {
        return roundUpdates[round];
    }

    /**
     * @dev Get contribution statistics for a hospital
     * @param hospitalAddress Address of the hospital
     * @return HospitalContribution struct
     */
    function getHospitalContribution(address hospitalAddress)
        public
        view
        returns (HospitalContribution memory)
    {
        return hospitalContributions[hospitalAddress];
    }

    /**
     * @dev Get total number of registered hospitals
     * @return Count of registered hospitals
     */
    function getRegisteredHospitalsCount() public view returns (uint256) {
        return registeredHospitals.length;
    }

    /**
     * @dev Advance to the next round (only owner)
     */
    function advanceRound() public onlyOwner {
        currentRound++;
        emit RoundCompleted(
            currentRound - 1,
            roundUpdates[currentRound - 1].length,
            block.timestamp
        );
    }

    /**
     * @dev Get number of updates in a specific round
     * @param round Round number
     * @return Count of updates
     */
    function getRoundUpdateCount(uint256 round) public view returns (uint256) {
        return roundUpdates[round].length;
    }
}
