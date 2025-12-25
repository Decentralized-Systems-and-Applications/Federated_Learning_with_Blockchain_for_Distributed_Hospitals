// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ModelRegistry {
    event ModelRegistered(uint256 round, string cid, string sha256Hash, address publisher);

    function registerModel(uint256 round, string memory cid, string memory sha256Hash) public {
        emit ModelRegistered(round, cid, sha256Hash, msg.sender);
    }
}
