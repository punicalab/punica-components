(function () {
  const template = document.createElement('template');

  template.innerHTML = `
      <style></style>
      <label class="switch jsSwitcher" id="switchContainer" role="switch" aria-label="regular switch">
        <input type="checkbox" class="off-screen" name="switcher" id="switcher" aria-hidden="true" />
        <span class="switch__off-text"></span>
        <span class="switch__lever" id="switchLever" aria-hidden="true"></span>
        <span class="switch__on-text"></span>
      </label>`;

  class Switch extends PunicaBase {
    static get booleanAttributes() {
      return ['disabled', 'elastic'];
    }
    /**
     *
     */
    get name() {
      return this.getAttribute('name');
    }

    /**
     *
     */
    set name(val) {
      this.setAttribute('name', val);
    }

    /**
     *
     */
    get initState() {
      return this.getAttribute('initstate');
    }

    /**
     *
     */
    set initState(val) {
      this.setAttribute('initstate', val);
    }

    /**
     *
     */
    get state() {
      return this.getAttribute('state') || this.offLabel;
    }

    /**
     * Programmatic state changes should update UI but NOT simulate a user click.
     * Custom change events are dispatched only from the native change handler.
     */
    set state(val) {
      const boolVal = val === true || val === 'true';
      const currentAttr = this.getAttribute('state');
      const currentBool = currentAttr === 'true';

      if (boolVal === currentBool) return;

      this.setAttribute('state', String(boolVal));

      if (this._switcher) {
        this._switcher.checked = boolVal;
      }

      this.setAttribute('aria-checked', String(boolVal));
    }

    /**
     *
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     *
     */
    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     *
     */
    get elastic() {
      return this.hasAttribute('elastic');
    }

    /**
     *
     */
    set elastic(value) {
      if (value) {
        this.setAttribute('elastic', '');
      } else {
        this.removeAttribute('elastic');
      }
    }

    /**
     *
     */
    get onLabel() {
      const onTextElem = this.shadowRoot.querySelector('.switch__on-text');
      if (onTextElem) {
        return onTextElem.textContent;
      }
    }

    /**
     *
     */
    set onLabel(val) {
      if (val) {
        const onTextElem = this.shadowRoot.querySelector('.switch__on-text');
        if (onTextElem) {
          onTextElem.textContent = val;
        }
      }
    }

    /**
     *
     */
    get offLabel() {
      const offTextElem = this.shadowRoot.querySelector('.switch__off-text');
      if (offTextElem) {
        return offTextElem.textContent;
      }
    }

    /**
     *
     */
    set offLabel(val) {
      if (val) {
        const offTextElem = this.shadowRoot.querySelector('.switch__off-text');
        if (offTextElem) {
          offTextElem.textContent = val;
        }
      }
    }

    /**
     *
     */
    constructor() {
      super();

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this._onSwitcherChange = this._onSwitcherChange.bind(this);
      this._onSwitchContainerKeyUp = this._onSwitchContainerKeyUp.bind(this);
      this._onSwitchContainerKeyDown =
        this._onSwitchContainerKeyDown.bind(this);

      this._switcher = this.shadowRoot.getElementById('switcher');
      this._switchLever = this.shadowRoot.getElementById('switchLever');
      this._switchContainer = this.shadowRoot.getElementById('switchContainer');
    }

    static get observedAttributes() {
      return ['elastic', 'on-label', 'off-label', 'disabled'];
    }

    /**
     *
     */
    connectedCallback(e) {
      super.connectedCallback();

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'switch');
      }
      if (!this.hasAttribute('aria-checked')) {
        this.setAttribute('aria-checked', 'false');
      }

      if (this._switcher) {
        this._switcher.addEventListener('change', this._onSwitcherChange);
      }

      if (this._switchContainer) {
        this._switchContainer.addEventListener(
          'keydown',
          this._onSwitchContainerKeyDown,
          true
        );
        this._switchContainer.addEventListener(
          'keyup',
          this._onSwitchContainerKeyUp,
          true
        );
      }

      this.setAttribute('state', this.state);
      this._upgradeProperty('state');
      this._upgradeProperty('disabled');
      this._upgradeProperty('elastic');
      this._upgradeProperty('onLabel');
      this._upgradeProperty('offLabel');

      const initStateValue = this.initState;

      if (initStateValue == 'true' && this._switcher) {
        this._switcher.click();
      }
    }

    /**
     *
     */
    disconnectedCallback(e) {
      if (this._switcher) {
        this._switcher.removeEventListener('change', this._onSwitcherChange);
      }

      if (this._switchContainer) {
        this._switchContainer.removeEventListener(
          'keydown',
          this._onSwitchContainerKeyDown,
          true
        );
        this._switchContainer.removeEventListener(
          'keyup',
          this._onSwitchContainerKeyUp,
          true
        );
      }

      this._switcher = null;
      this._switchLever = null;
      this._switchContainer = null;
      this._onSwitcherChange = null;
      this._onSwitchContainerKeyDown = null;
      this._onSwitchContainerKeyUp = null;
    }

    /**
     *
     */
    attributeChangedCallback(name, prevVal, curVal) {
      if (this.normalizeBooleanAttributeIfNeeded(name, curVal)) {
        return;
      }

      if (name === 'elastic') {
        this._handleElasticAttributeChange(this.elastic);
      }

      if (name === 'disabled') {
        this._handleDisabledAttributeChange(this.disabled);
      }

      if (name === 'on-label') {
        this.onLabel = curVal;
      }

      if (name === 'off-label') {
        this.offLabel = curVal;
      }
    }

    /*===========================
    PRIVATE FUNCTIONS 
    =============================*/
    _handleElasticAttributeChange(isElastic) {
      const switchContainer = this.shadowRoot.querySelector('.switch');
      if (isElastic && switchContainer) {
        switchContainer.classList.add('switch--elastic');
      } else if (switchContainer) {
        switchContainer.classList.remove('switch--elastic');
      }
    }

    _handleDisabledAttributeChange(isDisabled) {
      this._setAriaDisabled(this, isDisabled);

      if (this._switcher) {
        this._switcher.disabled = isDisabled;
        if (isDisabled) {
          this.blur();
          this._switcher.blur();
        }
      }
    }

    _upgradeProperty(prop) {
      if (this.hasOwnProperty(prop)) {
        const val = this[prop];
        delete this[prop];
        this[prop] = val;
      }
    }

    _setAriaDisabled(elem, value) {
      if (value !== true && value !== false) return;

      if (value === true) {
        elem.setAttribute('aria-disabled', value);
      } else {
        elem.removeAttribute('aria-disabled');
      }
    }

    _dispatchCustomChangeEvent() {
      const customEventArgs = {
        detail: {
          state: this.state
        },
        bubbles: true,
        cancelable: false,
        composed: true
      };

      const customChangeEvent = new CustomEvent('change', customEventArgs);

      this.dispatchEvent(customChangeEvent);
    }

    /*===========================
    PRIVATE EVENT HANDLERS 
    =============================*/
    _onSwitcherChange(e) {
      const switcher = e.currentTarget;
      const checked = switcher.checked;

      this.setAttribute('aria-checked', String(checked));
      this.setAttribute('state', String(checked));

      this._dispatchCustomChangeEvent();
    }

    _onSwitchContainerKeyDown(e) {
      if (e.keyCode === 32) {
        this._switchLever.classList.add('is-active');
      }
    }

    _onSwitchContainerKeyUp(e) {
      if (e.keyCode === 32) {
        this._switchLever.classList.remove('is-active');
      }
    }
  }

  customElements.define('punica-switch', Switch);
})();
