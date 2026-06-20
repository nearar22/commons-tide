"""Deploy the CommonsTide contract to Bradbury. Polls manually via the patched
SDK decode so status code 14 does not crash."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import patch_status  # noqa: E402
patch_status.apply()
from gl import make_client  # noqa: E402

TERMINAL = {"ACCEPTED", "FINALIZED", "UNDETERMINED", "CANCELED"}

CONTRACT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "contracts", "contract.py",
)


def main():
    client, account = make_client()
    print("Deployer:", account.address)
    code = open(CONTRACT_PATH, "r", encoding="utf-8").read()
    print("Deploying contract.py (", len(code), "bytes )...")
    tx_hash = client.deploy_contract(code=code, args=[])
    print("deploy tx:", tx_hash)

    addr = None
    exec_name = None
    for i in range(180):
        try:
            t = client.get_transaction(transaction_hash=tx_hash)
        except Exception as e:
            print(f"[{i}] decode err: {e}", flush=True)
            time.sleep(8)
            continue
        name = t.get("status_name") or t.get("status") if isinstance(t, dict) else None
        addr = t.get("recipient") if isinstance(t, dict) else None
        exec_name = t.get("tx_execution_result_name") if isinstance(t, dict) else None
        print(f"[{i}] status={name} recipient={addr} exec={exec_name}", flush=True)
        if str(name) in TERMINAL:
            break
        time.sleep(8)

    print("execution:", exec_name)
    print("contract address:", addr)
    root = os.path.dirname(os.path.dirname(__file__))
    out = {"tx": str(tx_hash), "address": str(addr)}
    with open(os.path.join(root, "deployment.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print("wrote deployment.json")


if __name__ == "__main__":
    main()
