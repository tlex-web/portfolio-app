# D-10 docs-only proof (plan 13-19)

Throwaway file on the branch `ci/13-proof-docs`. Its PR changes only a
`.planning/` path, so the pull_request run of CI should classify the diff as
docs-only, skip the six heavy jobs and still report a final `CI OK`. The PR is
closed unmerged and the branch deleted.
