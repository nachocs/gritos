# Backbone Migration Cleanup Guide

## Status: In Progress

This document tracks the cleanup of legacy Backbone code as it's migrated to React.

### Safe to Delete (Fully Replaced by React)

#### Old Header Views (Replaced by Header.jsx)

- [ ] src/js/app/main/header/loginView.js
- [ ] src/js/app/main/header/loginView-t.html
- [ ] src/js/app/main/header/avisosView.js
- [ ] src/js/app/main/header/avisosView-t.html
- [ ] src/js/app/main/header/fbView.js
- [ ] src/js/app/main/header/dreamysView.html
- [ ] src/js/app/main/header/dreamysView.js
- [x] src/js/app/main/header/loginView.js (Replaced by LoginStatus.jsx)
- [x] src/js/app/main/header/loginView-t.html (Replaced by LoginStatus.jsx)
- [x] src/js/app/main/header/avisosView.js (Replaced by AvisosBanner.jsx)
- [x] src/js/app/main/header/avisosView-t.html (Replaced by AvisosBanner.jsx)
- [x] src/js/app/main/header/fbView.js (Logic moved to index.js and UserContext)
- [x] src/js/app/main/header/dreamysView.html (Replaced by DreamysModal.jsx)
- [x] src/js/app/main/header/dreamysView.js (Replaced by DreamysModal.jsx)
- [x] src/js/app/main/header/resumenView-t.html (Replaced by ResumenNav.jsx)
- [x] src/js/app/main/header/resumenView.js (Replaced by ResumenNav.jsx)
- [x] src/js/app/main/header/resumenItemView-t.html (Replaced by ResumenNav.jsx)
- [x] src/js/app/main/header/resumenItemView.js (Replaced by ResumenNav.jsx)
- [ ] src/js/app/main/header/signUp.html
- [ ] src/js/app/main/header/signUp.js

#### Old Notifications Views (Replaced by NotificacionesButton.jsx, NotificacionesList.jsx, NotificacionesItem.jsx)

- [ ] src/js/app/main/header/notificacionesView-t.html
- [ ] src/js/app/main/header/notificacionesView.js
- [ ] src/js/app/main/header/notificacionesItemView-t.html
- [ ] src/js/app/main/header/notificacionesItemView.js
- [ ] src/js/app/main/header/notificacionesCollectionView.js
- [x] src/js/app/main/header/notificacionesView-t.html (Replaced by NotificacionesButton.jsx)
- [x] src/js/app/main/header/notificacionesView.js (Replaced by NotificacionesButton.jsx)
- [x] src/js/app/main/header/notificacionesItemView-t.html (Replaced by NotificacionesItem.jsx)
- [x] src/js/app/main/header/notificacionesItemView.js (Replaced by NotificacionesItem.jsx)
- [x] src/js/app/main/header/notificacionesCollectionView.js (Replaced by NotificacionesList.jsx)

#### Old Form Views (Replaced by FormShell.jsx, EditFormModal.jsx)

- [ ] src/js/app/main/form/formView.js
- [x] src/js/app/main/form/formView.js (Replaced by FormShell.jsx)
- [ ] src/js/app/main/form/formView.html
- [ ] src/js/app/main/form/Wysiwyg.js
- [x] src/js/app/main/form/Wysiwyg.js (Replaced by Wysiwyg.jsx)
- [ ] src/js/app/main/form/emojisModal.js
- [ ] src/js/app/main/form/emojisModal-t.html
- [x] src/js/app/main/form/emojisModal.js (Replaced by EmojisModal.jsx)
- [x] src/js/app/main/form/emojisModal-t.html (Replaced by EmojisModal.jsx)

#### Old Forum Views (Replaced by ForoPage.jsx, MessageList.jsx)

- [ ] src/js/app/main/foros/baseCollectionView.js
- [x] src/js/app/main/foros/baseCollectionView.js (Logic moved to MessageList.jsx)
- [x] src/js/app/main/foros/miniMsgCollectionView.js (Replaced by MiniMessageList.jsx)
- [ ] src/js/app/main/foros/msgCollectionView.js
- [x] src/js/app/main/foros/msgCollectionView.js (Replaced by MessageList.jsx)

#### Old Message Views (Replaced by MensajePage.jsx, MessageDetail.jsx, MessageItem.jsx)

- [ ] src/js/app/main/message/ (entire folder)
- [x] src/js/app/main/message/ (Replaced by MensajePage.jsx, MessageDetail.jsx, MessageItem.jsx)

