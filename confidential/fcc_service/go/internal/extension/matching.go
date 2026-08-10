package extension

import (
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"

	"extension-scaffold/pkg/types"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

const (
	fxrpDecimals  = 6
	c2flrDecimals = 18
	priceDecimals = 18
)

var (
	oneFXRP = new(big.Int).Exp(big.NewInt(10), big.NewInt(fxrpDecimals), nil)
	oneE18  = new(big.Int).Exp(big.NewInt(10), big.NewInt(priceDecimals), nil)
)

func validateAndMatch(
	request types.PrivateMatchRequest,
	now uint64,
) (types.MatchResult, error) {
	if request.Version != 1 {
		return types.MatchResult{}, fmt.Errorf(
			"unsupported private match version",
		)
	}

	buy := request.Buy
	sell := request.Sell

	if buy.Owner == (common.Address{}) ||
		sell.Owner == (common.Address{}) {
		return types.MatchResult{}, fmt.Errorf(
			"owner must not be zero address",
		)
	}

	if buy.Owner == sell.Owner {
		return types.MatchResult{}, fmt.Errorf(
			"self matching is not allowed",
		)
	}

	if buy.IntentHash == (common.Hash{}) ||
		sell.IntentHash == (common.Hash{}) {
		return types.MatchResult{}, fmt.Errorf(
			"intent hash must not be zero",
		)
	}

	if buy.DepositID == (common.Hash{}) ||
		sell.DepositID == (common.Hash{}) {
		return types.MatchResult{}, fmt.Errorf(
			"deposit id must not be zero",
		)
	}

	if err := validateDirection(buy, "buy"); err != nil {
		return types.MatchResult{}, err
	}

	if err := validateDirection(sell, "sell"); err != nil {
		return types.MatchResult{}, err
	}

	if err := verifyIntentIdentity(buy); err != nil {
		return types.MatchResult{}, fmt.Errorf(
			"buy intent verification failed: %w",
			err,
		)
	}

	if err := verifyIntentIdentity(sell); err != nil {
		return types.MatchResult{}, fmt.Errorf(
			"sell intent verification failed: %w",
			err,
		)
	}

	buyValidUntil, err := parseRFC3339Unix(
		buy.ValidUntil,
		"buy valid until",
	)
	if err != nil {
		return types.MatchResult{}, err
	}

	sellValidUntil, err := parseRFC3339Unix(
		sell.ValidUntil,
		"sell valid until",
	)
	if err != nil {
		return types.MatchResult{}, err
	}

	if now >= buyValidUntil || now >= sellValidUntil {
		return types.MatchResult{}, fmt.Errorf(
			"one or more intents have expired",
		)
	}

	if strings.ToLower(buy.OrderType) != "limit" ||
		strings.ToLower(sell.OrderType) != "limit" {
		return types.MatchResult{}, fmt.Errorf(
			"FCC confidential matcher currently requires limit orders",
		)
	}

	buyBaseRaw, err := decimalToInteger(
		buy.ReceiveAmount,
		fxrpDecimals,
		"buy receive amount",
	)
	if err != nil {
		return types.MatchResult{}, err
	}

	sellBaseRaw, err := decimalToInteger(
		sell.InputAmount,
		fxrpDecimals,
		"sell input amount",
	)
	if err != nil {
		return types.MatchResult{}, err
	}

	buyLimitE18, err := decimalToInteger(
		buy.LimitPrice,
		priceDecimals,
		"buy limit price",
	)
	if err != nil {
		return types.MatchResult{}, err
	}

	sellLimitE18, err := decimalToInteger(
		sell.LimitPrice,
		priceDecimals,
		"sell limit price",
	)
	if err != nil {
		return types.MatchResult{}, err
	}

	if buyLimitE18.Cmp(sellLimitE18) < 0 {
		return types.MatchResult{}, fmt.Errorf(
			"orders do not cross",
		)
	}

	baseAmountRaw := new(big.Int).Set(buyBaseRaw)
	if sellBaseRaw.Cmp(baseAmountRaw) < 0 {
		baseAmountRaw.Set(sellBaseRaw)
	}

	executionPriceE18, err := determineExecutionPrice(
		buy,
		sell,
		buyLimitE18,
		sellLimitE18,
	)
	if err != nil {
		return types.MatchResult{}, err
	}

	quoteAmountRaw := new(big.Int).Mul(
		baseAmountRaw,
		executionPriceE18,
	)

	// baseAmountRaw is FXRP with 6 decimals.
	// executionPriceE18 is C2FLR per whole FXRP with 18 decimals.
	// Dividing by 1e6 therefore yields C2FLR wei.
	quoteAmountRaw.Div(
		quoteAmountRaw,
		oneFXRP,
	)

	if quoteAmountRaw.Sign() <= 0 {
		return types.MatchResult{}, fmt.Errorf(
			"calculated quote amount is zero",
		)
	}

	commitment := buildExecutionCommitment(
		buy,
		sell,
		baseAmountRaw,
		quoteAmountRaw,
		executionPriceE18,
	)

	return types.MatchResult{
		Version: 1,

		MatchCommitment: commitment,

		BuyIntentHash:  buy.IntentHash,
		SellIntentHash: sell.IntentHash,

		BuyDepositID:  buy.DepositID,
		SellDepositID: sell.DepositID,

		BaseAmountRaw:  baseAmountRaw.String(),
		QuoteAmountRaw: quoteAmountRaw.String(),

		ExecutionPriceE18: executionPriceE18.String(),

		Market: "C2FLR/FXRP",
	}, nil
}

func validateDirection(
	intent types.PrivateIntent,
	expectedSide string,
) error {
	if strings.ToLower(intent.Side) != expectedSide {
		return fmt.Errorf(
			"expected %s side",
			expectedSide,
		)
	}

	from := strings.ToUpper(intent.FromAsset)
	to := strings.ToUpper(intent.ToAsset)

	switch expectedSide {
	case "buy":
		if from != "C2FLR" || to != "FXRP" {
			return fmt.Errorf(
				"buy intent must exchange C2FLR for FXRP",
			)
		}

	case "sell":
		if from != "FXRP" || to != "C2FLR" {
			return fmt.Errorf(
				"sell intent must exchange FXRP for C2FLR",
			)
		}
	}

	return nil
}

func verifyIntentIdentity(
	intent types.PrivateIntent,
) error {
	if strings.TrimSpace(intent.CreatedAt) == "" {
		return fmt.Errorf(
			"createdAt is required",
		)
	}

	expectedMessage, err := buildCanonicalIntentMessage(
		intent,
	)
	if err != nil {
		return err
	}

	if intent.SignedMessage != expectedMessage {
		return fmt.Errorf(
			"signed message does not match structured intent",
		)
	}

	signatureBytes, err := decodeSignature(
		intent.Signature,
	)
	if err != nil {
		return err
	}

	messageHash := accounts.TextHash(
		[]byte(expectedMessage),
	)

	signatureForRecovery := append(
		[]byte(nil),
		signatureBytes...,
	)

	if signatureForRecovery[64] >= 27 {
		signatureForRecovery[64] -= 27
	}

	pubKey, err := crypto.SigToPub(
		messageHash,
		signatureForRecovery,
	)
	if err != nil {
		return fmt.Errorf(
			"recovering wallet signature: %w",
			err,
		)
	}

	recovered := crypto.PubkeyToAddress(*pubKey)

	if recovered != intent.Owner {
		return fmt.Errorf(
			"wallet signature does not match owner",
		)
	}

	expectedIntentHash := crypto.Keccak256Hash(
		[]byte(
			strings.Join(
				[]string{
					expectedMessage,
					"Signature: " + intent.Signature,
					"Created At: " + intent.CreatedAt,
				},
				"\n",
			),
		),
	)

	if expectedIntentHash != intent.IntentHash {
		return fmt.Errorf(
			"intent hash does not match signed intent",
		)
	}

	return nil
}

func buildCanonicalIntentMessage(
	intent types.PrivateIntent,
) (string, error) {
	if strings.TrimSpace(intent.QuoteID) == "" {
		return "", fmt.Errorf("quoteId is required")
	}

	if intent.QuoteHash == (common.Hash{}) {
		return "", fmt.Errorf("quoteHash is required")
	}

	if _, err := parsePositiveDecimal(
		intent.InputAmount,
		"input amount",
	); err != nil {
		return "", err
	}

	if _, err := parsePositiveDecimal(
		intent.ReceiveAmount,
		"receive amount",
	); err != nil {
		return "", err
	}

	orderType := strings.ToLower(
		strings.TrimSpace(intent.OrderType),
	)

	if orderType != "market" &&
		orderType != "limit" &&
		orderType != "stop" {
		return "", fmt.Errorf(
			"unsupported order type",
		)
	}

	limitPrice := "none"
	if strings.TrimSpace(intent.LimitPrice) != "" {
		if _, err := parsePositiveDecimal(
			intent.LimitPrice,
			"limit price",
		); err != nil {
			return "", err
		}

		limitPrice = intent.LimitPrice
	}

	stopPrice := "none"
	if strings.TrimSpace(intent.StopPrice) != "" {
		if _, err := parsePositiveDecimal(
			intent.StopPrice,
			"stop price",
		); err != nil {
			return "", err
		}

		stopPrice = intent.StopPrice
	}

	tif := strings.ToUpper(
		strings.TrimSpace(intent.TimeInForce),
	)

	if tif != "IOC" && tif != "GTC" {
		return "", fmt.Errorf(
			"unsupported time in force",
		)
	}

	if _, err := time.Parse(
		time.RFC3339,
		intent.ValidUntil,
	); err != nil {
		return "", fmt.Errorf(
			"invalid validUntil: %w",
			err,
		)
	}

	return strings.Join(
		[]string{
			"FlareLock Private Intent",
			"Version: 2",
			"Wallet: " + strings.ToLower(intent.Owner.Hex()),
			"Quote ID: " + intent.QuoteID,
			"Quote Hash: " + intent.QuoteHash.Hex(),
			"Side: " + strings.ToLower(intent.Side),
			"From Asset: " + intent.FromAsset,
			"To Asset: " + intent.ToAsset,
			"Input Amount: " + intent.InputAmount,
			"Receive Amount: " + intent.ReceiveAmount,
			"Order Type: " + orderType,
			"Limit Price: " + limitPrice,
			"Stop Price: " + stopPrice,
			"Time In Force: " + tif,
			"Valid Until: " + intent.ValidUntil,
			"Network: Coston2",
			"Chain ID: 114",
		},
		"\n",
	), nil
}

func determineExecutionPrice(
	buy types.PrivateIntent,
	sell types.PrivateIntent,
	buyLimit *big.Int,
	sellLimit *big.Int,
) (*big.Int, error) {
	buyCreatedAt, err := time.Parse(
		time.RFC3339Nano,
		buy.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"invalid buy createdAt: %w",
			err,
		)
	}

	sellCreatedAt, err := time.Parse(
		time.RFC3339Nano,
		sell.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"invalid sell createdAt: %w",
			err,
		)
	}

	if !buyCreatedAt.After(sellCreatedAt) {
		return new(big.Int).Set(buyLimit), nil
	}

	return new(big.Int).Set(sellLimit), nil
}

