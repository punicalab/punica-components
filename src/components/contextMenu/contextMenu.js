(function () {
  class PCMItem extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
  }
  customElements.define('punica-context-menu-item', PCMItem);
  class PCMSeparator extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
  }
  customElements.define('punica-context-menu-separator', PCMSeparator);

  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class PunicaContextMenu extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #root;
    #openChain = [];
    #delegatedTargets = new Set();
    #hoverTimer = null;

    /**
     *
     */
    static get observedAttributes() {
      return ['target', 'disabled'];
    }

    /**
     *
     */
    constructor() {
      super();

      window.addEventListener('scroll', () => this.close(), true);
      window.addEventListener('resize', () => this.close());
      window.addEventListener('pointerdown', (e) => {
        if (!this.isConnected) return;
        const within = e.composedPath().includes(this.#root);
        if (!within) this.close();
      });
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      this.#setupDelegatedTargets();
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#teardownDelegatedTargets();
    }

    /**
     *
     * @param {*} n
     */
    attributeChangedCallback(n) {
      if (n === 'target') this.#setupDelegatedTargets();
    }

    /**
     *
     * @param {*} x
     * @param {*} y
     * @returns
     */
    openAt(x, y) {
      if (this.hasAttribute('disabled')) {
        return;
      }

      this.close();

      this.#root = document.createElement('div');
      this.#root.classList.add('punica-context-menu-root');
      this.#root.tabIndex = -1;

      this.#root.appendChild(template.content.cloneNode(true));
      const menu = this.#renderMenu(this, 0, null);

      this.#root.appendChild(menu);
      this.#openChain = [menu];
      this.#position(menu, x, y);

      this.#root.focus();

      document.body.appendChild(this.#root);
    }

    /**
     *
     */
    close() {
      if (this.#root) {
        this.#root.innerHTML = '';
        this.#root.remove();
      }
      this.#openChain = [];

      if (this.#hoverTimer) {
        clearTimeout(this.#hoverTimer);
        this.#hoverTimer = null;
      }
    }

    /**
     *
     * @returns
     */
    #setupDelegatedTargets() {
      this.#teardownDelegatedTargets();
      const sel = this.getAttribute('target');

      if (!sel) {
        return;
      }

      document.querySelectorAll(sel).forEach((el) => {
        const handler = (e) => {
          if (this.hasAttribute('disabled')) return;

          e.preventDefault();

          this.openAt(e.clientX, e.clientY);
        };

        el.addEventListener('contextmenu', handler);

        this.#delegatedTargets.add({ el, handler });
      });
    }

    /**
     *
     */
    #teardownDelegatedTargets() {
      for (const p of this.#delegatedTargets) {
        p.el.removeEventListener('contextmenu', p.handler);
      }

      this.#delegatedTargets.clear();
    }

    /**
     *
     * @param {*} source
     * @param {*} depth
     * @param {*} triggerBtn
     * @returns
     */
    #renderMenu(source, depth, triggerBtn) {
      const menu = document.createElement('div');

      menu.className = 'punica-context-menu';
      menu.setAttribute('role', 'menu');
      menu.tabIndex = -1;
      menu.__depth = depth;
      menu.__triggerBtn = triggerBtn || null;
      menu.__parentMenu = depth > 0 ? this.#openChain[depth - 1] : null;

      const list = document.createElement('ul');
      list.className = 'punica-context-menu-group';

      menu.appendChild(list);

      const children = Array.from(source.children).filter(
        (n) => !(n instanceof HTMLTemplateElement)
      );

      for (const node of children) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'punica-context-menu-separator') {
          const sep = document.createElement('div');
          sep.className = 'punica-context-menu-seperator';
          list.appendChild(sep);
        } else if (tag === 'punica-context-menu-item') {
          list.appendChild(this.#renderItem(node, depth));
        }
      }

      menu.addEventListener('pointerenter', () => this.#cancelHoverClose());
      menu.addEventListener('pointerleave', (e) => this.#scheduleHoverClose(e));

      return menu;
    }

    /**
     *
     * @param {*} itemEl
     * @param {*} depth
     * @returns
     */
    #renderItem(itemEl, depth) {
      const li = document.createElement('li');
      const btn = document.createElement('div');

      li.setAttribute('role', 'none');

      btn.className = 'punica-context-menu-item';
      btn.setAttribute('role', 'menuitem');
      btn.tabIndex = -1;

      const disabled = itemEl.hasAttribute('disabled');

      if (disabled) {
        btn.setAttribute('aria-disabled', 'true');
      }

      const value = itemEl.getAttribute('value') ?? '';
      const label = itemEl.getAttribute('label') ?? '';
      const keyboard = itemEl.getAttribute('keyboard') ?? '';
      const icon = document.createElement('span');

      icon.className = 'punica-context-menu-item-icon';
      icon.innerHTML = itemEl.getAttribute('icon') || '';

      const lbl = document.createElement('span');

      lbl.className = 'punica-context-menu-item-label';
      lbl.textContent = label;

      const right = document.createElement('span');
      right.className = 'punica-context-menu-item-keyboard';

      btn.append(icon, lbl, right);
      li.appendChild(btn);

      const hasChildren = Array.from(itemEl.children).some((n) =>
        ['punica-context-menu-item', 'punica-context-menu-separator'].includes(
          n.tagName.toLowerCase()
        )
      );

      btn.addEventListener('pointerenter', (e) => {
        this.#cancelHoverClose();
        if (
          btn._pcmSubmenu &&
          !btn._pcmSubmenu.classList.contains('punica-context-menu-hidden')
        ) {
          if (e.relatedTarget && btn._pcmSubmenu.contains(e.relatedTarget)) {
            this.#closeDeeperThan(depth);
            return;
          }
        }
        this.#closeDeeperThan(depth - 0);
      });

      btn.addEventListener('pointerleave', (e) => {
        const menu = btn.closest('.punica-context-menu');
        if (e.relatedTarget && menu && menu.contains(e.relatedTarget)) return;
        this.#scheduleHoverClose(e);
      });

      if (hasChildren) {
        btn.setAttribute('aria-haspopup', 'menu');
        btn.setAttribute('aria-expanded', 'false');
        right.innerHTML = '<span class="punica-context-menu-subarrow">›</span>';

        const submenu = this.#renderMenu(itemEl, depth + 1, btn);
        submenu.classList.add('punica-context-menu-hidden');
        this.#root.appendChild(submenu);

        const openSub = () => {
          this.#closeDeeperThan(depth);
          submenu.classList.remove('punica-context-menu-hidden');
          btn.setAttribute('aria-expanded', 'true');
          const o = btn.getBoundingClientRect(),
            m = submenu.getBoundingClientRect();
          let top = o.top,
            left = o.right + 4;
          if (top + m.height > innerHeight - 8)
            top = Math.max(8, innerHeight - m.height - 8);
          if (left + m.width > innerWidth - 8) left = o.left - m.width - 4;
          submenu.style.top = `${top}px`;
          submenu.style.left = `${left}px`;
          this.#openChain = this.#openChain.slice(0, depth + 1);
          this.#openChain[depth + 1] = submenu;
        };

        btn.addEventListener('pointerenter', () => {
          if (!disabled) openSub();
        });

        submenu.addEventListener('pointerenter', () =>
          this.#cancelHoverClose()
        );

        submenu.addEventListener('pointerleave', (e) =>
          this.#scheduleHoverClose(e)
        );

        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            openSub();
            const first = submenu.querySelector(
              '.punica-context-menu-item[role="menuitem"]:not([aria-disabled="true"])'
            );
            first?.setAttribute('aria-current', 'true');
            first?.focus();
          }
        });

        btn._pcmOpenSub = openSub;
        btn._pcmSubmenu = submenu;
      } else {
        if (keyboard) right.textContent = keyboard;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();

          if (btn.getAttribute('aria-disabled') === 'true') return;
          const path = this.#collectPath(btn);
          this.dispatchEvent(
            new CustomEvent('punica-context-menu-select', {
              bubbles: true,
              composed: true,
              detail: {
                value,
                labels: path.map((p) => p.label),
                path,
                originalEvent: e
              }
            })
          );
          this.close();
        });
      }

      btn.addEventListener('focus', () => {
        const menu = btn.closest('.punica-context-menu');
        menu
          ?.querySelectorAll('.punica-context-menu-item[aria-current="true"]')
          .forEach((x) => x.removeAttribute('aria-current'));
        btn.setAttribute('aria-current', 'true');
      });

      btn._pcmData = { value, label };
      return li;
    }

    /**
     *
     * @param {*} btn
     * @returns
     */
    #collectPath(btn) {
      const path = [];
      let m = btn.closest('.punica-context-menu');

      while (m && m.__triggerBtn) {
        const t = m.__triggerBtn;
        if (t && t._pcmData)
          path.unshift({
            label: t._pcmData.label,
            value: t._pcmData.value
          });
        m = m.__parentMenu;
      }
      const { label, value } = btn._pcmData || { label: '', value: '' };
      path.push({ label, value });
      return path;
    }

    /**
     *
     * @param {*} menu
     * @param {*} x
     * @param {*} y
     */
    #position(menu, x, y) {
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';

      menu.classList.remove('punica-context-menu-hidden');

      const r = menu.getBoundingClientRect();
      let left = x;
      let top = y;

      if (r.right > innerWidth - 8) {
        left = Math.max(8, innerWidth - r.width - 8);
      }

      if (r.bottom > innerHeight - 8) {
        top = Math.max(8, innerHeight - r.height - 8);
      }

      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }

    /**
     *
     * @param {*} e
     */
    #scheduleHoverClose(e) {
      this.#cancelHoverClose();

      this.#hoverTimer = setTimeout(() => {
        const node = e.relatedTarget;
        if (this.#isWithinOpenChain(node)) return;
        this.#closeDeeperThan(-1);
      }, 140);
    }

    /**
     *
     */
    #cancelHoverClose() {
      if (this.#hoverTimer) {
        clearTimeout(this.#hoverTimer);
        this.#hoverTimer = null;
      }
    }

    /**
     *
     * @param {*} node
     * @returns
     */
    #isWithinOpenChain(node) {
      if (!node) {
        return false;
      }

      for (const m of this.#openChain) {
        if (m.contains(node)) {
          return true;
        }

        if (
          m.__triggerBtn &&
          m.__triggerBtn.contains &&
          m.__triggerBtn.contains(node)
        )
          return true;
      }

      for (const m of this.#openChain) {
        const parent = m.__parentMenu;

        if (parent && parent.contains(node)) {
          return true;
        }
      }

      return false;
    }

    /**
     *
     * @param {*} depth
     */
    #closeDeeperThan(depth) {
      for (let i = this.#openChain.length - 1; i > depth; i--) {
        const m = this.#openChain[i];
        if (!m) {
          continue;
        }

        m.classList.add('punica-context-menu-hidden');

        if (m.__triggerBtn) {
          m.__triggerBtn.setAttribute('aria-expanded', 'false');
        }

        this.#openChain.pop();
      }
    }
  }

  customElements.define('punica-context-menu', PunicaContextMenu);
})();