#### Old Gallery Views (Replaced by GalleryPage.jsx, GalleryThumbnail.jsx)

- [x] src/js/app/main/gallery/galleryView.js (Replaced by GalleryPage.jsx)
- [x] src/js/app/main/gallery/galleryMsgView.js (Replaced by GalleryItem.jsx)
- [x] src/js/app/main/gallery/galleryMsgView.html (Replaced by GalleryItem.jsx)
- [x] src/js/app/main/gallery/galleryCollection.js (Replaced by useJsonSearch)

#### Old Right Sidebar Views (Replaced by RightSidebar.jsx)

- [x] src/js/app/main/right/galleryThumbnailView.js (Replaced by GalleryThumbnail.jsx)
- [x] src/js/app/main/right/votacionesThumbnailView.js (Replaced by VotacionesThumbnail.jsx)
- [x] src/js/app/main/right/resumenView.js (Replaced by MiniMessageList.jsx in Sidebar)
- [x] src/js/app/main/right/ (entire folder marked for deletion)

#### Old User List Views (Replaced by future React component)

- [ ] src/js/app/main/userList/ (entire folder)
      go with - [ ] src/js/app/main/userList/ (entire folder)
      go with - [ ] src/js/app/main/userList/ (entire folder)
- [x] src/js/app/main/userList/ (Replaced by UserListPage.jsx and UserList.jsx)

#### Other Old Views

- [ ] src/js/app/main/spinnerView.js
- [ ] src/js/app/main/spinnerView.html
- [ ] src/js/app/main/base/ViewBase.js

### React Backbone Bridge Status

React no longer imports Backbone models directly, and the generic
`useBackboneModel` / `useBackboneCollection` hooks have been removed.

These legacy models are still kept for old Backbone views outside React:

- [x] src/js/app/models/headModel.js
- [x] src/js/app/models/msgCollection.js
- [x] src/js/app/models/msgModel.js
- [x] src/js/app/models/resumenCollection.js
- [x] src/js/app/models/formModel.js
- [x] src/js/app/models/registro.js

### Removed React Bridge Models

These React-only bridge models have been replaced by `useJsonSearch` and removed:

- [x] src/js/app/models/encuestasCollection.js
- [x] src/js/app/models/galleryCollection.js
- [x] src/js/app/models/galleryThumbnailModel.js
- [x] src/js/app/models/votacionesThumbnailModel.js

These direct page bridges have been replaced by fetch hooks:

- [x] MensajePage uses `useMessage` instead of `MsgModel`
- [x] ForoPage uses `useHead` and `useForumMessages` instead of HeadModel/MsgCollection
- [x] FormShell uses `useHead` instead of HeadModel
- [x] ResumenNav uses `useResumen` and `fetchHead` instead of ResumenCollection/HeadModel

### Deprecated Models (Replaced by React Contexts)

These models have been replaced by React Contexts and should be removed after all references are updated:

- [x] userModel.js → UserContext (replaced)
- [x] globalModel.js → GlobalContext (replaced)
- [x] notificacionesCollection.js → NotificationsContext (replaced)
- [x] notificacionesUserModel.js → NotificationsContext (replaced)

### Completed Context Replacements

- [x] ResumenNav uses UserContext instead of userModel
- [x] DreamysModal uses UserContext instead of userModel
- [x] EditFormModal uses FormContext/UserContext instead of formModel/userModel
- [x] SignUpModal uses RegistrationContext/UserContext instead of registro/userModel

### Next Steps

1. Begin removing old Backbone view files once all React components are in place
2. Replace remaining legacy modal/form payloads with plain React data
3. Move shared event/socket utilities away from Backbone.Events where practical
4. [In Progress] Move shared event/socket utilities away from Backbone.Events where practical
   - [x] Refactored `vent.js` to remove Backbone dependency
5. Add coverage for route-level pages and modal payload handling
6. [In Progress] Transition `router.js` logic to React Router and `GlobalContext`
7. [In Progress] Port `emojis.js` and `dreamysService.js` to React hooks
   - [x] Ported `dreamysService.js` to modern fetch API
   - [x] Ported `dreamysService.js` to modern fetch API
   - [x] Ported `dreamysService.js` to modern fetch API
   - [ ] Port `foro` sanitization logic to `GlobalContext` or a custom hook
   - [x] Implement `Layout` component for structural consistency
   - [ ] Migrate `Util.checkForms` (unsaved changes guard) to React Router blockers
   - [x] Migrated build system to Vite for modern DX
