#!/usr/bin/env python3
import json
from pathlib import Path

HERE = Path(__file__).parent
ACTION_ID = "0x" + "11" * 32
TEE_ID = "0x" + "22" * 20
VERSION = "0.2.0"

def b32(s):
    return "0x" + s.encode().ljust(32, b"\0").hex()

def hx(b):
    return "0x" + b.hex()

def action(op_type, op_command, original=b""):
    fixed = {
        "instructionId": ACTION_ID,
        "teeId": TEE_ID,
        "timestamp": 1700000000,
        "rewardEpochId": 42,
        "opType": b32(op_type),
        "opCommand": b32(op_command),
        "cosigners": [],
        "cosignersThreshold": 0,
        "originalMessage": hx(original),
        "additionalFixedMessage": "0x",
    }
    return {
        "data": {
            "id": ACTION_ID,
            "type": "instruction",
            "submissionTag": "submit",
            "message": hx(json.dumps(fixed).encode()),
        },
        "additionalVariableMessages": [],
        "timestamps": [],
        "additionalActionData": "0x",
        "signatures": [],
    }

fixtures = [
    {
        "name": "01-missing-ciphertext",
        "request": {"method": "POST", "path": "/action",
                    "body": action("FLARELOCK_MATCH", "VERIFY_AND_MATCH")},
        "expect": {"status": 200, "json_subset": {"status": 0, "data": "0x"},
                   "log_prefix": "error: encrypted payload is required"},
    },
    {
        "name": "02-unknown-op-type",
        "request": {"method": "POST", "path": "/action",
                    "body": action("WRONG_TYPE", "VERIFY_AND_MATCH", b"x")},
        "expect": {"status": 501, "text_contains": "unsupported op type"},
    },
    {
        "name": "03-unknown-op-command",
        "request": {"method": "POST", "path": "/action",
                    "body": action("FLARELOCK_MATCH", "WRONG_COMMAND", b"x")},
        "expect": {"status": 501, "text_contains": "unsupported op command"},
    },
    {
        "name": "04-invalid-action-json",
        "request": {"method": "POST", "path": "/action", "raw_body": "not json"},
        "expect": {"status": 400},
    },
    {
        "name": "05-message-not-datafixed",
        "request": {
            "method": "POST", "path": "/action",
            "body": {"data": {"id": ACTION_ID, "type": "instruction",
                              "submissionTag": "submit",
                              "message": hx(b"not json")}},
        },
        "expect": {"status": 400},
    },
    {
        "name": "06-get-action-not-allowed",
        "request": {"method": "GET", "path": "/action"},
        "expect": {"status": 405},
    },
    {
        "name": "07-unknown-path",
        "request": {"method": "GET", "path": "/does-not-exist"},
        "expect": {"status": 404},
    },
    {
        "name": "08-get-state",
        "request": {"method": "GET", "path": "/state"},
        "expect": {
            "status": 200,
            "json": {
                "stateVersion": b32(VERSION),
                "state": {
                    "matchesProcessed": 0,
                    "lastCommitment": "0x" + "00" * 32,
                },
            },
        },
    },
]

for f in fixtures:
    (HERE / f"{f['name']}.json").write_text(json.dumps(f, indent=2) + "\n")

for old in HERE.glob("*.json"):
    if old.name == "index.json":
        continue
    if old.stem not in {f["name"] for f in fixtures}:
        old.unlink()

(HERE / "index.json").write_text(json.dumps({
    "fixtures": [f["name"] for f in fixtures]
}, indent=2) + "\n")

print("Generated", len(fixtures), "FlareLock conformance fixtures.")
