// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console2} from "forge-std/Script.sol";

import {FlareLockEscrow} from "../src/FlareLockEscrow.sol";

interface IFlareContractRegistry {
    function getContractAddressByName(string calldata name) external view returns (address);
}

interface IAssetManager {
    function fAsset() external view returns (address);
}

contract DeployFlareLockEscrow is Script {
    address private constant FLARE_CONTRACT_REGISTRY = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;

    function run() external returns (FlareLockEscrow escrow) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        address deployer = vm.addr(privateKey);

        address operator = vm.envOr("ESCROW_OPERATOR", deployer);

        address assetManager =
            IFlareContractRegistry(FLARE_CONTRACT_REGISTRY).getContractAddressByName("AssetManagerFXRP");

        address fxrpToken = IAssetManager(assetManager).fAsset();

        require(assetManager.code.length > 0, "Asset Manager has no code");

        require(fxrpToken.code.length > 0, "FXRP token has no code");

        vm.startBroadcast(privateKey);

        escrow = new FlareLockEscrow(fxrpToken, operator);

        vm.stopBroadcast();

        console2.log("Network chain ID:", block.chainid);

        console2.log("Deployer:", deployer);

        console2.log("Operator:", operator);

        console2.log("AssetManagerFXRP:", assetManager);

        console2.log("FTestXRP:", fxrpToken);

        console2.log("FlareLockEscrow:", address(escrow));
    }
}
