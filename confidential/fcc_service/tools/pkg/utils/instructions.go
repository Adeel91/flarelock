package utils

import (
	"context"
	"math/big"
	"time"

	"extension-scaffold/tools/pkg/contracts/flarelock"
	"extension-scaffold/tools/pkg/fccutils"
	"extension-scaffold/tools/pkg/support"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/pkg/errors"
)

func DeployInstructionSender(s *support.Support) (common.Address, *flarelock.FlareLockInstructionSender, error) {
	opts, err := bind.NewKeyedTransactorWithChainID(s.Prv, s.ChainID)
	if err != nil {
		return common.Address{}, nil, errors.Errorf("failed to create transactor: %s", err)
	}

	// Both registry args are the FlareTeeManager diamond proxy: the diamond
	// routes ExtensionManager and MachineManager calls to the right facets.
	address, tx, contract, err := flarelock.DeployFlareLockInstructionSender(
		opts, s.ChainClient, s.Addresses.FlareTeeManager, s.Addresses.FlareTeeManager,
	)
	if err != nil {
		return common.Address{}, nil, errors.Errorf("failed to deploy contract: %s", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	receipt, err := bind.WaitMined(ctx, s.ChainClient, tx)
	if err != nil {
		return common.Address{}, nil, errors.Errorf("deployment tx not mined within 2 minutes (tx: %s): %s", tx.Hash().Hex(), err)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		return common.Address{}, nil, errors.New("contract deployment failed")
	}

	return address, contract, nil
}

func SetExtensionId(s *support.Support, instructionSenderAddress common.Address) error {
	sender, err := flarelock.NewFlareLockInstructionSender(instructionSenderAddress, s.ChainClient)
	if err != nil {
		return errors.Errorf("failed to bind contract: %s", err)
	}

	opts, err := bind.NewKeyedTransactorWithChainID(s.Prv, s.ChainID)
	if err != nil {
		return errors.Errorf("failed to create transactor: %s", err)
	}

	tx, err := sender.SetExtensionId(opts)
	if err != nil {
		reason := fccutils.DecodeRevertReason(err)
		if reason == "" {
			parsed, _ := flarelock.FlareLockInstructionSenderMetaData.GetAbi()
			if parsed != nil {
				callData, packErr := parsed.Pack("setExtensionId")
				if packErr == nil {
					from := crypto.PubkeyToAddress(s.Prv.PublicKey)
					reason = fccutils.SimulateAndDecodeRevert(
						s.ChainClient, from, instructionSenderAddress, nil, callData,
					)
				}
			}
		}
		if reason != "" {
			return errors.Errorf("failed to call setExtensionId: %s (revert reason: %s)", err, reason)
		}
		return errors.Errorf("failed to call setExtensionId: %s", err)
	}

	receipt, err := bind.WaitMined(context.Background(), s.ChainClient, tx)
	if err != nil {
		return errors.Errorf("failed waiting for transaction: %s", err)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		parsed, _ := flarelock.FlareLockInstructionSenderMetaData.GetAbi()
		if parsed != nil {
			callData, packErr := parsed.Pack("setExtensionId")
			if packErr == nil {
				from := crypto.PubkeyToAddress(s.Prv.PublicKey)
				reason := fccutils.SimulateAndDecodeRevert(
					s.ChainClient, from, instructionSenderAddress, nil, callData,
				)
				if reason != "" {
					return errors.Errorf("setExtensionId transaction failed (revert reason: %s)", reason)
				}
			}
		}
		return errors.New("setExtensionId transaction failed")
	}

	return nil
}

func SendConfidentialMatch(
	s *support.Support,
	instructionSenderAddress common.Address,
	teeID common.Address,
	encryptedPayload []byte,
) (common.Hash, common.Hash, error) {
	sender, err := flarelock.NewFlareLockInstructionSender(
		instructionSenderAddress,
		s.ChainClient,
	)
	if err != nil {
		return common.Hash{}, common.Hash{}, errors.Errorf(
			"failed to bind contract: %s",
			err,
		)
	}

	opts, err := bind.NewKeyedTransactorWithChainID(
		s.Prv,
		s.ChainID,
	)
	if err != nil {
		return common.Hash{}, common.Hash{}, errors.Errorf(
			"failed to create transactor: %s",
			err,
		)
	}

	opts.Value = big.NewInt(1000000)

	tx, err := sender.SendConfidentialMatch(
		opts,
		teeID,
		encryptedPayload,
	)
	if err != nil {
		return common.Hash{}, common.Hash{}, errors.Errorf(
			"failed to send confidential instruction: %s",
			err,
		)
	}

	receipt, err := bind.WaitMined(
		context.Background(),
		s.ChainClient,
		tx,
	)
	if err != nil {
		return common.Hash{}, common.Hash{}, errors.Errorf(
			"failed waiting for transaction: %s",
			err,
		)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		return common.Hash{}, common.Hash{}, errors.Errorf(
			"transaction failed with status: %d",
			receipt.Status,
		)
	}

	if len(receipt.Logs) == 0 {
		return common.Hash{}, common.Hash{}, errors.New(
			"no logs found in receipt",
		)
	}

	var instructionID common.Hash

	for _, log := range receipt.Logs {
		event, parseErr :=
			s.TeeVerification.ParseTeeInstructionsSent(
				*log,
			)

		if parseErr == nil {
			instructionID =
				event.InstructionId

			break
		}
	}

	if instructionID == (common.Hash{}) {
		return common.Hash{}, common.Hash{}, errors.New(
			"TeeInstructionsSent event not found",
		)
	}

	return instructionID, receipt.TxHash, nil
}
