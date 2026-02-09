(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-row wrap="nowrap" alignitems="center" spacing="0.5">
      <punica-col>
        <punica-button variant="text" size="small" id="prevPage">
          <slot name="prevPage"></slot>
        </punica-icon-button>
      </punica-col>
      <punica-col id="pages"></punica-col>
      <punica-col>
        <punica-button variant="text" size="small" id="nextPage">
          <slot name="nextPage"></slot>
        </punica-icon-button>
      </punica-col>
    </punica-row>
    <style></style>
  `;

  class Pagination extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #prevButton = null;
    #nextButton = null;
    #pages = null;

    /**
     *
     * @param {*} page
     * @param {*} totalCount
     * @param {*} size
     * @returns
     */
    paginate(page, totalCount, size) {
      if (!page || !totalCount) return null;

      const totalPagesCount = Math.ceil(totalCount / size);
      const prev = page === 1 ? null : page - 1;
      const next = page === totalPagesCount ? null : page + 1;
      const items = [1];

      if (page === 1 && totalPagesCount === 1)
        return { page, prev, next, items };
      if (page > 3) items.push('…');

      const r = 1;
      const r1 = page - r;
      const r2 = page + r;

      for (let i = r1 > 2 ? r1 : 2; i <= Math.min(totalPagesCount, r2); i++)
        items.push(i);

      if (r2 + 1 < totalPagesCount) items.push('…');
      if (r2 < totalPagesCount) items.push(totalPagesCount);

      return { page, prev, next, items };
    }

    /**
     *
     */
    get page() {
      return parseInt(this.getAttribute('page'));
    }

    /**
     *
     */
    set page(val) {
      this.setAttribute('page', val);
    }

    /**
     *
     */
    get totalCount() {
      return parseInt(this.getAttribute('totalCount'));
    }

    /**
     *
     */
    set totalCount(val) {
      this.setAttribute('totalCount', val);
    }

    /**
     *
     */
    get size() {
      return this.getAttribute('size') || 20;
    }

    /**
     *
     */
    set size(val) {
      this.setAttribute('size', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['page', 'totalCount', 'size'];
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'page':
        case 'totalCount':
        case 'size':
          break;
      }
    }

    /**
     *
     */
    prevButtonClick() {}

    /**
     *
     */
    nextButtonClick() {}

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#prevButton = this.#shadow.querySelector('#prevPage');
      this.#nextButton = this.#shadow.querySelector('#nextPage');
      this.#pages = this.#shadow.querySelector('#pages');
    }

    /**
     *
     */
    connectedCallback() {
      this.update();
    }

    /**
     *
     */
    update() {
      let element = null;
      const { page, prev, next, items } = this.paginate(
        this.page,
        this.totalCount,
        this.size
      );

      this.#pages.innerHTML = '';

      if (prev) {
        this.#prevButton.addEventListener('click', this.prevButtonClick);
        this.#prevButton.removeAttribute('disabled');
      } else {
        this.#prevButton.removeEventListener('click', this.nextButtonClick);
        this.#prevButton.setAttribute('disabled', '');
      }

      if (next) {
        this.#nextButton.addEventListener('click', this.nextButtonClick);
        this.#nextButton.removeAttribute('disabled');
      } else {
        this.#nextButton.removeEventListener('click', this.prevButtonClick);
        this.#nextButton.setAttribute('disabled', '');
      }

      items.forEach((item) => {
        if (Number.isInteger(item)) {
          element = document.createElement('punica-button');
          element.setAttribute('size', 'small');

          if (page == item) {
            element.setAttribute('color', 'primary');
            element.style.opacity = '.3';
          } else {
            element.setAttribute('variant', 'text');
            element.style.fontWeight = '500';
            element.style.opacity = '1';
          }
          element.rounded = true;
          element.style.height = '24px';
          element.style.padding = '6px 12px';
        } else {
          element = document.createElement('punica-typography');
        }

        element.innerText = item;

        this.#pages.appendChild(element);
      });
    }
  }

  customElements.define('punica-pagination', Pagination);
})();
