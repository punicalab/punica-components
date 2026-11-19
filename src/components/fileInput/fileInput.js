import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { icons } from '../../core/icons.js';
import styles from './fileInput.css';

const NONE = Object.freeze([]);

/** The browser's own "select a file" message, in the user's language. */
const missingMessage = () => {
  const probe = document.createElement('input');
  probe.type = 'file';
  probe.required = true;
  return probe.validationMessage;
};

/**
 * Whether a file passes an `accept` list: extensions (`.pdf`), exact types
 * (`image/png`) and wildcards (`image/*`).
 * @param {File} file
 * @param {string | null} accept
 */
const accepts = (file, accept) => {
  const rules = (accept || '')
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
};

/**
 * A file picker: a button that opens the system dialog and a zone files can
 * be dropped on. The chosen files are submitted under `name`, one entry per
 * file, exactly as a native file input submits them.
 *
 * @element punica-file-input
 *
 * @attr {string} accept - Comma-separated extensions and MIME types; dropped files that do not match are left out.
 * @attr {boolean} multiple - More than one file may be chosen.
 * @attr {string} name - Name the files are submitted under.
 * @attr {string} label - Accessible name of the drop zone.
 * @attr {string} label-browse - Text of the button, `Choose file` by default.
 * @attr {string} label-drop - Text beside the button, `or drop it here` by default.
 * @attr {boolean} disabled - Takes no files and submits nothing.
 * @attr {boolean} required - A file is needed before the form submits.
 *
 * @prop {File[]} files - The chosen files. Assign a list, or an empty list to clear.
 *
 * @fires punica-change - The user chose or dropped files; `detail: { files }`.
 *
 * @csspart base - The drop zone.
 * @csspart icon - The upload glyph.
 * @csspart button - The native button that opens the dialog.
 * @csspart hint - The text beside the button.
 * @csspart list - The list of chosen file names.
 * @csspart file - One file name in the list.
 *
 * @cssprop --punica-file-input-padding - Padding of the drop zone.
 * @cssprop --punica-file-input-radius - Corner radius of the drop zone.
 * @cssprop --punica-file-input-border-color - Dashed border of the drop zone.
 * @cssprop --punica-file-input-background - Background of the drop zone.
 *
 * @cssstate dragover - Files are being dragged over the zone.
 * @cssstate filled - At least one file is chosen.
 * @cssstate invalid - Required and no file is chosen.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaFileInput extends FormControl(PunicaElement) {
  static properties = {
    accept: {},
    multiple: { type: Boolean },
    label: {},
    labelBrowse: { default: 'Choose file' },
    labelDrop: { default: 'or drop it here' },
    files: { type: Array, attribute: false, default: NONE }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base" role="group">
      <input class="native" type="file" hidden />
      ${icons.upload}
      <button part="button" type="button"></button>
      <span part="hint" class="hint"></span>
      <ul part="list" class="list" hidden></ul>
    </div>
  `;

  #native = this.$('.native');
  #button = this.$('button');
  #depth = 0;

  constructor() {
    super();
    const base = this.$('.base');
    const native = this.#native;
    this.#button.addEventListener('click', () => {
      if (!this.isDisabled) native.click();
    });
    native.addEventListener('change', () => {
      const files = [...native.files];
      // Emptied so that choosing the same file again is still a change.
      native.value = '';
      if (files.length) this.#take(files);
    });
    // The picker's own cancel and change events stay inside.
    native.addEventListener('cancel', (event) => event.stopPropagation());
    native.addEventListener('click', (event) => event.stopPropagation());

    base.addEventListener('dragenter', (event) => {
      if (!this.#carriesFiles(event)) return;
      event.preventDefault();
      this.#depth++;
      this.toggleState('dragover', true);
    });
    base.addEventListener('dragover', (event) => {
      if (!this.#carriesFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });
    base.addEventListener('dragleave', () => {
      this.#depth = Math.max(0, this.#depth - 1);
      if (!this.#depth) this.toggleState('dragover', false);
    });
    base.addEventListener('drop', (event) => {
      this.#depth = 0;
      this.toggleState('dragover', false);
      if (!this.#carriesFiles(event)) return;
      event.preventDefault();
      let files = [...event.dataTransfer.files].filter((file) => accepts(file, this.accept));
      if (!this.multiple) files = files.slice(0, 1);
      if (files.length) this.#take(files);
    });
  }

  update() {
    const files = this.#files();
    const native = this.#native;
    if (this.accept) native.setAttribute('accept', this.accept);
    else native.removeAttribute('accept');
    native.multiple = this.multiple;
    native.disabled = this.isDisabled;

    const base = this.$('.base');
    const name = this.#name();
    if (name) base.setAttribute('aria-label', name);
    else base.removeAttribute('aria-label');
    // The group says it is disabled, so its dimmed hint and file names are
    // read as part of a disabled control rather than as low-contrast text.
    if (this.isDisabled) base.setAttribute('aria-disabled', 'true');
    else base.removeAttribute('aria-disabled');
    this.#button.disabled = this.isDisabled;
    this.#button.textContent = this.labelBrowse ?? '';
    this.$('.hint').textContent = this.labelDrop ?? '';

    const list = this.$('.list');
    list.replaceChildren(
      ...files.map((file) => {
        const item = document.createElement('li');
        item.setAttribute('part', 'file');
        item.textContent = file.name;
        return item;
      })
    );
    list.hidden = !files.length;
    this.toggleState('filled', files.length > 0);

    if (files.length && this.name) {
      const data = new FormData();
      for (const file of files) data.append(this.name, file);
      this.setFormValue(data);
    } else {
      this.setFormValue(null);
    }
    const missing = this.required && !files.length;
    this.setValidity(missing ? { valueMissing: true } : {}, missing ? missingMessage() : '', this.#button);
  }

  formReset() {
    this.files = [];
  }

  formRestore(state) {
    if (state instanceof FormData) {
      this.files = [...state.values()].filter((value) => value instanceof File);
    }
  }

  /** Moves focus to the button. */
  focus(options) {
    this.#button.focus(options);
  }

  /** Opens the system file dialog; like a native file input, only from a user gesture. */
  showPicker() {
    if (!this.isDisabled) this.#native.click();
  }

  /** @returns {File[]} */
  #files() {
    return [...(this.files || NONE)];
  }

  #name() {
    if (this.label) return this.label;
    const text = [...this.labels].map((l) => l.textContent.trim()).filter(Boolean);
    return text.length ? text.join(' ') : null;
  }

  #carriesFiles(event) {
    return !this.isDisabled && [...(event.dataTransfer?.types || [])].includes('Files');
  }

  /** Takes files from the user: sets them and says so. */
  #take(files) {
    this.files = files;
    this.update(new Map());
    this.emit('change', { files: this.#files() });
  }
}

define('punica-file-input', PunicaFileInput);