func parseRFC3339Unix(
	value string,
	field string,
) (uint64, error) {
	parsed, err := time.Parse(
		time.RFC3339,
		value,
	)
	if err != nil {
		return 0, fmt.Errorf(
			"%s is invalid: %w",
			field,
			err,
		)
	}

	if parsed.Unix() < 0 {
		return 0, fmt.Errorf(
			"%s is before unix epoch",
			field,
		)
	}

	return uint64(parsed.Unix()), nil
}

func parsePositiveDecimal(
	value string,
	field string,
) (*big.Rat, error) {
	value = strings.TrimSpace(value)

	if value == "" {
		return nil, fmt.Errorf(
			"%s is required",
			field,
		)
	}

	parsed, ok := new(big.Rat).SetString(value)
	if !ok || parsed.Sign() <= 0 {
		return nil, fmt.Errorf(
			"%s must be a positive decimal",
			field,
		)
	}

	return parsed, nil
}

func decimalToInteger(
	value string,
	decimals int64,
	field string,
) (*big.Int, error) {
	parsed, err := parsePositiveDecimal(
		value,
		field,
	)
	if err != nil {
		return nil, err
	}

	scale := new(big.Int).Exp(
		big.NewInt(10),
		big.NewInt(decimals),
		nil,
	)

	scaled := new(big.Rat).Mul(
		parsed,
		new(big.Rat).SetInt(scale),
	)

	if scaled.Denom().Cmp(big.NewInt(1)) != 0 {
		return nil, fmt.Errorf(
			"%s has more than %d decimal places",
			field,
			decimals,
		)
	}

	return new(big.Int).Set(
		scaled.Num(),
	), nil
}

