/**
 * Punica Components
 *
 * This file contains base type definitions that can be used with any framework
 * (Vanilla JS, Angular, Vue, etc.) or extended for framework-specific usage.
 *
 * @see ./react.d.ts for React-specific extensions
 */

// Base attribute interfaces (no React dependencies)

export interface PunicaAccordionAttributes {
  expanded: boolean;
  rounded?: boolean;
  class?: string;
}

export interface PunicaAccordionSummaryAttributes {
  class?: string;
}

export interface PunicaAccordionDetailsAttributes {
  class?: string;
}

export interface PunicaSelectAttributes {
  value: string | number | Date;
  size?: 'small' | 'medium' | 'large';
  class?: string;
  rounded?: boolean;
  disabled?: boolean;
  placeholder?: string;
  fullwidth?: boolean;
  selecteditemdisplayitem?: string;
  minimumtargetwidth?: boolean;
}

export interface PunicaSelectItemAttributes {
  value: string | number | Date;
  class?: string;
}

export interface PunicaPopoverAttributes {
  class?: string;
  open: boolean;
  minimumtargetwidth?: boolean;
  left: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  placement: 'top' | 'left' | 'right' | 'bottom';
}

export interface PunicaPaginationAttributes {
  class?: string;
  page: number;
  totalCount: number;
  size?: number;
}

export interface PunicaButtonAttributes {
  class?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'filled' | 'outlined';
  type?: 'button' | 'submit' | 'reset';
  fullwidth?: boolean;
  loading?: boolean;
  underline?: boolean;
  rounded?: boolean;
  disabled?: boolean;
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'warning'
    | 'success'
    | 'ghost';
}

export interface PunicaButtonGroupAttributes {
  class?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'text';
  disabled?: boolean;
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'warning'
    | 'success'
    | 'ghost';
  fullwidth?: boolean;
}

export interface PunicaIconButtonAttributes {
  class?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success';
}

export interface PunicaAvatarAttributes {
  class?: string;
  variant?: 'circular' | 'rounded' | 'square';
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success'
    | 'white'
    | string;
}

export interface PunicaAlertAttributes {
  class?: string;
  variant?: 'standard' | 'filled' | 'outlined';
  severity?: 'error' | 'info' | 'warning' | 'success';
}

export interface PunicaAlertActionAttributes {
  class?: string;
}

export interface PunicaAlertIconAttributes {
  class?: string;
}

export interface PunicaAlertContentAttributes {
  class?: string;
}

export interface PunicaAppBarAttributes {
  class?: string;
  position?: 'absolute' | 'fixed' | 'relative' | 'static' | 'sticky';
  color?:
    | 'inherit'
    | 'transparent'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'warning'
    | 'success';
}

export interface PunicaBadgeAttributes {
  size: 'small' | 'medium';
  color: 'primary' | 'error' | 'info' | 'warning' | 'success';
  badgecontent?: number;
  class?: string;
  max?: number;
}

export interface PunicaChipAttributes {
  class?: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  color?: 'default' | 'primary' | 'error' | 'info' | 'warning' | 'success';
}

export interface PunicaInputAttributes {
  class?: string;
  placeholder?: string;
  name?: string;
  fullwidth?: boolean;
  hidespinbutton?: boolean;
  disabled?: boolean;
  rounded?: boolean;
  error?: boolean;
  minlength?: number;
  maxlength?: number;
  tabindex?: number;
  startadornment?: HTMLElement;
  endadornment?: HTMLElement;
  value?: string;
  size?: 'small' | 'medium' | 'large';
  type?:
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week';
}

export interface PunicaTextareaAttributes {
  class?: string;
  placeholder?: string;
  fullwidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  value?: string;
  rounded?: boolean;
  rows?: number;
  minlength?: number;
  maxlength?: number;
}

export interface PunicaContainerAttributes {
  class?: string;
  maxwidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disablegutters?: boolean;
}

export interface PunicaHiddenAttributes {
  class?: string;
  breakPoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction: 'up' | 'down';
}

export interface PunicaIconAttributes {
  class?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge';
  color?: 'default' | 'primary' | 'error' | 'info' | 'warning' | 'success';
}

export interface PunicaDatePickerAttributes {
  class?: string;
  open?: boolean;
  value?: Date | string;
  timezone?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
}

export interface PunicaDrawerAttributes {
  class?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge' | 'fullSize';
  direction?: 'top' | 'left' | 'bottom' | 'right';
  open?: boolean;
  rounded?: boolean;
  customsize?: string;
}

