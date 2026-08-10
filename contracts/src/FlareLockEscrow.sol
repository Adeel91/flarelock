// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

library SafeToken {
    error TokenCallFailed();
    error TokenOperationRejected();

    function safeTransfer(IERC20 token, address recipient, uint256 amount) internal {
        (bool success, bytes memory returndata) =
            address(token).call(abi.encodeCall(token.transfer, (recipient, amount)));

        if (!success) {
            revert TokenCallFailed();
        }

        if (returndata.length > 0 && !abi.decode(returndata, (bool))) {
            revert TokenOperationRejected();
        }
    }

    function safeTransferFrom(IERC20 token, address sender, address recipient, uint256 amount) internal {
        (bool success, bytes memory returndata) =
            address(token).call(abi.encodeCall(token.transferFrom, (sender, recipient, amount)));

        if (!success) {
            revert TokenCallFailed();
        }

        if (returndata.length > 0 && !abi.decode(returndata, (bool))) {
            revert TokenOperationRejected();
        }
    }
}

contract FlareLockEscrow {
    using SafeToken for IERC20;

    enum Asset {
        NativeC2FLR,
        FXRP
    }

    enum DepositState {
        None,
        Available,
        Locked,
        Withdrawn,
        Settled
    }

    struct Deposit {
        address depositor;
        Asset asset;
        uint256 amount;
        bytes32 intentHash;
        bytes32 matchCommitment;
        uint64 expiresAt;
        DepositState state;
    }

    struct SettlementPayload {
        uint8 version;
        bytes32 domain;
        bytes32 matchCommitment;
        bytes32 buyIntentHash;
        bytes32 sellIntentHash;
        bytes32 buyDepositId;
        bytes32 sellDepositId;
        uint256 baseAmountRaw;
        uint256 quoteAmountRaw;
        uint256 executionPriceE18;
    }

    error ZeroAddress();
    error ZeroAmount();
    error InvalidExpiry();
    error InvalidIntentHash();
    error InvalidMatchCommitment();
    error DepositNotFound();
    error DepositUnavailable();
    error DepositAlreadyLocked();
    error DepositNotLocked();
    error DepositExpired();
    error DepositStillLocked();
    error NotDepositor();
    error NotOperator();
    error NotOwner();
    error NativeTransferFailed();
    error DirectNativeTransferDisabled();
    error UnsupportedFeeOnTransferToken();
    error ReentrantCall();
    error InvalidSettlementVersion();
    error InvalidSettlementDomain();
    error InvalidTEE();
    error InvalidTEESignature();
    error InvalidSignatureLength();
    error InvalidSignatureV();
    error InvalidSignatureS();
    error SettlementAlreadyConsumed();
    error InvalidSettlementStatus();
    error InvalidSubmissionTag();
    error InvalidSettlementDeposit();
    error SettlementDepositExpired();
    error SettlementAssetMismatch();
    error SettlementIntentMismatch();
    error SettlementCommitmentMismatch();
    error SettlementAmountMismatch();

    event NativeDeposited(
        bytes32 indexed depositId,
        address indexed depositor,
        bytes32 indexed intentHash,
        uint256 amount,
        uint64 expiresAt
    );

    event TokenDeposited(
        bytes32 indexed depositId,
        address indexed depositor,
        bytes32 indexed intentHash,
        address token,
        uint256 amount,
        uint64 expiresAt
    );

    event DepositLocked(bytes32 indexed depositId, bytes32 indexed matchCommitment, address indexed operator);

    event DepositUnlocked(bytes32 indexed depositId, bytes32 indexed matchCommitment, address indexed operator);

    event DepositWithdrawn(
        bytes32 indexed depositId, address indexed depositor, Asset asset, uint256 amount, bool expiredRecovery
    );

    event OperatorUpdated(address indexed previousOperator, address indexed newOperator);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    event MatchSettled(
        bytes32 indexed matchCommitment,
        bytes32 indexed buyDepositId,
        bytes32 indexed sellDepositId,
        address buyer,
        address seller,
        uint256 baseAmountRaw,
        uint256 quoteAmountRaw,
        uint256 executionPriceE18,
        bytes32 instructionId
    );

    IERC20 public immutable fxrp;

    address public owner;
    address public operator;
    address public trustedTee;

    uint256 public depositNonce;

    uint256 private reentrancyState = 1;

    mapping(bytes32 depositId => Deposit deposit) public deposits;
    mapping(bytes32 matchCommitment => bool consumed) public consumedMatchCommitments;

    bytes32 public constant SETTLEMENT_DOMAIN = bytes32("FLARELOCK_SETTLEMENT");
    bytes32 public constant TEE_ACTION_RESULT_PREFIX = bytes32("TEE_ACTION_RESULT");
    uint256 public constant FCC_CHAIN_ID = 114;

    uint256 private constant SECP256K1N_HALF = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }

        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) {
            revert NotOperator();
        }

        _;
    }

    modifier nonReentrant() {
        if (reentrancyState != 1) {
            revert ReentrantCall();
        }

        reentrancyState = 2;
        _;
        reentrancyState = 1;
    }

    constructor(address fxrpToken, address initialOperator, address initialTrustedTee) {
        if (fxrpToken == address(0) || initialOperator == address(0) || initialTrustedTee == address(0)) {
            revert ZeroAddress();
        }

        if (fxrpToken.code.length == 0) {
            revert ZeroAddress();
        }

        fxrp = IERC20(fxrpToken);
        owner = msg.sender;
        operator = initialOperator;
        trustedTee = initialTrustedTee;

        emit OwnershipTransferred(address(0), msg.sender);
        emit OperatorUpdated(address(0), initialOperator);
    }

    receive() external payable {
        revert DirectNativeTransferDisabled();
    }

    fallback() external payable {
        revert DirectNativeTransferDisabled();
    }

    function depositNative(bytes32 intentHash, uint64 expiresAt)
        external
        payable
        nonReentrant
        returns (bytes32 depositId)
    {
        _validateDeposit(msg.value, intentHash, expiresAt);

        depositId = _createDepositId(msg.sender, Asset.NativeC2FLR, msg.value, intentHash);

        deposits[depositId] = Deposit({
            depositor: msg.sender,
            asset: Asset.NativeC2FLR,
            amount: msg.value,
            intentHash: intentHash,
            matchCommitment: bytes32(0),
            expiresAt: expiresAt,
            state: DepositState.Available
        });

        emit NativeDeposited(depositId, msg.sender, intentHash, msg.value, expiresAt);
    }

    function depositFXRP(uint256 amount, bytes32 intentHash, uint64 expiresAt)
        external
        nonReentrant
        returns (bytes32 depositId)
    {
        _validateDeposit(amount, intentHash, expiresAt);

        uint256 balanceBefore = fxrp.balanceOf(address(this));

        fxrp.safeTransferFrom(msg.sender, address(this), amount);

        uint256 balanceAfter = fxrp.balanceOf(address(this));

        if (balanceAfter - balanceBefore != amount) {
            revert UnsupportedFeeOnTransferToken();
        }

        depositId = _createDepositId(msg.sender, Asset.FXRP, amount, intentHash);

        deposits[depositId] = Deposit({
            depositor: msg.sender,
            asset: Asset.FXRP,
            amount: amount,
            intentHash: intentHash,
            matchCommitment: bytes32(0),
            expiresAt: expiresAt,
            state: DepositState.Available
        });

        emit TokenDeposited(depositId, msg.sender, intentHash, address(fxrp), amount, expiresAt);
    }

    function lockDeposit(bytes32 depositId, bytes32 matchCommitment) external onlyOperator {
        Deposit storage deposit = _requireDeposit(depositId);

        if (matchCommitment == bytes32(0)) {
            revert InvalidMatchCommitment();
        }

        if (deposit.state == DepositState.Locked) {
            revert DepositAlreadyLocked();
        }

        if (deposit.state != DepositState.Available) {
            revert DepositUnavailable();
        }

        if (block.timestamp >= deposit.expiresAt) {
            revert DepositExpired();
        }

        deposit.state = DepositState.Locked;
        deposit.matchCommitment = matchCommitment;

        emit DepositLocked(depositId, matchCommitment, msg.sender);
    }

    function unlockDeposit(bytes32 depositId) external onlyOperator {
        Deposit storage deposit = _requireDeposit(depositId);

        if (deposit.state != DepositState.Locked) {
            revert DepositNotLocked();
        }

        bytes32 matchCommitment = deposit.matchCommitment;

        deposit.state = DepositState.Available;
        deposit.matchCommitment = bytes32(0);

        emit DepositUnlocked(depositId, matchCommitment, msg.sender);
    }

    function withdrawDeposit(bytes32 depositId) external nonReentrant {
        Deposit storage deposit = _requireDeposit(depositId);

        if (deposit.depositor != msg.sender) {
            revert NotDepositor();
        }

        bool expired = block.timestamp >= deposit.expiresAt;

        if (deposit.state == DepositState.Locked && !expired) {
            revert DepositStillLocked();
        }

        if (deposit.state != DepositState.Available && deposit.state != DepositState.Locked) {
            revert DepositUnavailable();
        }

        Asset asset = deposit.asset;
        uint256 amount = deposit.amount;

        deposit.state = DepositState.Withdrawn;
        deposit.amount = 0;

        if (asset == Asset.NativeC2FLR) {
            (bool success,) = payable(msg.sender).call{value: amount}("");

            if (!success) {
                revert NativeTransferFailed();
            }
        } else {
            fxrp.safeTransfer(msg.sender, amount);
        }

        emit DepositWithdrawn(depositId, msg.sender, asset, amount, expired);
    }

    function settleSignedMatch(
        bytes32 instructionId,
        string calldata submissionTag,
        uint8 status,
        bytes calldata settlementData,
        bytes calldata teeSignature
    ) external nonReentrant {
        _verifyTeeActionResult(instructionId, submissionTag, status, settlementData, teeSignature);

        SettlementPayload memory settlement = abi.decode(settlementData, (SettlementPayload));

        _settlePayload(settlement, instructionId);
    }

    function _verifyTeeActionResult(
        bytes32 instructionId,
        string calldata submissionTag,
        uint8 status,
        bytes calldata settlementData,
        bytes calldata teeSignature
    ) private view {
        if (status != 1) {
            revert InvalidSettlementStatus();
        }

        if (keccak256(bytes(submissionTag)) != keccak256(bytes("end"))) {
            revert InvalidSubmissionTag();
        }

        bytes32 actionResultHash = keccak256(
            abi.encodePacked(keccak256(settlementData), instructionId, keccak256(bytes(submissionTag)), bytes1(status))
        );

        bytes32 payloadHash = keccak256(abi.encode(TEE_ACTION_RESULT_PREFIX, FCC_CHAIN_ID, actionResultHash));

        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));

        address signer = _recoverSigner(ethSignedHash, teeSignature);

        if (signer != trustedTee) {
            revert InvalidTEE();
        }
    }

    function _settlePayload(SettlementPayload memory settlement, bytes32 instructionId) private {
        if (settlement.version != 1) {
            revert InvalidSettlementVersion();
        }

        if (settlement.domain != SETTLEMENT_DOMAIN) {
            revert InvalidSettlementDomain();
        }

        if (settlement.matchCommitment == bytes32(0)) {
            revert InvalidMatchCommitment();
        }

        if (consumedMatchCommitments[settlement.matchCommitment]) {
            revert SettlementAlreadyConsumed();
        }

        if (
            settlement.buyDepositId == bytes32(0) || settlement.sellDepositId == bytes32(0)
                || settlement.buyDepositId == settlement.sellDepositId
        ) {
            revert InvalidSettlementDeposit();
        }

        if (settlement.baseAmountRaw == 0 || settlement.quoteAmountRaw == 0 || settlement.executionPriceE18 == 0) {
            revert ZeroAmount();
        }

        Deposit storage buyDeposit = _requireDeposit(settlement.buyDepositId);

        Deposit storage sellDeposit = _requireDeposit(settlement.sellDepositId);

        if (buyDeposit.state != DepositState.Locked || sellDeposit.state != DepositState.Locked) {
            revert DepositNotLocked();
        }

        if (block.timestamp >= buyDeposit.expiresAt || block.timestamp >= sellDeposit.expiresAt) {
            revert SettlementDepositExpired();
        }

        if (buyDeposit.asset != Asset.NativeC2FLR || sellDeposit.asset != Asset.FXRP) {
            revert SettlementAssetMismatch();
        }

        if (buyDeposit.intentHash != settlement.buyIntentHash || sellDeposit.intentHash != settlement.sellIntentHash) {
            revert SettlementIntentMismatch();
        }

        if (
            buyDeposit.matchCommitment != settlement.matchCommitment
                || sellDeposit.matchCommitment != settlement.matchCommitment
        ) {
            revert SettlementCommitmentMismatch();
        }

        // Patch 7 intentionally supports whole-deposit settlement.
        if (buyDeposit.amount != settlement.quoteAmountRaw || sellDeposit.amount != settlement.baseAmountRaw) {
            revert SettlementAmountMismatch();
        }

        address buyer = buyDeposit.depositor;
        address seller = sellDeposit.depositor;

        consumedMatchCommitments[settlement.matchCommitment] = true;

        buyDeposit.state = DepositState.Settled;
        sellDeposit.state = DepositState.Settled;

        buyDeposit.amount = 0;
        sellDeposit.amount = 0;

        fxrp.safeTransfer(buyer, settlement.baseAmountRaw);

        (bool nativeSuccess,) = payable(seller).call{value: settlement.quoteAmountRaw}("");

        if (!nativeSuccess) {
            revert NativeTransferFailed();
        }

        emit MatchSettled(
            settlement.matchCommitment,
            settlement.buyDepositId,
            settlement.sellDepositId,
            buyer,
            seller,
            settlement.baseAmountRaw,
            settlement.quoteAmountRaw,
            settlement.executionPriceE18,
            instructionId
        );
    }

    function setTrustedTee(address newTrustedTee) external onlyOwner {
        if (newTrustedTee == address(0)) {
            revert ZeroAddress();
        }

        trustedTee = newTrustedTee;
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) {
            revert ZeroAddress();
        }

        address previousOperator = operator;
        operator = newOperator;

        emit OperatorUpdated(previousOperator, newOperator);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert ZeroAddress();
        }

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function isExpired(bytes32 depositId) external view returns (bool) {
        Deposit storage deposit = _requireDeposit(depositId);

        return block.timestamp >= deposit.expiresAt;
    }

    function _recoverSigner(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        if (signature.length != 65) {
            revert InvalidSignatureLength();
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v > 1) {
            revert InvalidSignatureV();
        }

        if (uint256(s) == 0 || uint256(s) > SECP256K1N_HALF) {
            revert InvalidSignatureS();
        }

        signer = ecrecover(digest, v + 27, r, s);

        if (signer == address(0)) {
            revert InvalidTEESignature();
        }
    }

    function _validateDeposit(uint256 amount, bytes32 intentHash, uint64 expiresAt) private view {
        if (amount == 0) {
            revert ZeroAmount();
        }

        if (intentHash == bytes32(0)) {
            revert InvalidIntentHash();
        }

        if (expiresAt <= block.timestamp) {
            revert InvalidExpiry();
        }
    }

    function _createDepositId(address depositor, Asset asset, uint256 amount, bytes32 intentHash)
        private
        returns (bytes32 depositId)
    {
        uint256 nonce = ++depositNonce;

        depositId = keccak256(abi.encode(block.chainid, address(this), depositor, asset, amount, intentHash, nonce));
    }

    function _requireDeposit(bytes32 depositId) private view returns (Deposit storage deposit) {
        deposit = deposits[depositId];

        if (deposit.state == DepositState.None) {
            revert DepositNotFound();
        }
    }
}
