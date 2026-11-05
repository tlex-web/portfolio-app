---
quick_id: 261105-wlf
slug: verify-unknown-slug-miss-path-returns-40
status: complete
date: 2026-11-05
code_changed: false
---

# Quick task 261105-wlf: unknown-slug miss path on www.tlui.de

**Result: pass, no code change.** `curl -I https://www.tlui.de/photos/nope` returns 404, so the 502 does not point to a bug in `proxy.ts`.

No plan or executor ran. Strato DNS moved while this task was being set up, so the check could run as written and left nothing to build.

## Evidence (live, 2026-11-05, about 22:30 UTC)

| Request | Answer |
|---------|--------|
| `https://www.tlui.de/photos/nope` (HEAD and GET) | 404, `X-Matched-Path: /_not-found` |
| `https://www.tlui.de/projects/nope` (GET) | 404 |
| `http://www.tlui.de/photos/nope` | 308 to https |
| `https://tlui.de/photos/nope`, pinned to the published A record | 308 to `https://www.tlui.de/photos/nope` |
| `https://portfolio-app-mocha-three.vercel.app/photos/nope` | 308 to `https://www.tlui.de/photos/nope` |

- Certificates: Let's Encrypt, one for `www.tlui.de` and one for `tlui.de`; curl verified both (`ssl_verify=0`).
- DNS: 1.1.1.1 and 8.8.8.8 resolve www to a Vercel CNAME. Those two and both authoritative rzone.de servers give the apex A record 216.198.79.1.
- 1.1.1.1 returns no AAAA for the apex. `MX smtpin.rzone.de` is still in place.

## The original 502

It can't be reproduced, because plain HTTP now gets a 308 and never reaches the proxy. The cause stays inferred, not confirmed. The likely path is that the rewrite was treated as an external target, and that target resolved to the parking host. That host's port 443 failed a TLS handshake in this session (curl exit 35 at 22:27:30 UTC, before the local resolver saw the new records).

## Found along the way

**On www.tlui.de, a miss is served by the plain rewrite, not the neutral render.** The body of the 404 for `/photos/nope` carries `"c":["","photos","nope"]`, and `/projects/nope` does the same. T-12-03 meant to keep the requested slug out of that payload. `/photos/_` renders correctly on www, so the neutral page itself works.

The most likely reason is that `canFetchNeutral` rejects `www.tlui.de`, but the `VERCEL_*` values can't be read from outside, so this is not confirmed. It is still a correct 404, and `proxy.ts` documents this fallback.

The fix belongs to the open deferred row "Switch the canonical host to www.tlui.de once the domain is live" (`.planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/deferred-items.md`). That row's condition is now met, and `data/site.ts:21` still names the vercel.app host.

## Local resolver note

The local router (192.168.1.1) still returned the old apex address 217.160.0.85 at 22:31 UTC, so `https://tlui.de` fails its handshake from this machine (curl exit 35) until that cached entry clears. This is local only.
