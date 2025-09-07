(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="card" part="card" role="status" aria-live="polite">
      <slot name="icon" class="icon"></slot>
      <div class="body">
        <p class="title" part="title"></p>
        <p class="msg" part="message"></p>
      </div>
      <button class="close" part="close" aria-label="Close" title="Close">✕</button>
      <div class="progress" hidden><i></i></div>
    </div>
    <style></style>
  `;

  const VARIANTS = {
    info: {
      bg: 'var(--info-main)',
      fg: 'var(--info-light)'
    },
    success: {
      bg: 'var(--success-main)',
      fg: 'var(--success-light)'
    },
    warning: {
      bg: 'var(--warning-main)',
      fg: 'var(--warning-light)'
    },
    error: {
      bg: 'var(--error-main)',
      fg: 'var(--error-light)'
    },
    neutral: {
      bg: 'var(--neutral-error)',
      fg: 'var(--neutral-light)'
    }
  };

  class Toast extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #timer = null;

    /**
     *
     */
    static get observedAttributes() {
      return ['title', 'message', 'variant', 'duration', 'dismissible'];
    }

    get title() {
      return this.getAttribute('title');
    }
    set title(v) {
      v == null ? this.removeAttribute('title') : this.setAttribute('title', v);
    }
    get message() {
      return this.getAttribute('message');
    }
    set message(v) {
      v == null
        ? this.removeAttribute('message')
        : this.setAttribute('message', v);
    }
    get variant() {
      return this.getAttribute('variant');
    }
    set variant(v) {
      v == null
        ? this.removeAttribute('variant')
        : this.setAttribute('variant', v);
    }
    get duration() {
      return this.getAttribute('duration');
    }
    set duration(v) {
      v == null
        ? this.removeAttribute('duration')
        : this.setAttribute('duration', v);
    }
    get dismissible() {
      return this.getAttribute('dismissible') ?? 'true';
    }
    set dismissible(v) {
      v == null
        ? this.removeAttribute('dismissible')
        : this.setAttribute('dismissible', v);
    }

    /**
     *
     * @param {*} v
     */
    #applyVariant(v) {
      const cfg = VARIANTS[v] || VARIANTS.neutral;
      this.style.setProperty('--toast-background', cfg.bg);
      this.style.setProperty('--toast-color', cfg.fg);
    }

    /**
     *
     */
    constructor() {
      super();
      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#shadow
        .querySelector('button.close')
        ?.addEventListener('click', () => this.hide());
    }

    /**
     *
     */
    connectedCallback() {
      this.#applyVariant(this.variant || 'neutral');

      this.#shadow.querySelector('.title').textContent = this.title || '';
      this.#shadow.querySelector('.title').hidden = !this.title;
      this.#shadow.querySelector('.msg').textContent = this.message || '';
      this.#shadow.querySelector('.msg').hidden = !this.message;

      if (this.dismissible === 'false')
        this.#shadow.querySelector('.close').style.display = 'none';
      if (!this.hasAttribute('enter-from'))
        this.setAttribute('enter-from', 'top');

      const dur = Number(this.duration || 0);
      const progress = this.#shadow.querySelector('.progress');

      if (dur > 0) {
        progress.hidden = false;
        progress.querySelector('i').style.animationDuration = dur + 'ms';
        this.#timer = setTimeout(() => this.hide(), dur);
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      if (this.#timer) clearTimeout(this.#timer);
    }

    /**
     *
     * @param {*} name
     * @param {*} _o
     * @param {*} n
     * @returns
     */
    attributeChangedCallback(name, _o, n) {
      if (!this.isConnected) return;
      if (name === 'variant') this.#applyVariant(n);
      if (name === 'title')
        this.#shadow.querySelector('.title').textContent = n || '';
      if (name === 'message')
        this.#shadow.querySelector('.msg').textContent = n || '';
      if (name === 'dismissible')
        this.#shadow.querySelector('.close').style.display =
          n === 'false' ? 'none' : '';
    }

    /**
     *
     * @returns
     */
    hide() {
      if (this.hasAttribute('leaving')) return;

      this.setAttribute('leaving', '');
      const duration =
        parseFloat(
          getComputedStyle(this).getPropertyValue('--toast-duration')
        ) || 400;
      setTimeout(() => {
        this.dispatchEvent(
          new CustomEvent('toast-close', {
            bubbles: true,
            composed: true
          })
        );
        this.remove();
      }, duration);
    }
  }

  customElements.define('punica-toast', Toast);
})();
