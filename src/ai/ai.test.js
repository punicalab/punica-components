import { describe, it, expect } from 'vitest';
import manifest from '../../custom-elements.json';
import { createKnowledge, createValidator, enumValues, guessKind } from './index.mjs';

const knowledge = createKnowledge(manifest);
const { validate } = createValidator(knowledge);
const rules = (source, kind) => validate(source, kind ? { kind } : {}).map((f) => f.rule);

describe('knowledge', () => {
  it('reads every element of the manifest', () => {
    expect(knowledge.tags.length).toBeGreaterThan(150);
    expect(knowledge.tags).toContain('punica-button');
  });

  it('parses enum types and leaves open types alone', () => {
    expect(enumValues("'small' | 'medium' | 'large'")).toEqual(['small', 'medium', 'large']);
    expect(enumValues('string')).toBeNull();
    expect(enumValues("'a' | string")).toBeNull();
  });

  it('describes an element with its attributes, events and slots', () => {
    const select = knowledge.get('select');
    expect(select.tag).toBe('punica-select');
    expect(select.attributes.find((a) => a.name === 'full-width').property).toBe('fullWidth');
    expect(select.events.map((e) => e.name)).toContain('punica-change');
    const md = knowledge.formatMarkdown('punica-select');
    expect(md).toContain('## <punica-select>');
    expect(md).toContain('`punica-change`');
  });

  it('gives the brief form: what markup needs, without what only styling needs', () => {
    const whole = knowledge.formatMarkdown('punica-select');
    const brief = knowledge.formatMarkdown('punica-select', { brief: true });

    for (const kept of ['## <punica-select>', '### Attributes', '`full-width`', '### Events', '`punica-change`', '### Slots', 'Import: ']) {
      expect(brief, kept).toContain(kept);
    }
    for (const left of ['### CSS parts', '### CSS custom properties', '### Custom states', '--punica-']) {
      expect(whole, left).toContain(left);
      expect(brief, left).not.toContain(left);
    }
    // It says what it left out, so nobody thinks there is nothing to style
    expect(brief).toMatch(/For styling: \d+ CSS parts, \d+ custom properties.*ask for the whole API/);
    // The attributes are the same ones, each on one line
    const names = (text) => [...text.matchAll(/^\| `([a-z-]+)` \|/gm)].map((match) => match[1]);
    const attributes = knowledge.get('select').attributes.map((a) => a.name);
    expect(names(brief).filter((name) => attributes.includes(name))).toEqual(attributes);
    expect(brief.length).toBeLessThan(whole.length * 0.85);
  });

  it('keeps in the brief form what an element cannot be used without', () => {
    // The names of the glyphs are the API of the icon
    expect(knowledge.formatMarkdown('punica-icon', { brief: true })).toContain('### Icon names');
    // A name that is no element is answered the same way
    expect(knowledge.formatMarkdown('punica-modal', { brief: true })).toContain('punica-dialog');
    // Over the whole library it is much shorter
    const size = (brief) => knowledge.tags.reduce((sum, tag) => sum + knowledge.formatMarkdown(tag, { brief }).length, 0);
    expect(size(true)).toBeLessThan(size(false) * 0.8);
  });

  it('finds an element by the words people use for it', () => {
    expect(knowledge.search('modal').map((r) => r.tag)).toContain('punica-dialog');
    expect(knowledge.search('date picker')[0].tag).toBe('punica-date-picker');
    expect(knowledge.search('toggle switch').map((r) => r.tag)).toContain('punica-switch');
  });

  it('ranks the element asked for first, from the words people use', () => {
    const first = (q) => knowledge.search(q)[0].tag;
    expect(first('text field')).toBe('punica-input');
    expect(first('select dropdown single choice')).toBe('punica-select');
    expect(first('radio button')).toBe('punica-radio');
    expect(first('tag input')).toBe('punica-tokenizer');
    expect(first('dialog footer')).toBe('punica-dialog-footer');
    expect(first('avatar')).toBe('punica-avatar');
    expect(first('table sort')).toBe('punica-table');
    expect(first('toggle switch')).toBe('punica-switch');
    expect(first('sidebar')).toBe('punica-side-nav');
  });

  it('says what became of a 1.x tag', () => {
    expect(knowledge.formatMarkdown('punica-modal')).toContain('punica-dialog');
    expect(knowledge.legacy('punica-typography').replacement).toBeNull();
  });

  it('reads the attributes an element takes from its children', () => {
    expect(knowledge.get('punica-form-layout').childAttributes).toContain('span');
  });
});

