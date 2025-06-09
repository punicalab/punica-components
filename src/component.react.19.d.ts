/// <reference types="react" />
import * as React from 'react';

interface PunicaAccordionProps extends React.HTMLAttributes<HTMLElement> {
  expanded: boolean;
  rounded?: boolean;
  class?: string;
}

interface PunicaAccordionSummaryProps
  extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaAccordionDetailsProps
  extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaSelectProps extends React.HTMLAttributes<HTMLElement> {
  value: string | number | Date;
  size?: 'small' | 'medium' | 'large';
  class?: string;
  rounded?: boolean;
  disabled?: boolean;
  fullwidth?: boolean;
  selecteditemdisplayitem?: string;
  minimumtargetwidth?: string;
}

interface PunicaSelectItemProps extends React.HTMLAttributes<HTMLElement> {
  value: string | number | Date;
  class?: string;
}

interface PunicaPopoverProps extends React.HTMLAttributes<HTMLElement> {
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

interface PunicaPaginationProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  page: number;
  totalCount: number;
  size?: number;
}

interface PunicaButtonProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'filled' | 'outlined';
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

interface PunicaButtonGroupProps extends React.HTMLAttributes<HTMLElement> {
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

interface PunicaIconButtonProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success';
}

interface PunicaAvatarProps extends React.HTMLAttributes<HTMLElement> {
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

interface PunicaAlertProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  variant?: 'standard' | 'filled' | 'outlined';
  severity?: 'error' | 'info' | 'warning' | 'success';
}

interface PunicaAlertActionProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaAlertIconProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaAlertContentProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaAppBarProps extends React.HTMLAttributes<HTMLElement> {
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

interface PunicaBadgeProps extends React.HTMLAttributes<HTMLElement> {
  size: 'small' | 'medium';
  color: 'primary' | 'error' | 'info' | 'warning' | 'success';
  badgecontent?: number;
  class?: string;
  max?: number;
}

interface PunicaChipProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  color?: 'default' | 'primary' | 'error' | 'info' | 'warning' | 'success';
}

interface PunicaInputProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  placeholder?: string;
  fullwidth?: boolean;
  hidespinbutton?: boolean;
  disabled?: boolean;
  rounded?: boolean;
  error?: boolean;
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

interface PunicaTextareaProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  placeholder?: string;
  fullwidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  value?: string;
  rounded?: boolean;
  rows?: number;
}

interface PunicaContainerProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  maxwidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disablegutters?: boolean;
}

interface PunicaHiddenProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  breakPoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction: 'up' | 'down';
}

interface PunicaIconProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge';
  color?: 'default' | 'primary' | 'error' | 'info' | 'warning' | 'success';
}

interface PunicaDatePickerProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  open?: boolean;
  value?: Date | string;
  timezone?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
}

interface PunicaDrawerProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  size: 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge' | 'fullSize';
  direction?: 'top' | 'left' | 'bottom' | 'right';
  open?: boolean;
}

interface PunicaPaperProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  rounded?: boolean;
}

interface PunicaSplitButtonProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaCardProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  rounded?: boolean;
  fullwidth?: boolean;
}

interface PunicaCardMediaProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaCardContentProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaCardActionsProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaBoxProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  rounded?: boolean;
  error?: boolean;
  border?: boolean;
  fullwidth?: boolean;
  fullheight?: boolean;
}

interface PunicaTooltipProps extends React.HTMLAttributes<HTMLElement> {
  text: string;
}

interface PunicaDividerProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  flexItem?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

interface PunicaSwitchProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  initstate?: boolean;
}

interface PunicaModalProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  rounded?: boolean;
  open: boolean;
  width: number | string;
  height: number | string;
}

interface PunicaModalHeaderProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaModalContentProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaModalFooterProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaDialogProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  open: boolean;
  rounded?: boolean;
  width?: number;
}

interface PunicaDialogHeaderProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaDialogContentProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaDialogFooterProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaSkeletonProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  variant: 'text' | 'circular' | 'rectangular';
  width: string;
  height: string;
  rounded?: boolean;
}

interface PunicaCheckboxProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  checked?: boolean;
  indeterminate?: boolean;
  label?: string;
  disabled?: boolean;
}

interface PunicaMenuProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  open: boolean;
  left: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  placement: 'top' | 'left' | 'right' | 'bottom';
}

interface PunicaMenuItemProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  disabled?: boolean;
}

interface PunicaTabProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  orientation: 'horizontal' | 'vertical';
  fullwidth?: boolean;
  disabled?: boolean;
  value?: string;
}

interface PunicaTabItemProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  value: string | number;
}

interface PunicaTabPanelProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  value: string | number;
  selectedvalue: string | number;
}

interface PunicaListViewProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  enabledivider?: boolean;
}

interface PunicaListViewItemProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
}

interface PunicaSingleSelectListProps
  extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  value: string | number | Date;
}

interface PunicaSingleSelectListItemProps
  extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  value: string | number | Date;
}

interface PunicaMultiSelectListProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  value: Array<string | number | Date>;
}

