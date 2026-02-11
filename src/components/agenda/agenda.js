(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="agenda-container">
      <div class="agenda-content"></div>
    </div>
    <style></style>
  `;

  class Agenda extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #currentDate = new Date();
    #currentView = 'day';
    #events = [];
    #locale = 'en-US';
    #timeRangeStartMin = 0;
    #timeRangeEndMin = 24 * 60;

    static get observedAttributes() {
      return ['starthour', 'endhour'];
    }

    constructor() {
      super();
      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      const startAttr = this.getAttribute('starthour');
      const endAttr = this.getAttribute('endhour');
      if (startAttr !== null || endAttr !== null) {
        const startHour =
          startAttr !== null && !Number.isNaN(Number(startAttr))
            ? Number(startAttr)
            : undefined;
        const endHour =
          endAttr !== null && !Number.isNaN(Number(endAttr))
            ? Number(endAttr)
            : undefined;
        this.setTimeRange({ startHour, endHour });
      } else {
        this.#render();
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'starthour' || name === 'endhour') {
        const startAttr = this.getAttribute('starthour');
        const endAttr = this.getAttribute('endhour');
        const startHour =
          startAttr !== null && !Number.isNaN(Number(startAttr))
            ? Number(startAttr)
            : undefined;
        const endHour =
          endAttr !== null && !Number.isNaN(Number(endAttr))
            ? Number(endAttr)
            : undefined;
        this.setTimeRange({ startHour, endHour });
      }
    }

    // Public API
    setEvents(events) {
      this.#events = events.map((e) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: new Date(e.endDate)
      }));
      this.#render();
    }

    addEvent(event) {
      this.#events.push({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      });
      this.#render();
    }

    getView() {
      return this.#currentView;
    }

    setView(view) {
      const valid = ['day', 'week', 'month', 'year'];
      if (!valid.includes(view)) return;
      this.#currentView = view;
      this.#render();
    }

    getCurrentDate() {
      return new Date(this.#currentDate.getTime());
    }

    setCurrentDate(date) {
      this.#currentDate = new Date(date);
      this.#render();
    }

    navigate(direction) {
      if (direction === -1 || direction === 1) this.#navigateDate(direction);
    }

    getTimeRange() {
      const format = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m
          .toString()
          .padStart(2, '0')}`;
      };

      return {
        startMin: this.#timeRangeStartMin,
        endMin: this.#timeRangeEndMin,
        start: format(this.#timeRangeStartMin),
        end: format(this.#timeRangeEndMin)
      };
    }

    setTimeRange(range) {
      if (!range || typeof range !== 'object') return;

      let { startMin, endMin, startHour, endHour, start, end } = range;

      const parseTimeStringToMinutes = (value) => {
        if (typeof value !== 'string') return undefined;
        const [hStr, mStr] = value.split(':');
        const h = Number(hStr);
        const m = Number(mStr ?? '0');
        if (
          Number.isNaN(h) ||
          Number.isNaN(m) ||
          h < 0 ||
          h > 24 ||
          m < 0 ||
          m >= 60
        ) {
          return undefined;
        }
        return h * 60 + m;
      };

      if (startMin == null) {
        if (typeof startHour === 'number') {
          startMin = startHour * 60;
        } else if (start != null) {
          startMin = parseTimeStringToMinutes(start);
        }
      }

      if (endMin == null) {
        if (typeof endHour === 'number') {
          endMin = endHour * 60;
        } else if (end != null) {
          endMin = parseTimeStringToMinutes(end);
        }
      }

      let s =
        typeof startMin === 'number' && Number.isFinite(startMin)
          ? startMin
          : this.#timeRangeStartMin;
      let e =
        typeof endMin === 'number' && Number.isFinite(endMin)
          ? endMin
          : this.#timeRangeEndMin;

      // Clamp to a single day [0, 1440]
      const maxMinutes = 24 * 60;
      s = Math.max(0, Math.min(maxMinutes, s));
      e = Math.max(0, Math.min(maxMinutes, e));

      // Snap to 15-minute slots
      const snap = (minutes) => Math.round(minutes / 15) * 15;
      s = snap(s);
      e = snap(e);

      if (e <= s) return;

      if (s === this.#timeRangeStartMin && e === this.#timeRangeEndMin) {
        return;
      }

      this.#timeRangeStartMin = s;
      this.#timeRangeEndMin = e;
      this.#render();
    }

    getLocale() {
      return this.#locale;
    }

    setLocale(locale) {
      this.#locale = locale || 'en-US';
      this.#render();
    }

    #navigateDate(direction) {
      const date = new Date(this.#currentDate);

      switch (this.#currentView) {
        case 'day':
          date.setDate(date.getDate() + direction);
          break;
        case 'week':
          date.setDate(date.getDate() + direction * 7);
          break;
        case 'month':
          date.setMonth(date.getMonth() + direction);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() + direction);
          break;
      }

      this.#currentDate = date;
      this.#render();
    }

    #render() {
      const content = this.#shadow.querySelector('.agenda-content');

      switch (this.#currentView) {
        case 'day':
          content.innerHTML = this.#renderDayView();
          break;
        case 'week':
          content.innerHTML = this.#renderWeekView();
          break;
        case 'month':
          content.innerHTML = this.#renderMonthView();
          break;
        case 'year':
          content.innerHTML = this.#renderYearView();
          break;
      }
    }

    #renderDayView() {
      const dayStart = new Date(this.#currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEvents = this.#events.filter((e) => {
        const eventDate = new Date(e.startDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === dayStart.getTime();
      });

      const eventsWithPositions = this.#assignGridSpans(dayEvents).map(
        (ev) => ({
          ...ev,
          ...this.#getSessionPosition(ev, dayStart)
        })
      );

      const rangeStartMin = this.#timeRangeStartMin;
      const rangeEndMin = this.#timeRangeEndMin;
      const rangeMinutes = Math.max(15, rangeEndMin - rangeStartMin);
      const slotsVisible = rangeMinutes / 15;
      const hoursVisible = rangeMinutes / 60;
      const startHour = Math.floor(rangeStartMin / 60);
      const dayHeightPx = slotsVisible * 30;

      let html = `<div class="day-view" style="height: ${dayHeightPx}px;">
        <div class="hours" style="grid-template-rows: repeat(${hoursVisible}, 120px);">`;

      for (let i = 0; i < hoursVisible; i++) {
        const hour = startHour + i;
        const period = hour < 12 ? 'AM' : 'PM';
        let hour12 = hour % 12;
        if (hour12 === 0) hour12 = 12;
        const formattedHour = `${hour12.toString().padStart(2, '0')}:00`;

        html += `
          <div class="hour" style="grid-row-start: ${i + 1}">
            <div class="hour-label">
              <div class="clock-wrapper">
                <div class="clock-text">${formattedHour}</div>
                <div class="clock-period">${period}</div>
              </div>
            </div>
          </div>
        `;
      }

      html += `</div><div class="event-wrapper" style="height: ${dayHeightPx}px;">
        <div class="events" style="grid-template-rows: repeat(${slotsVisible}, 30px);">`;

      eventsWithPositions.forEach((ev, idx) => {
        const { hidden, clippedAtStart, clippedAtEnd } = ev;
        if (hidden) {
          return;
        }
        const bgColor = this.#getEventColor(idx);
        const clippedClasses = [
          clippedAtStart ? 'clipped-start' : '',
          clippedAtEnd ? 'clipped-end' : ''
        ]
          .filter(Boolean)
          .join(' ');
        const contentClass = `event-content${
          clippedClasses ? ` ${clippedClasses}` : ''
        }`;

        html += `
          <div class="event" style="
            grid-column-end: ${ev.position.gridColumnEnd};
            grid-row-start: ${ev.position.gridRowStart};
            grid-row-end: ${ev.position.gridRowEnd};
          ">
            <div class="${contentClass}" style="background-color: ${bgColor}; border-left: 4px solid ${this.#darkenColor(
          bgColor
        )};">
              <div class="event-name">${ev.name}</div>
              <div class="event-time">${ev.startTimeText} - ${
          ev.endTimeText
        }</div>
            </div>
          </div>
        `;
      });

      html += '</div></div></div>';
      return html;
    }

    #renderWeekView() {
      const weekStart = this.#getWeekStart(this.#currentDate);
      const days = this.#getDayNames();
      const rangeStartMin = this.#timeRangeStartMin;
      const rangeEndMin = this.#timeRangeEndMin;
      const rangeMinutes = Math.max(60, rangeEndMin - rangeStartMin);
      const hoursVisible = rangeMinutes / 60;
      const startHour = Math.floor(rangeStartMin / 60);
      const PIXELS_PER_HOUR = 50;
      const gridHeightPx = hoursVisible * PIXELS_PER_HOUR;

      let html =
        '<div class="week-view"><div class="week-header"><div class="time-col"></div>';

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const isToday = this.#isSameDay(date, new Date());
        html += `
          <div class="day-header ${isToday ? 'today' : ''}">
            <div class="day-name">${days[i]}</div>
            <div class="day-number">${date.getDate()}</div>
          </div>
        `;
      }

      html += `</div><div class="week-grid" style="min-height: ${gridHeightPx}px;"><div class="hours-col">`;

      for (let i = 0; i < hoursVisible; i++) {
        const hour = startHour + i;
        const period = hour < 12 ? 'AM' : 'PM';
        let hour12 = hour % 12;
        if (hour12 === 0) hour12 = 12;
        html += `<div class="hour-label">${hour12}:00 ${period}</div>`;
      }

      html += '</div>';

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);
        date.setHours(0, 0, 0, 0);

        const dayEvents = this.#events.filter((e) => {
          const eventDate = new Date(e.startDate);
          eventDate.setHours(0, 0, 0, 0);
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === checkDate.getTime();
        });

        html += `<div class="day-column" style="height: ${gridHeightPx}px;">`;

        dayEvents.forEach((ev, idx) => {
          const pos = this.#getSessionPosition(ev, date);
          const { hidden, clippedAtStart, clippedAtEnd } = pos;
          if (hidden) return;
          const bgColor = this.#getEventColor(idx);
          const clippedClasses = [
            clippedAtStart ? 'clipped-start' : '',
            clippedAtEnd ? 'clipped-end' : ''
          ]
            .filter(Boolean)
            .join(' ');
          const contentClass = `week-event ${clippedClasses}`.trim();
          html += `
            <div class="${contentClass}" style="
              top: ${(pos.startDuration / 60) * PIXELS_PER_HOUR}px;
              height: ${(pos.duration / 60) * PIXELS_PER_HOUR}px;
              background-color: ${bgColor};
              border-left: 4px solid ${this.#darkenColor(bgColor)};
            ">
              <div class="event-title">${ev.name}</div>
              <div class="event-time-small">${pos.startTimeText}</div>
            </div>
          `;
        });

        html += '</div>';
      }

      html += '</div></div>';
      return html;
    }

    #renderMonthView() {
      const year = this.#currentDate.getFullYear();
      const month = this.#currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

      const days = this.#getDayNames();

      let html = '<div class="month-view"><div class="month-header">';
      days.forEach((day) => {
        html += `<div class="month-day-name">${day}</div>`;
      });
      html += '</div><div class="month-grid">';

      // Empty cells before first day
      for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="month-cell empty"></div>';
      }

      // Days of month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = this.#isSameDay(date, new Date());

        const dayEvents = this.#events.filter((e) => {
          const eventDate = new Date(e.startDate);
          eventDate.setHours(0, 0, 0, 0);
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === checkDate.getTime();
        });

        html += `
          <div class="month-cell ${isToday ? 'today' : ''}">
            <div class="cell-header">
              <span class="day-number">${day}</span>
            </div>
            <div class="cell-events">
        `;

        dayEvents.slice(0, 3).forEach((ev, idx) => {
          const bgColor = this.#getEventColor(idx);
          html += `
            <div class="month-event" style="background-color: ${bgColor};">
              <span class="event-dot"></span>
              ${ev.name}
            </div>
          `;
        });

        if (dayEvents.length > 3) {
          html += `<div class="more-events">+${
            dayEvents.length - 3
          } ${this.#getMoreText()}</div>`;
        }

        html += '</div></div>';
      }

      html += '</div></div>';
      return html;
    }

    #renderYearView() {
      const year = this.#currentDate.getFullYear();
      const months = this.#getMonthNames();

      let html = '<div class="year-view">';

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

        html += `
          <div class="year-month">
            <div class="year-month-name">${months[monthIndex]}</div>
            <div class="year-month-grid">
              <div class="year-day-names">
        `;

        ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].forEach((d) => {
          html += `<div>${d}</div>`;
        });

        html += '</div><div class="year-days">';

        for (let i = 0; i < startingDayOfWeek; i++) {
          html += '<div class="year-day empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, monthIndex, day);
          const isToday = this.#isSameDay(date, new Date());

          const hasEvents = this.#events.some((e) => {
            const eventDate = new Date(e.startDate);
            eventDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === checkDate.getTime();
          });

          html += `
            <div class="year-day ${isToday ? 'today' : ''} ${
            hasEvents ? 'has-events' : ''
          }">
              ${day}
            </div>
          `;
        }

        html += '</div></div></div>';
      }

      html += '</div>';
      return html;
    }

    // Helper methods from React code
    #getConcurrentCount(event, allEvents) {
      const timeline = [];

      for (const e of allEvents) {
        if (e.endDate > event.startDate && e.startDate < event.endDate) {
          timeline.push({ time: e.startDate, type: 'start' });
          timeline.push({ time: e.endDate, type: 'end' });
        }
      }

      timeline.sort(
        (a, b) =>
          a.time.getTime() - b.time.getTime() || (a.type === 'end' ? -1 : 1)
      );

      let count = 0;
      let maxCount = 0;

      for (const point of timeline) {
        if (point.type === 'start') {
          count++;
          maxCount = Math.max(maxCount, count);
        } else {
          count--;
        }
      }

      return maxCount;
    }

    #assignGridSpans(events, maxColumns = 4) {
      return events.map((event) => {
        const concurrentCount = this.#getConcurrentCount(event, events);
        const span = Math.max(1, Math.floor(maxColumns / concurrentCount));
        return {
          ...event,
          gridColumnEnd: `span ${span}`,
          overlapCount: concurrentCount
        };
      });
    }

    #getSessionPosition(data, currentDay) {
      const aDayInMinutes = 24 * 60;
      const { startDate, endDate, overlapCount = 1 } = data;

      // Normalize currentDay to start of day (00:00:00)
      const normalizedDay = new Date(currentDay);
      normalizedDay.setHours(0, 0, 0, 0);
      const currentDayInMilliseconds = normalizedDay.getTime();

      const startTimeInMilliseconds = startDate.getTime();
      const endTimeInMilliseconds = endDate.getTime();

      const diffEnd = Math.round(
        (endTimeInMilliseconds - currentDayInMilliseconds) / (1000 * 60)
      );

      let endDuration = diffEnd;
      if (diffEnd > aDayInMinutes) {
        endDuration = aDayInMinutes;
      }

      const diffStart = Math.round(
        (startTimeInMilliseconds - currentDayInMilliseconds) / (1000 * 60)
      );

      let startDuration = diffStart;
      if (diffStart < 0) {
        startDuration = 0;
      }

      const duration = Math.abs(Math.round(endDuration - startDuration));

      // Apply time range (in minutes from 00:00)
      const rangeStart = this.#timeRangeStartMin;
      const rangeEnd = this.#timeRangeEndMin;
      const eventStart = startDuration;
      const eventEnd = startDuration + duration;

      let hidden = false;
      let clippedAtStart = false;
      let clippedAtEnd = false;

      if (eventEnd <= rangeStart || eventStart >= rangeEnd) {
        hidden = true;
      }

      let effectiveStartDuration = startDuration;
      let effectiveDuration = duration;
      let startDurationRel = startDuration;

      if (!hidden) {
        const clippedStart = Math.max(eventStart, rangeStart);
        const clippedEnd = Math.min(eventEnd, rangeEnd);

        clippedAtStart = eventStart < rangeStart;
        clippedAtEnd = eventEnd > rangeEnd;

        effectiveStartDuration = clippedStart;
        effectiveDuration = Math.max(0, clippedEnd - clippedStart);
        startDurationRel = effectiveStartDuration - rangeStart;
      }

      const rowStart = Math.round(startDurationRel / 15);
      const rowEnd = Math.round(effectiveDuration / 15);

      const maxGridColumns = 4;
      const span = Math.max(1, Math.floor(maxGridColumns / overlapCount));

      const formatTime = (date) => {
        let h = date.getHours();
        const m = date.getMinutes().toString().padStart(2, '0');
        h = h % 12;
        if (h === 0) h = 12;
        return `${h.toString().padStart(2, '0')}:${m}`;
      };

      return {
        duration: effectiveDuration,
        startDuration: startDurationRel,
        hidden,
        clippedAtStart,
        clippedAtEnd,
        position: {
          gridColumnStart: 'span 1',
          gridColumnEnd: `span ${span}`,
          gridRowStart: rowStart + 1,
          gridRowEnd: `span ${rowEnd}`
        },
        startTimeText: formatTime(startDate),
        endTimeText: formatTime(endDate)
      };
    }

    #getDayNames() {
      const formatter = new Intl.DateTimeFormat(this.#locale, {
        weekday: 'short'
      });
      const days = [];
      const baseDate = new Date(2024, 0, 1); // Monday
      for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
        days.push(formatter.format(date));
      }
      return days;
    }

    #getMonthNames() {
      const formatter = new Intl.DateTimeFormat(this.#locale, {
        month: 'long'
      });
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(2024, i, 1);
        months.push(formatter.format(date));
      }
      return months;
    }

    #getMoreText() {
      const translations = {
        'en-US': 'more',
        en: 'more',
        'tr-TR': 'daha',
        tr: 'daha',
        'de-DE': 'mehr',
        de: 'mehr',
        'fr-FR': 'plus',
        fr: 'plus',
        'es-ES': 'más',
        es: 'más'
      };
      const lang = this.#locale.split('-')[0];
      return translations[this.#locale] || translations[lang] || 'more';
    }

    #getWeekStart(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      return new Date(d.setDate(diff));
    }

    #isSameDay(date1, date2) {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    }

    #getEventColor(index) {
      const colors = [
        '#E3F2FD',
        '#F3E5F5',
        '#E8F5E9',
        '#FFF3E0',
        '#FCE4EC',
        '#E0F2F1',
        '#FFF9C4',
        '#F1F8E9'
      ];
      return colors[index % colors.length];
    }

    #darkenColor(color) {
      const hex = color.replace('#', '');
      const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
      const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
      const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
      return `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  customElements.define('punica-agenda', Agenda);
})();
