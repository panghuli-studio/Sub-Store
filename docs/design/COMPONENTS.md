# Production UI components

The approved prototype and review are pinned in `approved-baseline.json`. Do not change the approved files while implementing the application.

| Prototype | Production component | Base |
|---|---|---|
| IconButton | UiIconButton | Reka UI Primitive + Floating Vue tooltip |
| Sidebar/mobile navigation | StudioNavigation | Vue Router links |
| Search/management toolbar | StudioToolbar | Reka UI Input/Button + NutUI Popup |
| Subscription/file cards | existing ListItem components | existing actions, NutUI controls |
| Settings cards/details | My.vue and original settings forms | NutUI Popup/Form/Input |
| Editors | original Sub/File/Sync/Share editors | existing NutUI and CodeMirror |
| Preview/logs | original CompareTable/FilePreview/LogsPanel | existing API/store logic |

New native button/input/select/table/label/svg elements are rejected. The upstream counts are frozen in `web/eslint.design-baseline.json`; changes may reduce them, never increase them. New controls use NutUI or Reka UI, as listed above. Existing API clients, store mutations, editor processing and validators remain the functional implementation.

New buttons use the Vue primitive from Reka UI. The pinned NutUI 3.3.8 Button renders a nonsemantic `view` and does not provide native keyboard-button semantics. Existing NutUI forms and controls stay in place; Reka's primitive supplies the native button element for new icon buttons, card titles and settings cards, with approved styling and Floating Vue tooltips.
