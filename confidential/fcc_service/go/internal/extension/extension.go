package extension

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"extension-scaffold/internal/config"
	"extension-scaffold/pkg/types"

	"github.com/flare-foundation/go-flare-common/pkg/tee/instruction"
	teetypes "github.com/flare-foundation/tee-node/pkg/types"
	teeutils "github.com/flare-foundation/tee-node/pkg/utils"

	"github.com/flare-foundation/tee-node/pkg/processorutils"
)

type Extension struct {
	mu sync.RWMutex

	Server *http.Server

	signPort int

	matchesProcessed uint64
	lastCommitment   [32]byte
}

func New(
	extensionPort,
	signPort int,
) *Extension {
	e := &Extension{
		signPort: signPort,
	}

	mux := http.NewServeMux()

	mux.HandleFunc(
		"GET /state",
		e.stateHandler,
	)

	mux.HandleFunc(
		"POST /action",
		e.actionHandler,
	)

	e.Server = &http.Server{
		Addr: fmt.Sprintf(
			":%d",
			extensionPort,
		),
		Handler: mux,
	}

	return e
}

func (e *Extension) stateHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	e.mu.RLock()

	stateResponse := types.StateResponse{
		StateVersion: teeutils.ToHash(
			config.Version,
		),
		State: types.State{
			MatchesProcessed: e.matchesProcessed,
			LastCommitment:   e.lastCommitment,
		},
	}

	e.mu.RUnlock()

	if err := json.NewEncoder(w).Encode(
		stateResponse,
	); err != nil {
		http.Error(
			w,
			fmt.Sprintf(
				"sending response: %v",
				err,
			),
			http.StatusInternalServerError,
		)

		return
	}
}

func (e *Extension) processAction(
	action teetypes.Action,
) (int, []byte) {
	dataFixed, err :=
		processorutils.Parse[instruction.DataFixed](action.Data.Message)

	if err != nil {
		return http.StatusBadRequest,
			[]byte(
				fmt.Sprintf(
					"decoding fixed data: %v",
					err,
				),
			)
	}

	if dataFixed.OPType !=
		teeutils.ToHash(
			config.OPTypeFlareLock,
		) {
		return http.StatusNotImplemented,
			[]byte(
				fmt.Sprintf(
					"unsupported op type: received %s, expected %s (%s)",
					dataFixed.OPType.Hex(),
					teeutils.ToHash(
						config.OPTypeFlareLock,
					).Hex(),
					config.OPTypeFlareLock,
				),
			)
	}

	if dataFixed.OPCommand !=
		teeutils.ToHash(
			config.OPCommandVerifyAndMatch,
		) {
		return http.StatusNotImplemented,
			[]byte(
				fmt.Sprintf(
					"unsupported op command: received %s, expected %s (%s)",
					dataFixed.OPCommand.Hex(),
					teeutils.ToHash(
						config.OPCommandVerifyAndMatch,
					).Hex(),
					config.OPCommandVerifyAndMatch,
				),
			)
	}

	result := e.processVerifyAndMatch(
		action,
		dataFixed,
	)

	body, _ := json.Marshal(result)

	return http.StatusOK, body
}

func (e *Extension) processVerifyAndMatch(
	action teetypes.Action,
	df *instruction.DataFixed,
) teetypes.ActionResult {
	if len(df.OriginalMessage) == 0 {
		return buildResult(
			action,
			df,
			nil,
			0,
			fmt.Errorf(
				"encrypted payload is required",
			),
		)
	}

	plaintext, err := decryptWithTEE(
		e.signPort,
		df.OriginalMessage,
	)
	if err != nil {
		return buildResult(
			action,
			df,
			nil,
			0,
			fmt.Errorf(
				"decrypting confidential match payload: %w",
				err,
			),
		)
	}

	var request types.PrivateMatchRequest

	decoder := json.NewDecoder(
		bytes.NewReader(plaintext),
	)

	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&request); err != nil {
		return buildResult(
			action,
			df,
			nil,
			0,
			fmt.Errorf(
				"decoding confidential match request: %w",
				err,
			),
		)
	}

	match, err := validateAndMatch(
		request,
		unixNow(),
	)
	if err != nil {
		return buildResult(
			action,
			df,
			nil,
			0,
			err,
		)
	}

	data, err := encodeSettlementResult(
		match.MatchCommitment,
		match.BuyIntentHash,
		match.SellIntentHash,
		match.BuyDepositID,
		match.SellDepositID,
		match.BaseAmountRaw,
		match.QuoteAmountRaw,
		match.ExecutionPriceE18,
	)
	if err != nil {
		return buildResult(
			action,
			df,
			nil,
			0,
			fmt.Errorf(
				"encoding settlement result: %w",
				err,
			),
		)
	}

	e.mu.Lock()
	e.matchesProcessed++
	e.lastCommitment =
		match.MatchCommitment
	e.mu.Unlock()

	return buildResult(
		action,
		df,
		data,
		1,
		nil,
	)
}
