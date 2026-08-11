// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {FlareLockEscrow} from "../src/FlareLockEscrow.sol";
import {MockERC20} from "./MockERC20.sol";

contract FlareLockEscrowTest is Test {
    MockERC20 private token;
    FlareLockEscrow private escrow;

    address private owner = makeAddr("owner");
    address private operator = makeAddr("operator");
    uint256 private trustedTeePrivateKey = 0xA11CE;
    address private trustedTee;
    address private alice = makeAddr("alice");
    address private bob = makeAddr("bob");

    bytes32 private intentHash = keccak256("intent-a");

    bytes32 private matchCommitment = keccak256("match-a");

    function setUp() public {
        trustedTee = vm.addr(trustedTeePrivateKey);

        token = new MockERC20();

        vm.prank(owner);

        escrow = new FlareLockEscrow(address(token), operator, trustedTee);

        token.mint(alice, 10_000_000);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_DepositNativeCreatesAvailableDeposit() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);

        vm.prank(alice);

        bytes32 depositId = escrow.depositNative{value: 1 ether}(intentHash, expiry);

        (
            address depositor,
            FlareLockEscrow.Asset asset,
            uint256 amount,
            bytes32 storedIntentHash,
            bytes32 storedMatchCommitment,
            uint64 storedExpiry,
            FlareLockEscrow.DepositState state
        ) = escrow.deposits(depositId);

        assertEq(depositor, alice);

        assertEq(uint256(asset), uint256(FlareLockEscrow.Asset.NativeC2FLR));

        assertEq(amount, 1 ether);
        assertEq(storedIntentHash, intentHash);

        assertEq(storedMatchCommitment, bytes32(0));

        assertEq(storedExpiry, expiry);

        assertEq(uint256(state), uint256(FlareLockEscrow.DepositState.Available));

        assertEq(address(escrow).balance, 1 ether);
    }

    function test_DepositFXRPTransfersRealTokens() public {
        uint256 amount = 1_500_000;

        uint64 expiry = uint64(block.timestamp + 1 hours);

        vm.startPrank(alice);

        token.approve(address(escrow), amount);

        bytes32 depositId = escrow.depositFXRP(amount, intentHash, expiry);

        vm.stopPrank();

        assertEq(token.balanceOf(alice), 8_500_000);

        assertEq(token.balanceOf(address(escrow)), amount);

        (
            address depositor,
            FlareLockEscrow.Asset asset,
            uint256 storedAmount,
            bytes32 storedIntentHash,,,
            FlareLockEscrow.DepositState state
        ) = escrow.deposits(depositId);

        assertEq(depositor, alice);

        assertEq(uint256(asset), uint256(FlareLockEscrow.Asset.FXRP));

        assertEq(storedAmount, amount);
        assertEq(storedIntentHash, intentHash);

        assertEq(uint256(state), uint256(FlareLockEscrow.DepositState.Available));
    }

    function test_OperatorCanLockDeposit() public {
        bytes32 depositId = _depositNative();

        vm.prank(operator);

        escrow.lockDeposit(depositId, matchCommitment);

        (,,,, bytes32 storedMatchCommitment,, FlareLockEscrow.DepositState state) = escrow.deposits(depositId);

        assertEq(storedMatchCommitment, matchCommitment);

        assertEq(uint256(state), uint256(FlareLockEscrow.DepositState.Locked));
    }

    function test_NonOperatorCannotLockDeposit() public {
        bytes32 depositId = _depositNative();

        vm.expectRevert(FlareLockEscrow.NotOperator.selector);

        vm.prank(bob);

        escrow.lockDeposit(depositId, matchCommitment);
    }

    function test_DepositorCannotWithdrawLockedDepositBeforeExpiry() public {
        bytes32 depositId = _depositNative();

        vm.prank(operator);

        escrow.lockDeposit(depositId, matchCommitment);

        vm.expectRevert(FlareLockEscrow.DepositStillLocked.selector);

        vm.prank(alice);

        escrow.withdrawDeposit(depositId);
    }

    function test_OperatorCanUnlockAndDepositorCanWithdraw() public {
        bytes32 depositId = _depositNative();

        vm.prank(operator);

        escrow.lockDeposit(depositId, matchCommitment);

        vm.prank(operator);

        escrow.unlockDeposit(depositId);

        uint256 balanceBefore = alice.balance;

        vm.prank(alice);

        escrow.withdrawDeposit(depositId);

        assertEq(alice.balance, balanceBefore + 1 ether);

        assertEq(address(escrow).balance, 0);
    }

    function test_DepositorCanRecoverLockedDepositAfterExpiry() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);

        vm.prank(alice);

        bytes32 depositId = escrow.depositNative{value: 1 ether}(intentHash, expiry);

        vm.prank(operator);

        escrow.lockDeposit(depositId, matchCommitment);

        vm.warp(expiry);

        uint256 balanceBefore = alice.balance;

        vm.prank(alice);

        escrow.withdrawDeposit(depositId);

        assertEq(alice.balance, balanceBefore + 1 ether);
    }

    function test_DepositorCanCancelAvailableFXRPDeposit() public {
        uint256 amount = 2_000_000;

        uint64 expiry = uint64(block.timestamp + 1 hours);

        vm.startPrank(alice);

        token.approve(address(escrow), amount);

        bytes32 depositId = escrow.depositFXRP(amount, intentHash, expiry);

        escrow.withdrawDeposit(depositId);

        vm.stopPrank();

        assertEq(token.balanceOf(alice), 10_000_000);

        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_DirectNativeTransfersAreRejected() public {
        vm.prank(alice);

        (bool success,) = address(escrow).call{value: 1 ether}("");

        assertFalse(success);

        assertEq(address(escrow).balance, 0);
    }

    function test_OnlyOwnerCanChangeOperator() public {
        address nextOperator = makeAddr("nextOperator");

        vm.expectRevert(FlareLockEscrow.NotOwner.selector);

        vm.prank(alice);

        escrow.setOperator(nextOperator);

        vm.prank(owner);

        escrow.setOperator(nextOperator);

        assertEq(escrow.operator(), nextOperator);
    }

    function test_DepositIdsCannotReplay() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);

        vm.startPrank(alice);

        bytes32 firstDepositId = escrow.depositNative{value: 1 ether}(intentHash, expiry);

        bytes32 secondDepositId = escrow.depositNative{value: 1 ether}(intentHash, expiry);

        vm.stopPrank();

        assertNotEq(firstDepositId, secondDepositId);
    }

    function test_SignedFCCMatchSettlesAtomically() public {
        (
            bytes32 buyDepositId,
            bytes32 sellDepositId,
            bytes32 commitment,
            bytes32 instructionId,
            bytes memory settlementData,
            bytes memory signature
        ) = _createSignedSettlement();

        uint256 sellerNativeBefore = alice.balance;
        uint256 buyerFxrpBefore = token.balanceOf(bob);

        escrow.settleSignedMatch(instructionId, "threshold", 1, settlementData, signature);

        assertEq(token.balanceOf(bob), buyerFxrpBefore + 1_000_000);

        assertEq(alice.balance, sellerNativeBefore + 175 ether);

        assertEq(address(escrow).balance, 0);
        assertEq(token.balanceOf(address(escrow)), 0);

        (,, uint256 buyAmount,,,, FlareLockEscrow.DepositState buyState) = escrow.deposits(buyDepositId);

        (,, uint256 sellAmount,,,, FlareLockEscrow.DepositState sellState) = escrow.deposits(sellDepositId);

        assertEq(buyAmount, 0);
        assertEq(sellAmount, 0);

        assertEq(uint256(buyState), uint256(FlareLockEscrow.DepositState.Settled));

        assertEq(uint256(sellState), uint256(FlareLockEscrow.DepositState.Settled));

        assertTrue(escrow.consumedMatchCommitments(commitment));
    }

    function test_SignedFCCMatchCannotReplay() public {
        (,,, bytes32 instructionId, bytes memory settlementData, bytes memory signature) = _createSignedSettlement();

        escrow.settleSignedMatch(instructionId, "threshold", 1, settlementData, signature);

        vm.expectRevert(FlareLockEscrow.SettlementAlreadyConsumed.selector);

        escrow.settleSignedMatch(instructionId, "threshold", 1, settlementData, signature);
    }

    function test_TamperedFCCSettlementIsRejected() public {
        (,,, bytes32 instructionId, bytes memory settlementData, bytes memory signature) = _createSignedSettlement();

        // uint8 version occupies the final byte of the first ABI word.
        settlementData[31] = bytes1(uint8(2));

        vm.expectRevert(FlareLockEscrow.InvalidTEE.selector);

        escrow.settleSignedMatch(instructionId, "threshold", 1, settlementData, signature);
    }

    function test_ResultSignedByWrongTEEIsRejected() public {
        (,,, bytes32 instructionId, bytes memory settlementData,) = _createSignedSettlement();

        bytes memory wrongSignature = _signActionResult(0xB0B, instructionId, "threshold", 1, settlementData);

        vm.expectRevert(FlareLockEscrow.InvalidTEE.selector);

        escrow.settleSignedMatch(instructionId, "threshold", 1, settlementData, wrongSignature);
    }

    function _createSignedSettlement()
        private
        returns (
            bytes32 buyDepositId,
            bytes32 sellDepositId,
            bytes32 commitment,
            bytes32 instructionId,
            bytes memory settlementData,
            bytes memory signature
        )
    {
        bytes32 buyIntentHash = keccak256("fcc-buy-intent");

        bytes32 sellIntentHash = keccak256("fcc-sell-intent");

        commitment = keccak256("fcc-match-commitment");

        instructionId = keccak256("fcc-instruction");

        uint64 expiry = uint64(block.timestamp + 1 hours);

        vm.deal(bob, 200 ether);

        vm.prank(bob);

        buyDepositId = escrow.depositNative{value: 175 ether}(buyIntentHash, expiry);

        vm.startPrank(alice);

        token.approve(address(escrow), 1_000_000);

        sellDepositId = escrow.depositFXRP(1_000_000, sellIntentHash, expiry);

        vm.stopPrank();

        vm.startPrank(operator);

        escrow.lockDeposit(buyDepositId, commitment);

        escrow.lockDeposit(sellDepositId, commitment);

        vm.stopPrank();

        settlementData = abi.encode(
            uint8(1),
            bytes32("FLARELOCK_SETTLEMENT"),
            commitment,
            buyIntentHash,
            sellIntentHash,
            buyDepositId,
            sellDepositId,
            uint256(1_000_000),
            uint256(175 ether),
            uint256(175 ether)
        );

        signature = _signActionResult(trustedTeePrivateKey, instructionId, "threshold", 1, settlementData);
    }

    function _signActionResult(
        uint256 privateKey,
        bytes32 instructionId,
        string memory submissionTag,
        uint8 status,
        bytes memory settlementData
    ) private returns (bytes memory signature) {
        bytes32 actionResultHash = keccak256(
            abi.encodePacked(keccak256(settlementData), instructionId, keccak256(bytes(submissionTag)), bytes1(status))
        );

        bytes32 payloadHash = keccak256(abi.encode(bytes32("TEE_ACTION_RESULT"), uint256(114), actionResultHash));

        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));

        (uint8 v, bytes32 r, bytes32 sigS) = vm.sign(privateKey, ethSignedHash);

        // go-ethereum crypto.Sign emits V as 0/1.
        // Foundry vm.sign emits 27/28, so normalize it to the
        // exact FCC signature representation.
        uint8 normalizedV = v - 27;

        signature = abi.encodePacked(r, sigS, normalizedV);
    }

    function _depositNative() private returns (bytes32 depositId) {
        vm.prank(alice);

        depositId = escrow.depositNative{value: 1 ether}(intentHash, uint64(block.timestamp + 1 hours));
    }
}
