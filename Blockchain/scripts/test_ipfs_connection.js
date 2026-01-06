const { create } = require("ipfs-http-client");
const fs = require("fs");

/**
 * Test IPFS connections for all hospital nodes
 * Tests if Docker IPFS nodes are accessible
 */

async function testIPFSConnection(apiUrl, nodeName) {
  try {
    console.log(`\n🔍 Testing ${nodeName} (${apiUrl})...`);
    const ipfs = create({ url: apiUrl });
    
    // Test 1: Check version
    const version = await ipfs.version();
    console.log(`   ✅ Connected! IPFS version: ${version.version}`);
    
    // Test 2: Check if API is accessible
    const id = await ipfs.id();
    console.log(`   ✅ Node ID: ${id.id.substring(0, 20)}...`);
    
    // Test 3: Add a test file
    const testContent = Buffer.from(`Test file for ${nodeName} - ${new Date().toISOString()}`);
    const result = await ipfs.add(testContent, { pin: true, cidVersion: 0 });
    console.log(`   ✅ Test upload successful! CID: ${result.cid.toString()}`);
    
    // Test 4: Retrieve the file
    const retrieved = await ipfs.cat(result.cid);
    const chunks = [];
    for await (const chunk of retrieved) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString();
    console.log(`   ✅ File retrieval successful!`);
    
    return {
      success: true,
      nodeName,
      apiUrl,
      cid: result.cid.toString(),
      nodeId: id.id
    };
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return {
      success: false,
      nodeName,
      apiUrl,
      error: error.message
    };
  }
}

async function main() {
  console.log("🧪 Testing IPFS Node Connections\n");
  console.log("💡 Make sure Docker containers are running:");
  console.log("   cd ipfs-hospitals && docker-compose up -d\n");

  // Test all IPFS nodes
  const nodes = [
    { name: "Hospital 1", url: "http://127.0.0.1:5001" },
    { name: "Hospital 2", url: "http://127.0.0.1:5002" },
    { name: "Hospital 3", url: "http://127.0.0.1:5003" },
    { name: "Global Node", url: "http://127.0.0.1:5004" },
  ];

  const results = [];
  for (const node of nodes) {
    const result = await testIPFSConnection(node.url, node.name);
    results.push(result);
  }

  // Summary
  console.log("\n📊 Test Summary:");
  console.log("=".repeat(50));
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${nodes.length}`);
  successful.forEach(r => {
    console.log(`   ${r.nodeName}: ${r.cid}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${nodes.length}`);
    failed.forEach(r => {
      console.log(`   ${r.nodeName}: ${r.error}`);
    });
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Check if Docker is running: docker ps");
    console.log("   2. Start containers: cd ipfs-hospitals && docker-compose up -d");
    console.log("   3. Wait 10-15 seconds for nodes to initialize");
    console.log("   4. Check logs: docker-compose logs");
  }

  // Save results
  const resultsPath = "ipfs_connection_test_results.json";
  require("fs").writeFileSync(
    resultsPath,
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );
  console.log(`\n💾 Results saved to: ${resultsPath}`);

  if (successful.length === 0) {
    console.log("\n⚠️  No IPFS nodes are accessible!");
    console.log("   You need at least one IPFS node running to proceed.");
    process.exit(1);
  } else {
    console.log("\n✅ At least one IPFS node is ready!");
    console.log("   You can now upload model files to IPFS.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });


