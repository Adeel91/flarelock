package support

import (
	"context"
	"fmt"
	"time"

	gethtypes "github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// WaitMinedResilient waits for an already-submitted transaction.
//
// Receipt lookup failures such as RPC 429 responses are retried with
// exponential backoff. The transaction itself is never resubmitted.
func WaitMinedResilient(
	ctx context.Context,
	client *ethclient.Client,
	tx *gethtypes.Transaction,
) (*gethtypes.Receipt, error) {
	delay := 2 * time.Second
	maxDelay := 8 * time.Second

	var lastErr error

	for {
		receipt, err := client.TransactionReceipt(
			ctx,
			tx.Hash(),
		)
		if err == nil {
			return receipt, nil
		}

		lastErr = err

		select {
		case <-ctx.Done():
			return nil, fmt.Errorf(
				"transaction %s receipt not confirmed before deadline; last RPC error: %v: %w",
				tx.Hash().Hex(),
				lastErr,
				ctx.Err(),
			)

		case <-time.After(delay):
		}

		if delay < maxDelay {
			delay *= 2

			if delay > maxDelay {
				delay = maxDelay
			}
		}
	}
}
