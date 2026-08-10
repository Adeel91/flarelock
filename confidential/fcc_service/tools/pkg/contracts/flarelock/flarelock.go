//go:generate go run github.com/ethereum/go-ethereum/cmd/abigen --abi=FlareLockInstructionSender.abi --bin=FlareLockInstructionSender.bin --pkg=flarelock --type=FlareLockInstructionSender --out=autogen.go

package flarelock
