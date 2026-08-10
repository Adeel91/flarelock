package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"strings"
	"time"

	"extension-scaffold/tools/pkg/configs"
	"extension-scaffold/tools/pkg/fccutils"
	"extension-scaffold/tools/pkg/support"
	instrutils "extension-scaffold/tools/pkg/utils"

	"github.com/ethereum/go-ethereum/accounts"
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
	Version uint8 `json:"version"`

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

	request := buildTestRequest()

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

func buildTestRequest() privateMatchRequest {
	now := time.Now().UTC()

	validUntil :=
		now.
			Add(time.Hour).
			Format(time.RFC3339)

	buy, err := buildSignedIntent(
		"buy",
		"C2FLR",
		"FXRP",
		"175",
		"1",
		"175",
		common.HexToHash(
			"0x2000000000000000000000000000000000000000000000000000000000000001",
		),
		validUntil,
		now.Format(time.RFC3339Nano),
	)
	if err != nil {
		fccutils.FatalWithCause(err)
	}

	sell, err := buildSignedIntent(
		"sell",
		"FXRP",
		"C2FLR",
		"1",
		"170",
		"170",
		common.HexToHash(
			"0x2000000000000000000000000000000000000000000000000000000000000002",
		),
		validUntil,
		now.Add(time.Second).Format(time.RFC3339Nano),
	)
	if err != nil {
		fccutils.FatalWithCause(err)
	}

	return privateMatchRequest{
		Version: 1,
		Buy:     buy,
		Sell:    sell,
	}
}

func buildSignedIntent(
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
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return privateIntent{}, errors.Errorf(
			"generating ephemeral intent key: %s",
			err,
		)
	}

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
			"signing ephemeral intent: %s",
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

	if err := json.Unmarshal(
		result.Data,
		&match,
	); err != nil {
		return errors.Errorf(
			"decoding match result: %s",
			err,
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
