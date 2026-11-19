import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './pagination.js';

const html = (attrs = '') => `<punica-pagination total-count="200" page-size="10" ${attrs}></punica-pagination>`;
const labels = (el) =>
  [...el.shadowRoot.querySelectorAll('.page-item')].map((li) => (li.classList.contains('ellipsis') ? '…' : li.textContent));
const pageButton = (el, n) => el.shadowRoot.querySelector(`button[data-page="${n}"]`);

contract('punica-pagination', { html: html('page="5"') });

describe('punica-pagination', () => {
  afterEach(cleanup);

  it('is created by createElement', () => {
    const el = document.createElement('punica-pagination');
    expect(el.attributes.length).toBe(0);
    expect(el.page).toBe(1);
  });

  it('is a named nav of native buttons with aria-current on the page', async () => {
    const el = await fixture(html('page="5"'));
    const nav = el.shadowRoot.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Pagination');
    expect(labels(el)).toEqual(['1', '…', '4', '5', '6', '…', '20']);
    const current = el.shadowRoot.querySelectorAll('[aria-current="page"]');
    expect(current.length).toBe(1);
    expect(current[0].localName).toBe('button');
    expect(current[0].textContent).toBe('5');
    expect(current[0].getAttribute('aria-label')).toBe('Page 5');
    expect(el.shadowRoot.querySelector('[part=previous]').getAttribute('aria-label')).toBe('Previous page');
    expect(el.shadowRoot.querySelector('[part=next]').getAttribute('aria-label')).toBe('Next page');
  });

  it('reacts to total-count, which 1.x observed as totalCount and never heard', async () => {
    const el = await fixture(html());
    expect(el.pageCount).toBe(20);
    el.setAttribute('total-count', '30');
    await settle();
    expect(el.totalCount).toBe(30);
    expect(labels(el)).toEqual(['1', '2', '3']);
    el.setAttribute('page-size', '15');
    await settle();
    expect(labels(el)).toEqual(['1', '2']);
  });

  it('shows the pages around the current one by sibling-count', async () => {
    const el = await fixture(html('page="1"'));
    expect(labels(el)).toEqual(['1', '2', '3', '4', '5', '…', '20']);
    el.page = 20;
    await settle();
    expect(labels(el)).toEqual(['1', '…', '16', '17', '18', '19', '20']);
    el.page = 10;
    el.siblingCount = 2;
    await settle();
    expect(labels(el)).toEqual(['1', '…', '8', '9', '10', '11', '12', '…', '20']);
  });

  it('fires punica-change with the page on a page, previous and next click', async () => {
    const el = await fixture(html('page="5"'));
    let event = once(el, 'punica-change');
    pageButton(el, 6).click();
    expect((await event).detail).toEqual({ page: 6, value: 6 });
    expect(el.page).toBe(6);
    await settle();
    event = once(el, 'punica-change');
    el.shadowRoot.querySelector('[part=next]').click();
    expect((await event).detail.page).toBe(7);
    await settle();
    event = once(el, 'punica-change');
    el.shadowRoot.querySelector('[part=previous]').click();
    expect((await event).detail.page).toBe(6);
  });

  it('fires once per click however often it re-rendered', async () => {
    // 1.x added a click handler on every update and removed the wrong one.
    const el = await fixture(html('page="2"'));
    for (let i = 0; i < 5; i++) {
      el.totalCount = 200 + i;
      await settle();
    }
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    el.shadowRoot.querySelector('[part=next]').click();
    await settle();
    el.shadowRoot.querySelector('[part=previous]').click();
    expect(fired).toBe(2);
    expect(el.page).toBe(2);
  });

  it('fires nothing for a programmatic change or the current page', async () => {
    const el = await fixture(html('page="5"'));
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    el.page = 3;
    await settle();
    pageButton(el, 3).click();
    expect(fired).toBe(0);
  });

  it('disables previous on the first page and next on the last', async () => {
    const el = await fixture(html('page="1"'));
    const previous = el.shadowRoot.querySelector('[part=previous]');
    const next = el.shadowRoot.querySelector('[part=next]');
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    el.page = 20;
    await settle();
    expect(previous.disabled).toBe(false);
    expect(next.disabled).toBe(true);
    el.page = 99;
    await settle();
    expect(el.currentPage).toBe(20);
  });

  it('keeps keyboard focus on the current page across a re-render', async () => {
    const el = await fixture(html('page="5"'));
    const button = pageButton(el, 6);
    button.focus();
    button.click();
    await settle();
    expect(el.shadowRoot.activeElement).toBe(pageButton(el, 6));
    expect(el.shadowRoot.activeElement.getAttribute('aria-current')).toBe('page');
    // Next goes disabled on the last page: focus stays inside.
    el.page = 19;
    await settle();
    const next = el.shadowRoot.querySelector('[part=next]');
    next.focus();
    next.click();
    await settle();
    expect(el.shadowRoot.activeElement).toBe(pageButton(el, 20));
  });

  it('formats numbers and names in the element language', async () => {
    const wrap = await fixture(
      `<div lang="ar-EG">${html('page="2" label="الصفحات" label-page="صفحة {page}" label-previous="السابق" label-next="التالي"')}</div>`
    );
    const el = wrap.querySelector('punica-pagination');
    const two = new Intl.NumberFormat('ar-EG').format(2);
    expect(pageButton(el, 2).textContent).toBe(two);
    expect(pageButton(el, 2).getAttribute('aria-label')).toBe(`صفحة ${two}`);
    expect(el.shadowRoot.querySelector('nav').getAttribute('aria-label')).toBe('الصفحات');
    expect(el.shadowRoot.querySelector('[part=next]').getAttribute('aria-label')).toBe('التالي');
  });

  it('takes no click while disabled', async () => {
    const el = await fixture(html('page="5" disabled'));
    expect([...el.shadowRoot.querySelectorAll('button')].every((b) => b.disabled)).toBe(true);
  });

  it('renders no page for an empty total', async () => {
    const el = await fixture('<punica-pagination></punica-pagination>');
    expect(labels(el)).toEqual([]);
    expect(el.shadowRoot.querySelector('[part=next]').disabled).toBe(true);
  });
});
