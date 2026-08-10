package utils

import (
	"encoding/json"

	"extension-scaffold/tools/pkg/fccutils"

	"github.com/ethereum/go-ethereum/common"
	teetypes "github.com/flare-foundation/tee-node/pkg/types"
	teeutils "github.com/flare-foundation/tee-node/pkg/utils"
	"github.com/pkg/errors"
)

type ConfidentialTarget struct {
	TeeID     common.Address
	PublicKey teetypes.PublicKey
}

func ResolveConfidentialTarget(
	proxyURL string,
) (*ConfidentialTarget, error) {
	info, err := fccutils.TeeInfo(proxyURL)
	if err != nil {
		return nil, errors.Errorf(
			"fetching TEE info: %s",
			err,
		)
	}

	teeID, _, err := fccutils.TeeProxyId(info)
	if err != nil {
		return nil, errors.Errorf(
			"deriving TEE id: %s",
			err,
		)
	}

	if info.TeeInfo.PublicKey !=
		info.MachineData.PublicKey {
		return nil, errors.New(
			"TEE info public key does not match registered machine data",
		)
	}

	return &ConfidentialTarget{
		TeeID:     teeID,
		PublicKey: info.TeeInfo.PublicKey,
	}, nil
}

func EncryptForTEE(
	target *ConfidentialTarget,
	payload any,
) ([]byte, error) {
	plaintext, err := json.Marshal(payload)
	if err != nil {
		return nil, errors.Errorf(
			"encoding confidential payload: %s",
			err,
		)
	}

	publicKey, err := teetypes.ParsePubKey(
		target.PublicKey,
	)
	if err != nil {
		return nil, errors.Errorf(
			"parsing TEE public key: %s",
			err,
		)
	}

	ciphertext, err := teeutils.Encrypt(
		plaintext,
		publicKey,
	)
	if err != nil {
		return nil, errors.Errorf(
			"encrypting confidential payload: %s",
			err,
		)
	}

	if len(ciphertext) == 0 {
		return nil, errors.New(
			"TEE encryption returned empty ciphertext",
		)
	}

	return ciphertext, nil
}
