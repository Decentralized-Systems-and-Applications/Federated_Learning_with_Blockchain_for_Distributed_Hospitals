const hre = require("hardhat");

async function main() {
  const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const registry = await hre.ethers.getContractAt("ModelRegistry2", CONTRACT);

  const [h1, h2, h3] = await hre.ethers.getSigners();
  const r = 5;

  console.log("Submitters:", await registry.getRoundSubmitters(r));

  console.log("H1:", await registry.getLocalUpdate(r, h1.address));
  console.log("H2:", await registry.getLocalUpdate(r, h2.address));
  console.log("H3:", await registry.getLocalUpdate(r, h3.address));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });