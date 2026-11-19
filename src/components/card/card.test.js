import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import '../button/button.js';
import './card.js';
import './cardHeader.js';
import './cardContent.js';
import './cardActions.js';
import './cardMedia.js';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const html = `<punica-card>
  <punica-card-media><img src="${PIXEL}" alt="A harbour at dusk"></punica-card-media>
  <punica-card-header>
    <span slot="start">K</span>
    Kotor
    <span slot="subtitle">Montenegro</span>
    <button slot="end" type="button" aria-label="More">…</button>
  </punica-card-header>
  <punica-card-content>A walled town at the end of a bay.</punica-card-content>
  <punica-card-actions><punica-button variant="text">Open</punica-button></punica-card-actions>
</punica-card>`;

contract('punica-card', { html });
contract('punica-card', { html: '<punica-card interactive href="#kotor"><punica-card-content>Kotor</punica-card-content></punica-card>' });
contract('punica-card-header', { html: '<punica-card-header>Kotor<span slot="subtitle">Montenegro</span></punica-card-header>' });
contract('punica-card-content', { html: '<punica-card-content>A walled town.</punica-card-content>' });
contract('punica-card-actions', { html: '<punica-card-actions><button type="button">Open</button></punica-card-actions>' });
contract('punica-card-media', { html: `<punica-card-media><img src="${PIXEL}" alt="A harbour at dusk"></punica-card-media>` });

const base = (el) => el.shadowRoot.querySelector('.base');

describe('punica-card', () => {
  afterEach(cleanup);

  it('is a plain surface by default: elevated, rounded, clipped', async () => {
    const el = await fixture(html);
    const b = base(el);
    expect(b.localName).toBe('div');
    const cs = getComputedStyle(b);
    expect(cs.boxShadow).not.toBe('none');
    expect(cs.borderTopLeftRadius).toBe('8px');
    expect(cs.overflow).toBe('hidden');
    expect(getComputedStyle(el).display).toBe('block');
  });

  it('draws each variant', async () => {
    const el = await fixture('<punica-card variant="outlined">x</punica-card>');
    base(el).style.transition = 'none';
    let cs = getComputedStyle(base(el));
    expect(cs.boxShadow).toBe('none');
    expect(cs.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    el.variant = 'filled';
    await settle();
    cs = getComputedStyle(base(el));
    expect(cs.boxShadow).toBe('none');
    const probe = document.createElement('i');
    probe.style.color = 'var(--punica-color-neutral-light)';
    el.after(probe);
    expect(cs.backgroundColor).toBe(getComputedStyle(probe).color);
    el.variant = 'red;} * {display:none';
    await settle();
    expect(getComputedStyle(base(el)).boxShadow).not.toBe('none');
  });

  it('is one native button when interactive', async () => {
    const el = await fixture('<punica-card interactive><punica-card-content>Kotor</punica-card-content></punica-card>');
    const button = base(el);
    expect(button.localName).toBe('button');
    expect(button.type).toBe('button');
    expect(button.contains(el.shadowRoot.querySelector('slot'))).toBe(true);
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
    button.click();
    el.click();
    expect(clicks).toBe(2);
    el.disabled = true;
    await settle();
    expect(base(el).disabled).toBe(true);
    base(el).click();
    expect(clicks).toBe(2);
  });

  it('is one native link when interactive with an href', async () => {
    const el = await fixture(
      '<punica-card interactive href="#kotor" target="_blank" label="Kotor, Montenegro">Kotor</punica-card>'
    );
    const a = base(el);
    expect(a.localName).toBe('a');
    expect(a.getAttribute('href')).toBe('#kotor');
    expect(a.getAttribute('rel')).toBe('noopener');
    expect(a.getAttribute('aria-label')).toBe('Kotor, Montenegro');
    el.target = null;
    el.href = 'javascript:alert(1)';
    await settle();
    expect(base(el).localName).toBe('button');
    el.href = '#budva';
    await settle();
    expect(base(el).localName).toBe('a');
    expect(base(el).hasAttribute('rel')).toBe(false);
    el.interactive = false;
    await settle();
    expect(base(el).localName).toBe('div');
    expect(base(el).hasAttribute('href')).toBe(false);
    expect(base(el).hasAttribute('aria-label')).toBe(false);
    expect(el.shadowRoot.querySelector('slot').assignedNodes().length).toBe(1);
  });

  it('lays the header out as start, title over subtitle, end', async () => {
    const el = await fixture(html);
    const header = el.querySelector('punica-card-header');
    const start = header.querySelector('[slot=start]').getBoundingClientRect();
    const end = header.querySelector('[slot=end]').getBoundingClientRect();
    const title = header.shadowRoot.querySelector('.title').getBoundingClientRect();
    const subtitle = header.shadowRoot.querySelector('.subtitle').getBoundingClientRect();
    expect(start.right).toBeLessThanOrEqual(title.left);
    expect(title.right).toBeLessThanOrEqual(end.left);
    expect(title.bottom).toBeLessThanOrEqual(subtitle.top + 0.5);
    expect(getComputedStyle(header).paddingTop).toBe('16px');
    expect(getComputedStyle(header.shadowRoot.querySelector('.title')).fontWeight).toBe('600');
  });

  it('runs media to the edges and puts actions at the end', async () => {
    const wrap = await fixture(`<div style="width:300px">${html}</div>`);
    const el = wrap.firstElementChild;
    const img = el.querySelector('img');
    expect(img.getBoundingClientRect().width).toBe(298);
    const actions = el.querySelector('punica-card-actions');
    expect(getComputedStyle(actions).justifyContent).toMatch(/end$/);
    actions.align = 'between';
    await settle();
    expect(getComputedStyle(actions).justifyContent).toBe('space-between');
    expect(getComputedStyle(el.querySelector('punica-card-content')).paddingInlineStart).toBe('16px');
  });
});

describe('punica-card elevation', () => {
  afterEach(cleanup);

  it('draws an elevated card on the raised surface, which differs from the surface in dark mode', async () => {
    const wrap = await fixture(
      '<div style="color-scheme: dark; background: var(--punica-color-surface)"><punica-card>Raised</punica-card><punica-card variant="outlined">Flat</punica-card></div>'
    );
    const [raised, flat] = [...wrap.children].map((c) => getComputedStyle(c.shadowRoot.querySelector('.base')).backgroundColor);
    expect(raised).not.toBe(flat);
    expect(flat).toBe(getComputedStyle(wrap).backgroundColor);
  });
});

describe('align attribute and text', () => {
  afterEach(cleanup);

  it('does not change the alignment of the text inside', async () => {
    const wrap = await fixture('<div style="text-align: center"><punica-card-actions align="start"><button>Go</button></punica-card-actions></div>');
    expect(getComputedStyle(wrap.firstElementChild).textAlign).toBe('center');
  });
});
