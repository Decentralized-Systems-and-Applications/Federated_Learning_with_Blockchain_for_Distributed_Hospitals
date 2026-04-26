# 🚀 IPFS + Blockchain Integration Guide

Complete guide for integrating IPFS storage with blockchain smart contracts in the Federated Learning system.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Deployment](#deployment)
4. [Usage](#usage)
5. [Workflow](#workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js & npm** (already installed)
2. **Hardhat** (installed locally in Blockchain/)
3. **IPFS Node** - Choose one:
   - Local IPFS: Install from https://docs.ipfs.io/install/
   - Docker IPFS: Use the docker-compose.yml in `ipfs-hospitals/`

### Required Packages

All packages are already installed:
- `@nomicfoundation/hardhat-toolbox`
- `ipfs-http-client`

---

## Setup

### 1. Start IPFS Node

**Option A: Local IPFS**
```bash
# Initialize IPFS (first time only)
ipfs init

# Start IPFS daemon
ipfs daemon
```

**Option B: Docker IPFS**
```bash
cd ../ipfs-hospitals
docker-compose up -d
```

The IPFS API will be available at `http://127.0.0.1:5001`

### 2. Start Hardhat Local Network

In a new terminal:
```bash
cd Blockchain
npx hardhat node
```

This starts a local Ethereum network on `http://127.0.0.1:8545`

---

## Deployment

### Step 1: Deploy the Contract

```bash
cd Blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Output:**
```
✅ ModelUpdateTracker deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📝 Contract owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
🔢 Current round: 0
💾 Deployment info saved to: deployment_info.json
```

The contract address is saved to `deployment_info.json` for future use.

### Step 2: Register Hospitals

Edit `scripts/interact.js` and set the `CONTRACT_ADDRESS` or it will use the default.

```bash
npx hardhat run scripts/interact.js --network localhost
```

This will:
- Register 3 hospitals (using the first 3 signers from Hardhat)
- Show contract info
- Optionally submit a test update

**Note:** The script uses Hardhat's default test accounts. In production, you'd use real hospital wallet addresses.

---

## Usage

### Method 1: Automatic Integration (Recommended)

This automatically processes all model files for the current round:

```bash
npx hardhat run scripts/integrate_fl_workflow.js --network localhost
```

**What it does:**
1. Finds all `h1_roundX.pt`, `h2_roundX.pt`, `h3_roundX.pt` files in `../FL/` directory
2. Uploads each to IPFS
3. Submits CIDs to blockchain
4. Shows summary and logs results

**Requirements:**
- Contract deployed and saved in `deployment_info.json`
- Hospitals registered on contract
- Model files exist in `../FL/` directory
- IPFS node running

### Method 2: Manual Upload (Individual Files)

For uploading a single model file:

```bash
node scripts/upload_to_ipfs_and_register.js <contract_address> <model_file> <round> <hospital_address>
```

**Example:**
```bash
node scripts/upload_to_ipfs_and_register.js \
  0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  ../FL/h1_round1.pt \
  1 \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### Method 3: Advance Round

After all hospitals submit updates for a round, advance to the next:

```bash
npx hardhat run scripts/advance_round.js --network localhost
```

**What it does:**
- Advances `currentRound` by 1
- Emits `RoundCompleted` event
- Shows summary of completed round

---

## Workflow

### Complete Federated Learning Round Flow

```
1. Train Models (Python)
   └─> python FL/fl_server.py
   └─> Creates: h1_round1.pt, h2_round1.pt, h3_round1.pt

2. Upload to IPFS & Register on Blockchain
   └─> npx hardhat run scripts/integrate_fl_workflow.js --network localhost
   └─> For each hospital model:
       ├─> Upload .pt file to IPFS → Get CID
       ├─> Submit CID to ModelUpdateTracker contract
       └─> Log result

3. Verify Submissions
   └─> Check blockchain for all hospitals submitted
   └─> View CIDs and transaction hashes

4. Advance Round (when all hospitals submitted)
   └─> npx hardhat run scripts/advance_round.js --network localhost

5. Repeat for next round
```

### Example: Round 1

```bash
# 1. Train models (in FL directory)
cd FL
python fl_server.py

# 2. Upload to IPFS and blockchain (in Blockchain directory)
cd ../Blockchain
npx hardhat run scripts/integrate_fl_workflow.js --network localhost

# Output:
# ✅ Hospital 1 uploaded: QmHash1...
# ✅ Hospital 2 uploaded: QmHash2...
# ✅ Hospital 3 uploaded: QmHash3...
# 📈 Round 1 Status: 3/3 submissions

# 3. Advance to round 2
npx hardhat run scripts/advance_round.js --network localhost

# 4. Train next round models
cd ../FL
python fl_server.py  # Creates round 2 models

# 5. Repeat...
```

---

## Querying Data

### View Round Updates

Use the `interact.js` script or create a custom query:

```javascript
const updates = await contract.getRoundUpdates(1);
updates.forEach(update => {
  console.log(`Hospital: ${update.hospitalAddress}`);
  console.log(`IPFS CID: ${update.ipfsHash}`);
  console.log(`Round: ${update.round}`);
  console.log(`Valid: ${update.isValid}`);
});
```

### Get Hospital Contributions

```javascript
const contribution = await contract.getHospitalContribution(hospitalAddress);
console.log(`Total contributions: ${contribution.totalContributions}`);
console.log(`Last round: ${contribution.lastContributionRound}`);
```

### Check if Hospital Submitted

```javascript
const hasSubmitted = await contract.hasHospitalSubmitted(hospitalAddress, round);
console.log(`Submitted: ${hasSubmitted}`);
```

---

## File Structure

```
Blockchain/
├── contracts/
│   └── ModelUpdateTracker.sol      # Main contract
├── scripts/
│   ├── deploy.js                    # Deploy contract
│   ├── interact.js                  # Interact with contract
│   ├── upload_to_ipfs_and_register.js  # Upload single file
│   ├── integrate_fl_workflow.js     # Full workflow automation
│   └── advance_round.js             # Advance to next round
├── deployment_info.json             # Auto-generated deployment info
└── IPFS_BLOCKCHAIN_INTEGRATION_GUIDE.md  # This file

FL/
├── h1_round1.pt, h2_round1.pt, ... # Model files
└── ipfs_blockchain_integration_log.json  # Upload logs
```

---

## Troubleshooting

### ❌ "Failed to connect to IPFS"

**Problem:** IPFS node not running

**Solution:**
```bash
# Check if IPFS is running
curl http://127.0.0.1:5001/api/v0/version

# Start IPFS
ipfs daemon
# OR
cd ipfs-hospitals && docker-compose up -d
```

### ❌ "Contract address not found"

**Problem:** Contract not deployed yet

**Solution:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### ❌ "Hospital not registered"

**Problem:** Hospitals need to be registered first

**Solution:**
```bash
npx hardhat run scripts/interact.js --network localhost
```

### ❌ "Already submitted for this round"

**Problem:** Hospital already submitted for this round (duplicate prevention)

**Solution:** This is expected behavior. Each hospital can only submit once per round.

### ❌ "Cannot advance round - no updates"

**Problem:** No submissions in current round

**Solution:** Submit model updates first using `integrate_fl_workflow.js`

### ❌ "Transaction failed - insufficient gas"

**Problem:** Network issue or contract paused

**Solution:**
```javascript
// Check if contract is paused
const isPaused = await contract.paused();

// If paused, unpause (owner only)
await contract.unpause();
```

---

## Environment Variables

Create a `.env` file (optional):

```env
# Contract Address (auto-saved to deployment_info.json)
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# IPFS API URL
IPFS_API_URL=http://127.0.0.1:5001

# For Docker IPFS
# IPFS_API_URL=http://localhost:5001
```

---

## Security Notes

1. **Private Keys:** Never commit private keys or `.env` files with real keys
2. **Network:** Use test networks for development
3. **Pausability:** Contract can be paused by owner in emergencies
4. **Access Control:** Only registered hospitals can submit updates
5. **Validation:** Duplicate submissions are prevented per round

---

## Next Steps

1. ✅ Deploy contract to testnet (Sepolia, Mumbai, etc.)
2. ✅ Use real hospital wallet addresses
3. ✅ Implement frontend dashboard
4. ✅ Add IPFS CID format validation
5. ✅ Implement model verification (check if CID matches uploaded file)

---

## Quick Reference

```bash
# Deploy
npx hardhat run scripts/deploy.js --network localhost

# Register hospitals
npx hardhat run scripts/interact.js --network localhost

# Upload all models for current round
npx hardhat run scripts/integrate_fl_workflow.js --network localhost

# Advance round
npx hardhat run scripts/advance_round.js --network localhost

# Compile contracts
npx hardhat compile

# Start local network
npx hardhat node
```

---

## Support

For issues or questions:
1. Check `IMPROVEMENTS_EXPLAINED.md` for contract details
2. Review Hardhat docs: https://hardhat.org/docs
3. Review IPFS docs: https://docs.ipfs.io




