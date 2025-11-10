(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="viewport">
      <table class="vtable">
        <thead>
          <tr><th style="text-align:left;padding:8px 12px;">Name</th><th>Company</th><th>Title</th></tr>
        </thead>
        <tbody class="pool">
          <tr class="pad pad-top" aria-hidden="true"><td colspan="99" style="padding:0;border:0;height:0"></td></tr>
          <tr class="pad pad-bottom" aria-hidden="true"><td colspan="99" style="padding:0;border:0;height:0"></td></tr>
        </tbody>
      </table>
    </div>
    <style></style>`;

  class VirtualTable extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #tbody;
    #padTop;
    #padBottom;

    items = [];
    renderer = null;

    #itemHeight = 48;
    #overscan = 6;
    onNearEnd = null;

    #attached = false;
    #raf = 0;
    #firstIndex = 0;
    #poolSize = 0;

    /**
     *
     */
    static get observedAttributes() {
      return ['itemheight', 'overscan'];
    }

    /**
     *
     */
    constructor() {
      super();
      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#tbody = this.#shadow.querySelector('.pool');
      this.#padTop = this.#shadow.querySelector('.pad-top');
      this.#padBottom = this.#shadow.querySelector('.pad-bottom');

      this.addEventListener('scroll', this.#onScroll, { passive: true });
      new ResizeObserver(() => this.#scheduleUpdate()).observe(this);
    }

    get itemHeight() {
      return this.#itemHeight;
    }
    set itemHeight(v) {
      const n = Math.max(1, parseInt(v, 10) || 48);
      if (n !== this.#itemHeight) {
        this.#itemHeight = n;
        this.setAttribute('itemheight', String(n));
        this.#scheduleUpdate(true);
      }
    }
    get overscan() {
      return this.#overscan;
    }
    set overscan(v) {
      const n = Math.max(0, parseInt(v, 10) || 6);
      if (n !== this.#overscan) {
        this.#overscan = n;
        this.setAttribute('overscan', String(n));
        this.#scheduleUpdate(true);
      }
    }

    /**
     *
     * @param {*} name
     * @param {*} _old
     * @param {*} val
     */
    attributeChangedCallback(name, _old, val) {
      if (name === 'itemheight') this.itemHeight = val;
      if (name === 'overscan') this.overscan = val;
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      if (this.hasAttribute('itemheight'))
        this.itemHeight = this.getAttribute('itemheight');
      if (this.hasAttribute('overscan'))
        this.overscan = this.getAttribute('overscan');
      this.#attached = true;
      this.#scheduleUpdate(true);
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#attached = false;
      cancelAnimationFrame(this.#raf);
    }

    /**
     *
     * @param {*} items
     */
    setData(items) {
      this.items = Array.isArray(items) ? items : [];
      this.#scheduleUpdate(true);
    }

    /**
     *
     * @param {*} fn
     */
    setRenderer(fn) {
      this.renderer = typeof fn === 'function' ? fn : null;
      this.#scheduleUpdate(true);
    }

    /**
     *
     * @returns
     */
    #onScroll = () => this.#scheduleUpdate();

    /**
     *
     * @param {*} force
     * @returns
     */
    #scheduleUpdate(force = false) {
      if (!this.#attached) return;
      cancelAnimationFrame(this.#raf);
      this.#raf = requestAnimationFrame(() => this.#update(force));
    }

    /**
     *
     * @returns
     */
    #calcVisible() {
      const vh = this.clientHeight || 0;
      const rowsInView = Math.ceil(vh / this.#itemHeight);
      const poolSize = Math.min(
        this.items.length,
        rowsInView + this.#overscan * 2
      );
      const top = this.scrollTop;
      const start = Math.max(
        0,
        Math.floor(top / this.#itemHeight) - this.#overscan
      );
      const end = Math.min(this.items.length, start + poolSize);
      return { start, end, poolSize };
    }

    /**
     *
     * @param {*} force
     * @returns
     */
    #update(force = false) {
      if (!this.renderer || !this.items) return;

      const totalHeight = this.items.length * this.#itemHeight;
      const { start, end, poolSize } = this.#calcVisible();
      const topH = start * this.#itemHeight;
      const visibleCount = end - start;
      const bottomH = totalHeight - topH - visibleCount * this.#itemHeight;

      this.#padTop.firstElementChild.style.height = topH + 'px';
      this.#padBottom.firstElementChild.style.height =
        Math.max(0, bottomH) + 'px';

      if (force || poolSize !== this.#poolSize || this.#firstIndex !== start) {
        let node = this.#padTop.nextSibling;
        while (node && node !== this.#padBottom) {
          const next = node.nextSibling;
          this.#tbody.removeChild(node);
          node = next;
        }

        for (let i = start; i < end; i++) {
          const tr = this.#renderRow(this.items[i], i);
          tr.classList.add('row');
          tr.style.setProperty('--row-height', this.#itemHeight + 'px');
          this.#tbody.insertBefore(tr, this.#padBottom);
        }

        this.#poolSize = poolSize;
        this.#firstIndex = start;
      }

      const remaining = this.items.length - (end + this.#overscan);
      if (
        remaining < (this.#poolSize || 1) * 2 &&
        typeof this.onNearEnd === 'function'
      ) {
        this.onNearEnd(end);
      }
    }

    /**
     *
     * @param {*} item
     * @param {*} index
     * @returns
     */
    #renderRow(item, index) {
      const tmp = document.createElement('tbody');
      this.renderer(tmp, item, index);
      const tr = tmp.querySelector('tr');
      if (!tr) throw new Error('renderer must append a single <tr> root.');
      if (index === this.items.length - 1) tr.removeAttribute('data-divider');
      return tr;
    }
  }

  customElements.define('punica-virtual-table', VirtualTable);
})();
