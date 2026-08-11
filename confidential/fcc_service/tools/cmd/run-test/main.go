package main

import (
	"crypto/ecdsa"
	"flag"
	"fmt"
	"math/big"
	"os"
	"strings"
	"time"

	"extension-scaffold/tools/pkg/configs"
	"extension-scaffold/tools/pkg/fccutils"
	"extension-scaffold/tools/pkg/support"
	instrutils "extension-scaffold/tools/pkg/utils"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/flare-foundation/go-flare-common/pkg/logger"
	"github.com/pkg/errors"
)

type privateIntent struct {
	Owner string `json:"owner"`

	IntentHash string `json:"intentHash"`
	DepositID  string `json:"depositId"`

	QuoteID   string `json:"quoteId"`
	QuoteHash string `json:"quoteHash"`

	Side      string `json:"side"`
	FromAsset string `json:"fromAsset"`
	ToAsset   string `json:"toAsset"`

	InputAmount   string `json:"inputAmount"`
	ReceiveAmount string `json:"receiveAmount"`

	OrderType   string `json:"orderType"`
	LimitPrice  string `json:"limitPrice,omitempty"`
	StopPrice   string `json:"stopPrice,omitempty"`
	TimeInForce string `json:"timeInForce"`

	ValidUntil string `json:"validUntil"`

	SignedMessage string `json:"signedMessage"`
	Signature     string `json:"signature"`
	CreatedAt     string `json:"createdAt"`
}

type privateMatchRequest struct {
	Version uint8 `json:"version"`

	Buy  privateIntent `json:"buy"`
	Sell privateIntent `json:"sell"`
}

type matchResult struct {
	Version uint8  `json:"version"`
	Domain  string `json:"domain"`

	MatchCommitment string `json:"matchCommitment"`

	BuyIntentHash  string `json:"buyIntentHash"`
	SellIntentHash string `json:"sellIntentHash"`

	BuyDepositID  string `json:"buyDepositId"`
	SellDepositID string `json:"sellDepositId"`

	BaseAmountRaw     string `json:"baseAmountRaw"`
	QuoteAmountRaw    string `json:"quoteAmountRaw"`
	ExecutionPriceE18 string `json:"executionPriceE18"`

	Market string `json:"market"`
}

func main() {
	af := flag.String(
		"a",
		configs.AddressesFile,
		"file with deployed addresses",
	)

	cf := flag.String(
		"c",
		configs.ChainNodeURL,
		"chain node url",
	)

	pf := flag.String(
		"p",
		configs.ExtensionProxyURL,
		"extension proxy url",
	)

	instructionSenderF := flag.String(
		"instructionSender",
		"",
		"instructionSender address",
	)

	flag.Parse()

	instructionSenderAddress :=
		common.HexToAddress(
			*instructionSenderF,
		)

	testSupport, err :=
		support.DefaultSupport(
			*af,
			*cf,
		)

	if err != nil {
		fccutils.FatalWithCause(err)
	}

	logger.Infof(
		"Setting extension ID on instruction sender...",
	)

	err = instrutils.SetExtensionId(
		testSupport,
		instructionSenderAddress,
	)

	if err != nil {
		if strings.Contains(
			err.Error(),
			"already set",
		) {
			logger.Infof(
				"Extension ID already set, continuing",
			)
		} else {
			fccutils.FatalWithCause(err)
		}
	}

	target, err :=
		instrutils.ResolveConfidentialTarget(
			*pf,
		)

	if err != nil {
		fccutils.FatalWithCause(err)
	}

	logger.Infof(
		"Resolved TEE ID: %s",
		target.TeeID.Hex(),
	)

	request, err := buildTestRequest()
	if err != nil {
		fccutils.FatalWithCause(err)
	}

	logger.Infof("Buyer address: %s", request.Buy.Owner)
	logger.Infof("Buyer intent hash: %s", request.Buy.IntentHash)
	logger.Infof("Buyer deposit ID: %s", request.Buy.DepositID)

	logger.Infof("Seller address: %s", request.Sell.Owner)
	logger.Infof("Seller intent hash: %s", request.Sell.IntentHash)
	logger.Infof("Seller deposit ID: %s", request.Sell.DepositID)

	if strings.EqualFold(
		strings.TrimSpace(os.Getenv("PREPARE_ONLY")),
		"true",
	) {
		logger.Infof("PREPARE_ONLY complete; no FCC instruction sent.")
		return
	}

	ciphertext, err :=
		instrutils.EncryptForTEE(
			target,
			request,
		)

	if err != nil {
		fccutils.FatalWithCause(err)
	}

	logger.Infof(
		"Encrypted confidential payload: %d bytes",
		len(ciphertext),
	)

	instructionID, txHash, err :=
		instrutils.SendConfidentialMatch(
			testSupport,
			instructionSenderAddress,
			target.TeeID,
			ciphertext,
		)

	if err != nil {
		fccutils.FatalWithCause(err)
	}

	logger.Infof(
		"Instruction sent: %s",
		instructionID.Hex(),
	)

	logger.Infof(
		"Coston2 transaction: %s",
		txHash.Hex(),
	)

	time.Sleep(5 * time.Second)

	if err := verifyResult(
		*pf,
		instructionID,
	); err != nil {
		fccutils.FatalWithCause(err)
	}

	logger.Infof(
		"FlareLock confidential match test passed.",
	)
}

