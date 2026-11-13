# Selftest fixture for scripts/guards/check-ci-gate.mjs: the CI OK verdict of
# the bad-heavy-mismatch fixture. Its heavy-job list lacks unit-tests, which
# carries the docs-only condition in that ci.yml.

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
          and (.key | IN("build")))
    )
end
