// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ModelUpdateTracker
 * @dev Smart contract for tracking federated learning model updates from hospitals
 * This contract stores model updates, IPFS hashes, and contribution records
 * @notice Improved version with security enhancements, duplicate prevention, and gas optimizations
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
    
    // Pausable state
    bool public paused;

    // Maximum IPFS hash length to prevent DoS attacks
    uint256 public constant MAX_IPFS_HASH_LENGTH = 100;

    // Mapping from round number to model updates
    mapping(uint256 => ModelUpdate[]) public roundUpdates;

    // Mapping from hospital address to their contribution stats
    mapping(address => HospitalContribution) public hospitalContributions;

    // Mapping from (round, hospital) to check if hospital already submitted for a round
    mapping(uint256 => mapping(address => bool)) public hasSubmittedForRound;

    // Array of all registered hospitals
    address[] public registeredHospitals;

    // Current federated learning round
    uint256 public currentRound;

    // Events
    event HospitalRegistered(address indexed hospital, uint256 timestamp);
    event HospitalUnregistered(address indexed hospital, uint256 timestamp);
    event ModelUpdateSubmitted(
        address indexed hospital,
        uint256 indexed round,
        string ipfsHash,
        uint256 timestamp
    );
    event ModelUpdateInvalidated(
        address indexed hospital,
        uint256 indexed round,
        uint256 timestamp
    );
    event RoundCompleted(uint256 indexed round, uint256 totalUpdates, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

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

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        currentRound = 0;
        paused = false;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @dev Register a new hospital
     * @param hospitalAddress Address of the hospital to register
     */
    function registerHospital(address hospitalAddress) 
        public 
        onlyOwner 
        whenNotPaused 
    {
        require(
            !hospitalContributions[hospitalAddress].isRegistered,
            "Hospital already registered"
        );
        require(hospitalAddress != address(0), "Cannot register zero address");

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
     * @dev Batch register multiple hospitals (gas optimization)
     * @param hospitalAddresses Array of hospital addresses to register
     */
    function batchRegisterHospitals(address[] calldata hospitalAddresses)
        external
        onlyOwner
        whenNotPaused
    {
        require(hospitalAddresses.length > 0, "Empty array");
        require(hospitalAddresses.length <= 50, "Too many hospitals"); // Prevent out of gas
        
        for (uint256 i = 0; i < hospitalAddresses.length; i++) {
            address hospitalAddress = hospitalAddresses[i];
            if (
                !hospitalContributions[hospitalAddress].isRegistered &&
                hospitalAddress != address(0)
            ) {
                hospitalContributions[hospitalAddress] = HospitalContribution({
                    hospitalAddress: hospitalAddress,
                    totalContributions: 0,
                    lastContributionRound: 0,
                    isRegistered: true
                });
                registeredHospitals.push(hospitalAddress);
                emit HospitalRegistered(hospitalAddress, block.timestamp);
            }
        }
    }

    /**
     * @dev Unregister a hospital (only owner, in case of malicious behavior)
     * @param hospitalAddress Address of the hospital to unregister
     */
    function unregisterHospital(address hospitalAddress)
        external
        onlyOwner
        whenNotPaused
    {
        require(
            hospitalContributions[hospitalAddress].isRegistered,
            "Hospital not registered"
        );
        
        hospitalContributions[hospitalAddress].isRegistered = false;
        emit HospitalUnregistered(hospitalAddress, block.timestamp);
    }

    /**
     * @dev Submit a model update for the current round
     * @param ipfsHash IPFS hash of the model update stored on IPFS (via Pinata)
     * @param round Round number for this update
     */
    function submitModelUpdate(string memory ipfsHash, uint256 round)
        public
        onlyRegisteredHospital
        whenNotPaused
    {
        require(round <= currentRound + 1, "Round number too high");
        require(round > 0, "Round must be greater than 0");
        require(
            !hasSubmittedForRound[round][msg.sender],
            "Already submitted for this round"
        );
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(
            bytes(ipfsHash).length <= MAX_IPFS_HASH_LENGTH,
            "IPFS hash too long"
        );

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

        // Mark that this hospital has submitted for this round
        hasSubmittedForRound[round][msg.sender] = true;

        // Update hospital contribution stats
        HospitalContribution storage contribution = hospitalContributions[msg.sender];
        contribution.totalContributions++;
        contribution.lastContributionRound = round;

        emit ModelUpdateSubmitted(msg.sender, round, ipfsHash, block.timestamp);
    }

    /**
     * @dev Check if a hospital has submitted for a specific round
     * @param hospitalAddress Address of the hospital
     * @param round Round number
     * @return true if hospital has submitted for this round
     */
    function hasHospitalSubmitted(address hospitalAddress, uint256 round)
        public
        view
        returns (bool)
    {
        return hasSubmittedForRound[round][hospitalAddress];
    }

    /**
     * @dev Invalidate a model update (only owner, for malicious updates)
     * @param round Round number
     * @param index Index of the update in the round's update array
     */
    function invalidateModelUpdate(uint256 round, uint256 index)
        external
        onlyOwner
        whenNotPaused
    {
        require(index < roundUpdates[round].length, "Invalid index");
        ModelUpdate storage update = roundUpdates[round][index];
        require(update.isValid, "Update already invalidated");
        
        update.isValid = false;
        
        // Decrease contribution count for the hospital
        address hospital = update.hospitalAddress;
        if (hospitalContributions[hospital].totalContributions > 0) {
            hospitalContributions[hospital].totalContributions--;
        }
        
        emit ModelUpdateInvalidated(hospital, round, block.timestamp);
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
     * @dev Get only valid updates for a specific round (gas efficient for large arrays)
     * @param round Round number
     * @return Array of valid ModelUpdate structs
     */
    function getValidRoundUpdates(uint256 round)
        public
        view
        returns (ModelUpdate[] memory)
    {
        ModelUpdate[] memory allUpdates = roundUpdates[round];
        uint256 validCount = 0;
        
        // Count valid updates
        for (uint256 i = 0; i < allUpdates.length; i++) {
            if (allUpdates[i].isValid) {
                validCount++;
            }
        }
        
        // Build array of valid updates
        ModelUpdate[] memory validUpdates = new ModelUpdate[](validCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allUpdates.length; i++) {
            if (allUpdates[i].isValid) {
                validUpdates[index] = allUpdates[i];
                index++;
            }
        }
        
        return validUpdates;
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
     * @dev Get all registered hospital addresses
     * @return Array of registered hospital addresses
     */
    function getRegisteredHospitals() 
        public 
        view 
        returns (address[] memory) 
    {
        return registeredHospitals;
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
    function advanceRound() public onlyOwner whenNotPaused {
        require(
            roundUpdates[currentRound].length > 0,
            "No updates in current round"
        );
        
        uint256 completedRound = currentRound;
        currentRound++;
        
        emit RoundCompleted(
            completedRound,
            roundUpdates[completedRound].length,
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

    /**
     * @dev Get number of valid updates in a specific round
     * @param round Round number
     * @return Count of valid updates
     */
    function getValidRoundUpdateCount(uint256 round) 
        public 
        view 
        returns (uint256) 
    {
        ModelUpdate[] memory updates = roundUpdates[round];
        uint256 count = 0;
        for (uint256 i = 0; i < updates.length; i++) {
            if (updates[i].isValid) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Pause the contract (emergency stop)
     */
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Transfer ownership to a new address
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(newOwner != owner, "New owner must be different");
        
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Renounce ownership (make contract ownerless)
     * @notice Use with extreme caution - cannot be undone
     */
    function renounceOwnership() external onlyOwner {
        address oldOwner = owner;
        owner = address(0);
        emit OwnershipTransferred(oldOwner, address(0));
    }
}
