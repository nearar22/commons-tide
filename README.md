# CommonsTide

### A semantic allocator for scarce community resources

[![GenLayer](https://img.shields.io/badge/GenLayer-Intelligent_Contract-155e75)](https://genlayer.com)
[![Contract tests](https://img.shields.io/badge/contract_tests-4_passing-15803d)](#verification)
[![Frontend tests](https://img.shields.io/badge/frontend_tests-2_passing-15803d)](#verification)

> A community writes its principles. Members explain what they need. Validators
> audit an exact allocation, while contract code guarantees that the protected
> reserve is never spent.

CommonsTide turns a fixed pool into an auditable allocation rather than a race,
an equal split, or an administrator's opaque spreadsheet. It is designed for
mentorship hours, grants, review slots, event seats, shared compute, and any
resource where urgency and written policy matter as much as arithmetic.

| Layer | Responsibility | Trust model |
|---|---|---|
| AI allocator | Proposes one grant and reason per request | Advisory |
| GenLayer validators | Audit the exact vector against principles and evidence | Semantic consensus |
| Conservation engine | Enforces spendable total, reserve, request caps, and minimum-useful amounts | Deterministic |
| Steward | Settles only a feasible reviewed allocation | Role-gated |

**Live on GenLayer Studio.**

- App: [commons-tide.pages.dev](https://commons-tide.pages.dev)
- Contract: [`0xe305...1DcC`](https://explorer-studio.genlayer.com/address/0xe305bE1b6600f2c51D7Bc226f79B88D30b4A1DcC)
- Deployment: [`0xc1d9...9ffd`](https://explorer-studio.genlayer.com/tx/0xc1d97373686942c99093ad1883e9dd740fa644f1919bcd9fb40b1fa6ca259ffd)
- Verified pool: `pool-1` · settled · reserve intact

---

## The tide at a glance

```text
open pool -> collect requests -> semantic allocation audit
          -> deterministic conservation -> steward settlement -> proof hash
```

---

## Tide Table I: the problem the water removes

Communities share scarce capacity: mentorship hours, treasury budget, review
slots, event seats. When demand exceeds supply, an equal split is the lazy
answer and usually the unfair one. It ignores who is blocked, who can wait, and
what the community promised to protect. Allocating fairly under scarcity is a
judgment, not an average, and that judgment is exactly what a normal contract
cannot make.

## Tide Table II: why GenLayer is load-bearing

A normal contract can check a quota or a balance. It cannot read whether a
request is genuinely urgent, whether an allocation honors a written principle,
or whether a group is being quietly deprioritized. CommonsTide puts that
allocation judgment on GenLayer: the AI proposes an exact division, validators
audit that same vector against every principle, urgency, amount, minimum-useful
constraint, and reason, and only then does the deterministic engine run.

## Tide Table III: the basin (a pool)

A steward opens a pool with a total amount, a protected emergency reserve, a
unit, and the community principles the allocator must honor. The spendable water
is the total minus the reserve. The reserve is never allocatable.

```
open_pool(title, unit, total, reserve, principles)
```

## Tide Table IV: the islands (requests)

Each member submits a request: an amount wanted, an urgency (blocker, high,
medium, low), a minimum useful amount, and a written reason. A request can never
exceed the spendable pool, and its minimum useful amount can never exceed what
it asked for. These are deterministic guards, checked before any model runs.

```
submit_request(pool_id, name, requested, urgency, min_useful, reason)
```

## Tide Table V: running the tide (the load-bearing entry)

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
validators audit the leader's exact allocation for substantive fairness while
the arithmetic independently guarantees feasibility and reserve conservation.

```
run_allocation(pool_id)
```

## Tide Table VI: the settlement

Only the steward can settle, and only a balanced or minor-pressure tide whose
reserve is intact. A `needs_rebalance` or a breached reserve is refused in code,
no matter what the model said. On settlement the contract mints a continuity
proof over the settled division.

```
settle_pool(pool_id)   ->  proofHash
```

## Tide Table VII: a worked tide (legacy demonstration)

Pool: 80 mentorship hours, 16 reserved, 64 spendable. Principles: prioritize
blocked work, protect the reserve, do not overload, delay the flexible.

```
Builder A      blocker  wants 6   ->  granted 6   (cannot ship while blocked)
Docs           high     wants 3   ->  granted 3   (release depends on it)
Newcomer       medium   wants 4   ->  granted 4   (onboarding set-aside)
Builder B      medium   wants 10  ->  granted 0   (flexible work delayed)

band: minor_pressure   reserve: intact   coverage: 56%   proof: 0xd5ec17c0886493a3
```

Builder B, the flexible request, absorbs the scarcity instead of the blocked
contributor. The reserve is never touched. That is the tide working.

## Tide Table VIII: reading the contract yourself

```
get_pools(start)     the shoreline, newest first
get_pool(id)         one pool with its requests and latest allocation
get_allocation(id)   the current allocation result
get_stats()          totals: pools, rounds, settled
```

## Tide Table IX: running the harbor locally

```
# read the live contract, no wallet needed
cd frontend
npm install
npm run dev            # open the harbor, browse real pools from the chain

# to write (open a pool, add requests, run a tide, settle), connect a wallet on
# GenLayer Studio. The Studio network is gasless.

# redeploy your own instance, or re-verify the full lifecycle
cd ../scripts
python deploy.py            # deploy the contract, writes deployment.json
python verify_full.py       # open, request, allocate, settle, prove on-chain
```

## Tide Table X: the deterministic guards and backstops

The validator does not check shape, it checks substance. A copied, arbitrary,
one-sided, overspending, or prompt-injected vector is rejected. Required fields
and ranges are guarded before the model, the conservation engine re-runs after
consensus, and settlement remains gated by the band and intact reserve.

Automated coverage includes principle validation, exact allocation auditing,
conservation, stale-allocation invalidation, steward-only settlement, wallet
provider wiring, and fail-closed transaction status handling.

```
Mechanic   : a scarce-pool DIVISION machine (not a text-scoring judge)
Stack      : Python GenVM contract + React/Vite SPA on genlayer-js
Hosting    : Cloudflare Pages, static, reads chain views, writes via wallet
No deposits and no value transfer. Studio writes are gasless.
```

## Verification

```bash
# Intelligent Contract invariants
gltest tests -q
# 4 passed

# Transaction-status behavior
cd frontend
npm test
# 2 passed

# Production bundle
npm run build
```

The suite proves more than a happy path: a stale allocation cannot settle,
non-stewards cannot finalize a pool, the reserve survives every accepted vector,
and `UNDETERMINED` is never presented to the user as success.
