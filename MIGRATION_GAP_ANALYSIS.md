# Gritos.com — React Migration Gap Analysis

**Date:** 2026-07-18
**Deployed app:** https://gritos.com — legacy Backbone/Marionette bundle `1.10.10` (webpack build). It is a client-rendered SPA; its exact source is still in this repo (`src/js/app/main/`, `src/js/app/models/`, `src/js/app/router.js`, plus `app.js`/`mainView.js`/`modalView.js` which exist on `master` but were deleted on this branch).
**This branch:** `react-migration` — React 18 + react-router + Vite. Builds clean; 13/16 tests pass (3 `LoginStatus` tests fail against the uncommitted rewrite).

The structural skeleton (routes, layout, contexts, API helpers) is migrated, but **a large share of the deployed app's actual functionality is missing or broken**. This document inventories every behavior of the deployed app, states its status in the React version, and lays out the steps to finish.

---

## Progress log

### 2026-07-18 — Phase 0 complete (verified in-browser against the live API)

All 13 bugs in Part 2 fixed; every fix verified by driving the dev server with headless Chrome against the real gritos.com backend (screenshots of foroscomun, a topic foro, message detail, gallery, votaciones, ciudadanos, /admin redirect — Spanish dates, no console errors). 16/16 tests pass, Vite build clean. Not yet committed.

**Extra bug found during verification (worse than anything on the list):** `Layout` was rendered `<Layout>{children}</Layout>` *above* `<Routes>` in `App.jsx` — outside any matched route — so `useParams()` inside it and everything it renders (`Header`, `FormShell`, `RightSidebar`) always returned `{}`. The header title/link and the composer's target foro were silently foroscomun-shaped on **every page**. Fixed by nesting all routes under `<Route element={<Layout/>}>` with `Layout` using `<Outlet/>`.

