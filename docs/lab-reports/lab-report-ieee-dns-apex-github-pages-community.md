<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Locating the Authoritative Control Plane: Apex DNS Migration to GitHub Pages and the Open-Source Community Architecture It Enables

**Codex of Conquest — Infrastructure & Community Report**
*2026-08-23*

---

## Abstract

This report documents the migration of a project's apex domain from a legacy shared web host to GitHub Pages, and the open-source community architecture that migration was undertaken to serve. The engineering content divides into two halves. The first is diagnostic: the administrative control plane for a domain is frequently *not* located where the operator's mental model places it, and the resulting search — registrar, nameserver operator, hosting enrollment — consumed the majority of the effort. We identify a specific and under-documented failure mode in which an active hosting enrollment renders apex address records immutable from within the DNS editor that ostensibly manages them. The second is architectural: we describe the resulting deployment topology (Actions-built artefact, apex `A`/`AAAA`, `www` `CNAME`, Let's Encrypt certificate), a persistence hazard specific to Actions-sourced Pages deployments, and the MIT-licensed, single-file distribution model that makes the project forkable, redeployable, and contributable by parties with no server infrastructure of their own. We include a complete redeployment runbook for third parties and a proposal for subdomain delegation to sibling cooperative projects. A methodological aside documents a measurement error — burst-query rate limiting misread as record instability — and its correction, retained here because the erroneous reading was very nearly acted upon.

**Index Terms** — DNS, apex records, ALIAS, GitHub Pages, continuous deployment, ACME, MIT license, community contribution, single-file applications.

---

## 1. Introduction

The project under discussion is a single-file browser role-playing game: engine, world graph, dialogue, quest system, and save layer all resident in one HTML document of approximately 5.5 MB, requiring no server, no build step, and no installation. It had been published at a vendor-provided subdomain of the form `exampleuser.github.io/example-game/`. The objective was to publish it instead at a project-owned apex domain — referred to throughout as `example-game.org` — over HTTPS, with `www` redirecting to the apex, while leaving the domain's existing electronic mail service undisturbed.

On paper this is a twenty-minute task consisting of four address records and a checkbox. In practice the substantive difficulty was not configuring DNS but *finding out where DNS was configured*, and then discovering that the records in question were held hostage by a service the operator had forgotten was enrolled.

The instinct — near-universal, and wrong — is that one adjusts a domain by addressing the registrar. This is the modern equivalent of writing a courteous letter to the Pony Express station master when what one actually needed was to move the mailbox at the end of the lane. The station master will receive the letter. He will read it with interest. He will not move your mailbox, because that was never his office.

---

## 2. Background: The Three-Body Problem of Domain Administration

A domain name in ordinary operation is administered by up to three mutually independent parties, and the operator typically remembers only the first.

| Role | Function | Where the operator thinks it is |
|---|---|---|
| **Registrar of record (R)** | Holds the registration; controls *which nameservers are delegated*. Does not answer queries. | "This is where DNS lives." |
| **Nameserver operator (N)** | Publishes the zone; actually answers `A`, `AAAA`, `MX`, `TXT` queries. | Rarely considered at all. |
| **Web host (H)** | Serves HTTP for the domain. Frequently also *is* N, and frequently injects records to point at itself. | "This is the old site; irrelevant." |

The registrar's sole DNS-relevant power is the delegation itself: a set of `NS` records saying "ask those servers instead." Everything downstream — every address record the world actually resolves — is published by whoever those servers belong to. Once delegation is set, the registrar is a signal flag raised once and then left in position. It communicates a single fact, continuously, and nothing else. One does not renegotiate the message by semaphoring harder at the flag.

In the case at hand, R and N were **different companies**. Registration sat with a small registrar; the zone was published by nameservers belonging to a large shared-hosting provider H, dating from a website deployed to that provider in the previous year and since forgotten. Every hour that the operator spent looking for address records in R's control panel was an hour spent at the wrong window.

### 2.1 Establishing Delegation Empirically

The diagnostic is one command and it should be the *first* command in any domain migration:

```sh
dig +short example-game.org NS
```

```
ns1.H.example.
ns2.H.example.
ns3.H.example.
```

This settles the question with no login required and no vendor documentation consulted. The answer names the only party whose opinion about address records matters. Everything before this lookup is speculation; everything after it is work.

A companion snapshot, taken before any change, records what is about to be disturbed:

```sh
for t in A AAAA CNAME MX TXT NS CAA; do
  echo "== $t =="; dig +short example-game.org $t
done > dns-before.txt
```

The pre-change state was:

| Name | Type | Value | Interpretation |
|---|---|---|---|
| `@` | A | `198.51.100.86` | H's shared web server |
| `@` | AAAA | *(absent)* | No IPv6 whatsoever |
| `www` | A | `198.51.100.86` | Same server |
| `@` | MX | `mx1`/`mx2` (filtering relay) | **Live email** |
| `@` | TXT | `v=spf1 mx include:… -all` | SPF for that email |
| — | HTTP | 63,523 bytes, Apache, modified 14 months prior | A live, forgotten website |

Two findings here were consequential and neither was anticipated by the operator. The domain was serving a real page, and the domain was carrying real mail. A migration planned as "point it at the new thing" was in fact a migration that could silently destroy a mail configuration.

---

## 3. The Apex Lock

### 3.1 Symptom

With delegation established and H's DNS editor open, the apex `A` record refused to be edited. It rendered in a list styled identically to the editable records but bore a distinct icon, no edit affordance, and — on hover — the explanatory text:

> *The domain has a hosting service associated with it (fully hosted, redirect, mirror, parked).*

This is the crux of the report, because it is the point at which a competent operator concludes the panel is broken, or that the provider forbids the operation, and begins researching how to move the domain elsewhere entirely.

### 3.2 Diagnosis

The provider's DNS editor and the provider's *hosting enrollment* are distinct subsystems, and the latter has write priority over the former. While a domain is enrolled in any hosting mode, the provider auto-generates the address records that route traffic to itself, and it marks them read-only precisely so that a customer cannot break their own website by editing DNS. The behaviour is defensible. It is also invisible from the screen where the operator is standing, which is what makes it expensive.

Crucially, the enrollment need not be "fully hosted." The tooltip enumerates four states — **fully hosted, redirect, mirror, parked** — and *all four* inject apex records. "Parked" is the treacherous one: a domain the operator has explicitly marked as unused still holds the apex lock, so the very act of tidying up produces the obstruction.

### 3.3 Remediation

The control is on the hosting screen, not the DNS screen. Under a heading of the form *Non-Hosting Options*, four choices were presented:

| Option | Effect | Verdict |
|---|---|---|
| **Set to DNS Only** | Provider publishes the zone, serves no HTTP | **Correct** |
| Redirect Domain | Provider serves HTTP 301 from its own servers | Rejected |
| Mirror Domain | Provider serves another site's files | Rejected |
| Park Domain | Provider serves a placeholder | Rejected |

**DNS Only** is the only option that releases the apex. The other three are rejected for a reason worth stating explicitly, because two of them look superficially useful: any option in which the provider answers HTTP for the domain will intercept the ACME HTTP-01 challenge used to issue the TLS certificate. The certificate authority's validator would be handed a redirect, or a placeholder, or somebody else's homepage, and would decline to issue. A redirect that promises to forward you onward is, for these purposes, a message in a bottle tied to an anchor: impeccably addressed, and never going anywhere.

Selecting DNS Only initiated an asynchronous *"Removing hosting plan…"* job. On completion the read-only apex and `www` records vanished and the custom-record editor accepted input.

### 3.4 Orthogonality of Electronic Mail

An early draft of the migration plan warned that mail records "may drop" with the hosting change. **This was wrong and is corrected here**, because the error would have been materially damaging had it been acted upon.

Web hosting and email hosting are separate products at the provider. `Set to DNS Only` withdraws the web service alone. The `MX` records, the mail-related `A` records (`mail`, `mailboxes`, `webmail`), and the SPF `TXT` record are generated by the *email* service and are untouched by the change. They were verified present against the authoritative servers after the removal completed, and again after every subsequent record change.

This orthogonality drives a hard constraint in §4.1 and it is the single most important sentence in this report for anyone reproducing the work: **the apex must not be given a `CNAME`.**

---

## 4. Apex Record Strategy

### 4.1 Why the Apex Cannot Take a CNAME

A `CNAME` record asserts that a name is an alias for another name, and the specification requires that no other record type coexist with it at the same name. The apex necessarily carries `SOA` and `NS` records, so a `CNAME` there is invalid on its face. The practical consequence is sharper than the formal one: a `CNAME` at the apex *shadows the `MX` records*. Mail delivery to the domain stops. Not degrades — stops.

For a domain whose email is being deliberately retained, this elevates a specification footnote to an operational hazard. The two admissible constructions are:

1. **`ALIAS`** (also marketed as `ANAME`): a provider-side synthetic record that resolves the target at query time and returns its addresses as though they were native `A`/`AAAA` records. Coexists with `MX` because, on the wire, no `CNAME` is ever emitted.
2. **Explicit `A` and `AAAA`**: literal addresses. Static zone data. Coexists with everything.

The provider offered `ALIAS`, which is uncommon and was initially adopted: two records instead of eight, and automatic tracking of the vendor's edge addresses should they ever change.

### 4.2 A Measurement Error, Retained

Verification of the `ALIAS` produced an alarming result. Twenty consecutive `A` queries issued directly at the authoritative nameserver returned:

```
15/20 full answers, 5/20 empty
```

An apparent 25% failure rate on IPv4 resolution. `AAAA` was, in the same sampling, stable at 4/4. The hypothesis assembled itself readily and was entirely plausible: the provider resolves `ALIAS` targets live, that resolution is flaky, and only the IPv4 path is affected. A recommendation to abandon `ALIAS` was issued with more confidence than the evidence supported.

The hypothesis was wrong. Expanding the sample revealed that `AAAA` — previously perfect — *also* began failing under heavier querying (3/15 empty). Records do not become unreliable because they are queried more vigorously. The failures were **rate limiting**, applied by the authoritative servers to a burst of identical queries from a single source address, and misread as a property of the record.

The correct measurement queries public recursive resolvers, which is both what real clients do and what the certificate authority does:

```
1.0.0.1 -> all four A records
9.9.9.9 -> all four A records
8.8.4.4 -> all four A records
```

Unanimous and correct on every attempt. A supporting datum: the zone's `SOA` minimum — the negative-cache TTL, which governs how long a resolver remembers a "no such record type" answer — was **60 seconds**, not the multi-hour figure the initial analysis had implied. Even a genuine miss would have been forgotten within a minute.

Two lessons are recorded, the second more useful than the first:

- **Measure at the layer that consumes the result.** Authoritative servers are infrastructure; recursive resolvers are the client population. Only the latter's view predicts user experience or ACME outcomes.
- **Treat a signal that scales with your own instrumentation as an artefact of the instrumentation.** The tell was not subtle in retrospect: the failure rate tracked query volume. When shouting louder makes the reply *less* reliable, one is not observing the message. One is observing the shouting.

The heliograph is an apt figure here. It transmits perfectly well until the observer, impatient, angles the mirror to catch more sun — and reads the resulting glare as evidence that the distant station has stopped signalling.

### 4.3 Decision

Explicit `A`/`AAAA` records were adopted regardless, on a *weaker* and honestly-stated rationale than the one originally offered: they are static zone data with no live resolution step, they are the vendor's primary documented configuration, and they remove one mechanism from the path between a visitor and a valid certificate. The cost is eight records rather than one and a manual update in the unlikely event the vendor renumbers its edge. `ALIAS` would also have worked.

### 4.4 Final Record Set

| Name | Type | Value | Provenance |
|---|---|---|---|
| `@` | A | four vendor edge addresses | added |
| `@` | AAAA | four vendor edge addresses | added |
| `www` | CNAME | `exampleuser.github.io.` | added |
| `_acme-style-challenge…` | TXT | verification token | added |
| `@` | MX | mail filtering relay ×2 | **untouched** |
| `@` | TXT | SPF policy | **untouched** |
| `mail`, `mailboxes`, `webmail` | A | mail service addresses | **untouched** |

All four addresses of each family are required. They are anycast edge nodes; publishing one is a single point of failure. The `AAAA` set is not decorative — IPv6-only clients and several mobile carriers cannot reach a domain without it, and this domain previously had none at all.

---

## 5. The Routing Model: Host Header, Not DNS

A question arose during the work that is worth answering in print, because the intuition it corrects is widespread.

> If the `CNAME` target is `exampleuser.github.io`, how does the request reach the *project* rather than the user's own homepage?

**It does not reach it via DNS.** The vendor routes on the HTTP `Host` header.

The `CNAME` target and the four literal addresses are interchangeable and equivalent: both resolve to the same anycast edge. The decisive evidence is that the explicit `A`-record configuration contains *no identifying information whatsoever* — no account name, no repository name, four bare addresses shared by every site the vendor hosts. Routing therefore cannot be derived from DNS. It isn't.

The actual sequence:

1. Client resolves `example-game.org` → an edge address.
2. Client issues `GET /` with `Host: example-game.org`.
3. Edge consults a **domain → repository** table.
4. Edge finds `exampleuser/example-game` and serves that repository's published artefact.

The table entry in step 3 is created by the repository's *custom domain* setting and reinforced by a `CNAME` file inside the published artefact. Three corollaries follow:

- A path component in a `CNAME` value (`…/example-game`) is meaningless. `CNAME` targets are hostnames; the path never enters DNS.
- Omitting the custom-domain setting yields **404**, not the wrong repository. No table entry, no mapping.
- A custom domain maps to exactly one repository, globally — which is why domain *verification* exists, and why it should be performed.

### 5.1 Domain Verification

Verification adds a `TXT` record under a vendor-specific subdomain name, proving account control. Once verified, only repositories under that account may claim the domain. Without it, a domain detached from its repository while DNS still points at the vendor may be claimed by any other account — a documented takeover path, closed by one record.

Because the verification `TXT` sits on its own subdomain label, it cannot collide with the apex SPF `TXT`. The two coexist without interaction.

---

## 6. Ordering Discipline and Certificate Acquisition

The single procedural rule governing this migration:

> **DNS first, resolved and confirmed. Vendor configuration second.**

Saving the custom domain triggers an ACME certificate request immediately. If DNS has not propagated, validation fails, and the vendor's settings page enters a "provisioning" state that in the common case clears only by detaching and reattaching the domain. Every hour of delay in this posture is self-inflicted.

The gate is a resolver check, not a stopwatch:

```sh
for r in 1.0.0.1 9.9.9.9 8.8.4.4; do
  echo "$r -> $(dig +short @$r example-game.org A | sort | tr '\n' ' ')"
done
```

Three identical four-address answers, and no trace of the former host's address, constitute the green light.

### 6.1 Observed Timeline

Propagation completed substantially faster than the several hours budgeted — the provider publishes at a one-hour TTL, but the prior records had aged out and recursive caches picked up the new set within minutes.

| Event | Elapsed |
|---|---|
| Hosting removal job completes | T+0 |
| Custom records accepted by editor | T+2 min |
| All three public resolvers unanimous | T+6 min |
| Domain verification succeeds | T+8 min |
| Custom domain saved; ACME request issued | T+9 min |
| **Certificate issued** (90-day validity) | **T+12 min** |

The certificate arrived while the operator was still reading a browser warning generated in the pre-issuance gap — a warning that was correct at the moment it was displayed and stale by the time it was acted upon. The gap is real and briefly alarming; it is not a fault condition.

Post-migration verification:

```
apex A        → identical four-address set from three resolvers   ✓
apex AAAA     → identical four-address set from three resolvers   ✓
www           → 301 → https://example-game.org/                   ✓
/play.html    → 200                                               ✓
/edit.html    → 200                                               ✓
former URL    → 301 → apex                                        ✓
MX / SPF      → unchanged                                         ✓
```

The vendor redirects the former subdomain URL to the custom domain automatically. No external link is broken by the migration.

### 6.2 Enforce HTTPS

Until the *Enforce HTTPS* setting is enabled, port 80 answers `200` rather than redirecting, and the vendor's own legacy-URL redirect targets `http://`. This leaves a plaintext hop in the chain. The setting is greyed out until the certificate exists — which is correct behaviour and should not be fought — and must be enabled as a distinct, deliberate step afterwards. It is easy to consider the migration finished at T+12 and leave this undone.

---

## 7. Deployment Persistence Under Actions-Sourced Pages

A hazard specific to this deployment model, and the reason the migration required a repository change at all.

When Pages publishes from a **branch**, the vendor writes a `CNAME` file into that branch on the operator's behalf when the custom domain is saved. The arrangement is self-sustaining.

When Pages publishes from **Actions** — as here, via a workflow that assembles `_site` and uploads it as an artefact — the custom domain exists only in repository settings, while the uploaded artefact is the authoritative description of the published site. A subsequent deployment can therefore clear the custom domain, and the failure surfaces later, as a 404 on the domain, with no obvious connection to the commit that caused it.

The remedy is to place the domain in the artefact:

1. `CNAME` at the repository root, containing exactly one line — the bare apex domain, with no scheme, no trailing slash, no `www`.
2. In the workflow's assembly step, copy it into the artefact alongside the licence file.
3. Add `CNAME` to the workflow's `paths:` trigger so that editing it produces a deployment.

Three lines. Thereafter the domain is a property of what is published rather than of a settings page, and survives every future deployment without attention.

### 7.1 Origin-Scoped Client State

An unavoidable consequence, noted because it is user-visible and cannot be mitigated. Browser `localStorage` is scoped per origin. `exampleuser.github.io` and `example-game.org` are different origins, so save data created at the former is inaccessible at the latter. Players return to an empty slate.

There is no migration path for this that does not involve export/import tooling. The chosen mitigation was scheduling: the domain move was shipped in the same release as an unrelated, already-planned save-format invalidation, converting two disruptions into one.

---

## 8. Open-Source Licensing as Community Infrastructure

The migration was not undertaken for vanity addressing. It was undertaken because a project-owned domain is a precondition for the community model described below, and because that model depends on the project being trivially forkable by people who own no infrastructure at all.

### 8.1 The Licence

The project is **MIT**. The choice is deliberate and worth defending in a document like this one.

MIT imposes one obligation — preserve the copyright and licence notice — and grants everything else, including commercial use, modification, and redistribution under different terms. For a project whose intended contribution is *content* — missions, rewordings, world nodes, dialogue — a copyleft licence would attach a redistribution obligation to every fork, and the modal contributor here is a hobbyist writing a quest arc, not a developer prepared to reason about licence compatibility. The friction would fall precisely on the contributions the project most wants.

Every file in the repository carries an `SPDX-License-Identifier` header, including this report. The identifier is machine-readable, survives copy-paste into other projects, and means a single extracted file remains correctly attributed even when separated from the repository that contained it.

### 8.2 The Single-File Artefact as a Distribution Model

The game is one HTML document. This is an aesthetic commitment that turns out to have significant licensing and community consequences:

- **The artefact is the source.** There is no build step, no minification, no transpilation. What is served is what is authored. "View source" is a complete and honest disclosure, and the licence's practical grant is not undermined by an unreadable bundle.
- **Distribution requires no infrastructure.** A fork can be played by opening a local file. No server, no toolchain, no package manager, no versions of anything to install.
- **Archival is trivial.** A right-click and *Save As* yields a complete, permanently playable copy that will still run when every service named in this report has been acquired, renamed, or shut down. This is the tin can and string of software distribution, and it will outlive most of the fibre.

### 8.3 The Editor as Contribution Surface

A second single-file document — the world builder — is published alongside the game at `/edit.html`. It is the mechanism by which contribution is opened to people who will never open a terminal.

The intended loop:

1. A contributor opens the editor in a browser. Nothing is installed, no account is created, and no permission is requested or granted.
2. They author a mission, revise dialogue, adjust an item chain, or reword an encounter. Prose contributions are explicitly first-class: a rewording that improves the voice of an existing scene is as welcome as new mechanical content.
3. They export the resulting data structure.
4. They submit it — as a pull request if they are comfortable with that, or as a file attached to an issue if they are not.
5. A maintainer merges it, and the deployment workflow republishes within a minute or two.

The significant property is the **absence of a privileged tool**. The editor is not an internal utility that happens to have been made public; it is the same document, under the same licence, served from the same artefact, that the maintainers use. There is no version of the project that a contributor cannot hold in their hands.

This is the difference between a community and an audience, and it is worth being explicit about the failure mode being avoided. A project that accepts contributions only from people who can clone a repository, install a toolchain, and run a build has not opened its doors; it has published its address and installed a lock. The messenger pigeon is a fine institution, but only if you are not required to first breed the pigeon.

### 8.4 What the Domain Adds

A project-owned apex domain contributes three things the vendor subdomain could not:

1. **Portability of identity.** The vendor subdomain encodes an account name. Should the project move hosts, change maintainers, or transfer to an organisation, every external link breaks. An owned domain is redirected in one place, and the community's accumulated links, bookmarks, and citations survive.
2. **Delegable namespace.** Subdomains can be assigned — see §9 — which the vendor subdomain cannot.
3. **Neutrality.** A name that belongs to the project rather than to an individual is a small but real signal that contributions accrue to a shared thing.

---

## 9. Subdomain Delegation to Sibling Cooperative Projects

With the apex established, the namespace beneath it becomes an asset the project can extend to others at zero marginal cost.

The proposal: **sibling cooperative projects — forks, translations, total conversions, tooling, community archives — may be offered a subdomain of the project domain.** A translation might take `de.example-game.org`; a conversion `frontier.example-game.org`; a community mission archive `missions.example-game.org`.

### 9.1 Mechanism

Each delegation is a single record, and the recipient's own deployment does the rest:

| Recipient's hosting | Record at the project's zone |
|---|---|
| Vendor Pages (any account) | `CNAME` subdomain → `theiruser.github.io.` |
| Arbitrary host | `CNAME` subdomain → their hostname |
| Redirect only | `CNAME` to a redirect service, or an apex-level rule |

The recipient sets their own custom domain to the delegated name and obtains their own certificate. No credential is shared in either direction. The project's zone is the only thing touched, and only by the addition of one record.

### 9.2 Governance Notes

Recorded now, before the first request rather than after the first dispute:

- **A delegation is a loan, not a transfer.** The project retains the zone and may withdraw a record. This should be stated plainly when a delegation is offered, so that no recipient builds on an assumption of permanence they were never given.
- **The apex is never delegated.** Only labels beneath it.
- **Recipients should be encouraged to own a domain.** A delegation is a courtesy for projects not yet ready to hold their own registration — scaffolding, not a permanent dependency, and the better outcome is that a sibling project eventually needs it no longer.
- **Verification interacts with delegation.** Domain verification at the vendor binds a domain to an account; delegating a subdomain to a *different* account may require the recipient to complete their own verification against the delegated label. This is a feature — it prevents silent reassignment — but it should be anticipated rather than discovered.
- **Mail is not delegated.** The apex `MX` governs the apex. A recipient who wants mail at their subdomain needs their own records, and the project should be reluctant to publish `MX` records on another party's behalf.

---

## 10. Redeployment Runbook for Third Parties

The following is sufficient for any reader to run a modified copy of the project under their own name. It requires no permission and no coordination, which is the point of the licence.

**Minimum path — no domain, no cost:**

1. Fork the repository.
2. In the fork's settings, set Pages source to **GitHub Actions**.
3. Push any change to the default branch. The included workflow assembles and publishes.
4. The fork is live at `yourname.github.io/repository-name/`.

Retain the licence and copyright notice. That is the entire obligation.

**Full path — with a custom domain:**

5. Determine where the zone is actually published — `dig +short yourdomain NS`. Do not assume the registrar. See §2, and consider §3 before concluding your provider's DNS editor is broken.
6. If the provider holds an apex lock, release it via the hosting screen, choosing the DNS-only option. Not redirect, not mirror, not park (§3.3).
7. Snapshot existing records before changing any — particularly `MX` and SPF if the domain carries mail (§3.4).
8. Publish apex `A` and `AAAA` records for the vendor's edge, and a `www` `CNAME` to `yourname.github.io.`. **Never a `CNAME` at the apex** (§4.1).
9. Verify the domain at the vendor (§5.1).
10. Confirm resolution through public recursive resolvers — not the authoritative servers, and not a browser (§4.2, §6).
11. **Only then** set the custom domain in the fork's settings.
12. Enable *Enforce HTTPS* once the certificate is issued (§6.2).
13. Add a `CNAME` file to the repository root and copy it into the artefact in the workflow (§7). This step is invisible until the day it isn't.

**Modification notes.** Content edits are made through `/edit.html` and exported; engine changes are made in the game file directly. There is no build step to learn, and no reason a fork must resemble the original. Contributions upstream are welcome but are in no sense required — a fork that never sends anything back is using the licence exactly as intended.

---

## 11. Threats to Validity

- **Vendor-specific detail.** Control-panel labels, the enumeration of non-hosting options, and the availability of `ALIAS` are properties of one provider at one date. The structural claim — that hosting enrollment can hold apex records read-only, and that the release control lives outside the DNS editor — generalises considerably further than the labels do.
- **Timing is not a benchmark.** The twelve-minute propagation-to-certificate interval reflects a zone whose prior records had already aged from most caches. A domain with a long-lived, widely-cached apex record will behave differently and the ordering discipline of §6 matters proportionally more.
- **Rate-limiting thresholds are unpublished.** §4.2 establishes that burst querying produced misleading results; it does not establish where the threshold lies. The remedy is to measure at recursive resolvers, not to calibrate against the limit.
- **The delegation model in §9 is untested.** It is a proposal with a worked mechanism, not a report of operational experience. The governance notes are anticipatory.

---

## 12. Conclusion

The engineering content of an apex-domain migration is small: eight address records, one alias, one verification token, a checkbox, and three lines of workflow. Essentially all of the difficulty lies elsewhere — in determining which of three independent parties actually controls the zone, and in discovering that a forgotten hosting enrollment holds the records in question read-only from behind a screen that gives no indication of doing so.

Two rules would have compressed this work substantially. **Ask the delegation before asking the vendor**: one `NS` lookup identifies the only party whose configuration matters, and no amount of correspondence with the registrar substitutes for it. **Measure at the layer that consumes the result**: the authoritative servers are not the client population, and an instrument that degrades under its own use is reporting on itself.

The migration's purpose was never the address. A single-file, MIT-licensed game with a browser-based editor and a zero-infrastructure fork path is an invitation, and an invitation benefits from a durable place to arrive — one that does not encode a single person's account name, that can be redirected in one operation if the project moves, and beneath which sibling projects can be offered a name of their own. The certificate took twelve minutes. Finding the doorway took considerably longer, which is the only reason this report exists: so that the next person spends their afternoon on the game instead of on the mailbox at the end of the lane.

---

## Appendix A — Verification Commands

```sh
# 1. Which nameservers actually answer? Run this FIRST, always.
dig +short example-game.org NS

# 2. Snapshot everything before changing anything.
for t in A AAAA CNAME MX TXT NS CAA; do
  echo "== $t =="; dig +short example-game.org $t
done > dns-before.txt

# 3. Gate for proceeding to vendor configuration — public resolvers,
#    NOT the authoritative servers (see §4.2).
for r in 1.0.0.1 9.9.9.9 8.8.4.4; do
  echo "A    $r -> $(dig +short @$r example-game.org A    | sort | tr '\n' ' ')"
  echo "AAAA $r -> $(dig +short @$r example-game.org AAAA | sort | tr '\n' ' ')"
done

# 4. Mail must survive every step. Check after each change.
dig +short @1.0.0.1 example-game.org MX
dig +short @1.0.0.1 example-game.org TXT

# 5. Certificate — subject must be the apex, not the vendor's wildcard.
echo | openssl s_client -connect example-game.org:443 \
    -servername example-game.org 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates

# 6. End-to-end.
curl -sSI https://example-game.org        | head -5   # 200, vendor server
curl -sSI https://www.example-game.org    | head -5   # 301 → apex
curl -sSI http://example-game.org         | head -5   # 301 once HTTPS enforced
curl -sSI https://exampleuser.github.io/example-game/ | head -5   # 301 → apex
```

## Appendix B — Failure Modes and First Diagnostic

| Symptom | Most likely cause | First check |
|---|---|---|
| Apex record not editable | Hosting enrollment holds it (§3) | Hosting screen, not DNS screen |
| Records edited, nothing changes | Zone published elsewhere (§2) | `dig +short domain NS` |
| Certificate stuck "provisioning" | Domain saved before DNS resolved (§6) | Resolver check; detach and reattach |
| Domain 404s after a deploy | Artefact lacks `CNAME` (§7) | Workflow assembly step |
| Mail stops | `CNAME` at apex shadowing `MX` (§4.1) | `dig +short domain MX` |
| Intermittent resolution failures | Burst-query rate limiting (§4.2) | Re-measure at public resolvers |
| Site loads over HTTP but warns on HTTPS | Certificate not yet issued | Wait; check `openssl s_client` |
| Wrong site served on the domain | Custom domain unset, or claimed elsewhere | Vendor Pages settings; verify domain |

---

## References

1. Mockapetris, P. (1987). *Domain Names — Concepts and Facilities*. RFC 1034, IETF.
2. Mockapetris, P. (1987). *Domain Names — Implementation and Specification*. RFC 1035, IETF. (`CNAME` exclusivity, §3.6.2.)
3. Andrews, M. (1998). *Negative Caching of DNS Queries (DNS NCACHE)*. RFC 2308, IETF. (SOA minimum as negative-cache TTL.)
4. Barnes, R., Hoffman-Andrews, J., McCarney, D., & Kasten, J. (2019). *Automatic Certificate Management Environment (ACME)*. RFC 8555, IETF.
5. Hoffman, P., & McManus, P. (2018). *DNS Queries over HTTPS (DoH)*. RFC 8484, IETF.
6. Open Source Initiative. *The MIT License*. https://opensource.org/license/mit
7. Linux Foundation. *SPDX Specification — License Identifiers*. https://spdx.dev
8. GitHub Docs. *Configuring a custom domain for your GitHub Pages site* — apex `A`/`AAAA` addresses, `ALIAS`/`ANAME` alternative, domain verification.
9. GitHub Docs. *Verifying your custom domain for GitHub Pages* — takeover prevention via account-scoped `TXT` challenge.
10. Codex of Conquest Source, `.github/workflows/pages.yml` — artefact assembly and `actions/deploy-pages` invocation.
11. Codex of Conquest Source, `edit.html` — world builder; contribution surface described in §8.3.
12. Codex of Conquest, `docs/lab-reports/lab-report-documentation-system-design.md` — documentation conventions this report follows.
