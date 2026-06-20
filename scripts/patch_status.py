"""Patch the SDK status maps so status code 14 (ACTIVATED on testnet, unknown to
this installed genlayer_py) does not crash decode. Import before using the
client's transaction helpers."""
from genlayer_py.types import transactions as _t


class _Activated:
    value = "ACTIVATED"


def apply():
    m = _t.TRANSACTION_STATUS_NUMBER_TO_NAME
    if "14" not in m:
        m["14"] = _Activated()
    if 14 not in m:
        m[14] = _Activated()
