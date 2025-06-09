(async function () {
  const template = document.createElement('template');

  template.innerHTML = `
      <punica-input size="small" placeholder="Lorem Ipsum...">
         <slot name="endAdornment" slot="endAdornment"></slot>
      </punica-input>

      <punica-popover open="false" minimumtargetwidth="true">
          <punica-paper id="calendar-container">

            <div id="calendar-header">
                <slot name="previous-month">
                </slot>
                <div id="navigation-month">
                </div>
                <slot name="next-month">
                </slot>
            </div>

            <div id="calendar-body">
                <div class="days-row">
                </div>
                <div class="dates">
                </div>
            </div>

          </punica-paper>
      </punica-popover>
  <style></style>`;

  const Days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const isValidDate = (dateString) => {
    if (!dateString) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const Months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  class DatePicker extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #popover = null;
    #selectedDate = null;
    #month = null;
    #year = null;
    #navigationMonth = null;
    #previousButton = null;
    #nextButton = null;

    /**
     *
     */
    static get observedAttributes() {
      return ['open', 'value', 'timezone'];
    }

    /**
     *
     */
    get timezone() {
      return this.getAttribute('timezone') || 'default';
    }

    /**
     *
     */
    set timezone(value) {
      this.setAttribute('timezone', value);
    }

    /**
     *
     */
    get value() {
      return this.getAttribute('value');
    }

    /**
     *
     */
    get minDate() {
      return this.getAttribute('minDate');
    }

    /**
     *
     */
    get maxDate() {
      return this.getAttribute('maxDate');
    }

    /**
     *
     */
    get open() {
      return this.hasAttribute('open') || false;
    }

    /**
     *
     */
    set open(value) {
      if (value) {
        this.setAttribute('open', value);
      } else {
        this.removeAttribute('open');
      }
    }

    /**
     *
     */
    get month() {
      if (this.#month == null) {
        return new Date().getMonth();
      }
      return this.#month;
    }

    /**
     *
     */
    set month(value) {
      this.#month = value;
    }

    /**
     *
     */
    get year() {
      if (!this.#year) {
        return new Date().getFullYear();
      }
      return this.#year;
    }

    /**
     *
     */
    set year(value) {
      this.#year = value;
    }

    /**
     *
     */
    get selectedDate() {
      return this.#selectedDate;
    }

    /**
     *
     */
    set selectedDate(value) {
      this.#selectedDate = value;
    }

    /**
     *
     */
    showDate() {
      this.#navigationMonth.innerHTML = `${Months[this.month]} ${this.year}`;
    }

    /**
     *
     */
    renderWeekDays() {
      const daysRow = this.#shadow.querySelector('.days-row');

      Days.forEach((day) => {
        const weekDayElement = document.createElement('div');
        weekDayElement.textContent = day;
        daysRow.appendChild(weekDayElement);
      });
    }

    /**
     *
     */
    renderDays() {
      const daysList = this.getDaysOfMonth();
      const days = this.#shadow.querySelector('.dates');

      const selectedDayTimestamp = this.selectedDate
        ? Math.floor(this.selectedDate.getTime() / 1000)
        : null;

      daysList.forEach((day) => {
        const dayElement = document.createElement('button');

        const dateOfDay = day.date;
        const currentDay = dateOfDay.getDate();

        const timestamp = Math.floor(new Date(dateOfDay).getTime() / 1000);
        dayElement.setAttribute('data-date', timestamp);

        dayElement.textContent = currentDay;

        const className = this.getDayClassName(day);

        dayElement.classList.add(className);
        if (day.isDisabled) {
          dayElement.classList.add('day-is-disabled');
        }

        if (timestamp === selectedDayTimestamp) {
          dayElement.classList.add('day-is-selected');
        }

        days.appendChild(dayElement);

        dayElement.addEventListener('click', () =>
          this.handleSelectDate(dayElement)
        );
      });
    }

    /**
     *
     */
    getDayClassName(day) {
      if (day.isOtherMonth) {
        return 'day-is-other-month';
      }
      if (day.isToday) {
        return 'day-is-today';
      }
      return 'day';
    }

    /**
     *
     */
    show() {
      const position = this.getBoundingClientRect();

      this.setAttribute('focus', true);
      this.#popover.setAttribute('top', position.top + 46);
      this.#popover.setAttribute('left', position.left);
      this.#popover.setAttribute('width', 320);
      this.#popover.setAttribute('bottom', position.bottom);
      this.#popover.setAttribute('open', true);

      if (this.selectedDate) {
        this.month = this.selectedDate.getMonth();
        this.year = this.selectedDate.getFullYear();
      }

      this.showDate();
      this.renderWeekDays();
      this.renderDays();
    }

    /**
     *
     */
    hide() {
      this.refresh();
      this.removeAttribute('focus');
      this.#popover.removeAttribute('open');
      const daysRow = this.#shadow.querySelector('.days-row');
      daysRow.innerHTML = '';
    }

    /**
     *
     */
    getDaysOfMonth() {
      const daysOfTheMonth = [];
      const today = new Date();
      const date = new Date(Date.UTC(this.year, this.month, 1, 0, 0, 0, 0));

      const extras = (date.getDay() + 6) % 7;

      date.setDate(date.getDate() - extras);

      while (1) {
        for (let i = 0; i < 7; i++) {
          const data = { date: new Date(date) };

          if (date.getMonth() != this.month) {
            data.isOtherMonth = true;
          }

          if (
            date.getDate() == today.getDate() &&
            date.getMonth() == today.getMonth() &&
            date.getFullYear() == today.getFullYear()
          ) {
            data.isToday = true;
          }

          // if (min && minValue > dateValue) {
          //   data.is = true;
          // }

          if (this.maxDate && new Date(this.maxDate) < data.date) {
            data.isDisabled = true;
          }

          daysOfTheMonth.push(data);

          date.setDate(date.getDate() + 1);
        }
        if (date.getMonth() != this.month) {
          break;
        }
      }
      return daysOfTheMonth;
    }

    /**
     *
     */
    handleClickOpenCalendar() {
      this.open = !this.open;
    }

    /**
     *
     */
    refresh() {
      const datesContainer = this.#shadow.querySelector('.dates');
      datesContainer.innerHTML = '';
    }

    /**
     *
     * @param {*} dayElement
     */
    handleSelectDate(dayElement) {
      this.#shadow
        .querySelectorAll('.day-is-selected')
        .forEach((el) => el.classList.remove('day-is-selected'));

      dayElement.classList.add('day-is-selected');
      const time = new Date(dayElement.getAttribute('data-date') * 1000);
      this.selectedDate = time;
    }

    /**
     *
     */
    handlePreviousButtonClick() {
      let m = this.month - 1;
      if (m == -1) {
        m = Months.length - 1;
        this.year = this.year - 1;
      }
      this.month = m;

      this.refresh();
      this.showDate();
      this.renderDays();
    }

    /**
     *
     */
    handleNextButtonClick() {
      let m = this.month + 1;
      if (m == Months.length) {
        m = 0;
        this.year = this.year + 1;
      }
      this.month = m;

      this.refresh();
      this.showDate();
      this.renderDays();
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'open':
          if (newValue == 'true') {
            this.show();
          } else {
            this.hide();
          }
          break;
      }
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#popover = this.#shadow.querySelector('punica-popover');
      this.#navigationMonth = this.#shadow.getElementById('navigation-month');
      this.#previousButton = this.#shadow.querySelector(
        'slot[name="previous-month"]'
      );
      this.#nextButton = this.#shadow.querySelector('slot[name="next-month"]');

      this.handlePreviousButtonClick =
        this.handlePreviousButtonClick.bind(this);
      this.handleNextButtonClick = this.handleNextButtonClick.bind(this);
      this.handleClickOpenCalendar = this.handleClickOpenCalendar.bind(this);
    }

    /**
     *
     */
    connectedCallback() {
      if (isValidDate(this.value)) {
        const date = new Date(this.value);
        date.setHours(3);
        date.setMinutes(0);
        date.setSeconds(0);
        this.selectedDate = date;
      }

      this.#previousButton.addEventListener(
        'click',
        this.handlePreviousButtonClick
      );
      this.#nextButton.addEventListener('click', this.handleNextButtonClick);
      this.#shadow
        .querySelector('slot[name="endAdornment"]')
        .addEventListener('click', this.handleClickOpenCalendar);
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#previousButton.removeEventListener(
        'click',
        this.handlePreviousButtonClick
      );
      this.#nextButton.removeEventListener('click', this.handleNextButtonClick);
      this.#shadow
        .querySelector('slot[name="endAdornment"]')
        .addEventListener('click', () => this.handleClickOpenCalendar());
    }
  }

  customElements.define('punica-date-picker', DatePicker);
})();
