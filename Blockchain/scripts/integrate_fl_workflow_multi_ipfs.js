const hre = require("hardhat");
const { create } = require("ipfs-http-client");
const fs = require("fs");
const path = require("path");

/**
 * Complete integration script with MULTI-IPFS node support
 * Each hospital uploads to its own IPFS node
 * 
 * Hospital 1 -> IPFS Node 1 (port 5001)
 * Hospital 2 -> IPFS Node 2 (port 5002)
 * Hospital 3 -> IPFS Node 3 (port 5003)
 * 
 * Usage:
 *   npx hardhat run scripts/integrate_fl_workflow_multi_ipfs.js --network localhost
 * 
 * Requires:
 * - Docker IPFS nodes running (docker-compose up -d in ipfs-hospitals/)
 * - Contract deployed
 * - Hospitals registered on contract
 * - Model files in ../FL/ directory
 */

async function testIPFSNode(apiUrl) {
  try {
    const ipfs = create({ url: apiUrl });
    await ipfs.version();
    return { ipfs, success: true };
  } catch (error) {
    return { ipfs: null, success: false, error: error.message };
  }
}

async function main() {
  console.log("🚀 Starting Federated Learning + Multi-IPFS + Blockchain Integration\n");

  // Load contract address
  const deploymentPath = path.join(__dirname, "..", "deployment_info.json");
  let contractAddress;
  
  if (process.env.CONTRACT_ADDRESS) {
    contractAddress = process.env.CONTRACT_ADDRESS;
    console.log("📋 Using contract from environment:", contractAddress);
  } else if (fs.existsSync(deploymentPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    contractAddress = deploymentInfo.contractAddress;
    console.log("📋 Using contract from deployment_info.json:", contractAddress);
  } else {
    console.error("❌ Contract address not found!");
    console.error("   Either set CONTRACT_ADDRESS environment variable or run deploy.js first");
    process.exit(1);
  }

  // IPFS node configuration for each hospital
  const ipfsNodes = [
    { hospital: 1, url: "http://127.0.0.1:5001", name: "Hospital 1 IPFS Node" },
    { hospital: 2, url: "http://127.0.0.1:5002", name: "Hospital 2 IPFS Node" },
    { hospital: 3, url: "http://127.0.0.1:5003", name: "Hospital 3 IPFS Node" },
  ];

  // Test IPFS connections
  console.log("\n🔗 Testing IPFS node connections...");
  const ipfsConnections = {};
  for (const node of ipfsNodes) {
    console.log(`   Testing ${node.name}...`);
    const test = await testIPFSNode(node.url);
    if (test.success) {
      ipfsConnections[node.hospital] = test.ipfs;
      console.log(`   ✅ ${node.name} connected`);
    } else {
      console.log(`   ❌ ${node.name} failed: ${test.error}`);
      console.log(`      💡 Make sure Docker container ipfs_hospital${node.hospital} is running`);
    }
  }

  const availableNodes = Object.keys(ipfsConnections).length;
  if (availableNodes === 0) {
    console.error("\n❌ No IPFS nodes are accessible!");
    console.error("   Please start Docker containers:");
    console.error("   cd ../ipfs-hospitals && docker-compose up -d");
    console.error("\n   Then wait 10-15 seconds for nodes to initialize");
    process.exit(1);
  }

  if (availableNodes < ipfsNodes.length) {
    console.log(`\n⚠️  Warning: Only ${availableNodes}/${ipfsNodes.length} IPFS nodes are available`);
    console.log("   Will use fallback to first available node for missing hospitals");
  }

  // Connect to blockchain
  console.log("\n⛓️  Connecting to blockchain...");
  const ModelUpdateTracker = await hre.ethers.getContractFactory("ModelUpdateTracker");
  const contract = ModelUpdateTracker.attach(contractAddress);
  const [owner, ...hospitalSigners] = await hre.ethers.getSigners();

  // Get current round
  let currentRound = Number(await contract.currentRound());
  console.log("📊 Current round:", currentRound);
  
  // Get registered hospitals
  const registeredHospitals = await contract.getRegisteredHospitals();
  console.log("🏥 Registered hospitals:", registeredHospitals.length);
  if (registeredHospitals.length === 0) {
    console.error("❌ No hospitals registered! Run scripts/interact.js first to register hospitals.");
    process.exit(1);
  }

  // Map hospital signers to addresses
  const hospitalMap = new Map();
  for (let i = 0; i < Math.min(hospitalSigners.length, registeredHospitals.length); i++) {
    hospitalMap.set(i + 1, hospitalSigners[i]);
  }

  // Find model files for current round + 1
  const targetRound = currentRound + 1;
  const flDir = path.join(__dirname, "..", "..", "FL");
  
  console.log(`\n🔍 Looking for model files for round ${targetRound}...`);
  const modelFiles = [];
  for (let i = 1; i <= 3; i++) {
    const modelFile = path.join(flDir, `h${i}_round${targetRound}.pt`);
    if (fs.existsSync(modelFile)) {
      modelFiles.push({ hospital: i, path: modelFile });
      console.log(`  ✅ Found: h${i}_round${targetRound}.pt`);
    } else {
      console.log(`  ⚠️  Missing: h${i}_round${targetRound}.pt`);
    }
  }

  if (modelFiles.length === 0) {
    console.log("\n💡 No model files found for round", targetRound);
    console.log("   Train models first using FL/fl_server.py");
    process.exit(0);
  }

  // Process each model file
  const uploadResults = [];
  for (const { hospital, path: modelPath } of modelFiles) {
    const hospitalSigner = hospitalMap.get(hospital);
    if (!hospitalSigner) {
      console.log(`⚠️  No signer found for hospital ${hospital}, skipping...`);
      continue;
    }

    console.log(`\n📤 Processing Hospital ${hospital}...`);
    console.log(`   File: ${path.basename(modelPath)}`);

    // Check if already submitted
    const hasSubmitted = await contract.hasSubmittedForRound(targetRound, hospitalSigner.address);
    if (hasSubmitted) {
      console.log(`   ⚠️  Already submitted for round ${targetRound}, skipping...`);
      continue;
    }

    // Get IPFS client for this hospital (or fallback)
    let ipfs = ipfsConnections[hospital];
    if (!ipfs) {
      // Fallback to first available node
      const firstAvailable = Object.values(ipfsConnections)[0];
      if (firstAvailable) {
        console.log(`   ⚠️  Hospital ${hospital} IPFS node not available, using fallback node`);
        ipfs = firstAvailable;
      } else {
        console.log(`   ❌ No IPFS nodes available, skipping...`);
        continue;
      }
    }

    // Upload to IPFS
    try {
      const fileContent = fs.readFileSync(modelPath);
      const fileSize = (fileContent.length / 1024 / 1024).toFixed(2);
      console.log(`   📦 File size: ${fileSize} MB`);
      console.log(`   🔼 Uploading to IPFS node ${hospital}...`);
      
      const result = await ipfs.add(fileContent, { 
        pin: true, 
        cidVersion: 0,
        wrapWithDirectory: false 
      });
      const cid = result.cid.toString();
      console.log(`   ✅ Uploaded to IPFS: ${cid}`);
      console.log(`   📊 Size on IPFS: ${result.size} bytes`);

      // Verify upload by retrieving
      console.log(`   🔍 Verifying upload...`);
      const retrieved = await ipfs.cat(cid);
      const chunks = [];
      for await (const chunk of retrieved) {
        chunks.push(chunk);
      }
      const retrievedSize = Buffer.concat(chunks).length;
      if (retrievedSize === fileContent.length) {
        console.log(`   ✅ Verification successful (${retrievedSize} bytes)`);
      } else {
        console.log(`   ⚠️  Warning: Size mismatch (${retrievedSize} vs ${fileContent.length})`);
      }

      // Submit to blockchain
      console.log(`   📝 Submitting CID to blockchain...`);
      const tx = await contract.connect(hospitalSigner).submitModelUpdate(cid, targetRound);
      console.log(`   🔗 Transaction: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      await tx.wait();
      console.log(`   ✅ Submitted to blockchain successfully`);

      uploadResults.push({
        hospital,
        cid,
        txHash: tx.hash,
        modelFile: path.basename(modelPath),
        ipfsNode: hospital,
        fileSize: fileContent.length,
        ipfsSize: result.size
      });
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.reason) {
        console.error(`      Reason: ${error.reason}`);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log("=".repeat(60));
  console.log(`   Round: ${targetRound}`);
  console.log(`   Models processed: ${uploadResults.length}/${modelFiles.length}`);
  
  if (uploadResults.length > 0) {
    console.log("\n📋 Upload Results:");
    uploadResults.forEach(result => {
      console.log(`\n   🏥 Hospital ${result.hospital}:`);
      console.log(`      📁 File: ${result.modelFile}`);
      console.log(`      🔗 CID: ${result.cid}`);
      console.log(`      📦 Size: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`      🗄️  IPFS Node: ${result.ipfsNode}`);
      console.log(`      🌐 View: https://ipfs.io/ipfs/${result.cid}`);
      console.log(`      ⛓️  TX: ${result.txHash}`);
    });

    // Check if all registered hospitals have submitted
    const updates = await contract.getRoundUpdates(targetRound);
    const registeredCount = registeredHospitals.length;
    
    console.log(`\n📈 Round ${targetRound} Status:`);
    console.log(`   Submissions: ${updates.length}/${registeredCount}`);
    
    if (updates.length === registeredCount) {
      console.log("\n🎉 All hospitals have submitted!");
      console.log("   Ready to advance to next round.");
      console.log("   Run: npx hardhat run scripts/advance_round.js --network localhost");
    } else {
      console.log(`\n⏳ Waiting for ${registeredCount - updates.length} more submission(s)...`);
    }
  }

  // Save log
  const logPath = path.join(flDir, "ipfs_blockchain_integration_log.json");
  let log = [];
  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, "utf8"));
  }
  log.push({
    round: targetRound,
    timestamp: new Date().toISOString(),
    ipfsNodesUsed: Object.keys(ipfsConnections).map(h => parseInt(h)),
    results: uploadResults
  });
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log(`\n💾 Log saved to: ${logPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