func buildTestRequest() (privateMatchRequest, error) {
	buyerKey, err := privateKeyFromEnv(
		"BUYER_PRIVATE_KEY",
	)
	if err != nil {
		return privateMatchRequest{}, err
	}

	sellerKey, err := privateKeyFromEnv(
		"SELLER_PRIVATE_KEY",
	)
	if err != nil {
		return privateMatchRequest{}, err
	}

	buyerAddress :=
		crypto.PubkeyToAddress(
			buyerKey.PublicKey,
		)

	sellerAddress :=
		crypto.PubkeyToAddress(
			sellerKey.PublicKey,
		)

	if err := verifyExpectedAddress(
		"EXPECTED_BUYER_ADDRESS",
		buyerAddress,
	); err != nil {
		return privateMatchRequest{}, err
	}

	if err := verifyExpectedAddress(
		"EXPECTED_SELLER_ADDRESS",
		sellerAddress,
	); err != nil {
		return privateMatchRequest{}, err
	}

	if buyerAddress == sellerAddress {
		return privateMatchRequest{}, errors.New(
			"buyer and seller must be different wallets",
		)
	}

	buyerCreatedAt :=
		strings.TrimSpace(
			os.Getenv("BUYER_CREATED_AT"),
		)

	sellerCreatedAt :=
		strings.TrimSpace(
			os.Getenv("SELLER_CREATED_AT"),
		)

	validUntil :=
		strings.TrimSpace(
			os.Getenv("INTENT_VALID_UNTIL"),
		)

	if buyerCreatedAt == "" ||
		sellerCreatedAt == "" ||
		validUntil == "" {
		return privateMatchRequest{}, errors.New(
			"BUYER_CREATED_AT, SELLER_CREATED_AT and INTENT_VALID_UNTIL are required",
		)
	}

	buyDepositID, err :=
		depositIDFromEnv(
			"BUYER_DEPOSIT_ID",
		)
	if err != nil {
		return privateMatchRequest{}, err
	}

	sellDepositID, err :=
		depositIDFromEnv(
			"SELLER_DEPOSIT_ID",
		)
	if err != nil {
		return privateMatchRequest{}, err
	}

	buy, err := buildSignedIntent(
		buyerKey,
		"buy",
		"C2FLR",
		"FXRP",
		"17.5",
		"0.1",
		"175",
		buyDepositID,
		validUntil,
		buyerCreatedAt,
	)
	if err != nil {
		return privateMatchRequest{}, err
	}

	sell, err := buildSignedIntent(
		sellerKey,
		"sell",
		"FXRP",
		"C2FLR",
		"0.1",
		"17",
		"170",
		sellDepositID,
		validUntil,
		sellerCreatedAt,
	)
	if err != nil {
		return privateMatchRequest{}, err
	}

	return privateMatchRequest{
		Version: 1,
		Buy:     buy,
		Sell:    sell,
	}, nil
}

