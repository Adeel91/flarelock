package extension

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"extension-scaffold/pkg/types"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

func signedIntent(
	t *testing.T,
	privateKeyHex string,
	side string,
	fromAsset string,
	toAsset string,
	inputAmount string,
	receiveAmount string,
	limitPrice string,
	depositID common.Hash,
	validUntil string,
	createdAt string,
) types.PrivateIntent {
	t.Helper()

	key, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		t.Fatal(err)
	}

	owner := crypto.PubkeyToAddress(key.PublicKey)

	quoteHash := crypto.Keccak256Hash(
		[]byte(
			fmt.Sprintf(
				"%s:%s:%s:%s:%s",
				side,
				fromAsset,
				toAsset,
				inputAmount,
				receiveAmount,
			),
		),
	)

	quoteID := "quote_" + quoteHash.Hex()[2:14]

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
		accounts.TextHash([]byte(message)),
		key,
	)
	if err != nil {
		t.Fatal(err)
	}

	signatureHex := "0x" + common.Bytes2Hex(signature)

	intentHash := crypto.Keccak256Hash(
		[]byte(
			message +
				"\nSignature: " +
				signatureHex +
				"\nCreated At: " +
				createdAt,
		),
	)

	return types.PrivateIntent{
		Owner: owner,

		IntentHash: intentHash,
		DepositID:  depositID,

		QuoteID:   quoteID,
		QuoteHash: quoteHash,

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
	}
}

func validMatchRequest(
	t *testing.T,
) types.PrivateMatchRequest {
	t.Helper()

	validUntil :=
		time.Now().
			Add(time.Hour).
			UTC().
			Format(time.RFC3339)

	// Buy is deliberately older. Existing FlareLock matching therefore
	// executes this limit/limit match at the buyer's 175 C2FLR price.
	buy := signedIntent(
		t,
		"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		"buy",
		"C2FLR",
		"FXRP",
		"175",
		"1",
		"175",
		common.HexToHash("0x1001"),
		validUntil,
		"2026-08-10T10:00:00.000Z",
	)

	sell := signedIntent(
		t,
		"abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		"sell",
		"FXRP",
		"C2FLR",
		"1",
		"170",
		"170",
		common.HexToHash("0x2002"),
		validUntil,
		"2026-08-10T10:00:01.000Z",
	)

	return types.PrivateMatchRequest{
		Version: 1,
		Buy:     buy,
		Sell:    sell,
	}
}

func TestValidateAndMatchSuccess(t *testing.T) {
	request := validMatchRequest(t)

	result, err := validateAndMatch(
		request,
		uint64(time.Now().Unix()),
	)
	if err != nil {
		t.Fatal(err)
	}

	if result.MatchCommitment == (common.Hash{}) {
		t.Fatal("expected non-zero match commitment")
	}

	if result.BaseAmountRaw != "1000000" {
		t.Fatalf(
			"unexpected FXRP raw base amount: %s",
			result.BaseAmountRaw,
		)
	}

	if result.QuoteAmountRaw !=
		"175000000000000000000" {
		t.Fatalf(
			"unexpected C2FLR raw quote amount: %s",
			result.QuoteAmountRaw,
		)
	}

	if result.ExecutionPriceE18 !=
		"175000000000000000000" {
		t.Fatalf(
			"unexpected execution price: %s",
			result.ExecutionPriceE18,
		)
	}

	if result.Market != "C2FLR/FXRP" {
		t.Fatalf(
			"unexpected market: %s",
			result.Market,
		)
	}
}

func TestValidateAndMatchUsesOlderLimitPrice(t *testing.T) {
	request := validMatchRequest(t)

	// Make the seller older instead.
	request.Sell = signedIntent(
		t,
		"abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		"sell",
		"FXRP",
		"C2FLR",
		"1",
		"170",
		"170",
		common.HexToHash("0x2002"),
		request.Sell.ValidUntil,
		"2026-08-10T09:59:59.000Z",
	)

	result, err := validateAndMatch(
		request,
		uint64(time.Now().Unix()),
	)
	if err != nil {
		t.Fatal(err)
	}

	if result.ExecutionPriceE18 !=
		"170000000000000000000" {
		t.Fatalf(
			"expected older seller price, got %s",
			result.ExecutionPriceE18,
		)
	}
}

func TestValidateAndMatchRejectsSelfMatch(t *testing.T) {
	request := validMatchRequest(t)

	request.Sell.Owner = request.Buy.Owner

	_, err := validateAndMatch(
		request,
		uint64(time.Now().Unix()),
	)

	if err == nil {
		t.Fatal("expected self-match rejection")
	}
}

func TestValidateAndMatchRejectsUnsignedFieldMutation(t *testing.T) {
	request := validMatchRequest(t)

	request.Buy.LimitPrice = "999999"

	_, err := validateAndMatch(
		request,
		uint64(time.Now().Unix()),
	)

	if err == nil {
		t.Fatal(
			"expected signed-message binding rejection",
		)
	}
}

func TestValidateAndMatchRejectsNonCrossingOrders(t *testing.T) {
	request := validMatchRequest(t)

	request.Buy = signedIntent(
		t,
		"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		"buy",
		"C2FLR",
		"FXRP",
		"160",
		"1",
		"160",
		common.HexToHash("0x1001"),
		request.Buy.ValidUntil,
		request.Buy.CreatedAt,
	)

	_, err := validateAndMatch(
		request,
		uint64(time.Now().Unix()),
	)

	if err == nil {
		t.Fatal(
			"expected non-crossing rejection",
		)
	}
}

func TestValidateAndMatchRejectsExpiredIntent(t *testing.T) {
	request := validMatchRequest(t)

	request.Buy = signedIntent(
		t,
		"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		"buy",
		"C2FLR",
		"FXRP",
		"175",
		"1",
		"175",
		common.HexToHash("0x1001"),
		"2020-01-01T00:00:00Z",
		request.Buy.CreatedAt,
	)

	_, err := validateAndMatch(
		request,
		uint64(time.Now().Unix()),
	)

	if err == nil {
		t.Fatal(
			"expected expired intent rejection",
		)
	}
}

func TestValidateAndMatchRejectsBadSignature(t *testing.T) {
	request := validMatchRequest(t)

	request.Buy.Signature =
		request.Sell.Signature

	_, err := validateAndMatch(
		request,
		uint64(time.Now().Unix()),
	)

	if err == nil {
		t.Fatal(
			"expected invalid signature rejection",
		)
	}
}

func TestCommitmentIsDeterministic(t *testing.T) {
	request := validMatchRequest(t)

	now := uint64(time.Now().Unix())

	first, err := validateAndMatch(
		request,
		now,
	)
	if err != nil {
		t.Fatal(err)
	}

	second, err := validateAndMatch(
		request,
		now,
	)
	if err != nil {
		t.Fatal(err)
	}

	if first.MatchCommitment !=
		second.MatchCommitment {
		t.Fatal(
			"expected deterministic commitment",
		)
	}
}
