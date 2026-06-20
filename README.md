```
COMMONSTIDE  ::  HARBOR MASTER'S TIDE ALMANAC
Instrument : semantic division of a scarce shared pool
Venue      : GenLayer Bradbury, chain 4221
Allocator  : an AI proposal under validator consensus (advisory)
Arbiter    : a deterministic conservation engine in contract code (binding)
Contract   : 0x18c47fFbA8a2602606213258f04875607EC01645
```

Let shared resources flow fairly. CommonsTide turns needs, urgencies, and
written community principles into a transparent allocation tide: an AI divides a
fixed pool across competing requesters, and a conservation engine enforces the
budget on-chain so the water never overspills. What follows is a tide almanac,
read it entry by entry the way a harbor master reads the tables before the water
moves.

Contract on the explorer:
https://explorer-bradbury.genlayer.com/address/0x18c47fFbA8a2602606213258f04875607EC01645
Deployed by tx:
https://explorer-bradbury.genlayer.com/tx/0x5ae7e5a090dd41d2a901907923a437974d815cba074547c4cd2e32919642d838

---

## TIDE TABLE I: the problem the water removes

Communities share scarce capacity: mentorship hours, treasury budget, review
slots, event seats. When demand exceeds supply, an equal split is the lazy
answer and usually the unfair one. It ignores who is blocked, who can wait, and
what the community promised to protect. Allocating fairly under scarcity is a
judgment, not an average, and that judgment is exactly what a normal contract
cannot make.

## TIDE TABLE II: why GenLayer is load-bearing

A normal contract can check a quota or a balance. It cannot read whether a
request is genuinely urgent, whether an allocation honors a written principle,
or whether a group is being quietly deprioritized. CommonsTide puts that
allocation judgment on GenLayer: the AI proposes how to divide the pool, many
validators reproduce a derived fairness reading, and they must agree before the
tide moves. The judgment is the on-chain settlement, not an off-chain opinion.

## TIDE TABLE III: the basin (a pool)

A steward opens a pool with a total amount, a protected emergency reserve, a
unit, and the community principles the allocator must honor. The spendable water
is the total minus the reserve. The reserve is never allocatable.

```
open_pool(title, unit, total, reserve, principles)
```

## TIDE TABLE IV: the islands (requests)

Each member submits a request: an amount wanted, an urgency (blocker, high,
medium, low), a minimum useful amount, and a written reason. A request can never
exceed the spendable pool, and its minimum useful amount can never exceed what
it asked for. These are deterministic guards, checked before any model runs.

```
submit_request(pool_id, name, requested, urgency, min_useful, reason)
```

## TIDE TABLE V: running the tide (the load-bearing entry)

Anyone can run an allocation round. The allocator reads the requests and the
principles and proposes one integer grant per request with a one-line reason.
Then the conservation engine runs in code, identically on every validator, after
consensus:

```python
# clamp every grant to what was asked; never award more than requested
grant = max(0, min(requested, proposed_grant))
# hard conservation: grants can never exceed the spendable pool
if granted_sum > spendable:        # scale down in code, the reserve is untouchable
    grant = grant * spendable // granted_sum
# a grant below a requester's minimum useful amount helps no one: drop to zero
if 0 < grant < min_useful:
    grant = 0
```

The engine re-derives coverage, unmet need, reserve health, and a fairness band
(`balanced`, `minor_pressure`, `needs_rebalance`, `constraint_violation`). The
model can propose anything; the arithmetic decides what is feasible. The
validators agree on the derived band, not on the raw grant numbers, because an
open-ended division never matches byte-for-byte across two runs.

```
run_allocation(pool_id)
```

## TIDE TABLE VI: the settlement

Only the steward can settle, and only a balanced or minor-pressure tide whose
reserve is intact. A `needs_rebalance` or a breached reserve is refused in code,
no matter what the model said. On settlement the contract mints a continuity
proof over the settled division.

```
settle_pool(pool_id)   ->  proofHash
```

## TIDE TABLE VII: a worked tide (verified on-chain)

Pool: 80 mentorship hours, 16 reserved, 64 spendable. Principles: prioritize
blocked work, protect the reserve, do not overload, delay the flexible.

```
Builder A      blocker  wants 6   ->  granted 6   (cannot ship while blocked)
Docs           high     wants 3   ->  granted 3   (release depends on it)
Newcomer       medium   wants 4   ->  granted 4   (onboarding set-aside)
Builder B      medium   wants 10  ->  granted 3   (useful but flexible; delayed)

band: minor_pressure   reserve: intact   coverage: 69%   proof: 0x56d42986e5ea233e
```

Builder B, the flexible request, absorbs the scarcity instead of the blocked
contributor. The reserve is never touched. That is the tide working.

## TIDE TABLE VIII: reading the contract yourself

```
get_pools(start)     the shoreline, newest first
get_pool(id)         one pool with its requests and latest allocation
get_allocation(id)   the current allocation result
get_stats()          totals: pools, rounds, settled
```

## TIDE TABLE IX: running the harbor locally

```
# read the live contract, no wallet needed
cd frontend
npm install
npm run dev            # open the harbor, browse real pools from the chain

# to write (open a pool, add requests, run a tide, settle) connect a wallet on
# Bradbury and claim test GEN from the faucet first

# redeploy your own instance, or re-verify the full lifecycle
cd ../scripts
python deploy.py            # deploy the contract, writes deployment.json
python verify_full.py       # open, request, allocate, settle, prove on-chain
```

## TIDE TABLE X: the deterministic guards and backstops

The validator does not check shape, it checks substance. Removing the model and
returning a constant would still be rejected: required fields and ranges are
guarded before the model, the conservation engine re-runs after consensus, the
reserve floor is enforced in code, and settlement is gated by the derived band
and the reserve being intact. The arithmetic, not the prompt, decides.

```
Mechanic   : a scarce-pool DIVISION machine (not a text-scoring judge)
Stack      : Python GenVM contract + React/Vite SPA on genlayer-js
Hosting    : Cloudflare Pages, static, reads chain views, writes via wallet
No deposits, no value transfer. Members pay only the network fee.
```
