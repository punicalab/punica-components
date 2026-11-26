import { define } from '../../core/element.js';
import { PunicaRadioGroup } from '../radio/radioGroup.js';
import './selectableCard.js';
import styles from './selectableCardGroup.css';

/**
 * A set of `<punica-selectable-card>`s of which one is chosen: a radio
 * group whose radios are cards. The group is the form control: it holds
 * `value`, submits it under `name`, validates `required` and resets.
 *
 * One card is in the tab order. Arrow keys, Home and End move focus and
 * choose in one step; Space and Enter choose the focused card.
 *
 * @element punica-selectable-card-group
 *
 * @attr {string} value - Default value. The property holds the current value.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name of the group.
 * @attr {'horizontal' | 'vertical'} orientation - Cards in a row that wraps, or in a column; `horizontal` by default.
 * @attr {boolean} disabled - Disables every card and submits nothing.
 * @attr {boolean} required - A card has to be chosen before the form submits.
 *
 * @slot - The `<punica-selectable-card>` elements.
 *
 * @fires {{ value: string }} punica-change - The user chose another card; `detail: { value }`.
 *
 * @cssprop --punica-selectable-card-group-gap - Space between the cards.
 * @cssprop --punica-selectable-card-group-min-width - Narrowest a card gets in a row before the row wraps.
 *
 * @cssstate invalid - Required and nothing is chosen.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaSelectableCardGroup extends PunicaRadioGroup {
  static properties = {
    orientation: { default: 'horizontal' }
  };

  static styles = styles;
  static itemTag = 'punica-selectable-card';
  static itemFlag = 'checked';
}

define('punica-selectable-card-group', PunicaSelectableCardGroup);
