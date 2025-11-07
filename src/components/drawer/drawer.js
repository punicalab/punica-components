const template = document.createElement('template');
template.innerHTML = `
    <div class="backdrop"></div>
    <punica-box>
      <slot></slot>
    </punica-box>
    <style>${css}</style>
  `;

const SIZES = {
  small: '480px',
  medium: '600px',
  large: '900px',
  xlarge: '1160px',
  '2xlarge': '1280px',
  fullSize: '100%'
};

class Drawer extends HTMLElement {
  #shadow = this.attachShadow({ mode: 'open' });
  #content = null;
  #backdrop = null;

  constructor() {
    super();
    this.#shadow.appendChild(template.content.cloneNode(true));
    this.#content = this.#shadow.querySelector('punica-box');
    this.#backdrop = this.#shadow.querySelector('.backdrop');
  }

  get open() {
    return this.hasAttribute('open');
  }
  set open(v) {
    this.#isTruthy(v)
      ? this.setAttribute('open', '')
      : this.removeAttribute('open');
  }

  get direction() {
    return this.getAttribute('direction') || 'right';
  }
  set direction(v) {
    this.setAttribute('direction', v);
  }

  get size() {
    return this.getAttribute('size') || 'medium';
  }
  set size(v) {
    this.setAttribute('size', v);
  }

  get rounded() {
    return this.hasAttribute('rounded');
  }
  set rounded(v) {
    v ? this.setAttribute('rounded', '') : this.removeAttribute('rounded');
  }

  get customsize() {
    return this.getAttribute('customsize') || '';
  }
  set customsize(v) {
    v ? this.setAttribute('customsize', v) : this.removeAttribute('customsize');
  }

  static get observedAttributes() {
    return ['open', 'direction', 'size', 'customsize', 'rounded'];
  }

  #isTruthy(val) {
    if (val === '' || val === true) return true;
    if (val == null) return false;
    const s = String(val).toLowerCase().trim();
    return !['false', '0', 'no', 'null', 'undefined'].includes(s);
  }

  #normalizeOpenAttr() {
    const raw = this.getAttribute('open');
    if (raw != null && !this.#isTruthy(raw)) {
      this.removeAttribute('open');
    } else if (raw != null) {
      this.setAttribute('open', '');
    }
  }

  connectedCallback() {
    this.#normalizeOpenAttr();
    this.#applySizeBox();

    this.#backdrop.addEventListener('click', this.#onBackdropClick);
    document.addEventListener('keydown', this.#onKeyDown);

    if (this.open) document.body.style.overflow = 'hidden';
  }
  disconnectedCallback() {
    this.#backdrop.removeEventListener('click', this.#onBackdropClick);
    document.removeEventListener('keydown', this.#onKeyDown);
    document.body.style.overflow = '';
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'open') {
      if (newVal != null && !this.#isTruthy(newVal)) {
        this.removeAttribute('open');
        document.body.style.overflow = '';
        return;
      }
      if (newVal != null) {
        this.#applySizeBox();
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    if (['size', 'customsize', 'direction'].includes(name)) {
      this.#applySizeBox();
    }
  }

  #applySizeBox() {
    const size = this.customsize || SIZES[this.size] || '600px';
    if (this.direction === 'left' || this.direction === 'right') {
      this.#content.style.width = size;
      this.#content.style.height = '100vh';
    } else {
      this.#content.style.width = '100vw';
      this.#content.style.height = size;
    }
  }

  #fireOnClose() {
    this.dispatchEvent(
      new CustomEvent('close', { bubbles: true, composed: true })
    );
  }

  #onBackdropClick = () => {
    this.#fireOnClose();
  };
  #onKeyDown = (e) => {
    if (e.key === 'Escape') this.#fireOnClose();
  };
}

customElements.define('punica-drawer', Drawer);
