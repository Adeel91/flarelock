package main

import (
	"context"
	"encoding/json"
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

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	gethtypes "github.com/ethereum/go-ethereum/core/types"
	"github.com/joho/godotenv"
	"github.com/pkg/errors"
)

const settlementDomain = "FLARELOCK_SETTLEMENT"

const escrowABI = `[
	{
		"type":"function",
		"name":"lockDeposit",
		"stateMutability":"nonpayable",
		"inputs":[
			{"name":"depositId","type":"bytes32"},
			{"name":"matchCommitment","type":"bytes32"}
		],
		"outputs":[]
	},
	{
		"type":"function",
		"name":"unlockDeposit",
		"stateMutability":"nonpayable",
		"inputs":[
			{"name":"depositId","type":"bytes32"}
		],
		"outputs":[]
	},
	{
		"type":"function",
		"name":"settleSignedMatch",
		"stateMutability":"nonpayable",
		"inputs":[
			{"name":"instructionId","type":"bytes32"},
			{"name":"submissionTag","type":"string"},
			{"name":"status","type":"uint8"},
			{"name":"settlementData","type":"bytes"},
			{"name":"teeSignature","type":"bytes"}
		],
		"outputs":[]
	}
]`

type privateIntent struct {
	Owner common.Address `json:"owner"`

	IntentHash common.Hash `json:"intentHash"`
	DepositID  common.Hash `json:"depositId"`

	QuoteID   string      `json:"quoteId"`
	QuoteHash common.Hash `json:"quoteHash"`

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

type executorInput struct {
	Request privateMatchRequest `json:"request"`
}

type decodedSettlement struct {
	Version           uint8
	Domain            string
	MatchCommitment   common.Hash
	BuyIntentHash     common.Hash
	SellIntentHash    common.Hash
	BuyDepositID      common.Hash
	SellDepositID     common.Hash
	BaseAmountRaw     *big.Int
	QuoteAmountRaw    *big.Int
	ExecutionPriceE18 *big.Int
}

type executorOutput struct {
	InstructionID          string `json:"instructionId"`
	InstructionTransaction string `json:"instructionTransaction"`

	MatchCommitment string `json:"matchCommitment"`

	BuyIntentHash  string `json:"buyIntentHash"`
	SellIntentHash string `json:"sellIntentHash"`

	BuyDepositID  string `json:"buyDepositId"`
	SellDepositID string `json:"sellDepositId"`

	BaseAmountRaw     string `json:"baseAmountRaw"`
	QuoteAmountRaw    string `json:"quoteAmountRaw"`
	ExecutionPriceE18 string `json:"executionPriceE18"`

	SubmissionTag string `json:"submissionTag"`
	Status        uint8  `json:"status"`

	BuyerLockTransaction  string `json:"buyerLockTransaction"`
	SellerLockTransaction string `json:"sellerLockTransaction"`
	SettlementTransaction string `json:"settlementTransaction"`
}

func main() {
	inputFile := flag.String(
		"input",
		"",
		"path to confidential match request JSON",
	)

	outputFile := flag.String(
		"output",
		"",
		"path for settlement result JSON",
	)

	addressesFile := flag.String(
		"a",
		configs.AddressesFile,
		"FCC deployed addresses file",
	)

	chainURL := flag.String(
		"c",
		configs.ChainNodeURL,
		"Coston2 RPC URL",
	)

	proxyURL := flag.String(
		"p",
		"",
		"FCC extension proxy URL",
	)

	instructionSender := flag.String(
		"instructionSender",
		"",
		"FlareLock InstructionSender address",
	)

	escrowAddress := flag.String(
		"escrow",
		"",
		"FlareLock escrow address",
	)

	flag.Parse()

	// When invoked from confidential/fcc_service/tools, this loads the
	// deployment/operator key and FCC configuration without requiring
	// trader private keys.
	_ = godotenv.Load("../.env")

	if *inputFile == "" {
		fatal(errors.New("-input is required"))
	}

	if *outputFile == "" {
		fatal(errors.New("-output is required"))
	}

	if *proxyURL == "" {
		*proxyURL = strings.TrimSpace(os.Getenv("EXT_PROXY_URL"))
	}

	if *proxyURL == "" {
		fatal(errors.New(
			"FCC proxy URL is required via -p or EXT_PROXY_URL",
		))
	}

	if *instructionSender == "" {
		*instructionSender =
			strings.TrimSpace(
				os.Getenv("INSTRUCTION_SENDER_ADDRESS"),
			)
	}

	if *instructionSender == "" {
		fatal(errors.New(
			"InstructionSender address is required",
		))
	}

	if *escrowAddress == "" {
		*escrowAddress =
			strings.TrimSpace(
				os.Getenv("FLARELOCK_ESCROW_ADDRESS"),
			)
	}

	if *escrowAddress == "" {
		fatal(errors.New(
			"FlareLock escrow address is required",
		))
	}

	var input executorInput

	rawInput, err := os.ReadFile(*inputFile)
	if err != nil {
		fatal(errors.Errorf(
			"reading executor input: %s",
			err,
		))
	}

	if err := json.Unmarshal(rawInput, &input); err != nil {
		fatal(errors.Errorf(
			"decoding executor input: %s",
			err,
		))
	}

	if err := validateRequest(input.Request); err != nil {
		fatal(err)
	}

	s, err := support.DefaultSupport(
		*addressesFile,
		*chainURL,
	)
	if err != nil {
		fatal(errors.Errorf(
			"initialising FCC support: %s",
			err,
		))
	}

	target, err :=
		instrutils.ResolveConfidentialTarget(
			*proxyURL,
		)
	if err != nil {
		fatal(errors.Errorf(
			"resolving confidential target: %s",
			err,
		))
	}

	ciphertext, err :=
		instrutils.EncryptForTEE(
			target,
			input.Request,
		)
	if err != nil {
		fatal(errors.Errorf(
			"encrypting FCC request: %s",
			err,
		))
	}

	instructionID, instructionTx, err :=
		instrutils.SendConfidentialMatch(
			s,
			common.HexToAddress(
				*instructionSender,
			),
			target.TeeID,
			ciphertext,
		)
	if err != nil {
		fatal(errors.Errorf(
			"sending FCC instruction: %s",
			err,
		))
	}

	actionResponse, err :=
		fccutils.ActionResult(
			*proxyURL,
			instructionID,
		)
	if err != nil {
		fatal(errors.Errorf(
			"loading FCC action result: %s",
			err,
		))
	}

	result := actionResponse.Result

	if result.ID != instructionID {
		fatal(errors.New(
			"FCC result instruction ID mismatch",
		))
	}

	if result.Status == 0 {
		fatal(errors.Errorf(
			"FCC confidential match failed: %s",
			result.Log,
		))
	}

	if result.Status == 2 {
		fatal(errors.New(
			"FCC action remained pending",
		))
	}

	if result.Status != 1 {
		fatal(errors.Errorf(
			"unexpected FCC status: %d",
			result.Status,
		))
	}

	if len(result.Data) == 0 {
		fatal(errors.New(
			"FCC settlement result contained no data",
		))
	}

	if len(actionResponse.Signature) == 0 {
		fatal(errors.New(
			"FCC result contained no TEE signature",
		))
	}

	settlement, err :=
		decodeSettlementResult(
			result.Data,
		)
	if err != nil {
		fatal(err)
	}

	if err := verifySettlementMatchesRequest(
		settlement,
		input.Request,
	); err != nil {
		fatal(err)
	}

	parsedEscrowABI, err :=
		abi.JSON(
			strings.NewReader(
				escrowABI,
			),
		)
	if err != nil {
		fatal(errors.Errorf(
			"parsing escrow ABI: %s",
			err,
		))
	}

	escrow :=
		bind.NewBoundContract(
			common.HexToAddress(
				*escrowAddress,
			),
			parsedEscrowABI,
			s.ChainClient,
			s.ChainClient,
			s.ChainClient,
		)

	buyerLockTx, err :=
		transactAndWait(
			s,
			escrow,
			"lockDeposit",
			settlement.BuyDepositID,
			settlement.MatchCommitment,
		)
	if err != nil {
		fatal(errors.Errorf(
			"locking buyer deposit: %s",
			err,
		))
	}

	sellerLockTx, err :=
		transactAndWait(
			s,
			escrow,
			"lockDeposit",
			settlement.SellDepositID,
			settlement.MatchCommitment,
		)
	if err != nil {
		// A non-zero transaction hash means the seller lock was
		// submitted and may already be pending or mined.
		if sellerLockTx == (common.Hash{}) {
			_ = bestEffortUnlock(
				s,
				escrow,
				settlement.BuyDepositID,
			)
		}

		fatal(errors.Errorf(
			"locking seller deposit: %s",
			err,
		))
	}

	settlementTx, err :=
		transactAndWait(
			s,
			escrow,
			"settleSignedMatch",
			instructionID,
			string(result.SubmissionTag),
			result.Status,
			[]byte(result.Data),
			[]byte(actionResponse.Signature),
		)
	if err != nil {
		// If settlement was submitted, an RPC receipt failure must
		// never trigger an unlock of potentially settled deposits.
		if settlementTx == (common.Hash{}) {
			_ = bestEffortUnlock(
				s,
				escrow,
				settlement.BuyDepositID,
			)

			_ = bestEffortUnlock(
				s,
				escrow,
				settlement.SellDepositID,
			)
		}

		fatal(errors.Errorf(
			"settling FCC match: %s",
			err,
		))
	}

	output := executorOutput{
		InstructionID: instructionID.Hex(),

		InstructionTransaction: instructionTx.Hex(),

		MatchCommitment: settlement.MatchCommitment.Hex(),

		BuyIntentHash: settlement.BuyIntentHash.Hex(),

		SellIntentHash: settlement.SellIntentHash.Hex(),

		BuyDepositID: settlement.BuyDepositID.Hex(),

		SellDepositID: settlement.SellDepositID.Hex(),

		BaseAmountRaw: settlement.BaseAmountRaw.String(),

		QuoteAmountRaw: settlement.QuoteAmountRaw.String(),

		ExecutionPriceE18: settlement.ExecutionPriceE18.String(),

		SubmissionTag: string(result.SubmissionTag),

		Status: result.Status,

		BuyerLockTransaction: buyerLockTx.Hex(),

		SellerLockTransaction: sellerLockTx.Hex(),

		SettlementTransaction: settlementTx.Hex(),
	}

	rawOutput, err :=
		json.MarshalIndent(
			output,
			"",
			"  ",
		)
	if err != nil {
		fatal(errors.Errorf(
			"encoding settlement output: %s",
			err,
		))
	}

	rawOutput = append(
		rawOutput,
		'\n',
	)

	if err := os.WriteFile(
		*outputFile,
		rawOutput,
		0o600,
	); err != nil {
		fatal(errors.Errorf(
			"writing settlement output: %s",
			err,
		))
	}

	fmt.Printf(
		"FlareLock FCC settlement complete: %s\n",
		settlementTx.Hex(),
	)
}

func validateRequest(
	request privateMatchRequest,
) error {
	if request.Version != 1 {
		return errors.New(
			"FCC request version must be 1",
		)
	}

	if request.Buy.Owner ==
		(common.Address{}) {
		return errors.New(
			"buyer owner is missing",
		)
	}

	if request.Sell.Owner ==
		(common.Address{}) {
		return errors.New(
			"seller owner is missing",
		)
	}

	if request.Buy.IntentHash ==
		(common.Hash{}) ||
		request.Sell.IntentHash ==
			(common.Hash{}) {
		return errors.New(
			"intent hashes are required",
		)
	}

	if request.Buy.DepositID ==
		(common.Hash{}) ||
		request.Sell.DepositID ==
			(common.Hash{}) {
		return errors.New(
			"deposit IDs are required",
		)
	}

	if request.Buy.Owner ==
		request.Sell.Owner {
		return errors.New(
			"self matching is not allowed",
		)
	}

	return nil
}

func decodeSettlementResult(
	data []byte,
) (decodedSettlement, error) {
	uint8Type, err :=
		abi.NewType(
			"uint8",
			"",
			nil,
		)
	if err != nil {
		return decodedSettlement{}, err
	}

	bytes32Type, err :=
		abi.NewType(
			"bytes32",
			"",
			nil,
		)
	if err != nil {
		return decodedSettlement{}, err
	}

	uint256Type, err :=
		abi.NewType(
			"uint256",
			"",
			nil,
		)
	if err != nil {
		return decodedSettlement{}, err
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

	values, err :=
		arguments.Unpack(data)
	if err != nil {
		return decodedSettlement{},
			errors.Errorf(
				"decoding FCC settlement result: %s",
				err,
			)
	}

	if len(values) != 10 {
		return decodedSettlement{},
			errors.Errorf(
				"unexpected settlement field count: %d",
				len(values),
			)
	}

	domainBytes :=
		values[1].([32]byte)

	domain :=
		strings.TrimRight(
			string(domainBytes[:]),
			"\x00",
		)

	return decodedSettlement{
		Version: values[0].(uint8),

		Domain: domain,

		MatchCommitment: common.Hash(
			values[2].([32]byte),
		),

		BuyIntentHash: common.Hash(
			values[3].([32]byte),
		),

		SellIntentHash: common.Hash(
			values[4].([32]byte),
		),

		BuyDepositID: common.Hash(
			values[5].([32]byte),
		),

		SellDepositID: common.Hash(
			values[6].([32]byte),
		),

		BaseAmountRaw: values[7].(*big.Int),

		QuoteAmountRaw: values[8].(*big.Int),

		ExecutionPriceE18: values[9].(*big.Int),
	}, nil
}

func verifySettlementMatchesRequest(
	settlement decodedSettlement,
	request privateMatchRequest,
) error {
	if settlement.Version != 1 {
		return errors.Errorf(
			"unexpected settlement version: %d",
			settlement.Version,
		)
	}

	if settlement.Domain !=
		settlementDomain {
		return errors.Errorf(
			"unexpected settlement domain: %s",
			settlement.Domain,
		)
	}

	if settlement.MatchCommitment ==
		(common.Hash{}) {
		return errors.New(
			"FCC returned an empty match commitment",
		)
	}

	if settlement.BuyIntentHash !=
		request.Buy.IntentHash {
		return errors.New(
			"FCC buyer intent hash mismatch",
		)
	}

	if settlement.SellIntentHash !=
		request.Sell.IntentHash {
		return errors.New(
			"FCC seller intent hash mismatch",
		)
	}

	if settlement.BuyDepositID !=
		request.Buy.DepositID {
		return errors.New(
			"FCC buyer deposit ID mismatch",
		)
	}

	if settlement.SellDepositID !=
		request.Sell.DepositID {
		return errors.New(
			"FCC seller deposit ID mismatch",
		)
	}

	if settlement.BaseAmountRaw.Sign() <= 0 ||
		settlement.QuoteAmountRaw.Sign() <= 0 ||
		settlement.ExecutionPriceE18.Sign() <= 0 {
		return errors.New(
			"FCC returned invalid settlement amounts",
		)
	}

	return nil
}

func newTransactor(
	s *support.Support,
) (*bind.TransactOpts, error) {
	return bind.NewKeyedTransactorWithChainID(
		s.Prv,
		s.ChainID,
	)
}

func transactAndWait(
	s *support.Support,
	contract *bind.BoundContract,
	method string,
	args ...interface{},
) (common.Hash, error) {
	opts, err :=
		newTransactor(s)
	if err != nil {
		return common.Hash{}, err
	}

	tx, err :=
		contract.Transact(
			opts,
			method,
			args...,
		)
	if err != nil {
		return common.Hash{},
			errors.Errorf(
				"%s transaction submission: %s",
				method,
				err,
			)
	}

	ctx, cancel :=
		context.WithTimeout(
			context.Background(),
			3*time.Minute,
		)
	defer cancel()

	receipt, err :=
		support.WaitMinedResilient(
			ctx,
			s.ChainClient,
			tx,
		)
	if err != nil {
		return tx.Hash(),
			errors.Errorf(
				"%s transaction %s was submitted but receipt confirmation failed: %s",
				method,
				tx.Hash().Hex(),
				err,
			)
	}

	if receipt.Status !=
		gethtypes.ReceiptStatusSuccessful {
		return common.Hash{},
			errors.Errorf(
				"%s transaction reverted: %s",
				method,
				tx.Hash().Hex(),
			)
	}

	return tx.Hash(), nil
}

func bestEffortUnlock(
	s *support.Support,
	contract *bind.BoundContract,
	depositID common.Hash,
) error {
	_, err :=
		transactAndWait(
			s,
			contract,
			"unlockDeposit",
			depositID,
		)

	return err
}

func fatal(err error) {
	fmt.Fprintln(
		os.Stderr,
		"settle-match:",
		err,
	)

	os.Exit(1)
}
