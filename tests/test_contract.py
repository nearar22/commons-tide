import json
import sys


def deploy(direct_deploy):
    return direct_deploy("contracts/contract.py")


def enable_template_in_direct_mode(contract, monkeypatch):
    module = sys.modules[contract.__class__.__module__]
    monkeypatch.setattr(
        module.gl.eq_principle,
        "prompt_non_comparative",
        lambda fn, **_kwargs: fn(),
    )


def open_ready_pool(contract):
    pool = contract.open_pool(
        "Release review hours",
        "hours",
        20,
        4,
        "Prioritize genuine blockers and protect the emergency reserve.",
    )
    contract.submit_request(
        pool["id"], "Release team", 10, "blocker", 5,
        "The audited release cannot ship until this review is complete.",
    )
    contract.submit_request(
        pool["id"], "Documentation", 8, "low", 3,
        "Documentation would benefit from an editorial review this week.",
    )
    return pool["id"]


def mock_allocation(direct_vm, blocker=10, flexible=6):
    direct_vm.mock_llm("COMMONSTIDE ALLOCATOR", json.dumps({
        "grants": {
            "r1": {"grant": blocker, "reason": "Release blocker is fully funded."},
            "r2": {"grant": flexible, "reason": "Flexible editorial work receives the remainder."},
        },
        "note": "The reserve stays protected while the blocker is prioritized.",
    }))


def test_requires_substantive_allocation_principles(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    with direct_vm.expect_revert("Describe the community allocation principles"):
        contract.open_pool("Pool", "hours", 20, 4, "fair")


def test_exact_allocation_is_audited_and_conserved(direct_vm, direct_deploy, monkeypatch):
    contract = deploy(direct_deploy)
    enable_template_in_direct_mode(contract, monkeypatch)
    pool_id = open_ready_pool(contract)
    mock_allocation(direct_vm)

    result = contract.run_allocation(pool_id)["allocation"]

    assert result["grantedSum"] == 16
    assert result["reserveIntact"] is True
    assert result["rows"][0]["granted"] == 10
    assert result["validatorAudit"]["principles"] == "checked"
    assert result["validatorAudit"]["reasons"] == "checked"


def test_new_request_invalidates_stale_allocation(direct_vm, direct_deploy, monkeypatch):
    contract = deploy(direct_deploy)
    enable_template_in_direct_mode(contract, monkeypatch)
    pool_id = open_ready_pool(contract)
    mock_allocation(direct_vm)
    contract.run_allocation(pool_id)
    direct_vm.clear_mocks()

    contract.submit_request(
        pool_id, "Accessibility", 4, "high", 2,
        "A keyboard blocker prevents contributors from completing the flow.",
    )

    assert contract.get_pool(pool_id)["status"] == "ready"
    with direct_vm.expect_revert("Run a fresh allocation before settling"):
        contract.settle_pool(pool_id)


def test_only_steward_can_settle(direct_vm, direct_deploy, direct_alice, direct_bob, monkeypatch):
    direct_vm.sender = direct_alice
    contract = deploy(direct_deploy)
    enable_template_in_direct_mode(contract, monkeypatch)
    pool_id = open_ready_pool(contract)
    mock_allocation(direct_vm)
    contract.run_allocation(pool_id)
    direct_vm.clear_mocks()

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the steward can settle"):
        contract.settle_pool(pool_id)
