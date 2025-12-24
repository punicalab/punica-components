(function () {
  const template = document.createElement('template');
  template.innerHTML = `
      <div class="root" part="root">
        <slot></slot>
        <div class="layout" part="layout" role="group" aria-label="Resizable split panes"></div>
      </div>
      <style></style>
    `;

  class Split extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #layoutEl;
    #panes = [];
    #gutters = [];
    #sizes = [];
    #mins = [];
    #drag = null;
    #isDragging = false;

    #mo = null;
    #attrWriting = false;

    static get observedAttributes() {
      return ['orientation', 'sizes', 'min', 'step'];
    }

    get orientation() {
      return (this.getAttribute('orientation') || 'horizontal').toLowerCase();
    }
    set orientation(v) {
      this.setAttribute('orientation', v);
    }

    get sizes() {
      const s = this.getAttribute('sizes');
      if (!s) return null;
      return s
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => !Number.isNaN(n));
    }
    set sizes(v) {
      if (Array.isArray(v)) this.setAttribute('sizes', v.join(','));
      else this.removeAttribute('sizes');
    }

    get min() {
      const m = this.getAttribute('min');
      if (!m) return null;
      return m
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => !Number.isNaN(n));
    }
    set min(v) {
      if (Array.isArray(v)) this.setAttribute('min', v.join(','));
      else if (typeof v === 'number') this.setAttribute('min', String(v));
      else this.removeAttribute('min');
    }

    get step() {
      const s = this.getAttribute('step');
      if (!s) return null;
      const num = Number(s);
      return Number.isNaN(num) ? null : num;
    }

    set step(v) {
      if (v != null && v !== '') this.setAttribute('step', String(v));
      else this.removeAttribute('step');
    }

    constructor() {
      super();
    }

    connectedCallback() {
      super.connectedCallback();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#layoutEl = this.#shadow.querySelector('.layout');

      this.#adoptChildrenToSlots();
      this.#buildLayout();
      this.#initSizes(false);

      this.#mo = new MutationObserver(() => this.#onChildrenMutated());
      this.#mo.observe(this, { childList: true });
    }

    disconnectedCallback() {
      window.removeEventListener('pointermove', this.#onPointerMove);
      window.removeEventListener('pointerup', this.#onPointerUp);
      this.#mo?.disconnect();
      this.#mo = null;
    }

    attributeChangedCallback(name) {
      if (!this.isConnected) return;

      if (name === 'sizes' && this.#attrWriting) return;

      if (name === 'orientation') this.#applyFlexDirections();
      if (name === 'sizes') this.#initSizes(true);
      if (name === 'min') this.#initMins();
    }

    setSizes(arr) {
      if (!Array.isArray(arr) || arr.length !== this.#panes.length) return;
      const sum = arr.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.01) return;
      this.#sizes = [...arr];
      this.#applySizes();
      this.#writeSizesAttr();
      this.#emitChange(!this.#isDragging);
    }
    getSizes() {
      return [...this.#sizes];
    }
    reset() {
      this.removeAttribute('sizes');
      this.#initSizes(false);
    }

    #adoptChildrenToSlots() {
      const kids = Array.from(this.children).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE
      );
      kids.forEach((el, i) => {
        el.setAttribute('slot', `pane-${i}`);
      });
    }

    #buildLayout() {
      this.#layoutEl.innerHTML = '';
      this.#panes = [];
      this.#gutters = [];

      const lightChildren = Array.from(this.children).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE
      );
      const count = lightChildren.length;
      if (!count) return;

      for (let i = 0; i < count; i++) {
        const pane = document.createElement('div');
        pane.className = 'pane';
        pane.setAttribute('part', 'pane');
        pane.style.flex = '1 1 0%';
        pane.style.position = 'relative';

        const s = document.createElement('slot');
        s.name = `pane-${i}`;
        pane.appendChild(s);

        this.#layoutEl.appendChild(pane);
        this.#panes.push({ el: pane, slotName: `pane-${i}` });

        if (i < count - 1) {
          const gutter = document.createElement('div');
          gutter.className = 'gutter';
          gutter.setAttribute('part', 'gutter');
          gutter.tabIndex = 0;
          gutter.setAttribute('role', 'separator');
          gutter.setAttribute(
            'aria-orientation',
            this.orientation === 'vertical' ? 'vertical' : 'horizontal'
          );
          gutter.dataset.index = String(i);
          this.#layoutEl.appendChild(gutter);
          this.#gutters.push(gutter);

          gutter.addEventListener('pointerdown', this.#onPointerDown);
          gutter.addEventListener('keydown', this.#onGutterKeydown);
        }
      }

      this.#applyFlexDirections();
      this.#initMins();
    }

    #applyFlexDirections() {
      this.#gutters.forEach((g) =>
        g.setAttribute(
          'aria-orientation',
          this.orientation === 'vertical' ? 'vertical' : 'horizontal'
        )
      );
    }

    #initMins() {
      const count = this.#panes.length;
      const minsAttr = this.min;
      this.#mins = Array(count).fill(5);
      if (minsAttr && minsAttr.length) {
        if (minsAttr.length === 1)
          this.#mins = Array(count).fill(
            Math.max(0, Math.min(100, minsAttr[0]))
          );
        else
          for (let i = 0; i < count; i++)
            this.#mins[i] = Math.max(0, Math.min(100, minsAttr[i] ?? 5));
      }
    }

    #initSizes(fromAttr = false) {
      const count = this.#panes.length;
      if (!count) return;
      let sizes = this.sizes;
      if (!sizes || sizes.length !== count)
        sizes = Array(count).fill(100 / count);
      else {
        const sum = sizes.reduce((a, b) => a + b, 0);
        if (sum !== 100) sizes = sizes.map((v) => (v * 100) / sum);
      }
      this.#initMins();
      sizes = this.#constrainAndNormalize(sizes);
      this.#sizes = sizes;
      this.#applySizes();
      if (!fromAttr) this.#writeSizesAttr();
      this.#emitChange(!this.#isDragging);
    }

    #constrainAndNormalize(sizes) {
      const mins = this.#mins;
      let adjusted = sizes.map((v, i) => Math.max(v, mins[i]));
      let sum = adjusted.reduce((a, b) => a + b, 0);
      if (sum > 100) {
        let excess = sum - 100;
        const order = adjusted
          .map((v, i) => ({ v, i }))
          .sort((a, b) => b.v - a.v);
        for (const item of order) {
          const i = item.i;
          const canReduce = Math.max(0, adjusted[i] - mins[i]);
          const take = Math.min(canReduce, excess);
          adjusted[i] -= take;
          excess -= take;
          if (excess <= 0) break;
        }
      }
      sum = adjusted.reduce((a, b) => a + b, 0);
      if (sum < 100) {
        let deficit = 100 - sum;
        const flexibles = adjusted.map((v, i) => Math.max(0, v - mins[i]));
        const flexSum = flexibles.reduce((a, b) => a + b, 0);
        if (flexSum === 0) adjusted[0] += deficit;
        else
          for (let i = 0; i < adjusted.length; i++)
            adjusted[i] += (flexibles[i] / flexSum) * deficit;
      }
      const total = adjusted.reduce((a, b) => a + b, 0);
      return adjusted.map((v) => (v * 100) / total);
    }

    #applySizes() {
      if (!this.#panes.length) return;

      const safe = (v) => (Number.isFinite(v) ? v : 0);

      const visibleIdx = [];
      this.#panes.forEach((p, i) => {
        const v = safe(this.#sizes[i]);
        if (v > 0.0001) visibleIdx.push(i);
      });

      if (visibleIdx.length <= 1) {
        // TEK PANE MODU
        const idx = visibleIdx[0] ?? 0;
        this.#panes.forEach((p, i) => {
          if (i === idx) {
            p.el.style.display = '';
            p.el.style.flex = '0 0 100%';
          } else {
            p.el.style.display = 'none';
            p.el.style.flex = '0 0 0%';
          }
        });
        this.#gutters.forEach((g) => (g.style.display = 'none'));
        return;
      }

      this.#panes.forEach((p, i) => {
        const v = safe(this.#sizes[i]);
        p.el.style.display = v <= 0.0001 ? 'none' : '';
        p.el.style.flex = `0 0 ${v}%`;
      });

      this.#gutters.forEach((g, i) => {
        const leftVisible = safe(this.#sizes[i]) > 0.0001;
        const rightVisible = safe(this.#sizes[i + 1]) > 0.0001;
        g.style.display = leftVisible && rightVisible ? '' : 'none';
      });
    }

    #emitChange(final = false) {
      this.dispatchEvent(
        new CustomEvent('split-change', {
          bubbles: true,
          composed: true,
          detail: { sizes: this.getSizes(), final }
        })
      );
    }

    #onPointerDown = (ev) => {
      this.#isDragging = true;

      const gutter = ev.currentTarget;
      const index = Number(gutter.dataset.index);
      if (Number.isNaN(index)) return;

      gutter.setPointerCapture(ev.pointerId);
      gutter.classList.add('dragging');
      this.toggleAttribute('no-transition', true);
      document.documentElement.classList.add('drag-disable-select');

      const rect = this.#shadow
        .querySelector('.layout')
        .getBoundingClientRect();
      const isVert = this.orientation === 'vertical';
      this.#drag = {
        pointerId: ev.pointerId,
        index,
        startPos: isVert ? ev.clientY : ev.clientX,
        rectStart: isVert ? rect.top : rect.left,
        sizePx: isVert ? rect.height : rect.width,
        initialSizes: [...this.#sizes],
        isVert
      };

      window.addEventListener('pointermove', this.#onPointerMove, {
        passive: false
      });
      window.addEventListener('pointerup', this.#onPointerUp, {
        passive: true
      });
    };

    #onPointerMove = (ev) => {
      if (!this.#drag || ev.pointerId !== this.#drag.pointerId) return;
      ev.preventDefault();
      const { index, startPos, sizePx, initialSizes, isVert } = this.#drag;
      const current = isVert ? ev.clientY : ev.clientX;
      let deltaPx = current - startPos;

      const isRTL = getComputedStyle(this).direction === 'rtl';
      if (!isVert && isRTL) deltaPx = -deltaPx;

      let deltaPercent = (deltaPx / sizePx) * 100;

      // Snap to step if step is defined
      if (this.step) {
        deltaPercent = Math.round(deltaPercent / this.step) * this.step;
      }

      const sizes = [...initialSizes];
      const a = index,
        b = index + 1;
      let newA = sizes[a] + deltaPercent;
      let newB = sizes[b] - deltaPercent;

      const minA = this.#mins[a],
        minB = this.#mins[b];

      if (newA < minA) {
        const diff = minA - newA;
        newA = minA;
        newB -= diff;
      } else if (newB < minB) {
        const diff = minB - newB;
        newB = minB;
        newA -= diff;
      }

      if (newA >= minA && newB >= minB) {
        sizes[a] = newA;
        sizes[b] = newB;
        this.#sizes = sizes;
        this.#applySizes();
        this.#writeSizesAttr();
        this.#emitChange(false);
      }
    };

    #onPointerUp = () => {
      if (!this.#drag) return;
      const gutter = this.#gutters[this.#drag.index];
      if (gutter) gutter.classList.remove('dragging');
      this.toggleAttribute('no-transition', false);
      document.documentElement.classList.remove('drag-disable-select');
      window.removeEventListener('pointermove', this.#onPointerMove);
      window.removeEventListener('pointerup', this.#onPointerUp);
      this.#drag = null;
      this.#isDragging = false;
      this.#writeSizesAttr();
      this.#emitChange(true);
    };

    #onGutterKeydown = (ev) => {
      const gutter = ev.currentTarget;
      const index = Number(gutter.dataset.index);
      if (Number.isNaN(index)) return;

      const isVert = this.orientation === 'vertical';
      const isRTL = getComputedStyle(this).direction === 'rtl';
      const keyboardStep = ev.shiftKey ? 5 : 1;

      const incKeys = isVert
        ? ['ArrowDown']
        : isRTL
        ? ['ArrowLeft']
        : ['ArrowRight'];
      const decKeys = isVert
        ? ['ArrowUp']
        : isRTL
        ? ['ArrowRight']
        : ['ArrowLeft'];
      if (![...incKeys, ...decKeys].includes(ev.key)) return;

      ev.preventDefault();
      const sizes = [...this.#sizes];
      const a = index,
        b = index + 1;
      let delta = incKeys.includes(ev.key) ? keyboardStep : -keyboardStep;

      // Snap to step attribute if defined
      if (this.step) {
        delta = Math.round(delta / this.step) * this.step;
        if (delta === 0)
          delta = incKeys.includes(ev.key) ? this.step : -this.step;
      }

      const minA = this.#mins[a],
        minB = this.#mins[b];
      let newA = sizes[a] + delta;
      let newB = sizes[b] - delta;

      if (newA < minA) {
        const diff = minA - newA;
        newA = minA;
        newB -= diff;
      } else if (newB < minB) {
        const diff = minB - newB;
        newB = minB;
        newA -= diff;
      }

      if (newA >= minA && newB >= minB) {
        sizes[a] = newA;
        sizes[b] = newB;
        this.#sizes = sizes;
        this.#applySizes();
        this.#writeSizesAttr();
        this.#emitChange(true);
      }
    };

    #onChildrenMutated() {
      const prevSizes = [...this.#sizes];
      const prevCount = this.#panes.length;

      this.#adoptChildrenToSlots();

      this.#buildLayout();

      const nextCount = this.#panes.length;
      if (nextCount === 0) return;

      if (this.hasAttribute('sizes')) {
        this.#initSizes(true);
        return;
      }

      if (prevSizes.length && prevCount > 0) {
        const next = this.#reflowSizesToNewCount(
          prevSizes,
          prevCount,
          nextCount
        );
        this.#sizes = next;
        this.#applySizes();
        this.#writeSizesAttr();
        this.#emitChange(!this.#isDragging);
      } else {
        this.#initSizes(false);
      }
    }

    #reflowSizesToNewCount(prev, prevCount, nextCount) {
      const clean = (a) =>
        a.map((v) => {
          const n = Number(v);
          return Number.isFinite(n) && n > 0 ? n : 0;
        });

      prev = clean(prev);
      const sumPrev = prev.reduce((a, b) => a + b, 0) || 1;
      prev = prev.map((v) => (v * 100) / sumPrev);

      if (nextCount === prevCount) return [...prev];

      if (nextCount < prevCount) {
        const cut = prev.slice(0, nextCount);
        const s = cut.reduce((a, b) => a + b, 0) || 1;
        return cut.map((v) => (v * 100) / s);
      }

      const used = prev.reduce((a, b) => a + b, 0);
      const remain = Math.max(0, 100 - used);
      const extraEach = remain / (nextCount - prevCount || 1);
      return [...prev, ...Array(nextCount - prevCount).fill(extraEach)];
    }

    #sizesToAttrString(arr = this.#sizes) {
      return arr.map((v) => (Number.isFinite(v) ? +v.toFixed(4) : 0)).join(',');
    }

    #writeSizesAttr() {
      const next = this.#sizesToAttrString();
      if (this.getAttribute('sizes') !== next) {
        this.#attrWriting = true;
        this.setAttribute('sizes', next);
        queueMicrotask(() => {
          this.#attrWriting = false;
        });
      }
    }
  }

  customElements.define('punica-split', Split);
})();
