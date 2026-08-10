package extension

import (
	"bytes"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"extension-scaffold/internal/config"
	appTypes "extension-scaffold/pkg/types"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/flare-foundation/go-flare-common/pkg/tee/instruction"
	teeServer "github.com/flare-foundation/tee-node/pkg/server"
	teetypes "github.com/flare-foundation/tee-node/pkg/types"
	teeutils "github.com/flare-foundation/tee-node/pkg/utils"
)

func freePort(t *testing.T) int {
	t.Helper()

	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	port := l.Addr().(*net.TCPAddr).Port
	_ = l.Close()

	return port
}

func waitHTTP(t *testing.T, url string) {
	t.Helper()

	deadline := time.Now().Add(5 * time.Second)

	for time.Now().Before(deadline) {
		resp, err := http.Get(url)
		if err == nil {
			_ = resp.Body.Close()
			return
		}

		time.Sleep(50 * time.Millisecond)
	}

	t.Fatalf("service did not become reachable: %s", url)
}

func recoverTEEPublicKey(
	t *testing.T,
	signPort int,
) *ecdsa.PublicKey {
	t.Helper()

	challenge := []byte(
		"FlareLock local FCC integration challenge",
	)

	body, err := json.Marshal(
		teetypes.SignRequest{
			Message: challenge,
		},
	)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := http.Post(
		fmt.Sprintf(
			"http://127.0.0.1:%d/sign",
			signPort,
		),
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		t.Fatalf(
			"TEE /sign failed: %d %s",
			resp.StatusCode,
			string(raw),
		)
	}

	var signed teetypes.SignResponse

	if err := json.NewDecoder(resp.Body).Decode(
		&signed,
	); err != nil {
		t.Fatal(err)
	}

	if !bytes.Equal(
		signed.Message,
		challenge,
	) {
		t.Fatal(
			"TEE sign response changed challenge",
		)
	}

	if len(signed.Signature) != 65 {
		t.Fatalf(
			"unexpected TEE signature length: %d",
			len(signed.Signature),
		)
	}

	messageHash := crypto.Keccak256(
		challenge,
	)

	recoveryHash := accounts.TextHash(
		messageHash,
	)

	pub, err := crypto.SigToPub(
		recoveryHash,
		signed.Signature,
	)
	if err != nil {
		t.Fatalf(
			"recovering TEE public key: %v",
			err,
		)
	}

	return pub
}

