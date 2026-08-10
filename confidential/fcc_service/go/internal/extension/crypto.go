package extension

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	teetypes "github.com/flare-foundation/tee-node/pkg/types"
)

func decryptWithTEE(signPort int, ciphertext []byte) ([]byte, error) {
	requestBody, err := json.Marshal(teetypes.DecryptRequest{
		EncryptedMessage: ciphertext,
	})
	if err != nil {
		return nil, fmt.Errorf("encoding decrypt request: %w", err)
	}

	url := fmt.Sprintf(
		"http://127.0.0.1:%d/decrypt",
		signPort,
	)

	response, err := http.Post(
		url,
		"application/json",
		bytes.NewReader(requestBody),
	)
	if err != nil {
		return nil, fmt.Errorf("calling TEE decrypt endpoint: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(
			"TEE decrypt failed with status %d",
			response.StatusCode,
		)
	}

	var decoded teetypes.DecryptResponse

	decoder := json.NewDecoder(response.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&decoded); err != nil {
		return nil, fmt.Errorf(
			"decoding TEE decrypt response: %w",
			err,
		)
	}

	if len(decoded.DecryptedMessage) == 0 {
		return nil, fmt.Errorf(
			"TEE returned an empty decrypted payload",
		)
	}

	return decoded.DecryptedMessage, nil
}
