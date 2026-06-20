"""Full on-chain lifecycle: open a pool, submit competing requests, run the AI
allocation round (the conservation engine enforces the budget), and settle.
Proves the division mechanic end to end on Bradbury."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import patch_status  # noqa: E402
patch_status.apply()
from gl import make_client, read_view  # noqa: E402

TERMINAL = {"ACCEPTED", "FINALIZED", "UNDETERMINED", "CANCELED"}


def wait(client, tx_hash, label):
    for i in range(120):
        try:
            t = client.get_transaction(transaction_hash=tx_hash)
        except Exception as e:
            print(f"  [{label}:{i}] decode err: {e}", flush=True)
            time.sleep(8)
            continue
        name = t.get("status_name") or t.get("status") if isinstance(t, dict) else None
        exec_name = t.get("tx_execution_result_name") if isinstance(t, dict) else None
        print(f"  [{label}:{i}] status={name} exec={exec_name}", flush=True)
        if str(name) in TERMINAL:
            return t
        time.sleep(8)
    return None


def main():
    root = os.path.dirname(os.path.dirname(__file__))
    addr = json.load(open(os.path.join(root, "deployment.json")))["address"]
    client, account = make_client()
    print("Contract:", addr)
    print("Steward:", account.address)

    principles = (
        "Prioritize blocked work. Reserve support for newcomers. Do not overload any one person. "
        "Keep the emergency reserve protected. Reward contributors who help others. Delay flexible "
        "low-priority requests rather than rejecting them."
    )
    print("\n1) open_pool (80 mentorship hours, 16 reserved)")
    tx = client.write_contract(
        address=addr, function_name="open_pool",
        args=["Builder Mentorship Tide", "hours", 80, 16, principles],
    )
    wait(client, tx, "open")
    pools = read_view(client, account, addr, "get_pools", [0])
    pool_id = pools[0]["id"]
    print("  pool_id:", pool_id, "spendable:", pools[0]["spendable"])

    reqs = [
        ["Builder A", 6, "blocker", 4, "Contract integration is blocked; cannot ship without 4 to 6 hours of pairing."],
        ["Builder B", 10, "medium", 3, "UI polish before the demo. Flexible, can wait if needed."],
        ["Docs Contributor", 3, "high", 3, "Validator docs must be clarified before the release this week."],
        ["Newcomer E", 4, "medium", 2, "First contribution, needs onboarding help to get started."],
    ]
    print("\n2) submit_request x", len(reqs))
    for r in reqs:
        tx = client.write_contract(
            address=addr, function_name="submit_request",
            args=[pool_id, r[0], r[1], r[2], r[3], r[4]],
        )
        wait(client, tx, "req-" + r[0].split()[0])

    print("\n3) run_allocation (AI divides the pool, engine enforces the budget)")
    tx = client.write_contract(address=addr, function_name="run_allocation", args=[pool_id])
    wait(client, tx, "alloc")
    alloc = read_view(client, account, addr, "get_allocation", [pool_id])
    alloc = _plain(alloc)
    print("  band:", alloc.get("band"), "grantedSum:", alloc.get("grantedSum"),
          "spendable:", alloc.get("spendable"), "reserveIntact:", alloc.get("reserveIntact"),
          "coverage:", alloc.get("coverage"))
    for row in alloc.get("rows", []):
        print("   ", row.get("name"), "wanted", row.get("requested"), "got", row.get("granted"),
              "(", row.get("urgency"), ")")

    print("\n4) settle_pool (gated in code by reserve + band)")
    tx = client.write_contract(address=addr, function_name="settle_pool", args=[pool_id])
    wait(client, tx, "settle")
    pool = _plain(read_view(client, account, addr, "get_pool", [pool_id]))
    print("  status:", pool.get("status"), "proofHash:", pool.get("proofHash"))

    out = {
        "address": addr, "poolId": pool_id, "status": pool.get("status"),
        "band": alloc.get("band"), "grantedSum": alloc.get("grantedSum"),
        "spendable": alloc.get("spendable"), "reserveIntact": alloc.get("reserveIntact"),
        "proofHash": pool.get("proofHash"),
    }
    with open(os.path.join(root, "scripts", "verify_full_out.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print("\nwrote verify_full_out.json:", json.dumps(out))


def _plain(v):
    if hasattr(v, "items") and not isinstance(v, dict):
        return {k: _plain(val) for k, val in v.items()}
    if isinstance(v, dict):
        return {k: _plain(val) for k, val in v.items()}
    if isinstance(v, list):
        return [_plain(x) for x in v]
    return v


if __name__ == "__main__":
    main()
