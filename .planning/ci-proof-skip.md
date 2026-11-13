# D-10 [ci skip] proof (plan 13-19)

Throwaway file on the branch `ci/13-proof-skip`. Its head commit carries a CI
skip marker, as the GSD ship note does, so GitHub creates no push or
pull_request run of CI. The skip relay (`ci-skip-relay.yml`, from main) should
dispatch CI for the head and report a final `CI OK` on the head SHA. This is the
relay's acceptance test. The PR is closed unmerged and the branch deleted.
