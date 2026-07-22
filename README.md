# gritos
Gritos.com

- This is the front-end for gritos.com website, a community around channels.
- React 18 + Vite.

# install
- npm install
- npm start

# Known limitations
- No CI/deploy pipeline yet for the Vite build — legacy's webpack + CircleCI + versioned S3 path (`/dist/<version>/…`) is gone; the `deploy`/`bump-version`/`tag` npm scripts reference files that no longer exist in this branch.
- Facebook login is a stub (logs the response only) — matches legacy's own `fBlogin`, so this is parity-with-a-stub rather than a regression. A real port is a separate decision.
- Single JS bundle over 1 MB — no route-level code splitting yet.
- Dead legacy Backbone/Marionette source (`src/js/app/main/`, `src/js/app/models/`, `router.js`) still sits in the tree, unused by the React app. Kept temporarily as reference while porting; safe to delete once it's no longer needed for parity-checking.
- A small globe/language icon near the login area on deployed is not yet ported (purpose unclear — likely i18n).

# Changelog

## 2.0.0
Full rewrite: React 18 + Vite, replacing Backbone/Marionette + webpack.
Ported mola/nomola/love, encuestas (create/vote/close), mini-threads with reply composer, ciudadano walls, multi-foro tags, dreamys, notifications, avisos, URL capture previews, WYSIWYG selection toolbar, gallery (infinite scroll), votaciones, admin menu (edit/delete/ban stub), share menu.
Restored the HTML shell dropped with webpack (OG/Twitter metas, manifest.json, icon set, GA/AdSense, `imgError`, noscript); fixed SPA routing (root/reserved-foro URLs no longer rewritten, ciudadanos wall sub-paths no longer 404 to home); fixed a long tail of parity bugs surfaced against the deployed site (post-success detection, HTML-entity decoding in titles/captured-URL cards, MDL floating-label styling, full-height layout on sparse pages, reply-form spacing).

## 1.10.10
added html entities decode to encuestas
## 1.10.9
Added link to Privacy / legal in menu

## 1.10.8
Added google adsense

## 1.10.6
Dreamys and emocions url pointing root

## 1.10.2
Added font for Material Icons to support IE

## 1.10.1
bug in IE, doesn't support 'includes'

## 1.10.0
Encuestas y userList.
Cache fetch in some calls.

## 1.9.1
bug with moment locale not showing es
load model of msg before updating likes.

## 1.9.0
Full Gallery View, working.

## 1.8.6
Save previous dreamy when creating new dreamy, so we can remove it if msg is deleted.

## 1.8.5
Mejor match de urls. Mejor ImgError

## 1.8.4
Removed emojione library. Added img modal in carrousel

## 1.8.3
Dreamy on forms

## 1.8.2
Dreamy + Dreamy upload

## 1.8.1
Register feature

## 1.8.0
New Webpack, all scripts inline, lazy load avatars

## 1.7.2
Img vacio, ciudadanos Title

## 1.7.1
Added Lazy Load images

## 1.7.0
Added WebWorkers for Offline

## 1.6.0
Added CaptureUrl

## 1.5.3
Added manifest and phone icons.

## 1.5.2
Break Change. Changed msgModel to id:num as it was merging bad. Hope it doesn't have bad consecuences

## 1.5.1
Scroll Up on tittle and G
Polyfill and css changes for IE
IPad bug
font-size estandard in all forms
usual links change

## 1.5.0
Added PushState

## 1.4.0
Final version, not push state.

## 1.3.0
This is ready

## 1.2.0
Working notifications

## 1.1.0
Working sockets, emojis, post... very nearly ready

## 1.0.1
Working version with almost everything that was in legacy version. Missing posting to channels instead of general.