interface PunicaMultiSelectListItemProps
  extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  value: string | number | Date;
}

interface PunicaTimePickerProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  open?: boolean;
}

interface PunicaTypographyProps extends React.HTMLAttributes<HTMLElement> {
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

interface PunicaToggleButtonProps extends React.HTMLAttributes<HTMLElement> {
  value: any;
  selected?: boolean;
  class?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success';
}

interface PunicaToggleButtonGroupProps
  extends React.HTMLAttributes<HTMLElement> {
  value?: any;
  defaultvalue?: any;
  class?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullwidth?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

interface PunicaToolbarProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  variant?: 'dense' | 'regular';
  disablegutters?: boolean;
}

interface PunicaColProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

interface PunicaRowProps extends React.HTMLAttributes<HTMLElement> {
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

interface PunicaMultiSelectListItemProps
  extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  value: string | number | Date;
}

interface PunicaTimePickerProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  open?: boolean;
}

interface PunicaTypographyProps extends React.HTMLAttributes<HTMLElement> {
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

interface PunicaToggleButtonProps extends React.HTMLAttributes<HTMLElement> {
  value: any;
  selected?: boolean;
  class?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success';
}

interface PunicaToggleButtonGroupProps
  extends React.HTMLAttributes<HTMLElement> {
  value?: any;
  defaultvalue?: any;
  class?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullwidth?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

interface PunicaToolbarProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  variant?: 'dense' | 'regular';
  disablegutters?: boolean;
}

interface PunicaColProps extends React.HTMLAttributes<HTMLElement> {
  class?: string;
  xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

interface PunicaRowProps extends React.HTMLAttributes<HTMLElement> {
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

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'punica-accordion': PunicaAccordionProps;
      'punica-accordion-summary': PunicaAccordionSummaryProps;
      'punica-accordion-details': PunicaAccordionDetailsProps;
      'punica-select': PunicaSelectProps;
      'punica-select-item': PunicaSelectItemProps;
      'punica-popover': PunicaPopoverProps;
      'punica-pagination': PunicaPaginationProps;
      'punica-button': PunicaButtonProps;
      'punica-button-group': PunicaButtonGroupProps;
      'punica-icon-button': PunicaIconButtonProps;
      'punica-avatar': PunicaAvatarProps;
      'punica-alert': PunicaAlertProps;
      'punica-alert-action': PunicaAlertActionProps;
      'punica-alert-icon': PunicaAlertIconProps;
      'punica-alert-content': PunicaAlertContentProps;
      'punica-app-bar': PunicaAppBarProps;
      'punica-badge': PunicaBadgeProps;
      'punica-chip': PunicaChipProps;
      'punica-input': PunicaInputProps;
      'punica-textarea': PunicaTextareaProps;
      'punica-container': PunicaContainerProps;
      'punica-hidden': PunicaHiddenProps;
      'punica-icon': PunicaIconProps;
      'punica-date-picker': PunicaDatePickerProps;
      'punica-drawer': PunicaDrawerProps;
      'punica-paper': PunicaPaperProps;
      'punica-split-button': PunicaSplitButtonProps;
      'punica-card': PunicaCardProps;
      'punica-card-media': PunicaCardMediaProps;
      'punica-card-content': PunicaCardContentProps;
      'punica-card-actions': PunicaCardActionsProps;
      'punica-box': PunicaBoxProps;
      'punica-tooltip': PunicaTooltipProps;
      'punica-divider': PunicaDividerProps;
      'punica-switch': PunicaSwitchProps;
      'punica-modal': PunicaModalProps;
      'punica-modal-header': PunicaModalHeaderProps;
      'punica-modal-content': PunicaModalContentProps;
      'punica-modal-footer': PunicaModalFooterProps;
      'punica-dialog': PunicaDialogProps;
      'punica-dialog-header': PunicaDialogHeaderProps;
      'punica-dialog-content': PunicaDialogContentProps;
      'punica-dialog-footer': PunicaDialogFooterProps;
      'punica-skeleton': PunicaSkeletonProps;
      'punica-checkbox': PunicaCheckboxProps;
      'punica-menu': PunicaMenuProps;
      'punica-menu-item': PunicaMenuItemProps;
      'punica-tab': PunicaTabProps;
      'punica-tab-item': PunicaTabItemProps;
      'punica-tab-panel': PunicaTabPanelProps;
      'punica-list-view': PunicaListViewProps;
      'punica-list-view-item': PunicaListViewItemProps;
      'punica-single-select-list': PunicaSingleSelectListProps;
      'punica-single-select-list-item': PunicaSingleSelectListItemProps;
      'punica-multi-select-list': PunicaMultiSelectListProps;
      'punica-multi-select-list-item': PunicaMultiSelectListItemProps;
      'punica-time-picker': PunicaTimePickerProps;
      'punica-typography': PunicaTypographyProps;
      'punica-toggle-button': PunicaToggleButtonProps;
      'punica-toggle-button-group': PunicaToggleButtonGroupProps;
      'punica-toolbar': PunicaToolbarProps;
      'punica-col': PunicaColProps;
      'punica-row': PunicaRowProps;
    }
  }
}

export {};
