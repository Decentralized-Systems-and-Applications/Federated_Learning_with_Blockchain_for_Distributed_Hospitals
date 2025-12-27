const hre = require("hardhat");

async function main() {
  const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
  const registry = await ModelRegistry.deploy();
  await registry.waitForDeployment();

  console.log("ModelRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
