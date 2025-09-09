(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-card class="card" rounded="true">
      <punica-card-header>
        <punica-row wrap="nowrap" alignitems="center" justifycontent="space-between">
          <punica-col>
            <punica-typography variant="body2" class="title"></punica-typography>
          </punica-col>
          <punica-col>
            <punica-icon-button size="xsmall" class="close" style="padding:4px">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="#fff" d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>
            </punica-icon-button>
          </punica-col>
        </punica-row>
      </punica-card-header>
      <punica-card-content>
        <punica-typography variant="body2" class="msg"></punica-typography>
      </punica-card-content>
      <punica-card-actions>
        <div class="progress" hidden><i></i></div>
      </punica-card-actions>
    </punica-card>
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
        .querySelector('punica-icon-button.close')
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
