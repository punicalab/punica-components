
(async function () {
  const { Days, Months, getYears, ConverterNumberToTwoDigit } = await import('./utils/index.js');

  const template = document.createElement('template');

  template.innerHTML = `
      <punica-input size="small" placeholder="Lorem Ipsum...">
         <slot name="endAdornment" slot="endAdornment"></slot>
      </punica-input>

      <punica-popover open="false" minimumTargetWidth="true">
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
      return ['open'];
    }
    
    /**
     * 
     */
    get open(){
      return this.hasAttribute('open') || false;
    }

    /**
     * 
     */
     set open(value){

       if(value){
        this.setAttribute('open', value);
       }
       else{
        this.removeAttribute('open');
       }
    }


    /**
     * 
     */
    get month() {
      if(this.#month == null){
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
      if(!this.#year){
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
      // if (!this.#selectedDate) {
      //   this.#selectedDate = new Date();
      //   this.#selectedDate.setHours(23, 59);
      // }
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
    showDate(){
      this.#navigationMonth.innerHTML = `${Months[this.month]} ${this.year}`;
    }

    /**
     * 
     */
    renderWeekDays(){
      const daysRow = this.#shadow.querySelector('.days-row');

      Days.forEach(day => {
        const weekDayElement = document.createElement('div');
        weekDayElement.textContent = day;
        daysRow.appendChild(weekDayElement);
      });
    }

    /**
     * 
     */
    renderDays() {
      // debugger;
      const daysList = this.getDaysOfMonth();
      const days = this.#shadow.querySelector('.dates');

      daysList.forEach(day => {
        const dayElement = document.createElement('button');

        const dateOfDay = day.date;
        const currentDay = dateOfDay.getDate();

        const timestamp = Math.floor(new Date(dateOfDay).getTime() / 1000);
        dayElement.setAttribute('data-date', timestamp);

        dayElement.textContent = currentDay;

        const className = this.getDayClassName(day);
        dayElement.classList.add(className);
        days.appendChild(dayElement);

        dayElement.addEventListener('click', () => this.handleSelectDate(dayElement));
      });

    }

    /**
     * 
     */
    getDayClassName(day) {
      if(day.isOtherMonth){
        return 'day-is-other-month';
      }
      if(day.isToday){
        return 'day-is-today';
      }
      return 'day';
    }
   

    /**
     *
     */
    show() {
      const position = this.getBoundingClientRect();
      // const positionInput = this.#shadow.querySelector('punica-input').getBoundingClientRect();
      // console.log('position', position)
      this.setAttribute('focus', true);
      this.#popover.setAttribute('top', position.top + 46);
      this.#popover.setAttribute('left', position.left);
      this.#popover.setAttribute('width', 320);
      // this.#popover.setAttribute('height', position.height);
      this.#popover.setAttribute('bottom', position.bottom);
      this.#popover.setAttribute('open', true);
    }

    /**
     * 
     */
    hide(){
      this.refresh();
      this.removeAttribute('focus');
      this.#popover.removeAttribute('open');
    }

    /**
     * 
     */
    getDaysOfMonth() {
      // console.log(this.month);
      const daysOfTheMonth = [];
      const today = new Date();
      const date = new Date(Date.UTC(this.year, this.month, 1, 0, 0, 0, 0));
      console.log('date', new Date(Date.UTC(this.year, this.month, 1, 0, 0, 0, 0)))
      const extras = (date.getDay() + 6) % 7;

      date.setDate(date.getDate() - extras);

      while (1) {
        for (let i = 0; i < 7; i++) {
          const data = { date: new Date(date) };
  
          // const dateValue = Number(
          //   `${date.getFullYear()}${ConverterNumberToTwoDigit(
          //     date.getMonth()
          //   )}${ConverterNumberToTwoDigit(date.getDate())}`
          // );
  
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
          //   data.isDisabled = true;
          // }
  
          // if (max && maxValue < dateValue) {
          //   data.isDisabled = true;
          // }
  
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
    handleClickOpenCalendar(){
      this.open = !this.open;

      if(this.open){
        this.show();
        this.showDate();
        this.renderWeekDays();
        this.renderDays();
      }
      else{
        this.hide();
        const daysRow = this.#shadow.querySelector('.days-row');
        daysRow.innerHTML = '';
      }
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
    handleSelectDate(dayElement){
      const timestamp = Math.floor(new Date(this.selectedDate).getTime() / 1000);
      console.log(timestamp);
      // console.log(`[data-date=${String(timestamp)}]`)
      // console.log(`[data-date=${timestamp}]`)
      console.log(this.#shadow.querySelector(`[data-date="${timestamp}"]`));
      // console.log(this.#shadow.querySelector('[data-date="1730419200"]'));
      // this.#shadow.querySelector(`[data-date="${timestamp}"]`).classList.remove('day-is-selected');
      
      dayElement.classList.add('day-is-selected');
      const time = new Date(dayElement.getAttribute('data-date') * 1000);
      // console.log(new Date(time * 1000));
      // console.log(new Date(dayElement.getAttribute('data-date')));

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
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#popover = this.#shadow.querySelector('punica-popover');
      this.#navigationMonth = this.#shadow.getElementById('navigation-month')
      this.#previousButton = this.#shadow.querySelector('slot[name="previous-month"]');
      this.#nextButton = this.#shadow.querySelector('slot[name="next-month"]');

      this.handlePreviousButtonClick = this.handlePreviousButtonClick.bind(this);
      this.handleNextButtonClick = this.handleNextButtonClick.bind(this);
      this.handleClickOpenCalendar = this.handleClickOpenCalendar.bind(this);

    }

    connectedCallback() {
     const date = new Date();
     date.setHours(3,0);
     date.setSeconds(0);
     this.selectedDate = date;
     this.#previousButton.addEventListener('click', this.handlePreviousButtonClick);
     this.#nextButton.addEventListener('click', this.handleNextButtonClick);
     this.#shadow.querySelector('slot[name="endAdornment"]').addEventListener('click', this.handleClickOpenCalendar);
    
    }

    /**
     *
     */
     disconnectedCallback() {
      this.#previousButton.removeEventListener('click', this.handlePreviousButtonClick);
      this.#nextButton.removeEventListener('click', this.handleNextButtonClick);
      this.#shadow.querySelector('slot[name="endAdornment"]').addEventListener('click', () => this.handleClickOpenCalendar());

    }
  }

  customElements.define('punica-date-picker', DatePicker);
})();
