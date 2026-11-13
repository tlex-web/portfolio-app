# CI OK verdict (GUARD-07, D-01; docs-only fast path GUARD-08, D-08): the only
# check the main ruleset requires.
#
# Input:  toJSON(needs) from the ci-ok job in .github/workflows/ci.yml, an
#         object { "<job id>": { "result": "...", "outputs": { ... } }, ... }
# Args:   --arg event <github.event_name>
# Output: true when CI OK may pass, else false. The job runs this with
#         `jq -e`, so false exits 1 and fails the job; malformed input or a
#         missing --arg is a jq error (exit 2 or more) and fails it too.
#
# What each clause allows:
#   - the input must be an object with at least one entry; an empty `needs`
#     would make `all` vacuously true, so it fails;
#   - the `changes` job must be present and "success": a failed or missing
#     classification fails CI OK, never a silent skip of the heavy jobs;
#   - a need passes when its result is "success";
#   - dependency-review may be "skipped" when the event is not pull_request,
#     because its job-level `if:` runs it on PRs only;
#   - a heavy job (the six ids in the list below) may be "skipped" only when
#     `changes` reported docs_only "true" (scripts/ci/classify-changes.mjs);
#   - anything else fails: "failure", "cancelled" (a cancelled or superseded
#     run never reports green) and any other "skipped".
#
# The heavy-job list must equal the ci.yml jobs whose `if:` reads
# needs.changes.outputs.docs_only; scripts/guards/check-ci-gate.mjs fails
# `npm run lint` when the two drift apart.
#
# Exercised by the "ci-ok.jq:" cases in scripts/guards/selftest.mjs.

if type != "object" then false
else
  (.changes.result == "success" and .changes.outputs.docs_only == "true") as $docs
  | length > 0
    and .changes.result == "success"
    and all(
      to_entries[];
      .value.result == "success"
      or (.key == "dependency-review" and .value.result == "skipped" and $event != "pull_request")
      or ($docs
          and .value.result == "skipped"
          and (.key | IN("lint-and-typecheck", "unit-tests", "e2e-tests", "visual-regression", "build", "security-audit")))
    )
end
