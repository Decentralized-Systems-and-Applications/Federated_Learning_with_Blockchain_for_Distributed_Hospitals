const hre = require("hardhat");

async function main() {
  const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const registry = await hre.ethers.getContractAt("ModelRegistry2", CONTRACT);

  const round = 5;
  const globalCid = "QmdTnrNoz89GmUfpQHdD1D7SrZSTvGLqSvpu81TnB2cDb6";
  const globalHash = "0x" + "00".repeat(32); // optional for now

  const [owner] = await hre.ethers.getSigners();
  const tx = await registry
    .connect(owner)
    .publishGlobalModel(round, globalCid, globalHash);

  const receipt = await tx.wait();
  console.log("✅ Global model published. Tx:", receipt.hash);

  console.log("📌 Latest global model:");
  console.log(await registry.getLatestGlobalModel());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
