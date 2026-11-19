import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './fileInput.js';

contract('punica-file-input', { html: '<punica-file-input label="Attachments" name="files" multiple accept=".txt,image/*"></punica-file-input>' });

const file = (name, type = 'text/plain') => new File(['x'], name, { type });
const transfer = (...files) => {
  const data = new DataTransfer();
  for (const f of files) data.items.add(f);
  return data;
};
/** What the system dialog does when the user confirms a choice. */
const pick = (el, ...files) => {
  const native = el.shadowRoot.querySelector('input[type=file]');
  native.files = transfer(...files).files;
  native.dispatchEvent(new Event('change', { bubbles: true }));
};
const drop = (el, ...files) => {
  const base = el.shadowRoot.querySelector('.base');
  const init = { dataTransfer: transfer(...files), bubbles: true, cancelable: true, composed: true };
  base.dispatchEvent(new DragEvent('dragenter', init));
  const over = new DragEvent('dragover', init);
  base.dispatchEvent(over);
  const dragging = el.matches(':state(dragover)');
  base.dispatchEvent(new DragEvent('drop', init));
  return { dragging, accepted: over.defaultPrevented };
};
const names = (form) => [...new FormData(form)].map(([k, v]) => [k, v.name]);

describe('punica-file-input', () => {
  afterEach(cleanup);

  it('is a labelled group with a native button that opens the native picker', async () => {
    const el = await fixture('<punica-file-input label="Attachments" accept=".txt" multiple></punica-file-input>');
    const base = el.shadowRoot.querySelector('.base');
    const button = el.shadowRoot.querySelector('button');
    const native = el.shadowRoot.querySelector('input[type=file]');
    expect([base.getAttribute('role'), base.getAttribute('aria-label')]).toEqual(['group', 'Attachments']);
    expect(button.textContent).toBe('Choose file');
    expect(el.shadowRoot.querySelector('.hint').textContent).toBe('or drop it here');
    expect([native.accept, native.multiple, native.hidden]).toEqual(['.txt', true, true]);
    let opened = 0;
    native.addEventListener('click', (e) => {
      opened++;
      e.preventDefault();
    });
    await userEvent.tab();
    expect(el.shadowRoot.activeElement).toBe(button);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(opened).toBe(2);
  });

  it('takes its texts from label-browse and label-drop', async () => {
    const el = await fixture('<punica-file-input label="Foto" label-browse="Datei wählen" label-drop="oder hier ablegen"></punica-file-input>');
    expect(el.shadowRoot.querySelector('button').textContent).toBe('Datei wählen');
    expect(el.shadowRoot.querySelector('.hint').textContent).toBe('oder hier ablegen');
  });

  it('takes picked files, lists their names and fires punica-change with them', async () => {
    const el = await fixture('<punica-file-input label="Attachments" multiple></punica-file-input>');
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push([e.detail.files.map((f) => f.name), e.bubbles, e.composed]));
    pick(el, file('a.txt'), file('b.txt'));
    await settle();
    expect(el.files.map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
    expect(el.files[0]).toBeInstanceOf(File);
    expect([...el.shadowRoot.querySelectorAll('[part=file]')].map((li) => li.textContent)).toEqual(['a.txt', 'b.txt']);
    expect(el.matches(':state(filled)')).toBe(true);
    expect(seen).toEqual([[['a.txt', 'b.txt'], true, true]]);
    pick(el, file('a.txt'));
    expect(seen.length).toBe(2);
  });

  it('takes dropped files, filtered by accept and by multiple', async () => {
    const el = await fixture('<punica-file-input label="Attachments" accept=".txt,image/*"></punica-file-input>');
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail.files.map((f) => f.name)));
    const result = drop(el, file('a.pdf', 'application/pdf'), file('b.png', 'image/png'), file('c.TXT'));
    expect(result).toEqual({ dragging: true, accepted: true });
    expect(el.matches(':state(dragover)')).toBe(false);
    expect(seen).toEqual([['b.png']]);
    el.multiple = true;
    drop(el, file('a.pdf', 'application/pdf'), file('b.png', 'image/png'), file('c.TXT'));
    expect(seen[1]).toEqual(['b.png', 'c.TXT']);
    drop(el, file('a.pdf', 'application/pdf'));
    expect(seen.length).toBe(2);
  });

  it('takes nothing while disabled', async () => {
    const el = await fixture('<punica-file-input label="Attachments" disabled></punica-file-input>');
    expect(el.shadowRoot.querySelector('.base').getAttribute('aria-disabled')).toBe('true');
    const native = el.shadowRoot.querySelector('input[type=file]');
    let opened = 0;
    native.addEventListener('click', (e) => {
      opened++;
      e.preventDefault();
    });
    el.shadowRoot.querySelector('button').click();
    el.showPicker();
    expect(opened).toBe(0);
    expect(drop(el, file('a.txt'))).toEqual({ dragging: false, accepted: false });
    expect(el.files).toEqual([]);
  });

  it('fires nothing when files are assigned, and an empty list clears', async () => {
    const el = await fixture('<punica-file-input label="Attachments"></punica-file-input>');
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    el.files = [file('a.txt')];
    await settle();
    expect(el.shadowRoot.querySelector('.list').hidden).toBe(false);
    el.files = null;
    await settle();
    expect(el.files).toEqual([]);
    expect(el.shadowRoot.querySelector('.list').hidden).toBe(true);
    expect(fired).toBe(0);
  });

  it('appears in the form data as File entries, one per file', async () => {
    const form = await fixture('<form><punica-file-input name="docs" label="Docs" multiple></punica-file-input></form>');
    const el = form.firstElementChild;
    expect(names(form)).toEqual([]);
    pick(el, file('a.txt'), file('b.txt'));
    await settle();
    expect(names(form)).toEqual([['docs', 'a.txt'], ['docs', 'b.txt']]);
    expect(new FormData(form).get('docs')).toBeInstanceOf(File);
  });

  it('is left out of the form data when disabled', async () => {
    const form = await fixture('<form><punica-file-input name="docs" label="Docs"></punica-file-input></form>');
    const el = form.firstElementChild;
    el.files = [file('a.txt')];
    el.disabled = true;
    await settle();
    expect(names(form)).toEqual([]);
  });

  it('is emptied by form.reset()', async () => {
    const form = await fixture('<form><punica-file-input name="docs" label="Docs"></punica-file-input></form>');
    const el = form.firstElementChild;
    pick(el, file('a.txt'));
    await settle();
    form.reset();
    await settle();
    expect(el.files).toEqual([]);
    expect(names(form)).toEqual([]);
    expect(el.shadowRoot.querySelectorAll('[part=file]').length).toBe(0);
  });

  it('blocks checkValidity() when required and empty', async () => {
    const form = await fixture('<form><punica-file-input name="docs" label="Docs" required></punica-file-input></form>');
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage.trim()).not.toBe('');
    pick(el, file('a.txt'));
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-file-input name="docs" label="Docs"></punica-file-input></fieldset></form>');
    await settle();
    const el = form.querySelector('punica-file-input');
    el.files = [file('a.txt')];
    await settle();
    expect(el.shadowRoot.querySelector('button').disabled).toBe(true);
    expect(names(form)).toEqual([]);
  });
});
