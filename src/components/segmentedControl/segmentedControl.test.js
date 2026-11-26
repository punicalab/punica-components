import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './segmentedControl.js';

const control = (
  attrs = '',
  first = ''
) => `<punica-segmented-control label="View" ${attrs}>
  <punica-segmented-control-item value="day" ${first}>Day</punica-segmented-control-item>
  <punica-segmented-control-item value="week">Week</punica-segmented-control-item>
  <punica-segmented-control-item value="month">Month view</punica-segmented-control-item>
</punica-segmented-control>`;

contract('punica-segmented-control-item', {
  html: '<punica-segmented-control-item value="day" selected>Day</punica-segmented-control-item>'
});
contract('punica-segmented-control', {
  html: control('name="view" value="week"')
});

const entries = (form) => [...new FormData(form)];
const selected = (el) => [...el.children].map((i) => i.selected);
const focused = (el) => [...el.children].findIndex((i) => i.matches(':focus'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe('punica-segmented-control', () => {
  afterEach(cleanup);

  it('selects the item its value names, with radiogroup semantics', async () => {
    const el = await fixture(control('value="week"'));
    expect(selected(el)).toEqual([false, true, false]);
    expect(el.internals.role).toBe('radiogroup');
    expect(el.internals.ariaLabel).toBe('View');
    expect(el.internals.ariaOrientation).toBe('horizontal');
    expect(
      [...el.children].map((i) => [
        i.internals.role,
        i.internals.ariaChecked,
        i.getAttribute('tabindex')
      ])
    ).toEqual([
      ['radio', 'false', '-1'],
      ['radio', 'true', '0'],
      ['radio', 'false', '-1']
    ]);
  });

  it('chooses an item whose value is the empty string, as a native radio does ("All")', async () => {
    const el = await fixture(
      '<punica-segmented-control label="Kind" value=""><punica-segmented-control-item value="">All</punica-segmented-control-item><punica-segmented-control-item value="image">Images</punica-segmented-control-item></punica-segmented-control>'
    );
    await wait(50);
    const [all, images] = el.items;
    expect(all.matches(':state(selected)')).toBe(true);
    expect(images.matches(':state(selected)')).toBe(false);
    expect(el.shadowRoot.querySelector('.indicator').hidden).toBe(false);
    el.value = 'image';
    await settle();
    expect(images.matches(':state(selected)')).toBe(true);
    expect(all.matches(':state(selected)')).toBe(false);
  });

  it('takes its first value from a selected item when it has none', async () => {
    const el = await fixture(control('', 'selected'));
    expect(el.value).toBe('day');
  });

  it('slides its indicator behind the selected item, also in RTL', async () => {
    const wrap = await fixture(
      `<div>${control('value="week"')}<div dir="rtl">${control(
        'value="month"'
      )}</div></div>`
    );
    for (const el of wrap.querySelectorAll('punica-segmented-control')) {
      const indicator = el.shadowRoot.querySelector('.indicator');
      const over = async (item) => {
        await wait(350);
        const a = indicator.getBoundingClientRect();
        const b = item.getBoundingClientRect();
        expect(indicator.hidden).toBe(false);
        expect(Math.abs(a.left - b.left)).toBeLessThan(1);
        expect(Math.abs(a.width - b.width)).toBeLessThan(1);
      };
      await over(el.querySelector('[selected]'));
      el.children[0].click();
      await settle();
      await over(el.children[0]);
    }
  });

  it('wraps onto more lines when told to, its indicator following the chosen segment there', async () => {
    const el = await fixture(
      '<punica-segmented-control label="Period" value="year" style="--punica-segmented-control-wrap: wrap; max-inline-size: 180px"><punica-segmented-control-item value="day">Day</punica-segmented-control-item><punica-segmented-control-item value="week">Week</punica-segmented-control-item><punica-segmented-control-item value="month">Month</punica-segmented-control-item><punica-segmented-control-item value="year">Year</punica-segmented-control-item></punica-segmented-control>'
    );
    await wait(350);
    const [day, , , year] = el.items;
    expect(year.getBoundingClientRect().top).toBeGreaterThan(
      day.getBoundingClientRect().top
    );
    const indicator = el.shadowRoot
      .querySelector('.indicator')
      .getBoundingClientRect();
    const box = year.getBoundingClientRect();
    expect(Math.round(indicator.top)).toBe(Math.round(box.top));
    expect(Math.round(indicator.left)).toBe(Math.round(box.left));
    expect(Math.round(indicator.height)).toBe(Math.round(box.height));
  });

  it('hides its indicator while nothing is selected', async () => {
    const el = await fixture(control());
    expect(el.shadowRoot.querySelector('.indicator').hidden).toBe(true);
  });

  it('has one tab stop; arrows, Home and End move and select', async () => {
    const wrap = await fixture(
      `<div>${control('value="week"')}<button>after</button></div>`
    );
    const el = wrap.firstElementChild;
    const seen = [];
    wrap.addEventListener('punica-change', (e) =>
      seen.push([e.target.localName, e.detail])
    );
    await userEvent.tab();
    expect(focused(el)).toBe(1);
    await userEvent.keyboard('{ArrowRight}');
    expect(el.value).toBe('month');
    expect(focused(el)).toBe(2);
    await userEvent.keyboard('{ArrowRight}');
    expect(el.value).toBe('day');
    await userEvent.keyboard('{End}');
    expect(el.value).toBe('month');
    await userEvent.keyboard('{Home}');
    expect(el.value).toBe('day');
    await userEvent.keyboard('{ArrowLeft}');
    expect(el.value).toBe('month');
    expect(seen[0]).toEqual(['punica-segmented-control', { value: 'month' }]);
    expect(seen.length).toBe(5);
    await userEvent.tab();
    expect(document.activeElement).toBe(wrap.querySelector('button'));
  });

  it('selects on click and on Space, and fires nothing on a programmatic change', async () => {
    const el = await fixture(control());
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail));
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(el.value).toBe('day');
    el.children[2].click();
    expect(el.value).toBe('month');
    el.value = 'week';
    await settle();
    expect(selected(el)).toEqual([false, true, false]);
    expect(seen).toEqual([{ value: 'day' }, { value: 'month' }]);
  });

  it('skips a disabled item', async () => {
    const el = await fixture(control('value="day"'));
    el.children[1].disabled = true;
    await settle();
    el.children[1].click();
    expect(el.value).toBe('day');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(el.value).toBe('month');
  });

  it('appears in the form data, and is left out when disabled', async () => {
    const form = await fixture(
      `<form>${control('name="view" value="week"')}</form>`
    );
    await settle();
    expect(entries(form)).toEqual([['view', 'week']]);
    form.firstElementChild.disabled = true;
    await settle();
    expect(entries(form)).toEqual([]);
    form.firstElementChild.children[0].click();
    expect(form.firstElementChild.value).toBe('week');
  });

  it('goes back to the value attribute, or to its first state, on form.reset()', async () => {
    const form = await fixture(
      `<form>${control('name="a" value="week"')}${control(
        'name="b"',
        'selected'
      )}</form>`
    );
    const [a, b] = form.children;
    a.children[2].click();
    b.children[2].click();
    await settle();
    expect(entries(form)).toEqual([
      ['a', 'month'],
      ['b', 'month']
    ]);
    form.reset();
    await settle();
    expect(entries(form)).toEqual([
      ['a', 'week'],
      ['b', 'day']
    ]);
    expect(selected(a)).toEqual([false, true, false]);
  });

  it('blocks checkValidity() when required and nothing is selected', async () => {
    const form = await fixture(`<form>${control('name="a" required')}</form>`);
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    el.children[0].click();
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture(
      `<form><fieldset disabled>${control(
        'name="a" value="day"'
      )}</fieldset></form>`
    );
    await settle();
    const el = form.querySelector('punica-segmented-control');
    expect(el.children[0].internals.ariaDisabled).toBe('true');
    el.children[1].click();
    expect(el.value).toBe('day');
    expect(entries(form)).toEqual([]);
  });

  it('draws the indicator apart from the bar in dark mode', async () => {
    const wrap = await fixture(
      `<div style="color-scheme: dark">${control('value="week"')}</div>`
    );
    const el = wrap.firstElementChild;
    await settle();
    const bar = getComputedStyle(el.shadowRoot.querySelector('.base'));
    const indicator = getComputedStyle(
      el.shadowRoot.querySelector('.indicator')
    );
    expect(indicator.backgroundColor).not.toBe(bar.backgroundColor);
    expect(indicator.boxShadow).toMatch(/inset/);
  });
});

describe('punica-segmented-control direction change', () => {
  afterEach(cleanup);
  it('moves the indicator under the chosen segment when the direction flips after render', async () => {
    const wrap = await fixture(`<div dir="ltr">
      <punica-segmented-control label="View" value="week">
        <punica-segmented-control-item value="day">Day</punica-segmented-control-item>
        <punica-segmented-control-item value="week">Week</punica-segmented-control-item>
        <punica-segmented-control-item value="month">Month</punica-segmented-control-item>
      </punica-segmented-control></div>`);
    const control = wrap.querySelector('punica-segmented-control');
    const indicator = () =>
      control.shadowRoot
        .querySelector('[part=indicator]')
        .getBoundingClientRect();
    const week = () =>
      control.querySelector('[value=week]').getBoundingClientRect();
    await settle();
    expect(Math.abs(indicator().left - week().left)).toBeLessThan(3);
    wrap.dir = 'rtl';
    await settle();
    await new Promise((r) => setTimeout(r, 400));
    expect(Math.abs(indicator().left - week().left)).toBeLessThan(3);
  });
});
