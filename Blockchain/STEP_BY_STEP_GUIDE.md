# 📚 Step-by-Step Execution Guide

Complete guide to run all scripts in the correct order with checks at each step.

---

## 🔍 Prerequisites Check

Before starting, verify you have:

- [ ] Node.js and npm installed
- [ ] Docker Desktop installed (for IPFS nodes)
- [ ] Hardhat dependencies installed (`npm install` in Blockchain/)
- [ ] Python environment ready (for FL training)

---

## 📋 Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `deploy.js` | Deploy smart contract | First time setup |
| `interact.js` | Register hospitals | After deployment |
| `test_ipfs_connection.js` | Test IPFS nodes | Before uploading models |
| `integrate_fl_workflow.js` | Upload to single IPFS node | Single IPFS node setup |
| `integrate_fl_workflow_multi_ipfs.js` | Upload to multiple IPFS nodes | Docker multi-node setup |
| `upload_to_ipfs_and_register.js` | Manual single file upload | Testing or manual upload |
| `advance_round.js` | Advance to next FL round | After all hospitals submit |

---

## 🚀 Complete Workflow (First Time Setup)

### STEP 1: Install Dependencies

**Check:** Are dependencies installed?

```bash
cd Blockchain
npm install
```

**Expected output:**
```
added X packages
```

**If error:** Run `npm install` again.

---

### STEP 2: Start Hardhat Local Network

**What it does:** Starts a local Ethereum blockchain for testing.

**Action:**
```bash
# In a NEW terminal window (keep this running)
cd Blockchain
npx hardhat node
```

**Expected output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
```

**✅ Check:** You should see 20 accounts with 10000 ETH each.

**⚠️ Important:** Keep this terminal window open! The blockchain runs here.

---

### STEP 3: Deploy Smart Contract

**What it does:** Deploys the ModelUpdateTracker contract to the local blockchain.

**Action:**
```bash
# In a NEW terminal window
cd Blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Expected output:**
```
✅ ModelUpdateTracker deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📝 Contract owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
🔢 Current round: 0
💾 Deployment info saved to: deployment_info.json
```

**✅ Check:** 
- Contract address is shown
- `deployment_info.json` file is created in `Blockchain/` directory

