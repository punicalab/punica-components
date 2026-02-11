/**
 * React-specific TypeScript definitions for Punica Components
 *
 * This file extends the framework-agnostic base types with React-specific
 * features such as JSX support, React event handlers, and React-specific props.
 *
 * Supports React 18 and React 19.
 *
 * @see ./index.d.ts for base framework-agnostic types
 */

/// <reference types="react" />
/// <reference path="./index.d.ts" />

import * as React from 'react';

// Import base attribute types
import type {
  PunicaAccordionAttributes,
  PunicaAgendaAttributes,
  PunicaAccordionSummaryAttributes,
  PunicaAccordionDetailsAttributes,
  PunicaSelectAttributes,
  PunicaSelectItemAttributes,
  PunicaPopoverAttributes,
  PunicaPaginationAttributes,
  PunicaButtonAttributes,
  PunicaButtonGroupAttributes,
  PunicaIconButtonAttributes,
  PunicaAvatarAttributes,
  PunicaAlertAttributes,
  PunicaAlertActionAttributes,
  PunicaAlertIconAttributes,
  PunicaAlertContentAttributes,
  PunicaAppBarAttributes,
  PunicaBadgeAttributes,
  PunicaChipAttributes,
  PunicaInputAttributes,
  PunicaTextareaAttributes,
  PunicaContainerAttributes,
  PunicaHiddenAttributes,
  PunicaIconAttributes,
  PunicaDatePickerAttributes,
  PunicaDrawerAttributes,
  PunicaPaperAttributes,
  PunicaSplitButtonAttributes,
  PunicaCardAttributes,
  PunicaCardHeaderAttributes,
  PunicaCardMediaAttributes,
  PunicaCardContentAttributes,
  PunicaCardActionsAttributes,
  PunicaBoxAttributes,
  PunicaTooltipAttributes,
  PunicaDividerAttributes,
  PunicaSwitchAttributes,
  PunicaModalAttributes,
  PunicaModalHeaderAttributes,
  PunicaModalContentAttributes,
  PunicaModalFooterAttributes,
  PunicaDialogAttributes,
  PunicaDialogHeaderAttributes,
  PunicaDialogContentAttributes,
  PunicaDialogFooterAttributes,
  PunicaSkeletonAttributes,
  PunicaCheckboxAttributes,
  PunicaMenuAttributes,
  PunicaMenuItemAttributes,
  PunicaTabAttributes,
  PunicaTabItemAttributes,
  PunicaTabPanelAttributes,
  PunicaListViewAttributes,
  PunicaListViewItemAttributes,
  PunicaSingleSelectListAttributes,
  PunicaSingleSelectListItemAttributes,
  PunicaMultiSelectListAttributes,
  PunicaMultiSelectListItemAttributes,
  PunicaTimePickerAttributes,
  PunicaTypographyAttributes,
  PunicaToggleButtonAttributes,
  PunicaToggleButtonGroupAttributes,
  PunicaToolbarAttributes,
  PunicaColAttributes,
  PunicaRowAttributes,
  PunicaToastAttributes,
  PunicaToasterAttributes,
  PunicaProgressLineAttributes,
  PunicaSplitAttributes,
  PunicaContextMenuAttributes,
  PunicaContextMenuItemAttributes,
  PunicaContextMenuSeparatorAttributes,
  PunicaVirtualListAttributes,
  PunicaVirtualTableAttributes,
  PunicaQrCodeAttributes
} from './index';

// React props interfaces extending base attributes with React-specific features
type ReactProps<T> = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> &
  T;

interface PunicaAccordionProps extends ReactProps<PunicaAccordionAttributes> {
  key?: string | number;
  ref?: React.Ref<HTMLElement>;
}

interface PunicaAgendaProps extends ReactProps<PunicaAgendaAttributes> {
  key?: string | number;
  ref?: React.Ref<HTMLElement>;
}

interface PunicaAccordionSummaryProps
  extends ReactProps<PunicaAccordionSummaryAttributes> {
  key?: string | number;
  ref?: React.Ref<HTMLElement>;
}

interface PunicaAccordionDetailsProps
  extends ReactProps<PunicaAccordionDetailsAttributes> {
  key?: string | number;
  ref?: React.Ref<HTMLElement>;
}

