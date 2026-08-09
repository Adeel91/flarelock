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
    address private alice = makeAddr("alice");
    address private bob = makeAddr("bob");

    bytes32 private intentHash = keccak256("intent-a");

    bytes32 private matchCommitment = keccak256("match-a");

    function setUp() public {
        token = new MockERC20();

        vm.prank(owner);

        escrow = new FlareLockEscrow(address(token), operator);

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

    function _depositNative() private returns (bytes32 depositId) {
        vm.prank(alice);

        depositId = escrow.depositNative{value: 1 ether}(intentHash, uint64(block.timestamp + 1 hours));
    }
}