func privateKeyFromEnv(
	name string,
) (*ecdsa.PrivateKey, error) {
	value :=
		strings.TrimPrefix(
			strings.TrimSpace(
				os.Getenv(name),
			),
			"0x",
		)

	if value == "" {
		return nil, errors.Errorf(
			"%s is required",
			name,
		)
	}

	key, err := crypto.HexToECDSA(value)
	if err != nil {
		return nil, errors.Errorf(
			"parsing %s: %s",
			name,
			err,
		)
	}

	return key, nil
}

func verifyExpectedAddress(
	envName string,
	actual common.Address,
) error {
	expected :=
		strings.TrimSpace(
			os.Getenv(envName),
		)

	if expected == "" {
		return nil
	}

	if !common.IsHexAddress(expected) {
		return errors.Errorf(
			"%s is not a valid address",
			envName,
		)
	}

	if common.HexToAddress(expected) != actual {
		return errors.Errorf(
			"%s mismatch: derived %s",
			envName,
			actual.Hex(),
		)
	}

	return nil
}

func depositIDFromEnv(
	name string,
) (common.Hash, error) {
	value :=
		strings.TrimSpace(
			os.Getenv(name),
		)

	if value == "" {
		// Deposit ID is deliberately excluded from the
		// wallet-signed intent message and intent hash.
		// PREPARE_ONLY therefore uses zero here safely.
		return common.Hash{}, nil
	}

	if len(value) != 66 ||
		!strings.HasPrefix(value, "0x") {
		return common.Hash{}, errors.Errorf(
			"%s must be a 32-byte 0x-prefixed hash",
			name,
		)
	}

	return common.HexToHash(value), nil
}

func buildSignedIntent(
	privateKey *ecdsa.PrivateKey,
	side string,
	fromAsset string,
	toAsset string,
	inputAmount string,
	receiveAmount string,
	limitPrice string,
	depositID common.Hash,
	validUntil string,
	createdAt string,
) (privateIntent, error) {
	owner := crypto.PubkeyToAddress(
		privateKey.PublicKey,
	)

	quoteHash := crypto.Keccak256Hash(
		[]byte(fmt.Sprintf(
			"%s:%s:%s:%s:%s",
			side,
			fromAsset,
			toAsset,
			inputAmount,
			receiveAmount,
		)),
	)

	quoteID :=
		"quote_" +
			quoteHash.Hex()[2:14]

	message := fmt.Sprintf(
		"FlareLock Private Intent\nVersion: 2\nWallet: %s\nQuote ID: %s\nQuote Hash: %s\nSide: %s\nFrom Asset: %s\nTo Asset: %s\nInput Amount: %s\nReceive Amount: %s\nOrder Type: limit\nLimit Price: %s\nStop Price: none\nTime In Force: GTC\nValid Until: %s\nNetwork: Coston2\nChain ID: 114",
		strings.ToLower(owner.Hex()),
		quoteID,
		quoteHash.Hex(),
		side,
		fromAsset,
		toAsset,
		inputAmount,
		receiveAmount,
		limitPrice,
		validUntil,
	)

	signature, err := crypto.Sign(
		accounts.TextHash(
			[]byte(message),
		),
		privateKey,
	)
	if err != nil {
		return privateIntent{}, errors.Errorf(
			"signing wallet intent: %s",
			err,
		)
	}

	signatureHex :=
		"0x" +
			common.Bytes2Hex(signature)

	intentHash :=
		crypto.Keccak256Hash(
			[]byte(
				message +
					"\nSignature: " +
					signatureHex +
					"\nCreated At: " +
					createdAt,
			),
		)

	return privateIntent{
		Owner: owner.Hex(),

		IntentHash: intentHash.Hex(),
		DepositID:  depositID.Hex(),

		QuoteID:   quoteID,
		QuoteHash: quoteHash.Hex(),

		Side:      side,
		FromAsset: fromAsset,
		ToAsset:   toAsset,

		InputAmount:   inputAmount,
		ReceiveAmount: receiveAmount,

		OrderType:   "limit",
		LimitPrice:  limitPrice,
		TimeInForce: "GTC",

		ValidUntil: validUntil,

		SignedMessage: message,
		Signature:     signatureHex,
		CreatedAt:     createdAt,
	}, nil
}