interface PunicaSelectProps extends ReactProps<PunicaSelectAttributes> {
  key?: string | number;
  ref?: React.Ref<HTMLElement>;
}

interface PunicaSelectItemProps
  extends ReactProps<PunicaSelectItemAttributes> {}

interface PunicaPopoverProps extends ReactProps<PunicaPopoverAttributes> {}

interface PunicaPaginationProps
  extends ReactProps<PunicaPaginationAttributes> {}

interface PunicaButtonProps extends ReactProps<PunicaButtonAttributes> {}

interface PunicaButtonGroupProps
  extends ReactProps<PunicaButtonGroupAttributes> {}

interface PunicaIconButtonProps
  extends ReactProps<PunicaIconButtonAttributes> {}

interface PunicaAvatarProps extends ReactProps<PunicaAvatarAttributes> {}

interface PunicaAlertProps extends ReactProps<PunicaAlertAttributes> {}

interface PunicaAlertActionProps
  extends ReactProps<PunicaAlertActionAttributes> {}

interface PunicaAlertIconProps extends ReactProps<PunicaAlertIconAttributes> {}

interface PunicaAlertContentProps
  extends ReactProps<PunicaAlertContentAttributes> {}

interface PunicaAppBarProps extends ReactProps<PunicaAppBarAttributes> {}

interface PunicaBadgeProps extends ReactProps<PunicaBadgeAttributes> {}

interface PunicaChipProps extends ReactProps<PunicaChipAttributes> {}

interface PunicaInputProps extends ReactProps<PunicaInputAttributes> {}

interface PunicaTextareaProps extends ReactProps<PunicaTextareaAttributes> {}

interface PunicaContainerProps extends ReactProps<PunicaContainerAttributes> {}

interface PunicaHiddenProps extends ReactProps<PunicaHiddenAttributes> {}

interface PunicaIconProps extends ReactProps<PunicaIconAttributes> {}

interface PunicaDatePickerProps
  extends ReactProps<PunicaDatePickerAttributes> {}

interface PunicaDrawerProps extends ReactProps<PunicaDrawerAttributes> {}

interface PunicaPaperProps extends ReactProps<PunicaPaperAttributes> {}

interface PunicaSplitButtonProps
  extends ReactProps<PunicaSplitButtonAttributes> {}

interface PunicaCardProps extends ReactProps<PunicaCardAttributes> {}

interface PunicaCardHeaderProps
  extends ReactProps<PunicaCardHeaderAttributes> {}

interface PunicaCardMediaProps extends ReactProps<PunicaCardMediaAttributes> {}

interface PunicaCardContentProps
  extends ReactProps<PunicaCardContentAttributes> {}

interface PunicaCardActionsProps
  extends ReactProps<PunicaCardActionsAttributes> {}

interface PunicaBoxProps extends ReactProps<PunicaBoxAttributes> {}

interface PunicaTooltipProps extends ReactProps<PunicaTooltipAttributes> {}

interface PunicaDividerProps extends ReactProps<PunicaDividerAttributes> {}

interface PunicaSwitchProps extends ReactProps<PunicaSwitchAttributes> {}

interface PunicaModalProps extends ReactProps<PunicaModalAttributes> {}

interface PunicaModalHeaderProps
  extends ReactProps<PunicaModalHeaderAttributes> {}

interface PunicaModalContentProps
  extends ReactProps<PunicaModalContentAttributes> {}

interface PunicaModalFooterProps
  extends ReactProps<PunicaModalFooterAttributes> {}

interface PunicaDialogProps extends ReactProps<PunicaDialogAttributes> {}

interface PunicaDialogHeaderProps
  extends ReactProps<PunicaDialogHeaderAttributes> {}

interface PunicaDialogContentProps
  extends ReactProps<PunicaDialogContentAttributes> {}

interface PunicaDialogFooterProps
  extends ReactProps<PunicaDialogFooterAttributes> {}

interface PunicaSkeletonProps extends ReactProps<PunicaSkeletonAttributes> {}

interface PunicaCheckboxProps extends ReactProps<PunicaCheckboxAttributes> {}

interface PunicaMenuProps extends ReactProps<PunicaMenuAttributes> {}