func integrationSignedIntent(
	t *testing.T,
	side string,
	fromAsset string,
	toAsset string,
	inputAmount string,
	receiveAmount string,
	limitPrice string,
	depositID common.Hash,
	validUntil string,
	createdAt string,
) appTypes.PrivateIntent {
	t.Helper()

	key, err := crypto.GenerateKey()
	if err != nil {
		t.Fatal(err)
	}

	owner := crypto.PubkeyToAddress(key.PublicKey)

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

	return appTypes.PrivateIntent{
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

func TestRealTeeNodeDecryptsAndMatchesEncryptedPayload(
	t *testing.T,
) {
	if testing.Short() {
		t.Skip(
			"skipping real tee-node integration test in short mode",
		)
	}

	configPort := freePort(t)
	signPort := freePort(t)
	extensionPort := freePort(t)

	t.Setenv(
		"CHAIN_ID",
		"114",
	)

	t.Setenv(
		"EXTENSION_ID",
		"0x0000000000000000000000000000000000000000000000000000000000010000",
	)

	t.Setenv(
		"INITIAL_OWNER",
		"0x0000000000000000000000000000000000000001",
	)

	// Ensure this test does not accidentally depend on a deployment key.
	_ = os.Unsetenv(
		"DEPLOYMENT_PRIVATE_KEY",
	)

	go teeServer.StartServerExtension(
		configPort,
		signPort,
		extensionPort,
	)

	ext := New(
		extensionPort,
		signPort,
	)

	go func() {
		_ = ext.Server.ListenAndServe()
	}()

	time.Sleep(150 * time.Millisecond)

	waitHTTP(
		t,
		fmt.Sprintf(
			"http://127.0.0.1:%d/state",
			extensionPort,
		),
	)

	pubKey := recoverTEEPublicKey(
		t,
		signPort,
	)

	validUntil :=
		time.Now().
			Add(time.Hour).
			UTC().
			Format(time.RFC3339)

	request := appTypes.PrivateMatchRequest{
		Version: 1,

		Buy: integrationSignedIntent(
			t,
			"buy",
			"C2FLR",
			"FXRP",
			"175",
			"1",
			"175",
			common.HexToHash("0x1001"),
			validUntil,
			"2026-08-10T10:00:00.000Z",
		),

		Sell: integrationSignedIntent(
			t,
			"sell",
			"FXRP",
			"C2FLR",
			"1",
			"170",
			"170",
			common.HexToHash("0x2002"),
			validUntil,
			"2026-08-10T10:00:01.000Z",
		),
	}

	plaintext, err := json.Marshal(
		request,
	)
	if err != nil {
		t.Fatal(err)
	}

	ciphertext, err := teeutils.Encrypt(
		plaintext,
		pubKey,
	)
	if err != nil {
		t.Fatalf(
			"encrypting to real TEE key: %v",
			err,
		)
	}

	if bytes.Contains(
		ciphertext,
		[]byte("FlareLock Private Intent"),
	) {
		t.Fatal(
			"ciphertext contains private limit price plaintext",
		)
	}

	actionID :=
		crypto.Keccak256Hash(
			[]byte(
				"flarelock-real-tee-integration",
			),
		)

	teeID :=
		crypto.PubkeyToAddress(
			*pubKey,
		)

	df := instruction.DataFixed{
		InstructionID: actionID,
		TeeID:         teeID,
		Timestamp:     uint64(time.Now().Unix()),

		OPType: teeutils.ToHash(
			config.OPTypeFlareLock,
		),

		OPCommand: teeutils.ToHash(
			config.OPCommandVerifyAndMatch,
		),

		Cosigners:          []common.Address{},
		CosignersThreshold: 0,

		OriginalMessage: ciphertext,
	}

	fixedBytes, err := json.Marshal(df)
	if err != nil {
		t.Fatal(err)
	}

	action := teetypes.Action{}

	action.Data.ID =
		actionID

	action.Data.Type =
		"instruction"

	action.Data.SubmissionTag =
		"submit"

	action.Data.Message =
		fixedBytes

	actionBody, err := json.Marshal(
		action,
	)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := http.Post(
		fmt.Sprintf(
			"http://127.0.0.1:%d/action",
			extensionPort,
		),
		"application/json",
		bytes.NewReader(actionBody),
	)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf(
			"extension returned HTTP %d: %s",
			resp.StatusCode,
			string(raw),
		)
	}

	var result teetypes.ActionResult

	if err := json.Unmarshal(
		raw,
		&result,
	); err != nil {
		t.Fatalf(
			"decoding ActionResult: %v\n%s",
			err,
			string(raw),
		)
	}

	if result.Status != 1 {
		t.Fatalf(
			"confidential match failed: %s",
			result.Log,
		)
	}

	settlement, err := decodeSettlementResult(result.Data)
	if err != nil {
		t.Fatal(err)
	}

	if settlement.Version != 1 {
		t.Fatalf(
			"unexpected settlement version: %d",
			settlement.Version,
		)
	}

	var expectedDomain [32]byte
	copy(expectedDomain[:], []byte(settlementDomain))

	if settlement.Domain != expectedDomain {
		t.Fatal("unexpected settlement domain")
	}

	if settlement.MatchCommitment == (common.Hash{}) {
		t.Fatal(
			"expected non-zero execution commitment",
		)
	}

	if settlement.BaseAmountRaw.String() != "1000000" {
		t.Fatalf(
			"unexpected fill amount: %s",
			settlement.BaseAmountRaw.String(),
		)
	}

	if settlement.ExecutionPriceE18.String() !=
		"175000000000000000000" {
		t.Fatalf(
			"unexpected execution price: %s",
			settlement.ExecutionPriceE18.String(),
		)
	}

	t.Logf(
		"real tee-node ID: %s",
		teeID.Hex(),
	)

	t.Logf(
		"ciphertext bytes: %d",
		len(ciphertext),
	)

	t.Logf(
		"match commitment: %s",
		settlement.MatchCommitment.Hex(),
	)
}