describe('validate', () => {
  it('passes correct markup', () => {
    const html = `
      <punica-form-layout columns="2">
        <punica-field label="Name" span="full"><punica-input name="name" required></punica-input></punica-field>
      </punica-form-layout>
      <punica-button variant="outlined" color="error" full-width aria-label="Delete" data-id="7">
        <punica-icon slot="start" name="close"></punica-icon>Delete
      </punica-button>
      <!-- <punica-nope> in a comment is ignored -->
      <script>document.querySelector('punica-select').addEventListener('punica-change', (e) => e.detail.value);</script>`;
    expect(validate(html)).toEqual([]);
  });

  it('names an unknown tag and the closest one', () => {
    const [finding] = validate('<punica-buton></punica-buton>');
    expect(finding).toMatchObject({ rule: 'unknown-tag', fix: 'punica-button', line: 1, column: 1 });
  });

  it('maps a 1.x tag to its successor', () => {
    expect(validate('<punica-modal></punica-modal>')[0]).toMatchObject({ rule: 'legacy-tag', fix: 'punica-dialog' });
    expect(rules('<punica-typography variant="h1">x</punica-typography>')).toEqual(['legacy-tag']);
  });

  it('catches attributes that do not exist, camelCase and values out of the enum', () => {
    expect(rules('<punica-button varient="filled"></punica-button>')).toEqual(['unknown-attribute']);
    expect(validate('<punica-button fullWidth></punica-button>')[0]).toMatchObject({ rule: 'attribute-case', fix: 'full-width' });
    expect(validate('<punica-button fullwidth></punica-button>')[0]).toMatchObject({ rule: 'attribute-case', fix: 'full-width' });
    expect(validate('<punica-button variant="solid"></punica-button>')[0]).toMatchObject({ rule: 'invalid-value' });
    expect(validate('<punica-button disabled="false"></punica-button>')[0]).toMatchObject({ rule: 'boolean-false', severity: 'warning' });
  });

  it('knows the built-in icon names', () => {
    expect(validate('<punica-icon name="trash"></punica-icon>')[0]).toMatchObject({ rule: 'unknown-icon' });
    expect(validate('<punica-icon name="serch"></punica-icon>')[0]).toMatchObject({ rule: 'unknown-icon', fix: 'search' });
    expect(validate('<punica-icon name="search"></punica-icon>')).toEqual([]);
    expect(rules('<punica-icon name="trash" />', 'jsx')).toEqual(['unknown-icon']);
    expect(rules('<punica-icon name={icon} />', 'jsx')).toEqual([]);
  });

  it('checks a slot against the parent element', () => {
    expect(validate('<punica-button><span slot="startIcon">x</span></punica-button>')[0]).toMatchObject({ rule: 'unknown-slot', fix: 'start' });
    expect(rules('<div><span slot="anything">x</span></div>')).toEqual([]);
  });

  it('catches native and misspelt event names', () => {
    expect(validate("<punica-select></punica-select><script>s.addEventListener('change', f)</script>")[0]).toMatchObject({ rule: 'native-event-name', fix: 'punica-change' });
    expect(validate("el.addEventListener('punica-chnage', f)", { kind: 'js' })[0]).toMatchObject({ rule: 'unknown-event', fix: 'punica-change' });
    expect(rules("document.createElement('punica-modal')", 'js')).toEqual(['legacy-tag']);
    expect(rules('Toast.success("Saved")', 'js')).toEqual(['legacy-api']);
  });

  it('reads JSX: React 19 events, properties as props, dynamic values', () => {
    const ok = '<punica-select label="Plan" value={plan} onpunica-change={(e) => set(e.detail.value)} fullWidth onClick={f} className="x" key="k" />';
    expect(validate(ok, { kind: 'jsx' })).toEqual([]);
    expect(validate('<punica-select onChange={f} />', { kind: 'jsx' })[0]).toMatchObject({ rule: 'react-event', fix: 'onpunica-change' });
    expect(rules('<punica-select onpunica-chnage={f} />', 'jsx')).toEqual(['unknown-event']);
    expect(rules('<punica-button variant={"solid"} />', 'jsx')).toEqual(['invalid-value']);
  });

  it('reads Vue templates', () => {
    const vue = '<template><punica-select :value="plan" @punica-change="onPlan" label="Plan"></punica-select></template>';
    expect(validate(vue)).toEqual([]);
    expect(rules('<template><punica-select @change="f" v-if="x"></punica-select></template>')).toEqual(['native-event-name']);
  });

  it('warns of display: contents on a part that takes the focus', () => {
    expect(validate('.bare::part(base) { display: contents; }', { kind: 'css' })[0]).toMatchObject({ rule: 'part-display-contents', severity: 'warning', fix: 'display: inherit' });
    expect(rules('punica-side-nav-item::part(base){display:contents}', 'css')).toEqual(['part-display-contents']);
    expect(rules('<style>.b::part(label) { display: contents }</style><punica-button class="b">x</punica-button>')).toEqual([]);
    expect(rules('punica-section::part(base) { display: contents }', 'css')).toEqual([]);
    expect(rules('punica-button::part(base) { display: inherit }', 'css')).toEqual([]);
  });

  it('guesses the kind of source', () => {
    expect(guessKind('<punica-button>x</punica-button>')).toBe('html');
    expect(guessKind('return <punica-button className="a" />')).toBe('jsx');
    expect(guessKind("el.addEventListener('punica-change', f)")).toBe('js');
  });
});