Notable fix details:
- `moment.locale("es")` needed three pieces: the call itself, `import "moment/locale/es"` (moment loads locales via a dynamic `require` bundlers can't follow), and an exact-match alias `find: /^moment$/` in `vite.config.js` — Vite resolves bare `moment` to the locale-less `dist/moment.js` while `moment/locale/es` resolves against the full `moment.js`, creating two module instances. A plain string alias breaks subpath imports (prefix matching); the regex form is required.
- Own-post visibility fixed with `utils/messageEvents.js` (publish on submit success → `useForumMessages` prepends), mirroring legacy's direct `collection.add()`.
- `NotificationsContext` rewritten to the real socket flow (`Ws.prepararNotificaciones` + `notificaciones_<uid>`), with legacy's own-post filtering. Server-side read-state persistence still pending (Phase 5).
- The invented "Últimos Gritos" sidebar widget was removed (not a deployed feature; used a non-existent API value); `MiniMessageList`/`MiniMessageItem` deleted with it. `MainLayout.jsx` deleted as a dead twin.
- `FormContext` now exposes `isDirty`/`setDirty`; `FormShell` reports pending text; `useNavGuard` predicate param typo (`currentValue`→`currentLocation`) fixed.

### 2026-07-18 — Phase 1 (message card parity) implemented

New files: `utils/formatComments.js` (spoiler tokens → clickable spans, `target=_blank rel=noopener` forced on stored anchors, Autolinker with YouTube→iframe embed), `components/MolaActions.jsx` (love/mola/nomola with pipe-log optimistic toggle: fetch fresh → toggle own ID → PUT full model → `Ws.update(room, subtipo, uid)`; hidden logged-out), `components/EncuestaBlock.jsx` (options sorted by votes, single-vote enforcement moving the user's ID between option logs, "(cerrada)" state). `foroApi.js` gained `saveMessage` (PUT full entity JSON — Backbone `model.save()` parity) and `deleteMessage` (DELETE).

`MessageItem.jsx` reworked to integrate all of it plus: share menu (fb/tw popups via the previously-unused `util/socialShare.js`), admin menu (ban stub → confirm modal, delete with legacy permission rules [owner / `nivel>7` / head `Userid`] → confirm modal → DELETE, edit [owner] → `EditFormModal`, poll open/close toggle), tags footer from `publicados`+`INDICE` (`#foro`/`@alias` links), native lazy-loaded images with legacy vertical/horizontal classes, multi-image horizontal scroll-snap strip (lightweight slick replacement; CSS appended to `main.less`), click-to-zoom overlay (`.imagen-modal`, legacy `alto>364` rule), spoiler click-to-reveal (in-place toggle instead of legacy's tipr tooltip — same information, simpler). `head` now flows ForoPage → MessageList → MessageItem for permissions + share titles. Card keeps a local state copy so votes/edits update in place.

**Verified in-browser (headless Chrome vs live API):** YouTube links render as embedded players on foroscomun; tags footer shows `#kingcrimson`/`@user` links; share/admin menu structures present; mola actions correctly absent logged-out; `/kingcrimson/35941` renders the Votación block with options sorted by votes ("uno" 2, "dos" 1) exactly like the deployed site. 16/16 tests, build clean. **Not interactively driven** (voting/delete/edit require login credentials); logged-in flows need manual QA.

Known deviations from deployed, deliberate: scroll-snap strip instead of slick carousel; spoiler reveals in place instead of tooltip. Deferred within Phase 1 scope: hover user-list popups (listed as Phase 4.24).

### 2026-07-18 — Phase 2 (threads & walls) implemented and verified live

**API discovery:** `fetchHead` was querying `head.cgi?Name=<foro>`, which the live API answers with `{}` — foro titles/descriptions **never actually loaded** in the React app. Legacy Backbone generated `head.cgi?/<encoded-name>`, which returns the real head object (confirmed with curl against the live API). Fixed. Also confirmed live: `index.cgi?<path>/` (trailing slash) = children listing — that's how threads and walls fetch.

New: `components/MiniThread.jsx` (thread at `index.cgi?<INDICE>/<ID>/`, oldest→newest display from the newest-first API, "load previous" control using legacy's `firstEntry > 1` rule, live adds via `collection:<INDICE>/<ID>` socket room, dedupe+sort by `num`) and `components/ReplyForm.jsx` (Enter submits — legacy type:"msg" behavior — with emoji picker, image upload, `minigrito:{indice, entrada}` payload). `MessageItem` renders its thread inline when the entry has `minimsgs` (legacy behavior: threads visible in the foro feed, not just detail) or always on the detail page (`forceThread` via `MessageDetail`). `FormContext.submitMessage` now posts **JSON** (Backbone.sync parity — FormData would have mangled the nested `minigrito`).

**Ciudadanos walls:** `/ciudadanos/:id` now routes to `ForoPage` (was misrouted to MensajePage), which detects wall mode and renders legacy's wall header card (background image variant, big dreamy avatar, "Bienvenid@ a mi muro!" fallback) + the wall's message list from `index.cgi?ciudadanos/<id>/` + head from `head.cgi?/ciudadanos%2F<id>%2F`. Topic foros also gained the legacy `foro-description` card variants (plain / image-background). Sidebar now shows on walls too (`Layout` detects the id-only param).

**Verified in-browser vs live API:** `/kingcrimson/38603` shows the real head title ("king Crimson"), the full comment thread (4+ replies from jajani/AGA/daledebil) under the main card; `/ciudadanos/5726` renders AGA's wall with header card, avatar, welcome banner and wall posts. Reply form correctly absent logged-out. 16/16 tests, build clean. Reply posting not exercised (needs login).

Deferred/known: Header still shows slug-derived title (not head Titulo) and no `ciudadano` class variant; sidebar gallery link on walls goes to `/ciudadanos/<id>/gallery` which no route handles (legacy was equally broken — it bounced back to the wall); read-state tracking (`NotificacionesUserModel`) still Phase 5.

### 2026-07-19 — Phase 3 (composer parity) — ✅ DONE (build + browser-verified)

Converted the plain-`<textarea>` composers to legacy's `contenteditable` rich composer.

New files (written):
- **`utils/contentEditable.js`** — selection/caret helpers ported from legacy `formView` (`saveSelection`, `restoreSelection`, `insertHtmlAtRange`, `sanitizePastedText`, `elementContainsSelection`), decoupled from jQuery/Backbone.
- **`components/RichComposer.jsx`** — shared `forwardRef` contenteditable composer. Uncontrolled (React never reconciles the editable subtree); host reads via imperative handle `getHtml/clear/insertHtml/focus/isEmpty` and hears edits via `onContentChange`. Paste sanitization, caret-preserving emoji/HTML insertion (fixes bug #10), embedded selection WYSIWYG, optional `submitOnEnter` (reply/msg type).
- **`components/Wysiwyg.jsx`** — was a 0-byte stub; now the selection toolbar (bold/italic/link/XL/M/XS/spoiler) via `document.execCommand`, using `onMouseDown`+`preventDefault` so the selection survives the click.
- **`components/EncuestaForm.jsx`** — poll creation UI ported from `encuestasForm` (growing option inputs, Enter adds+focuses next, delete option; `getEncuesta()` returns legacy-shape JSON with html-entity-encoded, empty-filtered options, or null).
- **`components/TagsEditor.jsx`** — multi-foro tag chips (max 5, `#`-prefixed, word-char, min 3 / max 10 chars; Enter/comma commits).

Rewired (done):
- **`FormShell.jsx`** — now uses `RichComposer` + `EncuestaForm` + `TagsEditor`, a per-grito dreamy selector (reuses existing `DreamysModal` via `openModal({dreamys, uploadAvailable, formModel})` with a Backbone-model-shaped shim that captures `emocion`), and **contextual placeholders** ("Escribe en el muro de X" / "Explayate… en el foro de X" / default) from the current foro/wall head. **Bug fixed in passing:** posting from a wall (`/ciudadanos/:id`) previously went to `foroscomun` (the `foro` param is undefined there → `normalizeForo` → foroscomun); FormShell now detects wall mode and targets `ciudadanos/<id>`.
- **`EditFormModal.jsx`** — `<textarea>` → `RichComposer` (seeds `initialHtml` from the edited message via a `useState` initializer since ModalRoot remounts it per open); emoji insertion + submit now read the composer.
- **`ReplyForm.jsx`** — `<textarea>` → `RichComposer` with `submitOnEnter`/`onEnterSubmit`; submit reads `getHtml()` (strips `&nbsp;`/`&amp;`), guards on `isEmpty()`, clears via the handle. Emoji insertion goes through `composerRef.insertHtml`.

**Verification (2026-07-19):** `npm run build` clean. Browser-driven against the live API via headless Chrome + CDP, forcing the auth-gated composer to render by stubbing `login.cgi` (client-side composer behaviour needs no real session; nothing was submitted to the server):
- Composer renders as a `contenteditable` DIV (not a textarea); contextual placeholder correct on a topic foro ("Explayate a tu gusto en el foro de king Crimson", head loaded live).
- **Bug #10 fixed & confirmed:** picking an emoji inserts a rendered `<img class="emojione">` node into the editor (both `FormShell` and `ReplyForm`), not literal HTML source.
- WYSIWYG toolbar appears on text selection with all 7 buttons (B/I/A/XL/M/XS/SP); Bold wraps the selection in `<b>`.
- Poll toggle reveals `EncuestaForm`; tag entry commits chips (`#musica`, then `#rock` via comma).
- `ReplyForm` on `/kingcrimson/38603` renders the contenteditable reply box with emoji-as-`<img>`.
- No runtime exceptions; only React `defaultProps` deprecation warnings (pre-existing, from `Emoji`/`MessageItem`/`MiniThread`, unrelated to Phase 3).

URL capture & preview (item 19), added 2026-07-19:
- **`utils/captureUrl.js`** — pure ports of legacy `getCaptureUrls`/`isThisUrl` (URL extraction from the composer text: drop existing cards, strip tags/emails, regex-match, protocol-strip, dedupe, skip youtube/facebook/invalid-TLD) + `buildCapturedUrlCard` DOM builder (replaces the `_.template(displayCapturedUrl.html)` + `window.imgError`, which don't exist in React; broken images are left in place, matching legacy's no-op `imgError`).
- **`utils/socketEvents.js`** — added `onCaptureUrlReply(userId, handler)` (the shared `Ws` singleton already fires `capture_url_reply_<user>` on `vent`).
- **`RichComposer.jsx`** — optional `captureUrls`/`userId` props: scans on input, requests each new link via `Ws.captureUrlRequest` (capped at 5, tracks captured/removed/pending so keystroke bursts don't re-request), appends a preview card into the editor on reply, delegates close-button removal (raw-DOM cards the editor owns, not React children), and strips `.capture-url-close` in `getHtml()` for submit parity. Wired into `FormShell`, `ReplyForm`, `EditFormModal`.
- **Verified (2026-07-19, browser + CDP):** typing `https://example.com/articulo` emits one capture request with the protocol-stripped URL; injecting a reply on the real `vent` bus appends a `contenteditable=false` card with title/description/image; re-scanning doesn't re-request the carded URL; the × button removes the card; a dismissed URL is not re-requested. (The socket **transport** to gritos.com wasn't exercised — verified the request/subscription/render code paths via the real `Ws`/`vent` singletons.)

Still to do (Phase 3 leftover):
- Logged-in **submit** paths (actually posting a grito/reply, poll payload round-trip, image upload, and the live socket URL-capture round-trip) still untested — no real credentials; only the client-side composer behaviour was exercised.

### 2026-07-19 — Phase 4 (secondary views) — ✅ core DONE (build + browser-verified); 2 items deferred

Items 21–23 (the substantive, viewable secondary-view parity):
- **Votaciones (item 21)** — `VotacionesPage.jsx` rewritten to render the real `MessageItem` cards (was a bare `<ul>` of titles), filtered to poll entries (`encontrar: "encuesta"`), each normalized via `normalizeMessage`, with infinite scroll. Composer stays visible (it lives in Layout). Supports `/ciudadanos/:id/votaciones` (wall polls) too.
- **Gallery (item 22)** — `GalleryPage.jsx` now renders an image-tile grid inside a `.gallery` container (the CSS the legacy `galleryView` targeted) with infinite scroll; `GalleryItem.jsx` rewritten to the legacy `galleryMsgView.html` markup — an **image-only** square (`.img-gallery` background-image, `IMAGEN0_URL`→`IMAGEN1_URL` fallback, no title/description) with a hover forward-chevron link, and returns `null` for entries without an image. Layout hides the composer **and** the right sidebar on the gallery route (`/…/gallery`) and adds a `galeria` class for the full-width layout.
- **Sidebar (item 23)** — already done in Phase 0 (foro passed through, hidden on foroscomun, corrected `encontrar` values, invented "Últimos Gritos" widget removed); confirmed still correct on the secondary views.
- **Shared cleanup** — extracted the duplicated scroll listener into `hooks/useInfiniteScroll.js`, now used by ForoPage, VotacionesPage and GalleryPage.

**Verified (2026-07-19, headless Chrome + CDP vs live API, login stubbed):** `/kingcrimson/votaciones` → **29** real cards, **30** encuesta blocks rendered, composer **present**, heading "Votaciones de king Crimson", no exceptions. `/kingcrimson/gallery` → **10** image tiles all with background images + forward links, **no** text, composer **absent**, `.content.galeria` full-width class applied, first tile links to `/kingcrimson/38596`, no exceptions. Screenshots captured (clean 3-column full-width grid; votaciones cards with polls).

Items 24 & 25, built 2026-07-19 from the `master` source (the deleted `mainView.js`/`mainView-t.html` hold the exact logic):
- **Item 24 (hover user-list popup)** — `components/UserListPopup.jsx`, mounted once in Layout. A single delegated `mouseover [data-userlist]` listener (mirroring legacy `mainView.openUserList`) floats a `.user-list` panel above whichever mola/love/nomola icon (already carrying `data-userlist`/`data-userlisthead` from Phase 1) is hovered, fetches those users (`indice=ciudadanos&encontrar=listar:<log>`), and renders each with their dreamy + `alias_principal`; clicking a user navigates to `/ciudadanos/<ID>`. Hover-intent (200 ms close, cancelled on entering the panel) so users can click into it.
- **Item 25 (foro admin gear)** — a `.foro-admin` cog on the ForoPage head, gated by the exact legacy condition (owner in the pipe-separated `Userid`, the wall owner on a `ciudadanos` wall, or `nivel > 7`; never on foroscomun). Clicking it opens the existing `EditFormModal` with `{ msg: head, isHead: true }` and header "EDITAR FORO" / "EDITA TU MURO" — reusing all the head-edit save logic already there.

**Verified (2026-07-19, headless Chrome + CDP vs live API, login stubbed as user 17426 = kingcrimson's owner):** gear **present** on `/kingcrimson`, **absent** on `/foroscomun`; clicking it opens the edit modal pre-filled (title "king Crimson", intro loaded, header "EDITAR FORO"). Hovering a `love` icon (data-userlist `17426`) floated the panel and fetched the real user — showed "love" → **jajani** with avatar; 123 `[data-userlist]` triggers on the page. Screenshots captured. (Pre-existing, unrelated: `window.imgError is not a function` throws from legacy message-image `onerror=` handlers — that's Phase 6 item 30, not introduced here.)

Still deferred: **post-create navigation to a newly-created topic foro** (item 25's second half) — a logged-in write flow, unverifiable without real credentials.

### 2026-07-19 — Logged-in verification with a real admin session (uid provided)

Ran the app against the live API with a **real admin `uid`** (`1x…`, user "Nacho", nivel-high) — no login stub. Constraint honoured: **nothing published** (no post/reply/edit-save/delete); the one mola click was toggled back to baseline.

- ✅ **Real login flow** — `city` cookie uid → real `login.cgi` → UserContext loaded the actual user (alias "Nacho", real dreamy avatar from dreamers.es), composer visible.
- ✅ **Admin menu renders** on message cards (`.show-admin`) for the nivel-high user — the Phase 1 admin affordance, seen logged-in for the first time (edit/delete not clicked).
- ✅ **Foro admin gear (item 25)** confirmed with real admin perms on `/kingcrimson`.
- ✅ **mola/love/nomola write round-trip** — clicking mola on a card went `count 0→1, active→true` **from the server-persisted `saveMessage` response** (`fetchMessage`→toggle→PUT→re-render); clicking again returned it to `0/false`. `pre === afterRestore` → **live state restored, no trace left**. This is the first real confirmation of the Phase 1 vote write path (previously render-only).
- ✅ **Notifications UI** — button + panel render; showed the real empty state ("No tienes nuevas notificaciones"), no badge.
- ⚠️ **Environment limit — socket.io does not connect cross-origin from `localhost:3001` → `gritos.com`** (`ws.socket.connected === false`). So the socket-dependent features can't be exercised in this dev setup: **live notifications feed** (`prepararNotificaciones`/`notificaciones_<uid>`), **URL-capture transport** (the real `capture_url_reply`), and **live message/avisos push**. All are same-origin in production, so this is a dev-only limitation, not a code defect. URL-capture's request/render code path was already verified via injected reply (Phase 3); only the transport remains prod-only.
- Pre-existing, unrelated: the `window.imgError is not a function` throw recurs (legacy image `onerror=`, Phase 6 item 30).

Net: everything **HTTP-based** and login-gated is now verified end-to-end (login, admin affordances, mola writes). What's left genuinely needs either production (same-origin socket) or a deliberate write we're not doing (posting/voting): the live realtime layer and content-submit paths.

### 2026-07-19 — Ran the socket server locally → found a migration-breaking version mismatch + verified URL-capture end-to-end

Ran the local socket server (`../Git/gritos-socket`, patched to http + the client's `/ws/socket.io` path) to exercise the realtime layer.

- 🔴 **BLOCKER — socket.io protocol mismatch.** The React app ships **`socket.io-client` 4.8.3**; the socket server is **`socket.io` 1.7.2**. Engine.IO v4 vs v3 — they **cannot handshake**. Empirically confirmed: the app's own v4 client against the v1.7.2 server → `connect_error: "server error"`, the server never logs a connection. **The entire realtime layer is dead against this server: live notifications, live message/reply push, avisos, mola broadcast, and URL-capture transport all silently fail to connect.** This is almost certainly why the socket showed `connected:false` against production too. **Fix: upgrade `gritos-socket` to socket.io 4.x** (the server API is largely compatible — namespaces/rooms/`in().emit()` — needs a modest port; downgrading the client is the wrong direction). See new bug #11.
- ✅ **URL-capture verified end-to-end over a version-matched socket.** Stood up a socket.io **4.x** server reusing the real `capture_url_request` logic (`node-metainspector`), pointed the app's socket at it, logged in for real, typed `https://github.com` in the composer → the app connected, emitted `capture_url_request`, the server scraped the page and emitted `capture_url_reply`, and the composer rendered a real preview card (title "GitHub · Change is constant…", description, and the og:image loaded). Screenshot captured. So the Phase 3 URL-capture feature is **fully correct**; it was only ever blocked by the server version. (`endpoints.socket` was pointed at `http://localhost:8081` for the test and **reverted** to `https://gritos.com`; the temporary patch file was removed from the socket repo.)
- Note: `node-metainspector` (the server's ancient `request`-based scraper) fails on some hosts (e.g. wikipedia → `error null`) but works on many (github/bbc/nodejs/gritos.com) — a server-side scraper robustness issue, independent of the client.

### 2026-07-19 — gritos-socket upgraded to socket.io 4.8.3; Phase 5 item 27 (notifications) mostly done

**`gritos-socket` upgrade (bug #14):** branch `upgrade-socketio-4`, commit `ea20b66`, not deployed. `socket.io` 1.7.2 → 4.8.3, `package-lock.json` added (none existed before), explicit CORS added (`gritos.com` + `localhost:3001`). Verified with the real package versions installed (not a mock): full handshake + event round-trip for `subscribe`/`update`/`prepararNotificaciones`/`capture_url_request`, and CORS enforcement confirmed via raw HTTP headers (a browser client, not `curl`/Node, is what actually enforces CORS — the header check is the correct way to verify server behavior here). `npm run build`/`npm run lint` on the socket repo unaffected (187 pre-existing lint errors, all in generated `dist/`, identical before/after).

**Notifications (Phase 5 item 27), in the main app:**
- New `utils/notificacionesReadState.js` — a close 1:1 port of legacy `NotificacionesUserModel`: fetches/saves `index.cgi?notificaciones/<uid>`, exposes `update(tipo, foro, lastEntry, subtipo)` and `addNotificaciones(notis)`. Deliberately preserves a legacy quirk: it only ever *advances* an existing watermark, it never initializes a new `tipo` key from `update()` (only `addNotificaciones()` can create one) — matching the deployed model's actual behavior, not "fixed."
- Wired into `NotificationsContext` (load on login / clear on logout; `markNotificationAsRead` now persists the `msg`/`yo` watermark, matching legacy `toggleNotificaciones`'s exact tipo filter), `FormContext` (the `// TODO: Emit notification update event` replaced with a real `addNotification` call — required flipping provider nesting in `index.js` from `FormProvider > NotificationsProvider` to `NotificationsProvider > FormProvider` since Form now depends on Notifications), `useForumMessages` (foro list — advances on initial fetch, pagination, and live socket push), and `MiniThread` (minis — same three call sites).
- **Bug found and fixed:** `NotificacionesItem.jsx` read `entry.citizen?.alias_principal` for mola/nomola/love notifications, but the server (`gritos-socket/src/index.js` `emitNotificacion`) puts `citizen` at the **top level** of the payload, not nested in `entry`. Every such notification was silently rendering "Alguien" instead of the real actor's name. Fixed to read `data.citizen`.
- **Verification:** unit tests first — `notificacionesReadState.test.js` (10 cases — load/save wiring, prefixing, per-subtype mola/nomola/love tracking, the "never self-initializes" quirk, the 10-room cap, logged-out no-ops), `NotificacionesItem.test.js` (2 cases, covers the citizen-field fix), `FormContext.test.js` (3 cases, covers the `addNotification` wiring for both top-level and reply posts, and the no-notify-on-failure path). Full suite: 31/31 pass. `npm run build` clean.
- **Browser-verified** with the same real admin `uid` used in the 2026-07-19 session above (set directly via the `city` cookie, same code path `UserProvider` uses to resume a session — no credentials entered, nothing published): logged in as "Nacho", `Notificaciones` nav item present, panel opens showing the exact legacy empty-state string ("No tienes nuevas notificaciones"), no console errors anywhere in the new code paths. `ForoPage` (→ `useForumMessages`'s new `update('foro', …)` call) and a real `MiniThread` reply from live data (→ its new `update('minis', …)` call) both rendered without error. **Still not exercised: an actual live push** (`notificaciones_<uid>` event with real content) — the dev socket can't reach production (cross-origin, and bug #14 isn't deployed yet), so the read-state *write* paths are confirmed live but the *receive* path is only unit/synthetic-tested (see the URL-capture entry above for why: verified against a version-matched local socket, not production).

Still open for Phase 5: item 26 (FB login) — `LoginStatus.handleFbLogin` still only `console.log`s the response, exactly as legacy's `fBlogin` did, so this is parity-with-a-stub rather than a gap; a real `fbView` port is a separate decision. Item 28 (avisos banner) done. Item 29 (dreamys persistence) done — see #29 in the Phase 7 table.

### 2026-07-20 — gritos-socket deploy debugged and fixed live; Phase 5 item 28 (avisos banner) done

**Production outage diagnosed and fixed (bug #14 fully closed).** After the socket.io 4.8.3 deploy, `gritos-socket.service` was crash-looping. Root cause was unrelated to the version bump: the systemd unit's `Environment=PATH=/usr/bin:/usr/local/bin` resolved the `#!/usr/bin/env node` shebang to `/usr/bin/node` (**v6.17.1**, ancient CentOS/EPEL) instead of `/usr/local/bin/node` (**v12.19.0**, the intended runtime) — the service had silently been running Node 6 all along, and socket.io 4.x's `async close(fn) {}` syntax is what finally broke on it. Fixed by swapping the PATH order in `/usr/lib/systemd/system/gritos-socket.service` (backed up first), `daemon-reload` + `restart`. Verified via SSH: process stable under the correct binary (`/proc/<pid>/exe`), and from the client side: `curl` handshake against `https://gritos.com/ws/socket.io/…` returns `200` with correct CORS headers, and the real `react-migration` dev client connects (`connected: true`, upgraded to native `websocket` transport).
- **Follow-up, not yet done:** Node 12.19.0 is itself EOL; CentOS 7's glibc caps native Node installs around v18. Bump-in-place vs. containerize is still an open decision.

**Avisos banner (Phase 5 item 28).** A draft `AvisosBanner.jsx` already existed but didn't match legacy `avisosView.js`: it used a naive per-event increment instead of legacy's per-room **ID-diff** counting (`counters[room] = entry.ID - 1` on first sight, `nuevos = entry.ID - counters[room]` thereafter — so a single update that jumps several IDs is counted correctly, not as "1"), showed an accumulated global count instead of legacy's "latest room wins, overwrite" behavior, and had no click-to-navigate-and-clear. It also used made-up CSS classes (`avisos-banner__*`) that don't exist in `main.less` — the real stylesheet only styles `.avisos-main` (position/pill/cursor), so the old draft would have rendered completely unstyled. Rewrote to match legacy exactly, reusing `.avisos-main`.
- **Verified:** 7 new unit tests (`AvisosBanner.test.js`) covering the ID-diff baseline, ID-delta counting, thread-room filtering, `collection:` prefix stripping, latest-room-wins display, and click-to-clear. Hit a real jsdom gap along the way — `react-router-dom`'s dependency chain needs `TextEncoder`/`TextDecoder`, which jsdom doesn't provide; added to `src/setupTests.js` (a general fix, not test-specific, since this is the first test to import `react-router-dom`). Full suite: 38/38 pass, build clean.
- **Browser-verified live**, via a temporary `vent` trigger simulating a real socket `avisos` event against the actual running dev server: the pill rendered with the correct copy, position, and pill styling (confirming the CSS-class fix), and clicking it cleared the pill correctly.

### 2026-07-20 — UI audit (deployed vs branch, logged-out & logged-in), FontAwesome icons fixed

Side-by-side audit at 1280/1440px, both auth states, against the live deployed app. Findings:

**🔴 FIXED — FontAwesome icons were completely missing (empty boxes).** Every `fa-*` icon in the app (card go-to-message chevron, share, mola/love/nomola ♥👍👎, thread controls, admin affordances) rendered as an empty box. Root cause: the FA font files were never present at the path the compiled `@font-face` points to. `main.less` imports `font-awesome.less` with `@fa-font-path: "../fonts"` → `url("../fonts/fontawesome-webfont.woff2")`, resolving to `src/fonts/` — but only `MaterialIcons`, `Montserrat`, `newdreamers` etc. lived there; the FA fonts did not (webpack used to bundle them from `node_modules`; Vite needs them resolvable on disk). Vite couldn't resolve the `url()`, left it as a literal `/fonts/…`, and the dev server answered that path with the SPA `index.html` fallback (`Content-Type: text/html`) → `@font-face` parse error → `document.fonts` reported `FontAwesome error` → no glyphs. Material Icons worked because their file *did* exist in `src/fonts/`, so Vite fingerprinted the URL. **Fix:** copied `node_modules/font-awesome/fonts/fontawesome-webfont.*` into `src/fonts/` (matching the existing convention). Verified: `document.fonts` now `loaded`, dev URL resolves to `/src/fonts/…`, prod build fingerprints them into `dist/assets/` — icons render in both dev and prod, logged-out and logged-in.
  - Related, **not** fixed (harmless): the blanket `@import bootstrap.less` pulls in a `glyphicons-halflings` `@font-face` that 404s the same way (build warns), but **no component uses `glyphicon` classes**, so nothing renders wrong. The whole-Bootstrap import is bloat → Phase 6 (item 31).

**🟢 FIXED — the header/nav now matches the deployed hamburger design.** Deployed uses a *compact, hamburger-only* header at **every** width (verified to 1440px): hamburger (opens a left drawer with the "TOP" foro list + privacy link) · centered logo/title · right side = notificaciones + "Log In"/power (logged out) or avatar + "Nacho ▼" (logged in). The React branch had invented a desktop horizontal text nav (`Foros / Galería / Votaciones`) with no hamburger and an unreachable drawer.
  - Root cause the drawer was dead: MDL's `material.min.js` upgrades the DOM on `DOMContentLoaded`, before React mounts, so the `mdl-layout` never got upgraded — no hamburger button injected, `componentHandler` wasn't even on `window`. The `Drawer`/`ResumenNav` (TOP foro list) markup existed but was unreachable.
  - **Fix:** made the drawer **React-controlled** (not dependent on MDL's JS). `Layout` owns `drawerOpen` state + renders the `mdl-layout__obfuscator`; `Header` renders a real `mdl-layout__drawer-button` hamburger wired to it; `Drawer` toggles MDL's `is-visible` class (the CDN MDL *CSS* is loaded, so the slide transform works). Drawer auto-closes on navigation (`useEffect` on `pathname`). Removed the invented `Foros / Galería / Votaciones` header links — deployed reaches gallery/votaciones via the **right-sidebar thumbnails** (per-foro), not header nav, and foro browsing via the drawer. Rewrote `ResumenNav` to match the deployed `resumenView`/`resumenItemView` exactly: `nav.resumen-collection.mdl-navigation` with `.mdl-navigation__link` items, `gritos/`/`foros/` prefix stripped for both display and route (`resumen.cgi` returns `name: "gritos/kingcrimson"` → shows "kingcrimson" → `/kingcrimson`), TOP subheader, nuevo-tema form, and the `privacidad / legal` link pinned at the drawer bottom.
  - **Verified in-browser** (1280px, logged-out and logged-in): hamburger opens the drawer with the clean TOP foro list, clicking a foro navigates + auto-closes the drawer + reveals the right sidebar (gallery/votaciones thumbnails), header shows the foro title; logged-out shows Log In + power. 38/38 tests pass, build clean.
  - **Remaining minor gap:** deployed shows a small globe/`public` Material icon left of the login area (function unclear — likely language/i18n); not yet ported. Left as a follow-up rather than guessing its behavior.

**Auth-state differences (both versions behave the same *shape*, once FA is fixed):** logged-out = read-only feed + header login affordance; logged-in adds the expanded top composer ("Sueltate! Grita! (en tu muro).", camera/emoji/poll), per-card mola/love/nomola buttons, an inline reply composer under each card, and a per-card actions chevron. After the FA fix the React logged-in card icons render correctly. Composer placeholder text now matches deployed. (Minor still-to-confirm: deployed's top composer shows a **tag** icon between emoji and poll; the React top composer toolbar shows image/emoji/poll — a `TagsEditor` component exists in the branch, so verify whether the tag affordance is wired into the main composer or only contextually.)

---

## Part 1 — Full inventory of the deployed app vs. React status

Legend: ✅ ported · 🟡 partial · ❌ missing · 🐞 present but broken

### 1. HTML shell / SEO / analytics

| Deployed behavior | Source | React status |
|---|---|---|
| OpenGraph + Twitter card metas, `fb:app_id`, description/keywords/author | deployed `index.html` | ❌ `index.html` has only charset/viewport/title |
| PWA: `manifest.json`, full apple/android icon set, theme-color, google-site-verification | deployed `index.html` | ❌ missing (offline-plugin was dropped with webpack — intentional, but manifest/icons/metas should return) |
| Google Analytics (UA-108283891-1) + AdSense (`ca-pub-5436524166740759`) | deployed `index.html` | ❌ missing |
| `window.imgError` global img-fallback to `/imagenes/vacio.gif` | deployed `index.html` | ❌ missing (captured-url template relies on it) |
| `<noscript>` message | deployed `index.html` | ❌ missing |
| Versioned deploy path `/dist/<version>/…` | webpack config (deleted) | ❌ no deploy story for the Vite build yet |
| MDL css/js | shell | ✅ (CDN 1.3.0 in index.html + npm `material-design-lite` in index.js — double-loaded, pick one) |

### 2. Routing (`router.js` → `App.jsx`)

| Deployed behavior | React status |
|---|---|
| `/:foro`, `/:foro/gallery`, `/:foro/votaciones`, `/:foro/:id`, `/:foro/:id/votaciones`, fallback | ✅ routes exist (plus new `/​:foro/usuarios`) |
| Reserved foros (`admin`, `ciudadanos`, `jsgritos`) → `foroscomun`; foro slug sanitization (`[^\w/]` rejected) | 🟡 `normalizeForo` covers reserved names; no slug sanitization |
| **`/ciudadanos/:id` = a user's wall**, rendered as a *foro* (head + message list + composer with "Escribe en el muro de X"), not a message detail | 🐞 React routes `/ciudadanos/:id/*` to `MensajePage` (single-message semantics). Whole "muro" concept is missing |
| `/:foro/:id` = foro view filtered to one grito **with its comment thread and reply form** | 🐞 see §5 — thread/replies/reply-form missing, and the fetch is broken |
| Unsaved-form guard on navigation (`Util.checkForms` confirm + history revert) | 🐞 `useNavGuard` exists but reads `isDirty` from `FormContext`, which never provides it (always `undefined` → guard never fires). Predicate also uses `currentValue` instead of `currentLocation`. Legacy `beforeunload` warning also missing |
| Scroll to top on foro change; animate scroll to ~380px on entering a message | 🟡 `ScrollToTop` handles the first; no detail-scroll behavior |
| Global interception of `<a href>` clicks to route internally | ✅ obsolete (react-router `Link`) — but any `dangerouslySetInnerHTML` content with internal links now does full page loads |

### 3. Header (`mainView-t.html`, `loginView`, `notificacionesView`)

| Deployed behavior | React status |
|---|---|
| Title = `Titulo` from `head.cgi` (falls back to "gritos.com"); small-screen shows `#foro`; `ciudadano` class variant on user walls | 🟡 Header shows slug-derived `#foro`/"Gritos.com" only; never the real head title; no ciudadano variant |
| Logo (masked SVG) → home | ✅ |
| Notifications globe icon, MDL badge with unread count | 🟡 replaced by a text button "Notificaciones"; acceptable but visually different |
| Login: alias/password dropdown form, error display | ✅ (header dropdown, as deployed — see #58) |
| **Facebook login**: `FB.Event.subscribe('auth.authResponseChange')` → `/me` fields → POST `emaillogin.cgi` → set user + `city` cookie (`fbView.js`) | 🐞 `LoginModal.handleFbLogin` calls `FB.login` and only `console.log`s the response. `fbView` flow was never ported → **FB login does nothing** |
| Sign-up modal: alias/email/password with live availability checks against `check.cgi`, submit → `registro.cgi` + cookie | ✅ `SignUpModal` + `RegistrationContext` (tested) |
| Logged-in menu: avatar (dreamy_principal → FB_picture → default gif), alias, Dreamys modal, Log Out (`FB.logout` + cookie clear) | 🟡 present, but placeholder avatars use `via.placeholder.com` instead of bundled `dreamy4.gif`; Dreamys menu icon likewise |
| Session restore from `city` cookie (incl. legacy `uid::<x>` cookie format fallback) | 🟡 JSON cookie restore works; legacy `uid::` format fallback dropped (probably fine) |

### 4. Drawer (`resumenView`)

| Deployed behavior | React status |
|---|---|
| "TOP" link + `resumen.cgi` foro list | ✅ `ResumenNav` |
| Drawer title shows current head `Titulo` | 🟡 hard-coded "Gritos.com" |
| Nuevo Tema/Foro: sanitize name, `head.cgi` existence check, "ése ya existe" error, open head-edit modal (`isHead`, `INDICE: gritosdb`) | ✅ flow exists |
| After creating the foro: navigate to `/<Name>` and load it | ❌ `EditFormModal` just closes the modal |
| "privacidad / legal" link (dreamers.es) pinned at drawer bottom | ❌ missing |

### 5. Foro page & message cards (the core product — `mainView`, `msgView`, `molaView`, `miniMsg*`)

**Foro page chrome:**

| Deployed behavior | React status |
|---|---|
| `foro-description` card: `comments`/`INTRODUCCION` HTML, `IMAGEN0_URL` background image variant | 🟡 intro HTML only, no image background variants |
| Ciudadano wall header: background image, big dreamy avatar, "Bienvenid@ a mi muro!" fallback | ❌ (no wall at all) |
| `foro-admin` gear (visible to foro owners via `Userid`, wall owner, or `nivel > 7`) → EDITAR FORO / EDITA TU MURO modal | ❌ missing |
| Infinite scroll (`index.cgi?foro&init=<firstEntry>`) | ✅ + explicit "Cargar más" button |
| MDL spinner during collection fetches | 🟡 text placeholders instead |
| FAB `+`: focus composer, or open login menu when logged out | 🟡 scrolls to form; when logged out the form renders `null` so the FAB does nothing |
| Live insert of new gritos via socket `updated_collection:<foro>` (slide-down animation, prepend) | ✅ wired in `useForumMessages` |
| **Own submissions appear immediately** (legacy adds the response to the collection on success) | 🐞 React relies on the socket echo; for `foroscomun` posts `FormContext` never calls `Ws.update` (no `foro` attr → no room), so **your own grito doesn't appear until reload** |

**Message card (`msgView-t.html`)** — the biggest gap. Deployed features per card:

| Deployed behavior | React status |
|---|---|
| Author name linking to `/ciudadanos/<id>`, date `moment.fromNow` (Spanish) | 🟡 present, but `moment.locale('es')` is never set in React (`app.js` did) → **dates render in English** |
| `emocion` (per-grito dreamy) shown beside card | ✅ |
| Comments HTML with: `-:SPOILER[…]SPOILER:-` → click-to-reveal tooltip; `target="_blank" rel=noopener` forced on links; Autolinker URL linking; **YouTube URLs → embedded iframe player** | ❌ raw `dangerouslySetInnerHTML` only |
| Images: lazy-load (IntersectionObserver + fade-in), vertical/horizontal sizing classes, `vacio.gif` placeholder | 🟡 plain `<img>`, no lazy load |
| Multiple images → **slick carousel** (responsive breakpoints, dots/arrows) + click-to-zoom overlay (`imagen-modal`, `img-hover` when height > 364) | ❌ stacked images only |
| **Mola / No-mola / Love** buttons: counts as MDL badges, font-awesome animations, optimistic toggle (fetch → edit `molalog/nomolalog/lovelog` pipe-lists → save), only for logged-in users | ❌ empty `.mola-view` placeholder div |
| **Hover user-list popup** on vote counts / mola icons (`data-userlist` → `json.cgi?indice=ciudadanos&encontrar=listar:<ids>` popup with avatars) | ❌ missing (a `/​:foro/usuarios` page was invented instead — not a deployed feature) |
| Share menu: Facebook sharer + Twitter (popup via `Util.bookmarkthis`) | ❌ missing (`util/socialShare.js` exists unused) |
| Admin menu (logged-in): 🚫 ban/report (stub), 🗑 delete (owner, foro-owner or `nivel>7`) with confirm modal → `DELETE index.cgi`, ✏️ edit own grito → edit modal, 📊 open/close own poll | ❌ missing entirely |
| **Encuesta block**: options sorted by votes, vote/unvote (`fetch` → mutate `option.log`/`votos` → save), single vote per user enforced, "(cerrada)" state, vote counts with hover user-list | ❌ missing |
| Tags footer: `publicados` + own-foro chips linking to each foro (`#foro` / `@user`) | ❌ missing |
| Forward chevron → `/foro/id` | ✅ |
| **Mini-messages (comment thread)**: on `/:foro/:id`, fetch `index.cgi?<INDICE>/<ID>/`, newest-first, "…more" pagination (`previousMsgView`), live socket updates, per-comment mola/love, **reply composer** (Enter submits) | ❌ `MessageDetail` renders one card and an empty `message-replies` div |
| Per-message socket subscription (`msg_<INDICE>/<ID>` refreshes card data) | ❌ only user model subscribes |
| Real-time read-state tracking (`NotificacionesUserModel` update on view/parse) | ❌ missing |

**Composer (`formView` — deployed) vs `FormShell` (React):**

| Deployed behavior | React status |
|---|---|
| `contenteditable` rich-text area (HTML content, emojis as `<img>`, pasted-HTML sanitization keeping only `<a>`) | 🐞 plain `<textarea>` — emoji picker inserts raw `<img …>` markup as *text* into the value, which then posts literal HTML source typed by hand. The emoji feature only works with a contenteditable |
| **WYSIWYG selection toolbar** (appears over selected text): Bold, Italic, Link (prompt), XL/M/XS sizes, Spoiler wrapper | ❌ `Wysiwyg.jsx` is a 0-byte stub |
| Image upload `upload.cgi?sessionId=` with `FICHERO_IMAGEN<n>`, thumbs preview, `Ficheros` merge | ✅ |
| **Poll creation** (`polls-place` bar-chart icon → `encuestasForm`: dynamic options, Enter adds next option, delete option, html-encoded values, submitted as `encuesta` JSON) | ❌ |
| **Per-grito dreamy selector** (dreamy button → Dreamys modal → sets `emocion`) | ❌ not in `FormShell` (modal supports `formModel` but nothing passes it) |
| **Tags editor** (`show-tags` label icon → chips, add via Enter/comma, ≤5 tags, ≤10 chars, `\W` stripped, current-foro tag undeletable) → post to multiple foros | ❌ `tags: ""` hard-coded |
| **URL capture & preview**: on space/enter, extract URLs (skip emails/youtube/facebook, ≤5), socket `capture_url_request` → `capture_url_reply` → preview card (image/title/description) inserted in the text, removable, submit waits for pending captures | ❌ |
| Reply-mode (`type: 'msg'`): Enter submits; placeholder "hmmm…" | ❌ (no reply composer at all) |
| Contextual placeholders ("Escribe en el muro de X" / "Explayate a tu gusto en el foro de X" / "Sueltate! Grita!") | 🟡 generic "Grita en \<foro>…" |
| Head/gritosdb mode: Tema (disabled) + Titulo inputs + Introduccion | ✅ in `EditFormModal` |
| `&nbsp;`/`&amp;` cleanup, empty-check, throttled double-submit protection | 🟡 trim + `submitting` flag |
| beforeunload warning with pending text | ❌ |

### 6. Gallery (`galleryView`)

| Deployed behavior | React status |
|---|---|
| Grid of image tiles (`IMAGEN0_URL` → `IMAGEN1_URL` background), click → grito, slide-in animation | 🟡 `GalleryPage` + `GalleryItem` render a list with invented title/description text; deployed shows image-only tiles |
| Data: `json.cgi?indice=gritos/<foro>&encontrar=Ficheros&max=10` + `last=` pagination, **infinite scroll** | 🟡 same query ✓ but page ignores `nextPage` — only first 10 ever load |
| Full-width layout (`content-gallery` class swap, sidebar thumbnail hidden while in gallery) | ❌ rendered inside the normal `msg-list` column; composer stays visible (deployed hides it in gallery view) |

### 7. Votaciones (`encuestasCollection` + `msgCollectionView`)

| Deployed behavior | React status |
|---|---|
| Full message cards (with working encuesta voting, mola, comments, etc.) filtered to `encontrar=encuesta`, + composer + infinite scroll | 🐞 `VotacionesPage` renders plain `<li>` text items — **you cannot vote**; also no pagination. (`/​:foro/:id/votaciones` route renders the same generic page) |

### 8. Right sidebar (`rightView`)

| Deployed behavior | React status |
|---|---|
| Hidden on `foroscomun`; on a foro/wall shows: Galería thumbnail (latest image, `encontrar=Ficheros&max=1`) → `/foro/gallery`, and Votaciones teaser (latest poll text, 50-char ellipsis, `encontrar=encuesta&max=1`) → `/foro/votaciones`; each hidden while already on that view | 🐞 `RightSidebar` requires a `foro` prop that `Layout` never passes → **always renders `null`**. Sub-widgets also drifted: `GalleryThumbnail` queries `encontrar=IMAGEN0_THUMB` (legacy used `Ficheros`), `VotacionesThumbnail` queries `encontrar=VOTACION` (legacy used `encuesta`), and an invented "Últimos Gritos" widget queries `encontrar=Resumen` (not a legacy API value) via root-level `MiniMessageList`/`MiniMessageItem` (which display `INDICE` as a title — wrong) |

### 9. Notifications (`notificacionesView` / `NotificacionesCollection` / `NotificacionesUserModel`)

| Deployed behavior | React status |
|---|---|
| On login: `Ws.prepararNotificaciones(userId)`; server pushes `notificaciones` socket events; items filtered (skip own posts unless mola-subtype) | ❌ no socket wiring at all |
| Read-state model persisted server-side at `index.cgi?notificaciones/<ID>` — pipe-encoded per-room last-read counters (`foro`, `minis`, `msg` with `mola/nomola/love` positions, `yo`), queued until loaded, max 10 rooms, updated on read/visit/post | 🐞 `NotificationsContext` **fetches that read-state URL and treats the response as the notification list**; marks read only in local state |
| Badge counter of unread; opening the panel marks all read (and persists) | 🟡 UI exists on top of the wrong data |
| Rich item rendering: dreamy/avatar, "X y N más gritaron/comentaron en …", "tu grito"/"su grito"/"el grito de X", mola/nomola/love icons, "tu muro"/"el muro de X", relative date; click navigates to the room | 🟡 `NotificacionesItem` exists (163 lines) but is fed the wrong data model |
| Posting also seeds your own subscription rooms (`add_notificaciones` after `post.cgi`) | 🐞 code computes the array then has `// TODO: Emit notification update event` — never sent |

### 10. Avisos banner (`avisosView`)

| Deployed behavior | React status |
|---|---|
| On socket `avisos`: per-room counter (diff of entry IDs), "N nuevo(s) grito(s) en #room", **click → navigate to room and clear** | 🟡 `AvisosBanner` shows a count but: counts every event globally (not ID-diff per room), has no click-through navigation, never clears |

### 11. Dreamys (avatars)

| Deployed behavior | React status |
|---|---|
| Modal: public dreamys (`json.cgi?indice=dreamys&encontrar=public`) + personal (`encontrar=ciudadano=<id>`) + FB picture entry; URL rewriting to local `/imagenes/mrdreamy/` | ✅ `DreamysModal` (FB-picture entry: verify) |
| Select → **persist** `dreamy_principal` (legacy `userModel.save` PUTs to `index.cgi?<INDICE>/<ID>`) | 🐞 React only does local `updateUser` — **avatar change is lost on reload** |
| Upload new dreamy: `upload.cgi` → posts "Nuevo avatar!" entry with `dreamy_anterior` → sets `dreamy_principal` from `IMAGEN0_THUMB` | 🟡 upload exists; verify the post + persist chain matches |
| Per-grito selection path (`formModel.set('emocion')`) | ❌ unreachable (see composer) |

### 12. Cross-cutting

| Deployed behavior | React status |
|---|---|
| `moment.locale('es')` global | ❌ **not set** in React entry |
| Socket layer (`Ws.js`: rooms, `updated`/`msg`/`notificaciones`/`capture_url_reply`) | 🔴 code kept as-is, but **`socket.io-client` 4.x can't handshake with the 1.7.2 server** — realtime layer won't connect until the server is upgraded (bug #14) |
| `backbone-fetch-cache` for thumbnail/user-list caching | ❌ n/a (fine; no caching in React either) |
| Mockup mode (`util/mockups.js`) | 🟡 wired for login + foro list only |
| Dark theme `oscuro.less` (dormant in deployed too) | ✅ equally dormant |
| `main.less` | 🟡 heavily rewritten in uncommitted changes (~1000 lines churn) — needs visual QA against deployed |

---

## Part 2 — Outright bugs in the current React code (fix regardless of features)

> **Status 2026-07-19: all fixed** (#10 resolved by the Phase 3 contenteditable conversion, browser-verified). See Progress log. Bug #0 was found during verification.

0. ✅ **`App.jsx`/`Layout.jsx`** *(found during verification)* — `Layout` rendered above `<Routes>` → `useParams()` empty in Header/FormShell/RightSidebar on every page. Fixed via layout route + `<Outlet/>`.
1. ✅ **`MensajePage.jsx:16`** — `useMessage(currentForo, id)` called positionally; hook signature is `useMessage({ foro, id })`. Message detail **never loaded**.
2. ✅ **`Layout.jsx:39`** — `<RightSidebar />` rendered without the required `foro` prop → sidebar always `null`. Now passed (null on foroscomun, matching legacy visibility).
3. ✅ **`useNavGuard.js`** — `useForm()` had no `isDirty`; predicate param typo (`currentValue` vs `currentLocation`). Guard never triggered. `FormContext` now tracks dirty state from `FormShell`.
4. ✅ **`NotificationsContext.jsx:24`** — misused the read-state endpoint as a notification feed; rewritten to socket flow (`prepararNotificaciones` + `notificaciones_<uid>`).
5. ✅ **`FormContext.jsx`** — post to `foroscomun` never triggered a local insert → new grito invisible until reload. Fixed via `utils/messageEvents.js` publish/subscribe (FormShell → useForumMessages). The `// TODO` notification emission remains for Phase 5; `minigrito` serialization noted for Phase 2.
6. ✅ **`VotacionesThumbnail.jsx`** — `encontrar: "VOTACION"` → `encuesta`; also now renders legacy's comment-teaser format (50-char ellipsis).
7. ✅ **`GalleryThumbnail.jsx`** — `encontrar: "IMAGEN0_THUMB"` → `Ficheros`, with legacy's thumb-field precedence.
8. ✅ **`RightSidebar.jsx`** — invented "Últimos Gritos" widget (`encontrar: "Resumen"`, not a real API value) removed; `MiniMessageList`/`MiniMessageItem` deleted.
9. ✅ **`index.js`** — `moment.locale('es')` restored (+ locale import + `vite.config.js` exact-match alias; see Progress log for why all three are needed).
10. ✅ **Emoji insertion into `<textarea>`** inserted literal HTML source — fixed by the Phase 3 `RichComposer` (contenteditable); emoji now inserts a rendered `<img class="emojione">` node in both `FormShell` and `ReplyForm` (browser-verified 2026-07-19).
11. ✅ **`LoginStatus` tests** (3) — rewritten against the modal-based login flow; 16/16 pass.
12. ✅ **MDL loaded twice** — npm import removed; CDN (deployed 1.3.0 theme) kept.
13. ✅ `MiniMessageItem` bogus fields — moot; component deleted with #8.
14. ✅ **FIXED (not yet deployed) — socket.io client/server version mismatch.** `../Git/gritos-socket` bumped `socket.io` 1.7.2 → 4.8.3 on branch `upgrade-socketio-4` (commit `ea20b66`), matching the *react-migration* app's `socket.io-client`. Added explicit `cors: { origin: [...] }` (v4 requires it; v1 allowed all origins). No server logic changed — namespaces/rooms/`join`/`leave`/`.in().emit()` are unchanged. Verified locally: real `socket.io` 4.8.3 ↔ real `socket.io-client` 4.8.3 handshake + `subscribe`/`update`/`prepararNotificaciones`/`capture_url_request` round-trips, and CORS header behavior confirmed via raw `curl` (allowed origin echoed back, disallowed origin gets no `Access-Control-Allow-Origin`).
    - **Deploy-ordering catch:** the currently-**deployed** production bundle (`master`, not this branch) still ships `socket.io-client` **1.7.3** — only `react-migration` was bumped to 4.8.3. Deploying the socket.io 4.x server as-is would've broken *live production* the same way the mismatch currently breaks this branch, just inverted. **Fixed with `allowEIO3: true`** (commit `2704e7c`) — socket.io 4.x's built-in support for Engine.IO v3 clients (what socket.io-client 1.x/2.x speak). Verified locally: a real `socket.io-client` 1.7.3 and a real `socket.io-client` 4.8.3 connected to the **same running server instance simultaneously** (confirmed `socket.conn.protocol` = 3 and 4 respectively), both joined the same room, and each received the other's broadcast — the exact mixed old/new deployment scenario. This decouples the socket upgrade from the React migration: **it can deploy independently, any time**, and should be dropped once the legacy Backbone bundle is retired.
    - **✅ DEPLOYED and LIVE 2026-07-20.** Diagnosed a real production outage after deploy: `gritos-socket.service` was crash-looping (`SyntaxError: Unexpected identifier` on socket.io's `async close(fn) {}`). Root cause had nothing to do with the version bump being wrong — the systemd unit's `Environment=PATH=/usr/bin:/usr/local/bin` put `/usr/bin` (Node **v6.17.1**, ancient CentOS/EPEL) ahead of `/usr/local/bin` (Node **v12.19.0**, the intended runtime) in `env node`'s resolution order. The service had silently been running Node 6 the whole time; socket.io 1.7.2 never used syntax new enough to expose it. Fixed by swapping the PATH order in `/usr/lib/systemd/system/gritos-socket.service` (backed up first) + `daemon-reload` + `restart`. Verified: process stable under `/usr/local/bin/node` (confirmed via `/proc/<pid>/exe`), `curl` handshake against `https://gritos.com/ws/socket.io/…` returns `200` with the correct `Access-Control-Allow-Origin`, and the real `react-migration` dev client connects (`connected: true`, upgraded to native `websocket` transport) and the notifications panel opens cleanly.
    - **Follow-up, not yet done:** Node 12.19.0 is itself EOL (April 2022) and was only reachable by accident on that CentOS 7 box (glibc 2.17 caps native installs around Node 18). Discussed with the user; next step is either bumping to Node 18 in place or containerizing so the runtime stops being coupled to the frozen host OS — decision pending.

---

## Part 3 — Plan to finish the migration

Ordered so each phase yields a testable, deployable improvement. "API parity" always means: same CGI endpoints and params the deployed 1.10.10 uses (`index.cgi`, `post.cgi`, `head.cgi`, `resumen.cgi`, `json.cgi`, `login.cgi`, `emaillogin.cgi`, `registro.cgi`, `check.cgi`, `upload.cgi`, socket.io at `/ws/socket.io` ns `/indices`).

### Phase 0 — Stabilize what exists (small, do first) — ✅ DONE 2026-07-18
1. ✅ Fix the Part 2 bug list. Deleted `MainLayout.jsx`; converted `Layout.jsx` to a layout route (see Progress log).
2. ✅ Restore `moment.locale('es')`; replace `via.placeholder.com` with bundled `dreamy4.gif`.
3. ✅ Fix `LoginStatus` tests. Commit still pending user go-ahead.

### Phase 1 — Message card parity (core product value) — ✅ DONE 2026-07-18 (see Progress log)
4. ✅ `MolaActions` component: mola/nomola/love with pipe-log optimistic updates, badges, FA animation classes, hidden unless logged in.
5. ✅ Comment formatting pipeline (`formatComments` port): spoiler tokens → click-to-reveal spans, Autolinker, YouTube embed, `target=_blank rel=noopener`.
6. ✅ Images: native `loading="lazy"`, vertical/horizontal classes, scroll-snap strip for >1 image (slick replacement), click-to-zoom overlay.
7. ✅ Tags footer from `publicados` + `INDICE` (dedup, `#`/`@` prefix, links).
8. ✅ `EncuestaBlock`: options sorted by votes, vote/unvote with single-vote enforcement, closed state, owner/admin open-close action.
9. ✅ Admin menu: edit (owner) → `EditFormModal`; delete (owner/foro-owner/`nivel>7`) with confirm modal → `DELETE`; ban stub; poll stop.
10. ✅ Share menu (fb/twitter popups via `util/socialShare.js`).

### Phase 2 — Threads & walls (routing semantics) — mostly ✅ DONE 2026-07-18 (see Progress log)
11. ✅ `MiniThread` + `ReplyForm`: thread fetch/pagination/socket-live/reply (Enter submits); threads also render inline in foro feeds (legacy behavior). Per-message `msg_` subscription not yet wired (card refresh on remote edits).
12. ✅ Ciudadanos wall via `ForoPage` wall mode; `head.cgi?/<encoded>` format (the `Name=` guess returned `{}` — never worked). Composer placeholder "Escribe en el muro de X" still pending (Phase 3 contextual placeholders).
13. ✅ Read-state (`NotificacionesUserModel` port): `notificacionesReadState.js` (2026-07-19), wired into list parse (`useForumMessages`), thread view (`MiniThread`), and post (`FormContext`) — see Phase 5 item 27.

### Phase 3 — Composer parity
14. Convert composer to `contenteditable` (both `FormShell` and `EditFormModal`, shared component): paste sanitization, caret-preserving emoji/HTML insertion (logic exists in legacy `formView` to port), beforeunload + nav-guard wiring (`isDirty` from content).
15. Selection WYSIWYG toolbar (bold/italic/link/sizes/spoiler) — port `main/form/Wysiwyg.js` into `Wysiwyg.jsx`.
16. Poll creation UI (port `encuestasForm`): toggle via bar-chart icon, dynamic options, html-entity encoding, `encuesta` JSON in the post payload.
17. Tags editor (chips, limits, sanitization, undeletable current foro).
18. Per-grito dreamy button → `DreamysModal` with `formModel`-equivalent callback setting `emocion`.
19. URL capture: on space/enter extract URLs (port regex + filters), `Ws.captureUrlRequest`, render preview card from `capture_url_reply`, removable, delay submit while pending.
20. Contextual placeholders; immediate local insert of own post into the visible list.

### Phase 4 — Secondary views — ✅ DONE 2026-07-19 (see Progress log)
21. ✅ Votaciones page → renders real `MessageItem`s (encuesta entries) + composer + infinite scroll.
22. ✅ Gallery → image-tile grid (no text), infinite scroll, full-width layout with composer + sidebar hidden.
23. ✅ Right sidebar → done in Phase 0 (foro from route, foroscomun hidden, correct `encontrar`, invented widget removed).
24. ✅ Hover user-list popup (`UserListPopup.jsx`, delegated `[data-userlist]` hover → `listar:<log>` panel). Browser-verified.
25. ✅ Foro admin gear (`.foro-admin` cog → EditFormModal head edit, legacy owner/nivel gating). Browser-verified. Leftover: post-create foro navigation (logged-in write, needs creds).

### Phase 5 — Sessions & realtime periphery
26. Facebook login: port `fbView` (auth.authResponseChange → `/me` → `emaillogin.cgi` → cookie).
27. 🟡 Notifications — mostly done 2026-07-19 (see Progress log), pending live socket verification (needs #14 deployed): `Ws.prepararNotificaciones` on login ✅, consume `notificaciones_<uid>` socket events ✅, legacy filtering ✅, rich items ✅ (component exists — fixed a `citizen` field bug), badge ✅, read-state persistence ✅ (`notificacionesReadState.js`, ports `NotificacionesUserModel` 1:1 including its "never initializes, only advances" quirk), `FormContext` TODO replaced with `addNotification` call ✅.
28. ✅ Avisos banner — done 2026-07-20 (see Progress log): per-room ID-diff counting, click-through navigation + clear.
29. Dreamys: persist `dreamy_principal` server-side (PUT user model), verify upload→avatar chain.

### Phase 6 — Shell, cleanup, ship
30. `index.html`: restore OG/Twitter/FB metas, icons, manifest, GA/AdSense, `imgError`, noscript; de-dup MDL.
31. Delete dead legacy code once nothing imports it: `src/js/app/main/`, `src/js/app/models/`, `router.js`, `util/displayImage*.html`, `displayCapturedUrl.html`, `mockups` leftovers; drop `backbone`/`jquery`/`lodash` deps where unused; remove `Backbone.sync` patch from `index.js`.
32. Code-split (>1 MB single chunk today); route-level `React.lazy` is enough.
33. Visual QA of `main.less` against the deployed site (both breakpoints, drawer, cards, forms, modals). → **superseded by Phase 7**, which tracks this surface-by-surface.
34. Test coverage for the ported features (mola, encuesta, thread, composer, notifications) and a deploy pipeline for the Vite build (versioned path like `/dist/<version>/`).

### Phase 7 — UI parity audit (deployed vs branch) — 🟡 IN PROGRESS (started 2026-07-20)

Systematic side-by-side of every surface against https://gritos.com, **in both auth states**, at a fixed viewport (1280×900 desktop; 375 mobile as a second pass). Method: `master` is the deployed source — read the legacy view/template for ground truth rather than eyeballing, then compare rendered output. Findings that are behavioural (not cosmetic) get filed into the numbered bug list above.

Status key: ✅ matches · 🟡 minor gap · 🔴 significant gap · ⬜ not yet audited

| # | Surface | Logged out | Logged in | Notes |
|---|---|---|---|---|
| 35 | Global chrome (header, drawer, footer) | ✅ | ✅ | Was 🔴 — invented desktop nav, dead drawer, missing FontAwesome. Fixed 2026-07-20 (see Progress log). Remaining 🟡: deployed's globe/`public` icon by the login area not ported. |
| 36 | foroscomun feed | ✅ | ✅ | Card icons fixed with FontAwesome; composer correctly logged-in-only. |
| 37 | Topic foro (e.g. `/kingcrimson`) | ✅ | ✅ | Was 🔴 — header showed the slug `#kingcrimson` instead of the head `Titulo` ("king Crimson"); an invented `PageShell` `<h2>` heading ("Foro: kingcrimson"); sidebar Galería card missing its `right-side-head` caption and carrying an invented `photo_library` overlay. All fixed 2026-07-20. |
| 38 | Ciudadanos wall (`/ciudadanos/:id`) | ✅ | ✅ | Was 🔴 — header rendered green instead of the deployed red `ciudadano` variant. Root cause was broader (see #45). Fixed. |
| 45 | **Root element class `main`** (cross-cutting) | ✅ | ✅ | Layout's root was `main-shell`, which matches **no CSS at all**, while a chunk of `main.less` is scoped under `.main` — so `.main header.ciudadano` (red wall header), link colours, card supporting-text colour, drawer title padding and the ≤680px header-row padding **all silently never applied**. Renamed to `main`. |
| 39 | Message detail (`/:foro/:id`) | ✅ | ✅ | Was 🔴 — the foro head card was missing entirely. Root cause #46. |
| 40 | Gallery (`/:foro/gallery`) | ✅ | ✅ | Was 🔴 — head card missing (#46) **and** the whole right sidebar was hidden. Deployed keeps the sidebar and hides only the Galería thumbnail (#47). |
| 41 | Votaciones (`/:foro/votaciones`) | ✅ | ✅ | Was 🔴 — head card missing (#46). Sidebar correctly keeps Galería, hides Votaciones (#47). |
| 46 | **Head card belongs to the layout** (cross-cutting) | ✅ | ✅ | Legacy renders `foro-description` in `mainView`, so the deployed app shows it on *every* foro-scoped surface (feed, single message, gallery, votaciones). The branch rendered it inside `ForoPage`, so it vanished on `/:foro/:id`, `/gallery` and `/votaciones`. Extracted to `ForoDescription.jsx` and moved to `Layout`. |
| 47 | **Sidebar visibility rule** (cross-cutting) | ✅ | ✅ | Legacy `rightView` hides the sidebar only when there's no foro (foroscomun) and otherwise hides *just the thumbnail for the view you're on* — gallery keeps the Votaciones teaser, votaciones keeps the Galería thumbnail. The branch hid the entire sidebar on `/gallery`. Also removed a duplicated nested `.right-side` wrapper (Layout wrapped a component that already renders one). |
| 42 | Modals (login, signup, dreamys, edit, confirm) | ✅ | ✅ | Login dropdown restored (#58), signup form ported (#59), modal shell rebuilt on legacy markup (#61), edit modal re-rooted (#62), dreamys picker ported (#63). |
| 61 | **The modal shell itself was reimplemented** | ✅ | ✅ | `ModalRoot` used invented `modal-root__*` BEM names backed by a near-copy of legacy's CSS — so it *looked* close while dropping two things that live only in the real `.modal-back` block: **(a)** the `lite` variant (legacy defaults `lite:true` → `max-width:400px`, and clears it for the edit/dreamys modals → 600px; the branch was always 600px), and **(b)** the `.modal-body .formulario` overrides, which are what strip the card shadow and **hide the edit form's own submit button** so the footer's OK drives it. Also restored legacy's `<h3>` header, the `fa-times-circle` close icon (branch used a `×` glyph), the always-mounted shell toggled with `hide`, and the rule that the dreamys view is only built when a uid exists. Deleted the duplicated `.modal-root` / `.modal-group` / `.modal-error` CSS (~90 lines); legacy's `btn btn-default` footer buttons are real Bootstrap, which `main.less` imports at line 3. **Verified:** signup modal 400px + footer hidden, edit/dreamys 600px + footer shown. |
| 62 | **Edit modal's root class made #57's fix inert** | n/a | ✅ | Follow-up that shows #57 was only half-done. `EditFormModal`'s root was `div.modal-body.edit-form-modal`, but every rule its markup depends on — `.file-submit`, `.emojis`, `.custom-file-upload`, `.thumbs-place`, `.mdl-card` sizing — is nested **inside `.formulario`** in main.less. So renaming the classes in #57 fixed nothing: they still matched no rule. Legacy injects a whole `formView` into `.modal-body`, so the root has to be `.formulario.active` (`.formulario` is `display:none` by default) wrapping an inner `.mdl-card`, which is also the `position:relative` containing block the absolutely-positioned icon row resolves against. **Verified after the fix:** `.file-submit` absolute at `bottom:14px left:60px`, `.emojis` at `bottom:26px left:90px` — the same coordinates FormShell was measured against in #49 — card `box-shadow:none`, and `.form-submit-button` now correctly `display:none` with the footer OK wired to the form's submit via a registered action (legacy `this.action = EditForm.submitPost`). |
| 65 | **Foro admin gear only existed on the feed** | n/a | ✅ | Found by the logged-in pass on #37–41, and the same cross-cutting shape as #46: legacy renders `.foro-admin` in `mainView`, as a sibling of the head card and *outside* its conditional, so the deployed app shows the gear on every foro-scoped surface for anyone who can edit. The branch rendered it inside `ForoPage`, so it vanished on `/:foro/:id`, `/:foro/gallery` and `/:foro/votaciones` — invisible unless you audit while logged in as an owner. Extracted to `ForoAdmin.jsx` and moved to `Layout`. It has to stay a *sibling* of `ForoDescription` rather than move into it, because that component renders nothing for a foro with no intro text while the gear must still appear. Note `.content .foro-admin` is `position:absolute` against `.content`'s `position:relative`, so it also has to stay inside `.content`. |
| 66 | **Gallery was clamped to the content column** | ✅ | ✅ | Legacy's gallery slot is a **sibling** of `.content` (`mainView-t.html`: `<div class="content">…</div><div class="gallery"></div>`, and `render()` replaces the placeholder with the gallery view's el). The branch rendered the gallery through the `Outlet` *inside* `.content`, whose `max-width: 800px` meant `.gallery-entry`'s `width: 30%` resolved against 800px instead of the full content area. `Layout` now routes the Outlet to the sibling slot on gallery routes while still rendering `.content` (head card + gear), exactly as legacy does. **Verified:** gallery 884px vs `.content` 800px, entries 265px, `galleryInsideContent: false`. Also renamed the branch's invented `galeria` modifier to legacy's `content-gallery` — both are dead CSS, but matching the name avoids a future false lead. |
| 29 | **Dreamy changes were never persisted** | n/a | ✅ | Both dreamys paths were local-only, so a new avatar reverted on reload. **(a) Selecting** called `updateUser` (React state) where legacy calls `userModel.save('dreamy_principal', img)` — a Backbone set-then-PUT that sends the *whole* model, uid included (that's how the CGI authorizes it), to `index.cgi?<INDICE>/<ID>`. Added `saveUser` to `UserContext` using the same shape `saveMessage` already used, optimistic with rollback if the server rejects. **(b) Uploading** was worse: `upload.cgi` only stores the file — legacy then posts a `"Nuevo avatar!"` entry via `post.cgi` (carrying `dreamy_anterior`) and it's *that* response's `IMAGEN0_THUMB` that becomes the new dreamy. The branch stopped after the upload and looked for `data.mensaje` on the upload response, where it never exists, so uploading a dreamy did nothing at all. Now does the full two-step. Also fixed `selectDreamy` to branch on `formModel` (the composer's `emocion`) rather than `uploadAvailable`, matching legacy's `dreamyFormModel` check. **Verified without writing to production:** patched `window.fetch` in the page to capture state-changing requests and return a stub, then picked a dreamy — got exactly `PUT https://gritos.com/jsgritos/api/index.cgi?ciudadanos/1`, a 249-key body with `uid` present and `dreamy_principal` set to the clicked image. 3 regression tests in `UserContext.test.js` (PUT shape, rollback on failure, refusal when logged out). |
| 64 | **Legacy smilies looked broken — dev-env only, not a migration bug** | ✅ | ✅ | Old message bodies embed root-relative asset paths for the classic minidreamys (`/imagenes/mrdreamy/smilies/adlo.gif`). Those resolve against gritos.com in production (verified: `200 image/gif`) and legacy never rewrote them either — but in dev they resolve against `localhost:3001`, which serves nothing there, so all 25 rendered broken. `vite.config.js` already proxied `/indices` to gritos.com; added `/imagenes`. **Lesson:** content-embedded asset roots are invisible in dev unless proxied, and look exactly like a migration regression. `/imagenes` was the only such prefix on the pages checked — everything else root-relative was an app route. |
| 63 | **Dreamys picker had invented classes too** | n/a | ✅ | Third repeat of #55's exact shape: each dreamy was a `<button class="dreamy-card">` with a caption `<span>`, and `.dreamy-card` has **no CSS**, so they rendered as default-chrome buttons instead of legacy's bare 100×100 `<img class="select-dreamy">` with its yellow inset hover glow. `.dreamys-list` / `.dreamys-modal` / `.dreamys-error` / `.dreamys-note` were likewise all CSS-less, while legacy's `.dreamys-container` (the `max-height:240px` scroll pane), `.personal-dreamys`, `.public-dreamys`, `.upload-dreamy` and the top-level `.loader` sat unused. Ported to legacy's template, including the upload tile's inner `.loading` spinner (legacy puts the `loading` class on `.upload-dreamy` itself, not the label) and prepending the FB avatar to the personal list. **Verified:** 12 personal + 396 public dreamys render as two scrollable 100×100 grids with the cloud-upload tile first. |
| 58 | **Login was rebuilt as a modal instead of the header dropdown** | ✅ | ✅ | Part 1 recorded "moved into `LoginModal`" as intentional; the user overruled it — the target is the deployed app's behaviour, not a redesign. Reverted to a 1:1 port of legacy `loginView.js` + `loginView-t.html`: the alias/password form, Sign Up and FB buttons live in `ul.login-menu` hanging off the header button, `LoginModal.jsx` is deleted, and only Sign Up / Dreamys still open modals (as in legacy `signUp()` / `dreamysModal()`). Details that only work because the markup is now literal: **(a)** the panel must be wrapped in `div.mdl-navigation__link.login-view` — the entire `.login-view {…}` block in main.less (48px `.dreamy`, the 335px panel, `.sign-up`, `.error-login`, `.fb-login`) is scoped under it; **(b)** the `ul` is always rendered and toggled with the `hidden` class (`display:none!important`, from the html5-boilerplate reset inside `material.light_green-red.min.css`), not conditionally mounted; **(c)** logged-in variant carries `short`, `desplegable` and `mdl-card mdl-shadow--4dp`; **(d)** no outside-click handler — legacy dismisses via the same button, same as the emoji popup (#54). Also restored legacy `mainView.newMsg()`: the "+" FAB pops this menu open when logged out instead of doing nothing (wired through `utils/loginMenuEvents.js`, since React has no equivalent of mainView's direct `this.loginView` handle). **Verified:** panel measures 335px wide at `top:55 right:20`, `#fafcf6`, `z-index:3` — exactly the main.less rule. **Non-bug:** content shows faintly through the panel, because MDL's own `.mdl-navigation__link` sets `opacity:.87` and legacy uses that identical wrapper — deployed is equally translucent, so this is parity, not a defect. |
| 59 | **Sign-up form validated on submit, not on keystroke** | ✅ | n/a | Same shape as #56: the React form invented `.signup-modal`/`.modal-group`/`.modal-error`, so legacy's `.sign-up-modal`, `.error-form`, `.valid-alias`/`.valid-email`/`.valid-password` and `.valid-*-load` rules were **all dead CSS**, and the MDL floating labels were gone. Behaviourally it also validated only on submit, with invented copy ("Alias mínimo 4 caracteres.") and **no availability check at all** — legacy hits `check.cgi?indice=…&value=…` on every keystroke, aborting the in-flight request, and keeps `#signupSubmit` disabled until alias, email *and* password are all valid. Ported 1:1 including legacy's copy ("Alias mu corto", "email no vale", "El alias ya está pillao", "password de 8 characteres al menos, porfa"). **Verified live:** typing `abc` shows "Alias mu corto" in the red dashed pill; a 4th character fires the real `check.cgi` and returns "El alias ya está pillao". |
| 60 | **MDL floating labels never floated** (cross-cutting) | ✅ | ✅ | MDL's floating label is pure CSS keyed off `is-focused`/`is-dirty` classes that MDL's JS adds — and MDL never upgrades React DOM (#50, same root cause). So every `mdl-textfield--floating-label` in the branch left its label parked on top of whatever the user typed. Added `MdlTextfield.jsx`, which reproduces just those two classes; used by the login and signup forms. **`TagsEditor` and `EditFormModal` still hand-roll `mdl-textfield` markup and should move onto it.** |
| 56 | **Invented class names with no CSS** (method) | — | — | Three separate visual bugs this phase (#48c, #55, #57) had the same shape: markup invented a class (`.form-toolbar`, `.upload`, `.emoji-pick`) that **matches no rule in main.less**, so the element silently fell back to browser defaults. Comparing computed styles of *containers* kept passing while the leaf elements were wrong. Added a scan that diffs every `className` used in `react-app/**/*.jsx` against the class selectors in `main.less`; it surfaced ~56 candidates and found #57 immediately. Worth re-running before declaring Phase 7 done — remaining flagged names are mostly harmless JS hooks (`js-edit`, `js-logout`) or React-only wrappers, but each is worth a glance. **Update:** the scan has now caught six instances (#55 `.emoji-pick`, #57 `.form-toolbar`/`.upload`, #59 `.signup-modal`, #61 `.modal-root__*`, #63 `.dreamy-card`) — and #62 shows the scan alone isn't enough: `EditFormModal` used *correct* class names that still matched nothing, because the **ancestor** class was wrong and the rules are nested. So the check is two-part: does the class exist in main.less, **and** is it reachable given the ancestors this component renders? |
| 57 | **Edit modal repeated the composer bug** | n/a | ✅ | `EditFormModal` still had the pre-#48 markup: `.form-toolbar` + `.upload` (both CSS-less, so the icons dropped out of the absolutely-positioned row and picked up default button chrome), the grey material `insert_emoticon` instead of `smile.svg`, and `.emojis-modal-place` rendered *before* `.form-submit` so the popup covered its own toggle (#54). Brought in line with `FormShell`/legacy. |
| 43 | Composer detail (emoji, image, poll, tags, URL capture) | n/a | ✅ | Was 🔴 — see #48, #49, #53. Actual posting (submit round-trip) still unverified end-to-end. |
| 53 | **Composer toggle behaviour + missing placeholder** | n/a | ✅ | Behaviour compared by driving *both* sites through the same click sequence. (a) **The composer had no placeholder at all**: main.less draws it with `div[contenteditable="true"]:empty:before { content: attr(placeholder) }`, but `RichComposer` rendered **`data-placeholder`**, so `attr(placeholder)` resolved to nothing — the prompt ("Explayate a tu gusto en el foro de king Crimson") never appeared, which is also why the composer looked like an empty box. (b) **Emoji picker and tag list weren't mutually exclusive**: legacy's `showEmojis()` calls `toggleTagsIn(false)` and `toggleTags()` calls `showEmojisIn(false)`; the branch let both sit open at once. `TagsEditor` is now controlled by `FormShell` so the two coordinate, and submit closes both (legacy `submitPost`). (c) Opening the poll didn't swap the prompt to **"Pregunta lo que quieras"** (legacy `abreEncuesta`), nor restore it on close. (d) `Emoji.jsx` set `alt` via a React prop, so the entity string got double-escaped into a literal `&amp;#x1f600;` where deployed has the real character — legacy builds that markup as raw HTML, where the browser parses the entity. (The insert-into-post path via `buildEmojiHtml` was already correct, since that one *is* raw HTML.) **Verified:** the click sequence emoji→tag→emoji→emoji now produces exactly deployed's open/close states, and the popup geometry is identical (modal 700×140, tabs 678×30, content 678×88, 24×24 emoji, 8 tabs, `overflow-y: scroll`). **On outside-click:** neither deployed nor the branch closes the popup that way — deployed dismisses it by clicking the emoji icon *again*, see #54. |
| 54 | **Emoji popup covered its own toggle** | n/a | ✅ | The real defect behind "the popup doesn't close": `.emojis-modal-place` is a zero-height `position:relative` anchor, and legacy renders it **after** `.form-submit`. The branch rendered it *before*, which pulled the popup up over the composer's own icon row — so the emoji icon sat underneath the popup and couldn't be clicked again to close it (measured: deployed icon bottom 395 / popup top 401 → no overlap, `elementFromPoint` returns the icon; branch icon top 389 / popup top 374 → overlap, `elementFromPoint` returned an `.emojione` from the popup). Since deployed has no click-outside handler, that icon is the *only* way to dismiss it, so covering it made the popup effectively unclosable. Moved the block after `.form-submit`; `iconClickable` now true. This also resolves the reported "different background": the popup's own colours were already identical (modal `#fff` + 1px grey, content transparent + 1px darkkhaki, tabs transparent, tab `#fff` + darkkhaki — verified equal on both), but because `.emojis-modal-content` is **transparent**, mispositioning it over the white composer card instead of below it changed what showed through. |
| 55 | **Every emoji had a grey box + border** | n/a | ✅ | Legacy renders the bare `<img class="emojione">` directly into `.emojis-modal-content` and delegates the click (`'click .emojis-modal-content .emojione'`). The branch wrapped each one in `<button class="emoji-pick">` — and `.emoji-pick` **has no CSS at all**, so all 575 emoji inherited the browser's default button chrome: `background: rgb(239,239,239)` and `border: 2px outset`, i.e. a grey box around every emoji. Removed the wrapper and moved the handler onto the image (keeping `role="button"`/`tabIndex` for keyboard use, which are visually inert). Content children are now `IMG.emojione` directly, transparent with no border, matching deployed. Insertion still produces `<img class="emojione" alt="😀" …>` — the real character, matching deployed's stored format. Test selector updated from `.emoji-pick` to `.emojis-modal-content .emojione`. |
| 48 | **Composer (`FormShell`) markup drift** | n/a | ✅ | Three compounding bugs, all from markup that diverged from legacy `formView`: (a) `mdl-card` was on the **root** `.formulario` element, pulling in MDL's default `.mdl-card { width: 330px }` and clamping the whole composer to a narrow column — legacy has `mdl-card` as an inner child, and `.formulario .mdl-card { width: auto }` only ever overrode the inner one; (b) an invented `mdl-card__title` "Escribe tu grito" heading legacy doesn't have (the prompt is the contenteditable's contextual placeholder, e.g. "Explayate a tu gusto en el foro de king Crimson"); (c) the icon row used invented `.form-toolbar` / `.upload` classes that have **no CSS at all**, so icons fell into normal flow across two lines instead of legacy's absolutely-positioned single row (`.file-submit` bottom:14px, `.emojis` left:90px, `.tags-place` left:121px, `.polls-place` left:152px). Also restored `TagsEditor`'s `label_outline` toggle — legacy keeps the tag list collapsed behind it, so the branch was both leaking a stray "Foros" input over the composer and missing that icon from the row. `ReplyForm` already had the correct structure; `FormShell` alone had drifted. |
| 49 | **Composer icon set + Grita button** | n/a | ✅ | Follow-up to #48 after comparing *measured geometry* rather than eyeballing. (a) The Grita button was missing `mdl-button--raised`, so MDL rendered a **flat text button** — "Grita" appeared as bare red text instead of the filled red button; it also carried an invented `mdl-card__actions mdl-card--border` divider. (b) The emoji trigger used the grey material `insert_emoticon` glyph; deployed uses the yellow **`img/smile.svg`** (`.emojis img` sizes it 24×24). (c) The poll trigger used material `poll`; deployed uses the **FontAwesome `fa fa-bar-chart`** glyph — different shape and ~25% larger. Fixed in `FormShell` (+ the emoji icon in `ReplyForm`). Verified by measuring both sites: camera/emoji/tag/poll/Grita now match deployed **pixel-for-pixel** (left 60/90/121/152/686, bottoms 14/26/26/28/20, and `rgb(255,82,82)` on white). Note `.tags-place` is a 0×0 container in *both* — the icon overflows it by design, so comparing container-vs-icon is misleading. |
| 44 | Mobile breakpoint (375) | ✅ | ✅ | Was 🔴 — **no responsive switching happened at all** (#50). |
| 50 | **`is-small-screen` never applied** (cross-cutting) | ✅ | ✅ | MDL gates *every* responsive rule on a class its own JS toggles from a matchMedia listener: `.mdl-layout.is-small-screen .mdl-layout--large-screen-only{display:none}` and `.mdl-layout:not(.is-small-screen) .mdl-layout--small-screen-only{display:none}`. MDL's JS never upgrades React DOM, so the breakpoint was stuck on "large" **forever**: the desktop logo + full `Titulo` stayed visible at 375px, every `--small-screen-only` element (the mobile `#foro` title, the alias row in the login menu) was permanently hidden, and `.is-small-screen .mdl-layout__content`'s 56px offset never applied. `Layout` now toggles the class from its own matchMedia listener at MDL's 1024px threshold. |
| 51 | **Notificaciones trigger was a text label** | ✅ | ✅ | Legacy renders it as the 36px `public` material glyph with an MDL badge for the unread count (`notificacionesView-t.html`), styled `.notis-icon` (opacity .5 → 1 when active). The branch rendered the word "Notificaciones", which was both wrong and wide enough to squeeze the foro title out of the mobile header. **This also resolves the "missing globe icon" logged earlier as an unknown**: that glyph was never a language/i18n control — it *is* the notifications button. |
| 52 | **API responses are ISO-8859-1** (cross-cutting, correctness) | ✅ | ✅ | Every gritos CGI endpoint serves `Content-Type: application/json; charset=ISO-8859-1` and the payloads contain real latin-1 bytes (0xF3 for "ó"). `Response.json()`/`.text()` **always** decode as UTF-8 regardless of the declared charset, so those became U+FFFD — a foro intro read "saber d<?>nde...". Legacy escaped this because Backbone went through jQuery/XHR, which honours the header charset. Added `utils/apiFetch.js` (`fetchJson`/`decodeBody`) which reads the body as bytes and decodes with the *declared* charset, defaulting to UTF-8 so it keeps working if the backend is ever fixed; routed `foroApi` + login/registro/upload/notificaciones read-state through it. Message bodies mostly escaped the bug because they store accents as HTML entities, which is why only *some* strings looked corrupted. 6 regression tests in `apiFetch.test.js`. |

### Verification checklist (definition of done)
Side-by-side against https://gritos.com, logged out and logged in:
- foroscomun feed, a topic foro (e.g. any from the drawer), a user wall, one grito with comments, gallery, votaciones
- post a grito (text + emoji + image + tags + poll + URL preview + dreamy), reply, edit, delete, vote a poll, mola/love, share
- login (alias + FB), signup, logout, avatar change, notifications, avisos, live updates in a second browser