func verifyResult(
	proxyURL string,
	instructionID common.Hash,
) error {
	actionResponse, err :=
		fccutils.ActionResult(
			proxyURL,
			instructionID,
		)

	if err != nil {
		return err
	}

	result := actionResponse.Result

	logger.Infof(
		"FCC Instruction ID: %s",
		result.ID.Hex(),
	)

	logger.Infof(
		"FCC Submission Tag: %s",
		result.SubmissionTag,
	)

	logger.Infof(
		"FCC Result Status: %d",
		result.Status,
	)

	logger.Infof(
		"FCC Settlement Data: 0x%s",
		common.Bytes2Hex(result.Data),
	)

	logger.Infof(
		"FCC TEE Signature: 0x%s",
		common.Bytes2Hex(
			actionResponse.Signature,
		),
	)

	logger.Infof(
		"FCC Proxy Signature: 0x%s",
		common.Bytes2Hex(
			actionResponse.ProxySignature,
		),
	)

	if result.Status == 0 {
		return errors.Errorf(
			"FCC match failed: %s",
			result.Log,
		)
	}

	if result.Status == 2 {
		return errors.New(
			"FCC match is still pending",
		)
	}

	if len(result.Data) == 0 {
		return errors.New(
			"FCC result contained no data",
		)
	}

	var match matchResult

	uint8Type, err := abi.NewType("uint8", "", nil)
	if err != nil {
		return errors.Errorf(
			"building uint8 ABI type: %s",
			err,
		)
	}

	bytes32Type, err := abi.NewType("bytes32", "", nil)
	if err != nil {
		return errors.Errorf(
			"building bytes32 ABI type: %s",
			err,
		)
	}

	uint256Type, err := abi.NewType("uint256", "", nil)
	if err != nil {
		return errors.Errorf(
			"building uint256 ABI type: %s",
			err,
		)
	}

	arguments := abi.Arguments{
		{Type: uint8Type},
		{Type: bytes32Type},
		{Type: bytes32Type},
		{Type: bytes32Type},
		{Type: bytes32Type},
		{Type: bytes32Type},
		{Type: bytes32Type},
		{Type: uint256Type},
		{Type: uint256Type},
		{Type: uint256Type},
	}

	values, err := arguments.Unpack(result.Data)
	if err != nil {
		return errors.Errorf(
			"decoding ABI settlement result: %s",
			err,
		)
	}

	if len(values) != 10 {
		return errors.Errorf(
			"unexpected settlement field count: %d",
			len(values),
		)
	}

	domain := values[1].([32]byte)

	match = matchResult{
		Version: values[0].(uint8),
		Domain: string(
			domain[:len("FLARELOCK_SETTLEMENT")],
		),
		MatchCommitment: common.Hash(
			values[2].([32]byte),
		).Hex(),
		BuyIntentHash: common.Hash(
			values[3].([32]byte),
		).Hex(),
		SellIntentHash: common.Hash(
			values[4].([32]byte),
		).Hex(),
		BuyDepositID: common.Hash(
			values[5].([32]byte),
		).Hex(),
		SellDepositID: common.Hash(
			values[6].([32]byte),
		).Hex(),
		BaseAmountRaw:     values[7].(*big.Int).String(),
		QuoteAmountRaw:    values[8].(*big.Int).String(),
		ExecutionPriceE18: values[9].(*big.Int).String(),
		Market:            "C2FLR/FXRP",
	}

	if match.Domain != "FLARELOCK_SETTLEMENT" {
		return errors.Errorf(
			"unexpected settlement domain: %s",
			match.Domain,
		)
	}

	if match.Version != 1 {
		return errors.Errorf(
			"unexpected match result version: %d",
			match.Version,
		)
	}

	if match.MatchCommitment == "" ||
		match.MatchCommitment ==
			(common.Hash{}).Hex() {
		return errors.New(
			"match commitment is empty",
		)
	}

	if match.Market != "C2FLR/FXRP" {
		return errors.Errorf(
			"unexpected market: %s",
			match.Market,
		)
	}

	logger.Infof(
		"FCC Match Commitment: %s",
		match.MatchCommitment,
	)

	logger.Infof(
		"Base Amount Raw: %s",
		match.BaseAmountRaw,
	)

	logger.Infof(
		"Quote Amount Raw: %s",
		match.QuoteAmountRaw,
	)

	logger.Infof(
		"Execution Price E18: %s",
		match.ExecutionPriceE18,
	)

	return nil
}
