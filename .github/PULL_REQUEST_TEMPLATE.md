## What this changes

<!-- One or two sentences. What is different after this merges? -->

## Why

<!-- The defect or the goal. If it closes a backlog row, name it: §DX-02xx -->

## Existing-Work-First

<!-- Required by CONTRIBUTING.md. Rows go stale; four have closed as ALREADY SHIPPED. -->
- [ ] I ran `git log` / `git status` and grepped `BACKLOG*.md` and `docs/backlog/` to confirm this is not already done
- [ ] I greped to *disprove* the premise before building

## Verification

<!-- Paste the actual output, not a claim. -->
- [ ] `make check` passes
- [ ] `make test` passes (or: which tests, and why the rest were not run)

```
paste gate output here
```

## Comments

- [ ] Any comment I added passes the survival test in CONTRIBUTING.md (CC-1..CC-6):
      it is still true and useful a year from now to someone who never saw this diff
