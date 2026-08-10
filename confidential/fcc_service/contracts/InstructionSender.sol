// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {
    ITeeExtensionRegistry
} from "./interfaces/ITeeExtensionRegistry.sol";

import {
    ITeeMachineRegistry
} from "./interfaces/ITeeMachineRegistry.sol";

/// @title FlareLockInstructionSender
/// @notice Sends encrypted private FXRP/C2FLR execution bundles to one
///         explicitly selected FCC TEE machine.
///
/// The private order payload MUST already be ECIES-encrypted to `_teeId`'s
/// registered public key before this function is called. Only ciphertext is
/// placed in Coston2 calldata.
contract FlareLockInstructionSender {
    // forge-lint: disable-next-line(unsafe-typecast)
    bytes32 public constant OP_TYPE_FLARELOCK =
        bytes32("FLARELOCK_MATCH");

    // forge-lint: disable-next-line(unsafe-typecast)
    bytes32 public constant OP_COMMAND_VERIFY_AND_MATCH =
        bytes32("VERIFY_AND_MATCH");

    ITeeExtensionRegistry public immutable TEE_EXTENSION_REGISTRY;

    ITeeMachineRegistry public immutable TEE_MACHINE_REGISTRY;

    uint256 private constant FIRST_PUBLIC_EXTENSION_ID =
        0x10000;

    uint256 private _extensionId;

    constructor(
        ITeeExtensionRegistry _teeExtensionRegistry,
        ITeeMachineRegistry _teeMachineRegistry
    ) {
        require(
            address(_teeExtensionRegistry) != address(0),
            "TeeExtensionRegistry cannot be zero address"
        );

        require(
            address(_teeMachineRegistry) != address(0),
            "TeeMachineRegistry cannot be zero address"
        );

        require(
            address(_teeExtensionRegistry).code.length > 0,
            "TeeExtensionRegistry has no code"
        );

        require(
            address(_teeMachineRegistry).code.length > 0,
            "TeeMachineRegistry has no code"
        );

        TEE_EXTENSION_REGISTRY =
            _teeExtensionRegistry;

        TEE_MACHINE_REGISTRY =
            _teeMachineRegistry;
    }

    function setExtensionId() external {
        require(
            _extensionId == 0,
            "Extension ID already set."
        );

        uint256 next =
            TEE_EXTENSION_REGISTRY
                .nextPublicExtensionId();

        for (
            uint256 i = FIRST_PUBLIC_EXTENSION_ID;
            i < next;
            ++i
        ) {
            if (
                TEE_EXTENSION_REGISTRY
                    .getTeeExtensionInstructionsSender(i)
                    == address(this)
            ) {
                _extensionId = i;
                return;
            }
        }

        revert("Extension ID not found.");
    }

    /// @notice Sends ciphertext to a specifically selected TEE.
    /// @dev Selection is intentionally done by the client before encryption:
    ///      the private payload must be encrypted to the same machine's
    ///      public key.
    function sendConfidentialMatch(
        address _teeId,
        bytes calldata _encryptedPayload
    ) external payable returns (bytes32 instructionId) {
        require(
            _teeId != address(0),
            "TEE id cannot be zero"
        );

        require(
            _encryptedPayload.length > 0,
            "Encrypted payload cannot be empty"
        );

        address[] memory teeIds =
            new address[](1);

        teeIds[0] = _teeId;

        address[] memory cosigners =
            new address[](0);

        ITeeExtensionRegistry
            .TeeInstructionParams memory params =
                ITeeExtensionRegistry
                    .TeeInstructionParams({
                        opType:
                            OP_TYPE_FLARELOCK,
                        opCommand:
                            OP_COMMAND_VERIFY_AND_MATCH,
                        message:
                            _encryptedPayload,
                        cosigners:
                            cosigners,
                        cosignersThreshold:
                            0,
                        claimBackAddress:
                            msg.sender
                    });

        instructionId =
            TEE_EXTENSION_REGISTRY
                .sendInstructions{
                    value: msg.value
                }(
                    teeIds,
                    params
                );
    }

    function extensionId()
        external
        view
        returns (uint256)
    {
        return _getExtensionId();
    }

    function _getExtensionId()
        internal
        view
        returns (uint256)
    {
        require(
            _extensionId != 0,
            "Extension ID is not set."
        );

        return _extensionId;
    }
}
