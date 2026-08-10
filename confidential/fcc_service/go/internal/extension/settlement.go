package extension

import (
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

const settlementDomain = "FLARELOCK_SETTLEMENT"

func encodeSettlementResult(
	matchCommitment common.Hash,
	buyIntentHash common.Hash,
	sellIntentHash common.Hash,
	buyDepositID common.Hash,
	sellDepositID common.Hash,
	baseAmountRaw string,
	quoteAmountRaw string,
	executionPriceE18 string,
) ([]byte, error) {
	uint8Type, err := abi.NewType("uint8", "", nil)
	if err != nil {
		return nil, err
	}

	bytes32Type, err := abi.NewType("bytes32", "", nil)
	if err != nil {
		return nil, err
	}

	uint256Type, err := abi.NewType("uint256", "", nil)
	if err != nil {
		return nil, err
	}

	baseAmount, ok := new(big.Int).SetString(baseAmountRaw, 10)
	if !ok || baseAmount.Sign() <= 0 {
		return nil, fmt.Errorf("invalid base amount")
	}

	quoteAmount, ok := new(big.Int).SetString(quoteAmountRaw, 10)
	if !ok || quoteAmount.Sign() <= 0 {
		return nil, fmt.Errorf("invalid quote amount")
	}

	executionPrice, ok := new(big.Int).SetString(executionPriceE18, 10)
	if !ok || executionPrice.Sign() <= 0 {
		return nil, fmt.Errorf("invalid execution price")
	}

	var domain [32]byte
	copy(domain[:], []byte(settlementDomain))

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

	return arguments.Pack(
		uint8(1),
		domain,
		matchCommitment,
		buyIntentHash,
		sellIntentHash,
		buyDepositID,
		sellDepositID,
		baseAmount,
		quoteAmount,
		executionPrice,
	)
}

type decodedSettlementResult struct {
	Version           uint8
	Domain            [32]byte
	MatchCommitment   common.Hash
	BuyIntentHash     common.Hash
	SellIntentHash    common.Hash
	BuyDepositID      common.Hash
	SellDepositID     common.Hash
	BaseAmountRaw     *big.Int
	QuoteAmountRaw    *big.Int
	ExecutionPriceE18 *big.Int
}

func decodeSettlementResult(data []byte) (decodedSettlementResult, error) {
	uint8Type, err := abi.NewType("uint8", "", nil)
	if err != nil {
		return decodedSettlementResult{}, err
	}

	bytes32Type, err := abi.NewType("bytes32", "", nil)
	if err != nil {
		return decodedSettlementResult{}, err
	}

	uint256Type, err := abi.NewType("uint256", "", nil)
	if err != nil {
		return decodedSettlementResult{}, err
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

	values, err := arguments.Unpack(data)
	if err != nil {
		return decodedSettlementResult{}, fmt.Errorf(
			"decoding settlement result: %w",
			err,
		)
	}

	if len(values) != 10 {
		return decodedSettlementResult{}, fmt.Errorf(
			"unexpected settlement field count: %d",
			len(values),
		)
	}

	return decodedSettlementResult{
		Version:           values[0].(uint8),
		Domain:            values[1].([32]byte),
		MatchCommitment:   common.Hash(values[2].([32]byte)),
		BuyIntentHash:     common.Hash(values[3].([32]byte)),
		SellIntentHash:    common.Hash(values[4].([32]byte)),
		BuyDepositID:      common.Hash(values[5].([32]byte)),
		SellDepositID:     common.Hash(values[6].([32]byte)),
		BaseAmountRaw:     values[7].(*big.Int),
		QuoteAmountRaw:    values[8].(*big.Int),
		ExecutionPriceE18: values[9].(*big.Int),
	}, nil
}
