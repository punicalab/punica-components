import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import { icons } from '../../core/icons.js';
import './icon.js';

contract('punica-icon', { html: '<punica-icon name="search" label="Search"></punica-icon>' });
contract('punica-icon', { html: '<p>Saved <punica-icon name="check"></punica-icon></p>' });

describe('punica-icon', () => {
  afterEach(cleanup);

  it('draws a named glyph of the table as a real SVG, 1em square', async () => {
    const wrap = await fixture('<div style="font-size:20px"><punica-icon name="close"></punica-icon></div>');
    const el = wrap.firstElementChild;
    const svg = el.shadowRoot.querySelector('svg');
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(svg.querySelector('path').getAttribute('d')).toBe('M6 6l12 12M18 6 6 18');
    expect(svg.getBoundingClientRect().width).toBe(20);
    expect(svg.getBoundingClientRect().height).toBe(20);
    el.name = 'check';
    await settle();
    expect(el.shadowRoot.querySelectorAll('svg').length).toBe(1);
    expect(el.shadowRoot.querySelector('path').getAttribute('d')).toBe('m5 12 5 5 9-10');
  });

  it('knows every glyph of the table', async () => {
    const el = await fixture('<punica-icon></punica-icon>');
    for (const name of Object.keys(icons)) {
      el.name = name;
      await settle();
      expect(el.shadowRoot.querySelector('svg'), name).toBeTruthy();
    }
  });

  it('draws nothing for a name that is not in the table, and never reads it as markup', async () => {
    const el = await fixture('<punica-icon name="close"></punica-icon>');
    for (const bad of ['"><img src=x onerror=alert(1)>', '<svg onload=alert(1)>', 'constructor', 'toString', '__proto__', 'nope']) {
      el.setAttribute('name', bad);
      await settle();
      expect(el.shadowRoot.querySelector('svg, img'), bad).toBe(null);
      expect(el.shadowRoot.querySelector('.glyph').childNodes.length).toBe(0);
    }
  });

  it('is an image with a name when labelled and hidden otherwise', async () => {
    const el = await fixture('<punica-icon name="warning" label="Warning"></punica-icon>');
    expect(el.internals.role).toBe('img');
    expect(el.internals.ariaLabel).toBe('Warning');
    expect(el.internals.ariaHidden).toBe(null);
    el.label = null;
    await settle();
    expect(el.internals.role).toBe(null);
    expect(el.internals.ariaHidden).toBe('true');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('still shows a slotted icon-font element, sized and coloured by the host', async () => {
    const wrap = await fixture(
      '<div style="font-size:16px"><punica-icon size="2xlarge" color="error"><i class="fa-solid fa-user">u</i></punica-icon></div>'
    );
    const el = wrap.firstElementChild;
    const inner = el.querySelector('i');
    expect(getComputedStyle(inner).fontSize).toBe('32px');
    const probe = document.createElement('span');
    probe.style.color = 'var(--punica-color-error)';
    wrap.append(probe);
    expect(getComputedStyle(inner).color).toBe(getComputedStyle(probe).color);
    el.size = 'small';
    await settle();
    expect(getComputedStyle(inner).fontSize).toBe('14px');
  });
});
