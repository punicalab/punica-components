import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { isRtl } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, OptionNavigator, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import '../select/option.js';
import fieldStyles from '../select/field.css';
import styles from './powerSearch.css';

/**
 * @typedef {{ value: string, label?: string }} Choice
 * @typedef {object} FilterField
 * @property {string} key - What the filter is stored under.
 * @property {string} [label] - What the person reads; `key` by default.
 * @property {'text' | 'select' | 'date'} [type] - How the value is entered; `text` by default.
 * @property {(string | Choice)[]} [options] - The values of a `select` field.
 * @property {(string | Choice)[]} [operators] - Operators to choose from; the first is the default. `contains` for text, `is` for select, `on` for date when absent.
 * @typedef {{ key: string, operator: string, value: string }} Filter
 * @typedef {{ query: string, filters: Filter[] }} SearchValue
 */

const DEFAULT_OPERATOR = { text: 'contains', select: 'is', date: 'on' };

/** @param {string | Choice} c @returns {Required<Choice>} */
const choice = (c) => (typeof c === 'object' && c !== null ? { value: String(c.value), label: String(c.label ?? c.value) } : { value: String(c), label: String(c) });

/** @param {unknown} raw @returns {SearchValue} */
const normalise = (raw) => {
  const v = /** @type {any} */ (raw && typeof raw === 'object' ? raw : {});
  const filters = Array.isArray(v.filters)
    ? v.filters.filter((f) => f && f.key != null).map((f) => ({ key: String(f.key), operator: String(f.operator ?? ''), value: String(f.value ?? '') }))
    : [];
  return { query: typeof v.query === 'string' ? v.query : '', filters };
};

/** @param {string | null} text */
const parse = (text) => {
  if (!text) return normalise(null);
  try {
    return normalise(JSON.parse(text));
  } catch {
    return normalise({ query: text });
  }
};

