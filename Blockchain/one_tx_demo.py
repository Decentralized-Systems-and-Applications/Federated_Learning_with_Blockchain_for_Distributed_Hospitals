from web3 import Web3
from solcx import compile_standard, set_solc_version
from pathlib import Path

RPC = "HTTP://127.0.0.1:7545"  # ✅ change if Ganache shows different
w3 = Web3(Web3.HTTPProvider(RPC))
assert w3.is_connected(), "❌ Cannot connect to Ganache. Is it running?"

set_solc_version("0.8.20")

# Compile contract
source = (Path(__file__).resolve().parent / "ModelRegistry.sol").read_text(encoding="utf-8")

compiled = compile_standard({
    "language": "Solidity",
    "sources": {"ModelRegistry.sol": {"content": source}},
    "settings": {
        "evmVersion": "london",  # ✅ IMPORTANT: avoids PUSH0 / Shanghai opcodes
        "outputSelection": {"*": {"*": ["abi", "evm.bytecode"]}}
    }
})


abi = compiled["contracts"]["ModelRegistry.sol"]["ModelRegistry"]["abi"]
bytecode = compiled["contracts"]["ModelRegistry.sol"]["ModelRegistry"]["evm"]["bytecode"]["object"]

# Deploy
acct = w3.eth.accounts[0]
Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

tx_hash = Contract.constructor().transact({
    "from": acct,
    "gas": 3_000_000
})


receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
addr = receipt.contractAddress
print("✅ Contract deployed at:", addr)

# Send ONE transaction (store CID + SHA)
contract = w3.eth.contract(address=addr, abi=abi)

ROUND = 5
CID = "QmdTnrNoz89GmUfpQHdD1D7SrZSTvGLqSvpu81TnB2cDb6"
SHA = "a7acf6d2768963dfb3605d585648110f2b0f25e22538fe7aaa44a7c15c919211"


tx2 = contract.functions.registerModel(ROUND, CID, SHA).transact({
    "from": acct,
    "gas": 3_000_000
})


receipt2 = w3.eth.wait_for_transaction_receipt(tx2)

print("✅ One transaction sent!")
print("Tx hash:", receipt2.transactionHash.hex())
print("Block:", receipt2.blockNumber)
