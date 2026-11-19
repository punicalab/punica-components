// What the eval asks a model to build. Each task is something an app
// developer would ask for, in their words: no tag names, so the model has to
// find the elements itself. `form` lists the FormData keys a correct answer
// submits, checked in the browser.

export const tasks = [
  {
    id: 'contact-form',
    kind: 'html',
    prompt: 'A contact form: name and email (both required), a topic chosen from Sales, Support or Billing, a message, a checkbox to subscribe to the newsletter, and a submit button.',
    form: ['name', 'email', 'topic', 'message']
  },
  {
    id: 'confirm-delete',
    kind: 'html',
    prompt: 'A "Delete project" button that opens a confirmation dialog asking the user to confirm; on confirm, log "deleted" to the console.'
  },
  {
    id: 'data-table',
    kind: 'html',
    prompt: 'A table of five invoices (number, customer, amount, status) whose columns can be sorted, with the status shown as a coloured badge.'
  },
  {
    id: 'settings-tabs',
    kind: 'html',
    prompt: 'A settings page with three tabs (Profile, Notifications, Security). Profile has a name field, Notifications has two on/off switches, Security has a "Change password" button.'
  },
  {
    id: 'date-range',
    kind: 'html',
    prompt: 'A booking form with a check-in and check-out date range, the number of guests from 1 to 6, and a "Search" submit button.',
    form: ['guests']
  },
  {
    id: 'toast-on-save',
    kind: 'html',
    prompt: 'A "Save" button that shows a success notification saying "Saved" when clicked.'
  },
  {
    id: 'app-shell',
    kind: 'html',
    prompt: 'An application layout: a top bar with the app name, a side navigation with Dashboard, Projects and Settings (Dashboard current), and a main area with a heading.'
  },
  {
    id: 'chat',
    kind: 'html',
    prompt: 'An assistant chat screen: two messages (one from the user, one from the assistant) and a message input with a send button at the bottom.'
  },
  {
    id: 'rtl-form',
    kind: 'html',
    prompt: 'A right-to-left (Arabic) sign-in form with an email field, a password field, a "remember me" switch and a submit button. Use English labels; the layout must be right-to-left.',
    form: ['email', 'password']
  },
  {
    id: 'dark-theme',
    kind: 'html',
    prompt: 'A card with a title, a short paragraph and two buttons (a main and a secondary action), styled with a custom brand colour #7c3aed, that follows the user\'s light or dark preference.'
  },
  {
    id: 'react-form',
    kind: 'jsx',
    prompt: 'A React 19 component, PlanPicker, with a dropdown of plans (Free, Pro, Team) whose current value is kept in state with useState, and a text showing the chosen plan. Return only the component (JSX).'
  },
  {
    id: 'migrate-1x',
    kind: 'html',
    prompt: 'Rewrite this page, written for an old version, for the current version of the library:\n\n```html\n<script src="build.min.js"></script>\n<punica-typography variant="h1">Account</punica-typography>\n<punica-modal id="m" open>\n  <punica-modal-header>Close account</punica-modal-header>\n  <punica-modal-content>This cannot be undone.</punica-modal-content>\n  <punica-modal-footer><punica-button fullwidth>Close account</punica-button></punica-modal-footer>\n</punica-modal>\n<script>document.getElementById("m").addEventListener("close", () => console.log("closed"));</script>\n```'
  }
];
