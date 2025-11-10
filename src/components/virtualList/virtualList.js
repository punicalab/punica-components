(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="viewport">
      <div class="spacer"></div>
      <div class="pool"></div>
    </div>
    <style></style>`;

  class VirtualList extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #poolWrap;
    #spacer;

    items = [];
    renderer = null;

    #itemHeight = 48;
    #overscan = 6;
    onNearEnd = null;

    #pool = [];
    #firstIndex = 0;
    #poolSize = 0;
    #attached = false;
    #raf = 0;

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
      this.#spacer = this.#shadow.querySelector('.spacer');
      this.#poolWrap = this.#shadow.querySelector('.pool');

      this.addEventListener('scroll', this.#onScroll, { passive: true });
      new ResizeObserver(() => this.#scheduleUpdate()).observe(this);
    }

    get itemHeight() {
      return this.#itemHeight;
    }
    set itemHeight(val) {
      const parsed = Math.max(1, parseInt(val, 10) || 48);
      if (this.#itemHeight !== parsed) {
        this.#itemHeight = parsed;
        this.setAttribute('itemheight', String(parsed));
        this.#scheduleUpdate(true);
      }
    }

    get overscan() {
      return this.#overscan;
    }
    set overscan(val) {
      const parsed = Math.max(0, parseInt(val, 10) || 6);
      if (this.#overscan !== parsed) {
        this.#overscan = parsed;
        this.setAttribute('overscan', String(parsed));
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
      if (name === 'itemheight')
        this.itemHeight = Math.max(1, parseInt(val, 10) || 72);

      if (name === 'overscan')
        this.overscan = Math.max(0, parseInt(val, 10) || 6);

      this.#scheduleUpdate(true);
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      if (this.hasAttribute('itemheight'))
        this.itemHeight = Math.max(
          1,
          parseInt(this.getAttribute('itemheight'), 10) || 72
        );
      if (this.hasAttribute('overscan'))
        this.overscan = Math.max(
          0,
          parseInt(this.getAttribute('overscan'), 10) || 6
        );

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
      const viewportH = this.clientHeight || 0;
      const rowsInView = Math.ceil(viewportH / this.itemHeight);
      const poolSize = Math.min(
        this.items.length,
        rowsInView + this.overscan * 2
      );
      const scrollTop = this.scrollTop;
      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / this.itemHeight) - this.overscan
      );
      const endIndex = Math.min(this.items.length, startIndex + poolSize);
      return { poolSize, startIndex, endIndex };
    }

    /**
     *
     * @param {*} force
     * @returns
     */
    #update(force = false) {
      if (!this.renderer || !this.items) return;

      const total = this.items.length * this.itemHeight;
      this.#spacer.style.setProperty('--total-height', total + 'px');

      const { poolSize, startIndex, endIndex } = this.#calcVisible();

      if (
        force ||
        poolSize !== this.#poolSize ||
        this.#pool.length !== poolSize
      ) {
        this.#poolWrap.innerHTML = '';
        this.#pool = Array.from({ length: poolSize }, () => {
          const rowHost = document.createElement('div');
          rowHost.className = 'rowhost';
          rowHost.style.setProperty('--row-height', this.itemHeight + 'px');
          this.#poolWrap.appendChild(rowHost);
          return rowHost;
        });
        this.#poolSize = poolSize;
      }

      for (let i = 0; i < this.#pool.length; i++) {
        const itemIndex = startIndex + i;
        const host = this.#pool[i];

        if (itemIndex >= endIndex) {
          host.style.display = 'none';
          continue;
        }
        host.style.display = '';
        host.style.transform = `translateY(${itemIndex * this.itemHeight}px)`;

        if (
          force ||
          this.#firstIndex + i !== itemIndex ||
          !host.hasChildNodes()
        ) {
          host.replaceChildren();
          const container = this.#renderItem(this.items[itemIndex], itemIndex);
          host.appendChild(container);
        }
      }

      this.#firstIndex = startIndex;

      const remaining = this.items.length - (endIndex + this.overscan);
      if (
        remaining < (this.#poolSize || 1) * 2 &&
        typeof this.onNearEnd === 'function'
      ) {
        this.onNearEnd(endIndex);
      }
    }

    /**
     *
     * @param {*} item
     * @param {*} index
     * @returns
     */
    #renderItem(item, index) {
      const tmp = document.createElement('div');
      this.renderer(tmp, item, index);
      const child = tmp.firstElementChild;

      if (!child)
        throw new Error('renderer must append exactly one root element.');

      return child;
    }

    #onScroll = () => this.#scheduleUpdate();
  }

  customElements.define('punica-virtual-list', VirtualList);
})();