func decodeSignature(value string) ([]byte, error) {
	value = strings.TrimPrefix(
		strings.TrimSpace(value),
		"0x",
	)

	if len(value) != 130 {
		return nil, fmt.Errorf(
			"signature must contain 65 bytes",
		)
	}

	signature := common.FromHex("0x" + value)

	if len(signature) != 65 {
		return nil, fmt.Errorf(
			"signature must contain 65 bytes",
		)
	}

	return signature, nil
}

func buildExecutionCommitment(
	buy types.PrivateIntent,
	sell types.PrivateIntent,
	baseAmount *big.Int,
	quoteAmount *big.Int,
	executionPrice *big.Int,
) common.Hash {
	payload := strings.Join(
		[]string{
			"FlareLock FCC Execution",
			"Version: 1",
			"Network: Coston2",
			"Chain ID: 114",
			"Market: C2FLR/FXRP",
			"Buy Intent: " + buy.IntentHash.Hex(),
			"Sell Intent: " + sell.IntentHash.Hex(),
			"Buy Deposit: " + buy.DepositID.Hex(),
			"Sell Deposit: " + sell.DepositID.Hex(),
			"Base Amount Raw: " + baseAmount.String(),
			"Quote Amount Raw: " + quoteAmount.String(),
			"Execution Price E18: " + executionPrice.String(),
		},
		"\n",
	)

	return crypto.Keccak256Hash(
		[]byte(payload),
	)
}

func unixNow() uint64 {
	return uint64(time.Now().Unix())
}

func uintToString(value uint64) string {
	return strconv.FormatUint(value, 10)
}