/**
 * A search field that builds structured filters. The person types; the
 * fields of `filters` whose label matches are suggested; picking one asks
 * for its operator (when it has several) and then its value, from a list,
 * as text or as a date. The pair becomes a removable token (`Status: Open`)
 * and whatever text is left is the free-text query.
 *
 * The value is `{ query, filters: [{ key, operator, value }] }`. In a form
 * it is submitted under `name` as one JSON string, which keeps the
 * operators; the `value` attribute takes the same JSON as the default.
 *
 * Enter with no suggestion highlighted fires `punica-search` and then
 * submits the owning form, unless the event was cancelled. Backspace in the
 * empty field leaves the value step, or removes the last token; the arrow
 * keys walk the tokens.
 *
 * @element punica-power-search
 *
 * @attr {string} value - Default value, as JSON: `{"query":"","filters":[{"key":"status","operator":"is","value":"open"}]}`.
 * @attr {string} name - Name the value is submitted under, as JSON.
 * @attr {string} label - Accessible name of the field.
 * @attr {string} placeholder - Shown while the field is empty.
 * @attr {boolean} open - The suggestions are showing, when there are any.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its tokens and query and takes no input.
 * @attr {boolean} required - A query or a filter is needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-value - Placeholder while a value is entered, `Value` by default.
 * @attr {string} label-remove - Start of the name of each remove button, `Remove` by default; the token's text follows it.
 *
 * @prop {SearchValue} value - The current query and filters.
 * @prop {FilterField[]} filters - The fields a filter can be built on.
 *
 * @slot start - Content before the tokens, in place of the search icon.
 *
 * @fires punica-input - The user typed in the query; `detail: { value }` with the whole value.
 * @fires punica-change - A filter was added or removed, or the query was committed; `detail: { value }`.
 * @fires punica-search - The user pressed Enter; `detail: { value }`. Cancelable: cancelled, the form is not submitted.
 * @fires punica-open - The suggestions opened.
 * @fires punica-close - The suggestions closed. `detail.reason` is `select`, `escape`, `outside`, `blur`, `empty` or `api`.
 *
 * @csspart field - The bordered box.
 * @csspart icon - The search glyph.
 * @csspart tokens - The list of filter tokens.
 * @csspart token - One filter.
 * @csspart token-label - The text of a filter.
 * @csspart remove - The remove button of a filter.
 * @csspart pending - The field, and operator, whose value is being entered.
 * @csspart input - The text input, a combobox.
 * @csspart date - The date input of a date field's value step.
 * @csspart listbox - The floating list of suggestions.
 * @csspart option - Each suggestion.
 *
 * @cssprop --punica-power-search-radius - Corner radius of the field.
 * @cssprop --punica-power-search-height - Minimum block size of the field.
 * @cssprop --punica-power-search-padding - Inline padding of the field.
 * @cssprop --punica-power-search-border-color - Border colour at rest.
 * @cssprop --punica-power-search-background - Field background.
 * @cssprop --punica-power-search-min-width - Smallest inline size.
 * @cssprop --punica-power-search-token-background - Background of a token.
 * @cssprop --punica-power-search-listbox-max-height - Largest block size of the suggestions.
 *
 * @cssstate open - The suggestions are showing.
 * @cssstate pending - A filter's operator or value is being entered.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaPowerSearch extends FormControl(PunicaElement) {
  static properties = {
    defaultValue: { attribute: 'value', reflect: false },
    value: { type: Object, attribute: false },
    filters: { type: Array, attribute: false },
    label: {},
    placeholder: {},
    open: { type: Boolean },
    readonly: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelValue: { default: 'Value' },
    labelRemove: { default: 'Remove' }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="field" class="field">
      <slot name="start"><span part="icon" class="search-icon">${icons.search}</span></slot>
      <div part="tokens" class="tokens" role="list" hidden></div>
      <span part="pending" class="pending" hidden></span>
      <input part="input" class="control" type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="listbox" aria-expanded="false" autocomplete="off" autocapitalize="off" spellcheck="false">
      <input part="date" class="control date" type="date" hidden>
    </div>
    <div part="listbox" id="listbox" class="panel listbox" role="listbox" popover="manual"></div>
    <template id="token">
      <span part="token" class="token" role="listitem" tabindex="-1">
        <span part="token-label" class="token-label"></span>
        <button part="remove" class="remove" type="button" tabindex="-1">${icons.close}</button>
      </span>
    </template>
  `;

  #field = this.$('.field');
  #tokens = this.$('.tokens');
  #pendingEl = this.$('.pending');
  #input = this.$('[part="input"]');
  #date = this.$('[part="date"]');
  #listbox = this.$('#listbox');
  #template = this.$('#token');
  #surface = new FieldSurface(this, this.#listbox);
  #nav = new OptionNavigator(this.#input, () => this.#rows);
  /** Suggestion rows now in the list. @type {any[]} */
  #rows = [];
  /** What the rows were last built from. */
  #rowsKey = '';
  /** @type {{ field: FilterField, operator: string | null } | null} */
  #pending = null;
  /** The query last committed, to tell whether Enter or a blur changed it. */
  #committedQuery = '';
  #drawn = '';
  /** Focus is being moved onto a token on purpose. */
  #walking = false;
  #touched = false;
  #reason = 'api';

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('input', () => {
      if (this.#locked) return;
      if (!this.#pending) {
        this.value = { ...this.#value(), query: input.value };
        this.emit('input', { value: this.value });
      }
      this.#nav.set(null);
      this.open = true;
      this.update(new Map());
      if (this.#pending) this.#nav.set(this.#nav.items[0] || null);
    });
    input.addEventListener('keydown', (event) => this.#onInputKeydown(event));
    this.#date.addEventListener('keydown', (event) => this.#onDateKeydown(event));
    this.#field.addEventListener('mousedown', (event) => {
      if (event.target !== this.#field) return;
      event.preventDefault();
      this.#focusEntry();
    });
    this.#tokens.addEventListener('keydown', (event) => this.#onTokenKeydown(event));
    // A token takes focus only from the arrow keys; anything else that lands
    // there (a delegated focus(), a press) belongs in the text input.
    this.#tokens.addEventListener('focusin', () => {
      if (!this.#walking) this.#input.focus();
    });
    this.#tokens.addEventListener('click', (event) => {
      const target = /** @type {Element} */ (event.target);
      const token = /** @type {HTMLElement | null} */ (target.closest('.token'));
      if (!token || this.#locked || !target.closest('.remove')) return;
      this.#removeAt(Number(token.dataset.index));
      this.#focusEntry();
    });
    this.#listbox.addEventListener('mousedown', (event) => event.preventDefault());
    this.#listbox.addEventListener('click', (event) => {
      const row = this.#rowFrom(event);
      if (row && !row.disabled) this.#pick(row);
    });
    this.#listbox.addEventListener('pointermove', (event) => {
      const row = this.#rowFrom(event);
      if (row && !row.disabled && row !== this.#nav.active) this.#nav.set(row);
    });
    this.shadowRoot.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (next instanceof Node && (this.shadowRoot.contains(next) || this.contains(next))) return;
      this.#touched = true;
      // A value typed or picked for the pending field is kept; a half-built filter is not.
      const pending = this.#pending;
      if (pending && pending.operator !== null && pending.field.type !== 'select') {
        this.#commitValue(pending.field.type === 'date' ? this.#date.value : this.#input.value, false);
      }
      this.#pending = null;
      this.#close('blur');
      this.#commitQuery();
      this.requestUpdate();
    });
  }

  get #locked() {
    return this.isDisabled || this.readonly;
  }

  /** Opens the suggestions. */
  show() {
    this.open = true;
  }

  /** Closes the suggestions. */
  hide() {
    this.#close('api');
  }

  /** Moves focus to the text input. */
  focus(options) {
    this.#input.focus(options);
  }

  disconnected() {
    this.#surface.hide();
    this.#nav.set(null);
  }

  formReset() {
    this.#touched = false;
    this.#pending = null;
    this.value = parse(this.defaultValue);
    this.#committedQuery = this.value.query;
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = parse(state);
  }

  /** @returns {SearchValue} */
  #value() {
    return normalise(this.value);
  }

  /** @returns {FilterField[]} */
  #fields() {
    return (Array.isArray(this.filters) ? this.filters : []).filter((f) => f && f.key != null);
  }

  /** @param {string} key */
  #fieldOf(key) {
    return this.#fields().find((f) => String(f.key) === key) || null;
  }

  /** @param {FilterField} field @returns {Required<Choice>[]} */
  #operators(field) {
    const list = (field.operators || []).map(choice);
    return list.length ? list : [{ value: DEFAULT_OPERATOR[field.type || 'text'] || 'is', label: DEFAULT_OPERATOR[field.type || 'text'] || 'is' }];
  }

  /** The text a token shows for a filter. @param {Filter} filter */
  #tokenText(filter) {
    const field = this.#fieldOf(filter.key);
    const label = field ? String(field.label ?? field.key) : filter.key;
    let shown = filter.value;
    if (field?.type === 'select') shown = (field.options || []).map(choice).find((o) => o.value === filter.value)?.label ?? filter.value;
    else if (field?.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(filter.value)) {
      const [y, m, d] = filter.value.split('-').map(Number);
      shown = new Intl.DateTimeFormat(fieldLanguage(this), { dateStyle: 'medium' }).format(new Date(y, m - 1, d));
    }
    const operators = field ? this.#operators(field) : [];
    if (!operators.length || operators[0].value === filter.operator) return `${label}: ${shown}`;
    const op = operators.find((o) => o.value === filter.operator)?.label ?? filter.operator;
    return `${label} ${op} ${shown}`;
  }

  update(changed) {
    if (changed.has('defaultValue') && (this.value == null || changed.get('defaultValue') === undefined)) {
      if (this.value == null) {
        this.value = parse(this.defaultValue);
        this.#committedQuery = this.value.query;
      }
    }
    const value = this.#value();
    const input = this.#input;
    const disabled = this.isDisabled;
    const locked = this.#locked;
    const name = fieldName(this);
    const pending = this.#pending;

    // Tokens are redrawn only when what they show changes, so focus on one survives.
    const texts = value.filters.map((f) => this.#tokenText(f));
    const drawn = JSON.stringify([texts, this.labelRemove, locked]);
    if (drawn !== this.#drawn) {
      this.#drawn = drawn;
      const focused = [...this.#tokens.children].indexOf(/** @type {any} */ (this.shadowRoot.activeElement));
      const tokens = texts.map((text, i) => {
        const token = /** @type {HTMLElement} */ (this.#template.content.firstElementChild.cloneNode(true));
        token.dataset.index = String(i);
        token.querySelector('.token-label').textContent = text;
        const remove = token.querySelector('button');
        remove.setAttribute('aria-label', `${this.labelRemove} ${text}`);
        remove.disabled = locked;
        return token;
      });
      this.#tokens.replaceChildren(...tokens);
      this.#tokens.hidden = tokens.length === 0;
      if (focused >= 0) this.#focusToken(tokens[Math.min(focused, tokens.length - 1)] || input);
    }
    setAttr(this.#tokens, 'aria-label', name);
    setAttr(this.#tokens, 'aria-disabled', disabled ? 'true' : null);

    // The pending field and the entry it needs.
    const dateStep = !!pending && pending.operator !== null && pending.field.type === 'date';
    this.#pendingEl.hidden = !pending;
    if (pending) {
      const op = pending.operator === null ? null : this.#operators(pending.field).find((o) => o.value === pending.operator);
      const showOp = op && this.#operators(pending.field).length > 1;
      this.#pendingEl.textContent = `${pending.field.label ?? pending.field.key}${showOp ? ' ' + op.label : ''}`;
    }
    this.toggleState('pending', !!pending);
    // Hiding the focused entry would drop focus out of the element: move it first.
    const shown = dateStep ? this.#date : input;
    const gone = dateStep ? input : this.#date;
    shown.hidden = false;
    if (this.shadowRoot.activeElement === gone) shown.focus({ preventScroll: true });
    gone.hidden = true;
    if (!pending && input.value !== value.query && this.shadowRoot.activeElement !== input) input.value = value.query;

    input.disabled = disabled;
    input.readOnly = this.readonly;
    this.#date.disabled = disabled;
    input.placeholder = pending ? (pending.operator === null ? '' : this.labelValue) : value.filters.length ? '' : this.placeholder || '';
    setAttr(input, 'aria-label', pending ? String(pending.field.label ?? pending.field.key) : name);
    setAttr(this.#date, 'aria-label', pending ? String(pending.field.label ?? pending.field.key) : null);
    setAttr(this.#listbox, 'aria-label', pending ? String(pending.field.label ?? pending.field.key) : name);
    setAttr(input, 'aria-required', this.required ? 'true' : null);
    this.toggleState('disabled', disabled);

    // Suggestions: fields, then a field's operators, then its values.
    this.#buildRows();

    this.setFormValue(this.name ? JSON.stringify(value) : null, JSON.stringify(value));
    const missing = this.required && !value.query.trim() && value.filters.length === 0;
    this.setValidity(missing ? { valueMissing: true } : {}, nativeMessage('required'), input);
    const invalid = this.#touched && !this.validity.valid;
    setAttr(input, 'aria-invalid', invalid ? 'true' : null);
    this.toggleState('user-invalid', invalid);

    const want = this.open && !locked && !dateStep && this.#rows.length > 0;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, { matchWidth: true }, () => this.#close('outside'));
      this.toggleState('open', true);
      input.setAttribute('aria-expanded', 'true');
      this.emit('open');
    } else if (!want && this.#surface.open) {
      this.#surface.hide();
      this.#nav.set(null);
      this.toggleState('open', false);
      input.setAttribute('aria-expanded', 'false');
      const reason = this.open ? 'empty' : this.#reason;
      this.#reason = 'api';
      this.emit('close', { reason });
    } else if (want) {
      this.#surface.reposition();
    }
    if (this.#nav.active && !this.#rows.includes(this.#nav.active)) this.#nav.set(null);
  }

  /** Builds the suggestion rows for the step the person is on. */
  #buildRows() {
    const language = fieldLanguage(this);
    const needle = this.#input.value.trim().toLocaleLowerCase(language);
    const pending = this.#pending;
    /** @type {{ kind: string, value: string, label: string }[]} */
    let items = [];
    if (!pending) {
      items = this.#fields()
        .map((f) => ({ kind: 'field', value: String(f.key), label: String(f.label ?? f.key) }))
        .filter((f) => !needle || f.label.toLocaleLowerCase(language).includes(needle));
    } else if (pending.operator === null) {
      items = this.#operators(pending.field)
        .map((o) => ({ kind: 'operator', ...o }))
        .filter((o) => !needle || o.label.toLocaleLowerCase(language).includes(needle));
    } else if (pending.field.type === 'select') {
      items = (pending.field.options || [])
        .map(choice)
        .map((o) => ({ kind: 'value', ...o }))
        .filter((o) => !needle || o.label.toLocaleLowerCase(language).includes(needle));
    }
    const key = JSON.stringify(items);
    if (key === this.#rowsKey) return;
    this.#rowsKey = key;
    this.#rows = items.map((item) => {
      const row = /** @type {any} */ (document.createElement('punica-option'));
      row.setAttribute('part', 'option');
      row.value = item.value;
      row.dataset.kind = item.kind;
      row.textContent = item.label;
      return row;
    });
    this.#listbox.replaceChildren(...this.#rows);
  }

  #rowFrom(event) {
    return event.composedPath().find((node) => this.#rows.includes(node)) || null;
  }

  /** @param {string} reason */
  #close(reason) {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  #focusEntry() {
    (this.#date.hidden ? this.#input : this.#date).focus();
  }

  /** @param {SearchValue} next */
  #commit(next) {
    this.#touched = true;
    this.value = next;
    this.#committedQuery = next.query;
    this.update(new Map());
    this.emit('change', { value: this.value });
  }

  /** The query typed since the last commit becomes the committed one. */
  #commitQuery() {
    const value = this.#value();
    if (value.query === this.#committedQuery) return;
    this.#commit(value);
  }

  /** @param {any} row */
  #pick(row) {
    const kind = row.dataset.kind;
    if (kind === 'field') {
      const field = this.#fieldOf(row.value);
      if (!field) return;
      // The text was a search for the field, not the query.
      this.value = { ...this.#value(), query: '' };
      this.#input.value = '';
      const operators = this.#operators(field);
      this.#pending = { field, operator: operators.length > 1 ? null : operators[0].value };
      this.#date.value = '';
      this.open = true;
      this.update(new Map());
      this.#nav.set(this.#nav.items[0] || null);
      this.#focusEntry();
    } else if (kind === 'operator') {
      const pending = /** @type {any} */ (this.#pending);
      pending.operator = row.value;
      this.#input.value = '';
      this.update(new Map());
      this.#nav.set(this.#nav.items[0] || null);
      this.#focusEntry();
    } else {
      this.#commitValue(row.value);
    }
  }

  /**
   * Turns the pending field and a value into a token.
   * @param {string} raw
   * @param {boolean} [refocus] put focus back in the text input
   */
  #commitValue(raw, refocus = true) {
    const pending = this.#pending;
    const text = String(raw).trim();
    if (!pending || pending.operator === null || !text) return;
    const value = this.#value();
    this.#pending = null;
    this.#input.value = value.query;
    this.#commit({ query: value.query, filters: [...value.filters, { key: String(pending.field.key), operator: pending.operator, value: text }] });
    this.#close('select');
    if (refocus) this.#input.focus();
  }

  #cancelPending() {
    this.#pending = null;
    this.#input.value = this.#value().query;
    this.#close('api');
    this.update(new Map());
    this.#input.focus();
  }

  /** @param {number} index */
  #removeAt(index) {
    const value = this.#value();
    if (!(index >= 0 && index < value.filters.length)) return;
    this.#commit({ query: value.query, filters: value.filters.filter((_, i) => i !== index) });
  }

  #search() {
    this.#commitQuery();
    const event = this.emit('search', { value: this.value }, { cancelable: true });
    if (!event.defaultPrevented) submitForm(this.form);
  }

  /** @param {KeyboardEvent} event */
  #onInputKeydown(event) {
    if (this.#locked || event.isComposing) return;
    const input = this.#input;
    const nav = this.#nav;
    const showing = this.#surface.open;
    const pending = this.#pending;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const back = isRtl(this) ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'Enter') {
      event.preventDefault();
      if (showing && nav.active) {
        this.#pick(nav.active);
      } else if (pending && pending.operator !== null && pending.field.type !== 'select') {
        this.#commitValue(input.value);
      } else if (pending && pending.field.type === 'select' && pending.operator !== null) {
        const language = fieldLanguage(this);
        const text = input.value.trim().toLocaleLowerCase(language);
        const match = (pending.field.options || []).map(choice).find((o) => o.label.toLocaleLowerCase(language) === text);
        if (match) this.#commitValue(match.value);
      } else if (!pending) {
        this.#close('select');
        this.#search();
      }
    } else if (event.key === 'Backspace' && atStart && !input.value) {
      if (pending) {
        event.preventDefault();
        this.#cancelPending();
      } else if (this.#value().filters.length) {
        event.preventDefault();
        this.#removeAt(this.#value().filters.length - 1);
      }
    } else if (event.key === back && atStart && !pending) {
      const last = /** @type {HTMLElement | null} */ (this.#tokens.lastElementChild);
      if (last) {
        event.preventDefault();
        this.#focusToken(last);
      }
    } else if (event.key === 'Escape') {
      if (showing) {
        event.preventDefault();
        event.stopPropagation();
        this.#close('escape');
      } else if (pending) {
        event.preventDefault();
        event.stopPropagation();
        this.#cancelPending();
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showing) {
        this.open = true;
        this.update(new Map());
        nav.set(event.key === 'ArrowDown' ? nav.items[0] || null : nav.items.at(-1) || null);
      } else if (event.altKey && event.key === 'ArrowUp') {
        this.#close('api');
      } else {
        nav.move(event, { homeEnd: false });
      }
    } else if (showing && nav.move(event, { homeEnd: false })) {
      event.preventDefault();
    }
  }

  /** @param {KeyboardEvent} event */
  #onDateKeydown(event) {
    if (this.#locked) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      this.#commitValue(this.#date.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.#cancelPending();
    } else if (event.key === 'Backspace' && !this.#date.value) {
      event.preventDefault();
      this.#cancelPending();
    }
  }

  /** @param {HTMLElement} target a token, or the text input */
  #focusToken(target) {
    this.#walking = true;
    try {
      target.focus();
    } finally {
      this.#walking = false;
    }
  }

  /** @param {KeyboardEvent} event */
  #onTokenKeydown(event) {
    const tokens = /** @type {HTMLElement[]} */ ([...this.#tokens.children]);
    const index = tokens.indexOf(/** @type {any} */ (this.shadowRoot.activeElement));
    if (index < 0) return;
    const forward = isRtl(this) ? 'ArrowLeft' : 'ArrowRight';
    const back = isRtl(this) ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === back) this.#focusToken(tokens[Math.max(0, index - 1)]);
    else if (event.key === forward) this.#focusToken(tokens[index + 1] || this.#input);
    else if (event.key === 'Home') this.#focusToken(tokens[0]);
    else if (event.key === 'End') this.#input.focus();
    else if ((event.key === 'Backspace' || event.key === 'Delete') && !this.#locked) this.#removeAt(index);
    else return;
    event.preventDefault();
  }
}

define('punica-power-search', PunicaPowerSearch);
