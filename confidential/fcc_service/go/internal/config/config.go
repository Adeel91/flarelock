package config

import (
	"os"
	"strconv"
	"time"
)

const (
	Version = "0.2.0"

	OPTypeFlareLock         = "FLARELOCK_MATCH"
	OPCommandVerifyAndMatch = "VERIFY_AND_MATCH"

	TimeoutShutdown = 5 * time.Second
)

var (
	ExtensionPort = 8080
	SignPort      = 9090
)

func init() {
	if ep := os.Getenv("EXTENSION_PORT"); ep != "" {
		if v, err := strconv.Atoi(ep); err == nil {
			ExtensionPort = v
		}
	}

	if sp := os.Getenv("SIGN_PORT"); sp != "" {
		if v, err := strconv.Atoi(sp); err == nil {
			SignPort = v
		}
	}
}
