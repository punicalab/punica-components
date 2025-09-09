(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="region top-left"></div>
    <div class="region top-center"></div>
    <div class="region top-right"></div>
    <div class="region bottom-left"></div>
    <div class="region bottom-center"></div>
    <div class="region bottom-right"></div>
    <style></style>
  `;

  class Toaster extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));

      this.addEventListener('toast-close', (e) => {
        const t = e.target;
        if (t instanceof HTMLElement) t.remove();
      });
    }

    /**
     *
     * @param {*} opts
     * @returns
     */
    push(opts = {}) {
      const {
        title = '',
        message = '',
        variant = 'neutral',
        duration = 1000,
        dismissible = true,
        placement = 'top-right'
      } = opts;

      const region =
        this.#shadow.querySelector(`.region.${placement}`) ||
        this.#shadow.querySelector('.region.top-right');

      const toast = document.createElement('punica-toast');
      toast.setAttribute('variant', variant);

      if (title) toast.setAttribute('title', title);
      if (message) toast.setAttribute('message', message);
      if (duration > 0) toast.setAttribute('duration', String(duration));

      toast.setAttribute('dismissible', String(dismissible));
      toast.setAttribute(
        'enter-from',
        placement.startsWith('top') ? 'top' : 'bottom'
      );

      region.prepend(toast);

      return toast;
    }
  }

  window.Toast = {
    ensure() {
      let t = document.querySelector('punica-toaster');

      if (!t) {
        t = document.createElement('punica-toaster');
        document.body.appendChild(t);
      }

      return t;
    },
    show(options) {
      return this.ensure().push(options);
    }
  };

  customElements.define('punica-toaster', Toaster);
})();
