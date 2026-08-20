"""Deploy CommonsTide to StudioNet with a locally signed transaction."""
import json
import os
import sys
import time

import requests
import rlp

sys.path.insert(0, os.path.dirname(__file__))
from gl import make_client  # noqa: E402
from genlayer_py.abi import calldata  # noqa: E402
from genlayer_py.abi.transactions import serialize  # noqa: E402
from genlayer_py.chains import studionet  # noqa: E402
from genlayer_py.contracts.actions import _encode_add_transaction_data, ADDRESS_ZERO  # noqa: E402
from genlayer_py.contracts.utils import make_calldata_object  # noqa: E402

TERMINAL = {"ACCEPTED", "FINALIZED", "UNDETERMINED", "CANCELED"}
STUDIO_RPC = "https://studio.genlayer.com/api"
EXPLORER_API = "https://explorer-studio.genlayer.com/api"
ROOT = os.path.dirname(os.path.dirname(__file__))


def explorer_transactions(address):
    response = requests.get(
        EXPLORER_API + "/transactions", params={"search": address, "limit": 100},
        headers={"User-Agent": "Mozilla/5.0"}, timeout=30,
    )
    response.raise_for_status()
    body = response.json()
    return body.get("transactions") or body.get("data") or []


def next_nonce(address):
    nonces = []
    for item in explorer_transactions(address):
        raw = (((item.get("data") or {}).get("sim_config") or {}).get("signed_rollup_transaction"))
        if raw:
            fields = rlp.decode(bytes.fromhex(raw[2:] if raw.startswith("0x") else raw))
            nonces.append(int.from_bytes(fields[0], "big"))
    return max(nonces) + 1 if nonces else 0


def main():
    client, account = make_client()
    code = open(os.path.join(ROOT, "contracts", "contract.py"), encoding="utf-8").read()
    before = {item["hash"] for item in explorer_transactions(account.address)}
    payload = serialize([
        code, calldata.encode(make_calldata_object(method=None, args=[], kwargs=None)), False,
    ])
    encoded = _encode_add_transaction_data(
        client, account, ADDRESS_ZERO, studionet.default_consensus_max_rotations, payload
    )
    tx = {
        "from": account.address, "nonce": next_nonce(account.address), "data": encoded,
        "to": studionet.consensus_main_contract["address"], "value": 0,
        "gasPrice": 0, "gas": 500000, "chainId": studionet.id,
    }
    raw = "0x" + account.sign_transaction(tx).raw_transaction.hex()
    response = requests.post(
        STUDIO_RPC,
        json={"jsonrpc": "2.0", "id": 1, "method": "eth_sendRawTransaction", "params": [raw]},
        headers={"User-Agent": "Mozilla/5.0"}, timeout=45,
    )
    response.raise_for_status()
    sent = response.json()
    if sent.get("error"):
        raise RuntimeError("Deployment submission failed: " + str(sent["error"]))
    print("Deployer:", account.address)
    print("rollup tx:", sent.get("result"), flush=True)

    tx_hash = address = None
    for attempt in range(180):
        candidates = [
            item for item in explorer_transactions(account.address)
            if item.get("hash") not in before and bool((item.get("data") or {}).get("contract_code"))
        ]
        if candidates:
            record = candidates[0]
            status = str(record.get("status", ""))
            tx_hash, address = record.get("hash"), record.get("to_address")
            print(f"[{attempt}] {status} {tx_hash} {address}", flush=True)
            if status in TERMINAL:
                if status not in ("ACCEPTED", "FINALIZED"):
                    raise RuntimeError("Deployment ended " + status)
                break
        time.sleep(5)
    if not tx_hash or not address:
        raise TimeoutError("Deployment was not finalized")

    output = {
        "network": "studionet", "chainId": 61999, "tx": tx_hash,
        "address": address, "explorer": "https://explorer-studio.genlayer.com",
    }
    with open(os.path.join(ROOT, "deployment.json"), "w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
