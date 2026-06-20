"""Shared GenLayer helpers: load the funded key from .env, build a client, and
read views via the raw provider (genlayer_py read_contract is broken on Bradbury
because gen_call returns a dict, not a hex string)."""
import os
import urllib.request

from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

import genlayer_py  # noqa
try:
    _opener = urllib.request.build_opener()
    _opener.addheaders = [("User-Agent", "Mozilla/5.0")]
    urllib.request.install_opener(_opener)
except Exception:
    pass


def load_pk() -> str:
    pk = os.environ.get("GENLAYER_PRIVATE_KEY", "").strip()
    if not pk:
        root = os.path.join(os.path.dirname(__file__), "..", "..")
        env_path = os.path.join(root, ".env")
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GENLAYER_PRIVATE_KEY"):
                    pk = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not pk:
        raise SystemExit("GENLAYER_PRIVATE_KEY not found")
    if not pk.startswith("0x"):
        pk = "0x" + pk
    return pk


def make_client():
    account = create_account(account_private_key=load_pk())
    client = create_client(chain=testnet_bradbury, account=account)
    return client, account


def read_view(client, account, addr, fn, args=None):
    from genlayer_py.abi import calldata
    from genlayer_py.abi.transactions import serialize
    from genlayer_py.contracts.utils import make_calldata_object
    import eth_utils

    data = [
        calldata.encode(make_calldata_object(method=fn, args=args or [], kwargs=None)),
        b"\x00",
    ]
    res = client.provider.make_request(
        method="gen_call",
        params=[{
            "type": "read",
            "to": addr,
            "from": account.address,
            "data": serialize(data),
            "transaction_hash_variant": "latest-nonfinal",
        }],
    )["result"]
    hex_data = res["data"] if isinstance(res, dict) else res
    return calldata.decode(eth_utils.hexadecimal.decode_hex("0x" + hex_data))