export interface PunicaPaperAttributes {
  class?: string;
  rounded?: boolean;
}

export interface PunicaSplitButtonAttributes {
  class?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'filled' | 'outlined';
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'warning'
    | 'success'
    | 'ghost';
  rounded?: boolean;
  disabled?: boolean;
  open?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
  icon?: string;
}

export interface PunicaCardAttributes {
  class?: string;
  rounded?: boolean;
  fullwidth?: boolean;
}

export interface PunicaAgendaAttributes {
  class?: string;
}

export interface PunicaCardHeaderAttributes {
  class?: string;
}

export interface PunicaCardMediaAttributes {
  class?: string;
}

export interface PunicaCardContentAttributes {
  class?: string;
}

export interface PunicaCardActionsAttributes {
  class?: string;
}

export interface PunicaBoxAttributes {
  class?: string;
  rounded?: boolean;
  error?: boolean;
  border?: boolean;
  fullwidth?: boolean;
  fullheight?: boolean;
}

export interface PunicaTooltipAttributes {
  text: string;
}

export interface PunicaDividerAttributes {
  class?: string;
  flexItem?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export interface PunicaSwitchAttributes {
  class?: string;
  initstate?: boolean;
}

export interface PunicaModalAttributes {
  class?: string;
  rounded?: boolean;
  open: boolean;
  width: number | string;
  height: number | string;
}

export interface PunicaModalHeaderAttributes {
  class?: string;
}

export interface PunicaModalContentAttributes {
  class?: string;
}

export interface PunicaModalFooterAttributes {
  class?: string;
}

export interface PunicaDialogAttributes {
  class?: string;
  open: boolean;
  rounded?: boolean;
  width?: number;
}

export interface PunicaDialogHeaderAttributes {
  class?: string;
}

export interface PunicaDialogContentAttributes {
  class?: string;
}

export interface PunicaDialogFooterAttributes {
  class?: string;
}

export interface PunicaSkeletonAttributes {
  class?: string;
  variant: 'text' | 'circular' | 'rectangular';
  width: string;
  height: string;
  rounded?: boolean;
}

export interface PunicaCheckboxAttributes {
  class?: string;
  checked?: boolean;
  indeterminate?: boolean;
  label?: string;
  disabled?: boolean;
}

export interface PunicaMenuAttributes {
  class?: string;
  open?: boolean;
  left?: number;
  top?: number;
  bottom?: number;
  width?: number;
  height?: number;
  placement?: 'top' | 'left' | 'right' | 'bottom';
}

export interface PunicaMenuItemAttributes {
  class?: string;
  disabled?: boolean;
}

export interface PunicaTabAttributes {
  class?: string;
  orientation: 'horizontal' | 'vertical';
  fullwidth?: boolean;
  disabled?: boolean;
  value?: string;
}

export interface PunicaTabItemAttributes {
  class?: string;
  value: string | number;
}

export interface PunicaTabPanelAttributes {
  class?: string;
  value: string | number;
  selectedvalue: string | number;
}

export interface PunicaListViewAttributes {
  class?: string;
  enabledivider?: boolean;
  spacing?: number;
}

export interface PunicaListViewItemAttributes {
  class?: string;
}

export interface PunicaSingleSelectListAttributes {
  class?: string;
  value: string | number | Date;
}

export interface PunicaSingleSelectListItemAttributes {
  class?: string;
  value: string | number | Date;
}

export interface PunicaMultiSelectListAttributes {
  class?: string;
  value: Array<string | number | Date>;
}

export interface PunicaMultiSelectListItemAttributes {
  class?: string;
  value: string | number | Date;
}

export interface PunicaTimePickerAttributes {
  class?: string;
  open?: boolean;
}

export interface PunicaTypographyAttributes {
  class?: string;
  truncate?: number;
  textalign?: 'left' | 'right' | 'center' | 'justify';
  whitespace?: 'nowrap' | 'pre-line' | 'pre-wrap';
  fontweight?:
    | 'thin'
    | 'regular'
    | 'medium'
    | 'semi-bold'
    | 'bold'
    | 'extra-bold';
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success'
    | 'white'
    | string;
  variant?:
    | 'headline1'
    | 'headline2'
    | 'headline3'
    | 'headline4'
    | 'headline5'
    | 'headline6'
    | 'subtitle1'
    | 'subtitle2'
    | 'body1'
    | 'body2'
    | 'caption'
    | 'button'
    | 'overline';
}

export interface PunicaToggleButtonAttributes {
  value?: any;
  selected?: boolean;
  class?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success';
}

export interface PunicaToggleButtonGroupAttributes {
  value?: any;
  defaultvalue?: any;
  class?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullwidth?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export interface PunicaToolbarAttributes {
  class?: string;
  variant?: 'dense' | 'regular';
  disablegutters?: boolean;
}

export interface PunicaColAttributes {
  class?: string;
  xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export interface PunicaRowAttributes {
  class?: string;
  fullheight?: boolean;
  wrap?: 'nowrap' | 'wrap-reverse' | 'wrap';
  direction?: 'column-reverse' | 'column' | 'row-reverse' | 'row';
  spacing?: number;
  rowspacing?: number;
  columnspacing?: number;
  justifyitems?:
    | 'end'
    | 'auto'
    | 'start'
    | 'normal'
    | 'flex-end'
    | 'self-end'
    | 'flex-start'
    | 'self-start'
    | 'left'
    | 'center'
    | 'right'
    | 'baseline'
    | 'first baseline'
    | 'last baseline'
    | 'stretch'
    | 'safe'
    | 'unsafe'
    | 'legacy'
    | 'initial'
    | 'inherit';
  justifycontent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'initial'
    | 'inherit';
  aligncontent?:
    | 'stretch'
    | 'center'
    | 'flex-start'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'initial'
    | 'inherit';
  alignitems?:
    | 'stretch'
    | 'center'
    | 'flex-start'
    | 'flex-end'
    | 'baseline'
    | 'initial'
    | 'inherit';
}

export interface PunicaToastAttributes {
  class?: string;
}

export interface PunicaToasterAttributes {
  class?: string;
}

export interface PunicaProgressLineAttributes {
  class?: string;
  height?: string;
  color?: string;
}

export interface PunicaSplitAttributes {
  class?: string;
  orientation?: 'horizontal' | 'vertical';
  sizes?: number[];
  min?: number | number[];
  step?: string | number;
  setSizes?: (sizes: number[]) => void;
  getSizes?: () => number[];
  reset?: () => void;
  onSplitChange?: (event: CustomEvent<{ sizes: number[] }>) => void;
}

export interface PunicaContextMenuAttributes {
  class?: string;
  target: string;
  disabled?: boolean;
}

export interface PunicaContextMenuItemAttributes {
  class?: string;
  label?: string;
  value?: string;
  keyboard?: string;
  icon?: string;
  disabled?: boolean;
}

export interface PunicaContextMenuSeparatorAttributes {
  class?: string;
}

export interface PunicaVirtualListAttributes {
  class?: string;
  itemheight: number;
  overscan: number;
}

export interface PunicaVirtualTableAttributes {
  class?: string;
  itemheight: number;
  overscan: number;
}

export interface PunicaQrCodeAttributes {
  value?: string;
  size?: string | number;
  background?: string;
  foreground?: string;
  class?: string;
}

// Global element mapping for custom elements
declare global {
  interface HTMLElementTagNameMap {
    'punica-accordion': HTMLElement & PunicaAccordionAttributes;
    'punica-agenda': HTMLElement & PunicaAgendaAttributes;
    'punica-accordion-summary': HTMLElement & PunicaAccordionSummaryAttributes;
    'punica-accordion-details': HTMLElement & PunicaAccordionDetailsAttributes;
    'punica-select': HTMLElement & PunicaSelectAttributes;
    'punica-select-item': HTMLElement & PunicaSelectItemAttributes;
    'punica-popover': HTMLElement & PunicaPopoverAttributes;
    'punica-pagination': HTMLElement & PunicaPaginationAttributes;
    'punica-button': HTMLElement & PunicaButtonAttributes;
    'punica-button-group': HTMLElement & PunicaButtonGroupAttributes;
    'punica-icon-button': HTMLElement & PunicaIconButtonAttributes;
    'punica-avatar': HTMLElement & PunicaAvatarAttributes;
    'punica-alert': HTMLElement & PunicaAlertAttributes;
    'punica-alert-action': HTMLElement & PunicaAlertActionAttributes;
    'punica-alert-icon': HTMLElement & PunicaAlertIconAttributes;
    'punica-alert-content': HTMLElement & PunicaAlertContentAttributes;
    'punica-app-bar': HTMLElement & PunicaAppBarAttributes;
    'punica-badge': HTMLElement & PunicaBadgeAttributes;
    'punica-chip': HTMLElement & PunicaChipAttributes;
    'punica-input': HTMLElement & PunicaInputAttributes;
    'punica-textarea': HTMLElement & PunicaTextareaAttributes;
    'punica-container': HTMLElement & PunicaContainerAttributes;
    'punica-hidden': HTMLElement & PunicaHiddenAttributes;
    'punica-icon': HTMLElement & PunicaIconAttributes;
    'punica-date-picker': HTMLElement & PunicaDatePickerAttributes;
    'punica-drawer': HTMLElement & PunicaDrawerAttributes;
    'punica-paper': HTMLElement & PunicaPaperAttributes;
    'punica-split-button': HTMLElement & PunicaSplitButtonAttributes;
    'punica-card': HTMLElement & PunicaCardAttributes;
    'punica-card-header': HTMLElement & PunicaCardHeaderAttributes;
    'punica-card-media': HTMLElement & PunicaCardMediaAttributes;
    'punica-card-content': HTMLElement & PunicaCardContentAttributes;
    'punica-card-actions': HTMLElement & PunicaCardActionsAttributes;
    'punica-box': HTMLElement & PunicaBoxAttributes;
    'punica-tooltip': HTMLElement & PunicaTooltipAttributes;
    'punica-divider': HTMLElement & PunicaDividerAttributes;
    'punica-switch': HTMLElement & PunicaSwitchAttributes;
    'punica-modal': HTMLElement & PunicaModalAttributes;
    'punica-modal-header': HTMLElement & PunicaModalHeaderAttributes;
    'punica-modal-content': HTMLElement & PunicaModalContentAttributes;
    'punica-modal-footer': HTMLElement & PunicaModalFooterAttributes;
    'punica-dialog': HTMLElement & PunicaDialogAttributes;
    'punica-dialog-header': HTMLElement & PunicaDialogHeaderAttributes;
    'punica-dialog-content': HTMLElement & PunicaDialogContentAttributes;
    'punica-dialog-footer': HTMLElement & PunicaDialogFooterAttributes;
    'punica-skeleton': HTMLElement & PunicaSkeletonAttributes;
    'punica-checkbox': HTMLElement & PunicaCheckboxAttributes;
    'punica-menu': HTMLElement & PunicaMenuAttributes;
    'punica-menu-item': HTMLElement & PunicaMenuItemAttributes;
    'punica-tab': HTMLElement & PunicaTabAttributes;
    'punica-tab-item': HTMLElement & PunicaTabItemAttributes;
    'punica-tab-panel': HTMLElement & PunicaTabPanelAttributes;
    'punica-list-view': HTMLElement & PunicaListViewAttributes;
    'punica-list-view-item': HTMLElement & PunicaListViewItemAttributes;
    'punica-single-select-list': HTMLElement & PunicaSingleSelectListAttributes;
    'punica-single-select-list-item': HTMLElement &
      PunicaSingleSelectListItemAttributes;
    'punica-multi-select-list': HTMLElement & PunicaMultiSelectListAttributes;
    'punica-multi-select-list-item': HTMLElement &
      PunicaMultiSelectListItemAttributes;
    'punica-time-picker': HTMLElement & PunicaTimePickerAttributes;
    'punica-typography': HTMLElement & PunicaTypographyAttributes;
    'punica-toggle-button': HTMLElement & PunicaToggleButtonAttributes;
    'punica-toggle-button-group': HTMLElement &
      PunicaToggleButtonGroupAttributes;
    'punica-toolbar': HTMLElement & PunicaToolbarAttributes;
    'punica-col': HTMLElement & PunicaColAttributes;
    'punica-row': HTMLElement & PunicaRowAttributes;
    'punica-toast': HTMLElement & PunicaToastAttributes;
    'punica-toaster': HTMLElement & PunicaToasterAttributes;
    'punica-progress-line': HTMLElement & PunicaProgressLineAttributes;
    'punica-split': HTMLElement & PunicaSplitAttributes;
    'punica-context-menu': HTMLElement & PunicaContextMenuAttributes;
    'punica-context-menu-item': HTMLElement & PunicaContextMenuItemAttributes;
    'punica-context-menu-separator': HTMLElement &
      PunicaContextMenuSeparatorAttributes;
    'punica-virtual-list': HTMLElement & PunicaVirtualListAttributes;
    'punica-virtual-table': HTMLElement & PunicaVirtualTableAttributes;
    'punica-qr-code': HTMLElement & PunicaQrCodeAttributes;
  }
}

export {};