interface PunicaMenuItemProps extends ReactProps<PunicaMenuItemAttributes> {}

interface PunicaTabProps extends ReactProps<PunicaTabAttributes> {}

interface PunicaTabItemProps extends ReactProps<PunicaTabItemAttributes> {}

interface PunicaTabPanelProps extends ReactProps<PunicaTabPanelAttributes> {}

interface PunicaListViewProps extends ReactProps<PunicaListViewAttributes> {}

interface PunicaListViewItemProps
  extends ReactProps<PunicaListViewItemAttributes> {}

interface PunicaSingleSelectListProps
  extends ReactProps<PunicaSingleSelectListAttributes> {}

interface PunicaSingleSelectListItemProps
  extends ReactProps<PunicaSingleSelectListItemAttributes> {}

interface PunicaMultiSelectListProps
  extends ReactProps<PunicaMultiSelectListAttributes> {}

interface PunicaMultiSelectListItemProps
  extends ReactProps<PunicaMultiSelectListItemAttributes> {}

interface PunicaTimePickerProps
  extends ReactProps<PunicaTimePickerAttributes> {}

interface PunicaTypographyProps
  extends ReactProps<PunicaTypographyAttributes> {}

interface PunicaToggleButtonProps
  extends ReactProps<PunicaToggleButtonAttributes> {}

interface PunicaToggleButtonGroupProps
  extends ReactProps<PunicaToggleButtonGroupAttributes> {}

interface PunicaToolbarProps extends ReactProps<PunicaToolbarAttributes> {}

interface PunicaColProps extends ReactProps<PunicaColAttributes> {}

interface PunicaRowProps extends ReactProps<PunicaRowAttributes> {}

interface PunicaToastProps extends ReactProps<PunicaToastAttributes> {}

interface PunicaToasterProps extends ReactProps<PunicaToasterAttributes> {}

interface PunicaProgressLineProps
  extends ReactProps<PunicaProgressLineAttributes> {}

interface PunicaSplitProps extends ReactProps<PunicaSplitAttributes> {}

interface PunicaContextMenuProps
  extends ReactProps<PunicaContextMenuAttributes> {}

interface PunicaContextMenuItemProps
  extends ReactProps<PunicaContextMenuItemAttributes> {}

interface PunicaContextMenuSeparatorProps
  extends ReactProps<PunicaContextMenuSeparatorAttributes> {}

interface PunicaVirtualListProps
  extends ReactProps<PunicaVirtualListAttributes> {}

interface PunicaVirtualTableProps
  extends ReactProps<PunicaVirtualTableAttributes> {}

interface PunicaQrCodeProps extends ReactProps<PunicaQrCodeAttributes> {}

// React 18 JSX namespace augmentation
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'punica-accordion': PunicaAccordionProps;
      'punica-agenda': PunicaAgendaProps;
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
      'punica-card-header': PunicaCardHeaderProps;
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
      'punica-toast': PunicaToastProps;
      'punica-toaster': PunicaToasterProps;
      'punica-progress-line': PunicaProgressLineProps;
      'punica-split': PunicaSplitProps;
      'punica-context-menu': PunicaContextMenuProps;
      'punica-context-menu-item': PunicaContextMenuItemProps;
      'punica-context-menu-separator': PunicaContextMenuSeparatorProps;
      'punica-virtual-list': PunicaVirtualListProps;
      'punica-virtual-table': PunicaVirtualTableProps;
      'punica-qr-code': PunicaQrCodeProps;
    }
  }
}

// React 19 JSX runtime namespace augmentation
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
      'punica-card-header': PunicaCardHeaderProps;
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
      'punica-toast': PunicaToastProps;
      'punica-toaster': PunicaToasterProps;
      'punica-progress-line': PunicaProgressLineProps;
      'punica-split': PunicaSplitProps;
      'punica-context-menu': PunicaContextMenuProps;
      'punica-context-menu-item': PunicaContextMenuItemProps;
      'punica-context-menu-separator': PunicaContextMenuSeparatorProps;
      'punica-virtual-list': PunicaVirtualListProps;
      'punica-virtual-table': PunicaVirtualTableProps;
      'punica-qr-code': PunicaQrCodeProps;
    }
  }
}

export {};
