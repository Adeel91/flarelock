package types

import "github.com/ethereum/go-ethereum/common"

type ConfidentialMatchEnvelope struct {
	EncryptedPayload []byte `json:"encryptedPayload"`
}

type PrivateIntent struct {
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

type PrivateMatchRequest struct {
	Version uint8 `json:"version"`

	Buy  PrivateIntent `json:"buy"`
	Sell PrivateIntent `json:"sell"`
}

type MatchResult struct {
	Version uint8 `json:"version"`

	MatchCommitment common.Hash `json:"matchCommitment"`

	BuyIntentHash  common.Hash `json:"buyIntentHash"`
	SellIntentHash common.Hash `json:"sellIntentHash"`

	BuyDepositID  common.Hash `json:"buyDepositId"`
	SellDepositID common.Hash `json:"sellDepositId"`

	BaseAmountRaw     string `json:"baseAmountRaw"`
	QuoteAmountRaw    string `json:"quoteAmountRaw"`
	ExecutionPriceE18 string `json:"executionPriceE18"`

	Market string `json:"market"`
}

type State struct {
	MatchesProcessed uint64      `json:"matchesProcessed"`
	LastCommitment   common.Hash `json:"lastCommitment"`
}

type StateResponse struct {
	StateVersion common.Hash `json:"stateVersion"`
	State        State       `json:"state"`
}