**📝 Note:** Copy the contract address for later use (or it's saved in `deployment_info.json`).

---

### STEP 4: Register Hospitals

**What it does:** Registers 3 hospitals on the smart contract (required before they can submit updates).

**Action:**
```bash
# In the same terminal as Step 3
cd Blockchain
npx hardhat run scripts/interact.js --network localhost
```

**Expected output:**
```
📋 Contract Info:
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Current Round: 0
Registered Hospitals: 0

🏥 Registering hospitals...
✅ Hospital 1 registered: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
✅ Hospital 2 registered: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
✅ Hospital 3 registered: 0x90F79bf6EB2c4f870365E785982E1f101E93b906

📊 Round Updates:
Round 0 has 0 update(s)
```

**✅ Check:**
- All 3 hospitals show "✅ registered"
- Registered Hospitals count is now 3

**⚠️ If you see "might already be registered":** That's fine, they're already registered.

---

### STEP 5: Start IPFS Nodes (Docker)

**What it does:** Starts 4 IPFS nodes (3 for hospitals, 1 global) in Docker containers.

**Action:**
```bash
# In a NEW terminal window
cd ipfs-hospitals
docker-compose up -d
```

**Expected output:**
```
Creating ipfs_hospital1 ... done
Creating ipfs_hospital2 ... done
Creating ipfs_hospital3 ... done
Creating ipfs_global    ... done
```

**✅ Check:** Verify containers are running:
```bash
docker ps --filter "name=ipfs_"
```

**Expected:** 4 containers with status "Up"

**⏳ Wait:** Wait 15-20 seconds for IPFS nodes to fully initialize.

---

### STEP 6: Test IPFS Connections

**What it does:** Tests all IPFS nodes to ensure they're accessible and working.

**Action:**
```bash
# In a NEW terminal window
cd Blockchain
node scripts/test_ipfs_connection.js
```

**Expected output:**
```
🧪 Testing IPFS Node Connections

🔍 Testing Hospital 1 (http://127.0.0.1:5001)...
   ✅ Connected! IPFS version: 0.24.0
   ✅ Node ID: 12D3KooW...
   ✅ Test upload successful! CID: QmTestHash...
   ✅ File retrieval successful!

... (similar for Hospital 2, 3, Global)

📊 Test Summary:
✅ Successful: 4/4
```

**✅ Check:**
- At least one IPFS node should show "✅ Connected"
- Test upload should succeed with a CID

**❌ If connection fails:**
- Check Docker containers: `docker ps`
- Check logs: `docker-compose -f ipfs-hospitals/docker-compose.yml logs`
- Wait a bit longer (nodes may still be initializing)

---

### STEP 7: Train Models (if not done)

**What it does:** Trains federated learning models for each hospital.

**Action:**
```bash
# In a NEW terminal window
cd FL
python fl_server.py
```

**Expected output:**
```
🌍 Federated Round 1
...
✅ Saved global_round1.pt
...
🎉 Federated Learning finished
```

**✅ Check:**
- Model files created: `h1_round1.pt`, `h2_round1.pt`, `h3_round1.pt` in `FL/` directory
- Global models created: `global_round1.pt`, etc.

**⚠️ If models already exist:** You can skip this step.

---

### STEP 8: Upload Models to IPFS and Register on Blockchain

**Choose ONE of these options:**

#### Option A: Multi-IPFS (Recommended - Uses separate IPFS node per hospital)

**Action:**
```bash
cd Blockchain
npx hardhat run scripts/integrate_fl_workflow_multi_ipfs.js --network localhost
```

**What it does:**
- Finds model files (`h1_round1.pt`, `h2_round1.pt`, `h3_round1.pt`)
- Uploads each to its corresponding IPFS node
- Gets CIDs (Content Identifiers)
- Verifies uploads
- Submits CIDs to blockchain

**Expected output:**
```
🚀 Starting Federated Learning + Multi-IPFS + Blockchain Integration

📋 Using contract from deployment_info.json: 0x5FbDB...
🔗 Testing IPFS node connections...
   ✅ Hospital 1 IPFS Node connected
   ✅ Hospital 2 IPFS Node connected
   ✅ Hospital 3 IPFS Node connected

🔍 Looking for model files for round 1...
  ✅ Found: h1_round1.pt
  ✅ Found: h2_round1.pt
  ✅ Found: h3_round1.pt

📤 Processing Hospital 1...
   📦 File size: 0.XX MB
   🔼 Uploading to IPFS node 1...
   ✅ Uploaded to IPFS: QmHash...
   ✅ Verification successful
   📝 Submitting CID to blockchain...
   ✅ Submitted to blockchain successfully

... (similar for Hospital 2, 3)

📊 Summary:
   Round: 1
   Models processed: 3/3

📈 Round 1 Status:
   Submissions: 3/3

🎉 All hospitals have submitted!
```

#### Option B: Single IPFS (Uses one IPFS node)

**Action:**
```bash
cd Blockchain
npx hardhat run scripts/integrate_fl_workflow.js --network localhost
```

**Note:** This uses only one IPFS node (default: port 5001).

**✅ Check:**
- All 3 hospitals should show "✅ Submitted to blockchain"
- Round status should show "3/3" submissions
- CIDs should be displayed for each hospital

---

### STEP 9: Verify Submissions

**What it does:** Checks what's stored on the blockchain.

**Action:**
```bash
cd Blockchain
npx hardhat run scripts/interact.js --network localhost
```

**Expected output:**
```
📊 Round Updates:
Round 1 has 3 update(s)
  Update 1:
    Hospital: 0x7099...
    IPFS Hash: QmHash...
    Timestamp: [date/time]

📈 Hospital Contributions:
  0x7099...:
    Total Contributions: 1
    Last Round: 1
```

**✅ Check:**
- Round 1 should have 3 updates
- Each hospital should have 1 contribution

---

### STEP 10: Advance to Next Round

**What it does:** Advances the current round number (only after all hospitals submitted).

**Action:**
```bash
cd Blockchain
npx hardhat run scripts/advance_round.js --network localhost
```

**Expected output:**
```
📊 Current round: 1
   Updates in current round: 3

🚀 Advancing to round 2...
✅ Advanced to round 2

📊 Round 1 Summary:
   Total updates: 3
   1. 0x7099... - QmHash...
   2. 0x3C44... - QmHash...
   3. 0x90F7... - QmHash...
```

**✅ Check:**
- Current round should now be 2
- Round 1 summary should show all 3 submissions

---

## 🔄 Repeat for Next Round

For subsequent rounds, repeat **Steps 7-10**:

1. Train next round models (if needed)
2. Upload models (Step 8)
3. Verify submissions (Step 9)
4. Advance round (Step 10)

---

## 🔧 Manual Upload (Optional)

If you want to upload a single model file manually:

```bash
cd Blockchain
node scripts/upload_to_ipfs_and_register.js \
  <CONTRACT_ADDRESS> \
  <MODEL_FILE_PATH> \
  <ROUND_NUMBER> \
  <HOSPITAL_ADDRESS>
```

**Example:**
```bash
node scripts/upload_to_ipfs_and_register.js \
  0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  ../FL/h1_round1.pt \
  1 \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

---

## 🐛 Troubleshooting

### Contract not found
**Error:** `Contract address not found`
**Solution:** Run Step 3 (deploy.js) first

### Hospitals not registered
**Error:** `Hospital not registered`
**Solution:** Run Step 4 (interact.js) first

### IPFS connection failed
**Error:** `Failed to connect to IPFS`
**Solution:** 
- Check Docker containers: `docker ps`
- Start IPFS: `cd ipfs-hospitals && docker-compose up -d`
- Wait 15-20 seconds

### Already submitted
**Error:** `Already submitted for this round`
**Solution:** Normal - each hospital can only submit once per round. Advance to next round.

### No model files
**Error:** `No model files found`
**Solution:** Run Step 7 (train models) first

---

## 📊 Quick Reference

```bash
# 1. Start blockchain (keep running)
npx hardhat node

# 2. Deploy contract (one time)
npx hardhat run scripts/deploy.js --network localhost

# 3. Register hospitals (one time)
npx hardhat run scripts/interact.js --network localhost

# 4. Start IPFS (one time, keep running)
cd ipfs-hospitals && docker-compose up -d

# 5. Test IPFS (whenever needed)
node scripts/test_ipfs_connection.js

# 6. Train models (per round)
cd FL && python fl_server.py

# 7. Upload models (per round)
npx hardhat run scripts/integrate_fl_workflow_multi_ipfs.js --network localhost

# 8. Advance round (per round, after all submit)
npx hardhat run scripts/advance_round.js --network localhost
```

---

## ✅ Completion Checklist

- [ ] Hardhat node running
- [ ] Contract deployed
- [ ] Hospitals registered (3/3)
- [ ] IPFS nodes running (4 containers)
- [ ] IPFS connections tested
- [ ] Models trained
- [ ] Models uploaded to IPFS and blockchain
- [ ] Round advanced

---

## 📝 Notes

- Keep Hardhat node terminal open while using the system
- Keep Docker containers running while uploading
- Each hospital can only submit once per round (by design)
- Contract address is saved in `deployment_info.json`
- Upload logs are saved in `FL/ipfs_blockchain_integration_log.json`

