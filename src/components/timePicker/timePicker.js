(function () {
  const template = document.createElement('template');

  template.innerHTML = `
  <punica-input size="small" placeholder="Lorem Ipsum...">
    <slot name="endAdornment" slot="endAdornment">
    </slot> 
  </punica-input>
  <punica-popover open="false" minimumtargetwidth="true">
      <punica-paper id="calendar-container">
          <punica-toggle-button-group value="AM" orientation="vertical">
            <punica-toggle-button value="AM">
              <punica-typography slot="active">AM</punica-typography>
              <punica-typography slot="passive">AM</punica-typography>
            </punica-toggle-button>
            <punica-toggle-button value="PM">
              <punica-typography slot="active">PM</punica-typography>
              <punica-typography slot="passive">PM</punica-typography>
            </punica-toggle-button>
        </punica-toggle-button-group>
        <div class="time">
              <div class="hour">
                    <slot name="hour-up">
                    </slot>
                  <punica-typography variant='headline4' id="hour-display">
                    12
                  </punica-typography> 
                    <slot name="hour-down">
                    </slot>
              </div>
              <punica-typography class="timepicker-dot" variant='headline3'>
                :
              </punica-typography> 
              <div class="minutes">
                  <slot name="minutes-up">
                  </slot>
                  <punica-typography variant='headline3' id="minutes-display">
                    00
                  </punica-typography> 
                  <slot name="minutes-down">
                  </slot>
              </div>
        </div>
      </punica-paper>
      </punica-popover>
  <style></style>`;

  class TimePicker extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #popover = null;
    #hourDisplay = null;
    #minutesDisplay = null;
    #hourUpButton = null;
    #hourDownButton = null;
    #minutesUpButton = null;
    #minutesDownButton = null;

    /**
     *
     */
    get open() {
      return this.hasAttribute('open');
    }

    /**
     *
     */
    set open(value) {
      if (value) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['open'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#popover = this.#shadow.querySelector('punica-popover');
      this.#hourDisplay = this.#shadow.querySelector('#hour-display');
      this.#minutesDisplay = this.#shadow.querySelector('#minutes-display');

      this.#hourUpButton = this.#shadow.querySelector('slot[name="hour-up"]');
      this.#hourDownButton = this.#shadow.querySelector(
        'slot[name="hour-down"]'
      );
      this.#minutesUpButton = this.#shadow.querySelector(
        'slot[name="minutes-up"]'
      );
      this.#minutesDownButton = this.#shadow.querySelector(
        'slot[name="minutes-down"]'
      );

      this.incrementHour = this.incrementHour.bind(this);
      this.decrementHour = this.decrementHour.bind(this);
      this.incrementMinutes = this.incrementMinutes.bind(this);
      this.decrementMinutes = this.decrementMinutes.bind(this);
    }

    /**
     *
     */
    show() {
      const position = this.getBoundingClientRect();

      this.setAttribute('focus', '');
      this.#popover.setAttribute('top', position.top + 46);
      this.#popover.setAttribute('left', position.left);
      this.#popover.setAttribute('width', 214);
      this.#popover.setAttribute('bottom', position.bottom);
      this.#popover.setAttribute('open', '');
    }

    /**
     *
     */
    hide() {
      this.removeAttribute('focus');
      this.#popover.removeAttribute('open');
    }

    /**
     *
     */
    incrementHour() {
      let currentHour = parseInt(this.#hourDisplay.textContent, 10);
      currentHour = (currentHour % 12) + 1;
      this.#hourDisplay.textContent = currentHour.toString().padStart(2, '0');
    }

    /**
     *
     */
    decrementHour() {
      let currentHour = parseInt(this.#hourDisplay.textContent, 10);
      currentHour = currentHour === 1 ? 12 : currentHour - 1;
      this.#hourDisplay.textContent = currentHour.toString().padStart(2, '0');
    }

    /**
     *
     */
    incrementMinutes() {
      let currentMinutes = parseInt(this.#minutesDisplay.textContent, 10);
      currentMinutes = (currentMinutes + 1) % 60;
      this.#minutesDisplay.textContent = currentMinutes
        .toString()
        .padStart(2, '0');
    }

    /**
     *
     */
    decrementMinutes() {
      let currentMinutes = parseInt(this.#minutesDisplay.textContent, 10);
      currentMinutes = currentMinutes === 0 ? 59 : currentMinutes - 1;
      this.#minutesDisplay.textContent = currentMinutes
        .toString()
        .padStart(2, '0');
    }

    /**
     *
     */
    connectedCallback() {
      this.show();
      this.#hourUpButton.addEventListener('click', this.incrementHour);
      this.#hourDownButton.addEventListener('click', this.decrementHour);
      this.#minutesUpButton.addEventListener('click', this.incrementMinutes);
      this.#minutesDownButton.addEventListener('click', this.decrementMinutes);
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#hourUpButton.removeEventListener('click', this.incrementHour);
      this.#hourDownButton.removeEventListener('click', this.decrementHour);
      this.#minutesUpButton.removeEventListener('click', this.incrementMinutes);
      this.#minutesDownButton.removeEventListener(
        'click',
        this.decrementMinutes
      );
    }
  }

  customElements.define('punica-time-picker', TimePicker);
})();
