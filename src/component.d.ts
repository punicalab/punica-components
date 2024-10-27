declare global {
  namespace JSX {
    interface IntrinsicElements {
      'punica-accordion': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        expanded: boolean;
        rounded?: boolean;
        class?: string;
      };
      'punica-accordion-summary': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-accordion-details': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-select': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number | Date;
        class?: string;
        rounded?: boolean;
        fullWidth?: boolean;
      };
      'punica-select-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number | Date;
        class?: string;
      };
      'punica-popover': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        open: boolean;
        left: number;
        top: number;
        bottom: number;
        width: number;
        height: number;
        placement: 'top' | 'left' | 'right' | 'bottom';
      };
      'punica-pagination': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        page: number;
        totalCount: number;
        size?: number;
      };
      'punica-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        size?: 'small' | 'medium' | 'large';
        variant?: 'text' | 'filled' | 'outlined';
        fullWidth?: boolean;
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
      };
      'punica-button-group': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        fullWidth?: boolean;
      };
      'punica-icon-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        size?: 'xsmall' | 'small' | 'medium' | 'large';
        loading?: boolean;
        disabled?: boolean;
        color?:
          | 'primary'
          | 'secondary'
          | 'error'
          | 'info'
          | 'warning'
          | 'success';
      };
      'punica-avatar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        variant?: 'circular' | 'rounded' | 'square';
        color?: ('error' | 'info' | 'warning' | 'success') | string;
      };
      'punica-alert': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        variant?: 'standard' | 'filled' | 'outlined';
        severity?: 'error' | 'info' | 'warning' | 'success';
      };
      'punica-alert-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-alert-title': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-alert-description': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-badge': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        color?: 'primary' | 'error' | 'info' | 'warning' | 'success';
        size?: 'small' | 'large';
        badgeContent?: number;
        max?: number;
      };
      'punica-chip': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        size?: 'small' | 'medium';
        variant?: 'filled' | 'outlined';
        color?:
          | 'default'
          | 'primary'
          | 'error'
          | 'info'
          | 'warning'
          | 'success';
      };
      'punica-input': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        placeholder?: string;
        fullWidth?: boolean;
        disabled?: boolean;
        rounded?: boolean;
        error?: boolean;
        startAdornment?: HTMLElement;
        endAdornment?: HTMLElement;
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
      };
      'punica-textarea': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        placeholder?: string;
        fullWidth?: boolean;
        disabled?: boolean;
        error?: boolean;
        value?: string;
      };
      'punica-container': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        disableGutters?: boolean;
      };
      'punica-hidden': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        breakPoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        direction: 'up' | 'down';
      };
      'punica-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge';
        color?:
          | 'default'
          | 'primary'
          | 'error'
          | 'info'
          | 'warning'
          | 'success';
      };
      'punica-drawer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        size: 'small' | 'medium' | 'large' | 'xlarge';
        direction?: 'top' | 'left' | 'bottom' | 'right';
        open?: boolean;
      };
      'punica-paper': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        rounded?: boolean;
        class?: string;
      };
      'punica-split-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        rounded?: boolean;
        fullWidth?: boolean;
      };
      'punica-card-media': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-card-content': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-card-actions': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-box': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        rounded?: boolean;
        error?: boolean;
        border?: boolean;
        fullWidth?: boolean;
        fullHeight?: boolean;
      };
      'punica-divider': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-switch': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-modal': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        rounded?: boolean;
        open: boolean;
        width: number;
        height: number;
      };
      'punica-modal-header': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string };
      'punica-modal-content': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string };
      'punica-modal-footer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string };
      'punica-dialog': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string; open: boolean; rounded?: boolean };
      'punica-dialog-header': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string };
      'punica-dialog-content': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string };
      'punica-dialog-footer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string };
      'punica-skeleton': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        variant: 'text' | 'circular' | 'rectangular';
        width: string;
        height: string;
        rounded?: boolean;
      };
      'punica-checkbox': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        checked?: boolean;
        indeterminate?: boolean;
        label?: string;
      };
      'punica-menu': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        open: boolean;
        left: number;
        top: number;
        bottom: number;
        width: number;
        height: number;
        placement: 'top' | 'left' | 'right' | 'bottom';
      };
      'punica-menu-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        disabled?: boolean;
      };
      'punica-tab': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        orientation: 'horizontal' | 'vertical';
        fullWidth?: boolean;
        disabled?: boolean;
        value?: string;
      };
      'punica-tab-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        value: string | number;
      };
      'punica-tab-panel': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        value: string | number;
        selectedValue: string | number;
      };
      'punica-single-select-list': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        value: string | number | Date;
      };
      'punica-single-select-list-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        value: string | number | Date;
      };
      'punica-multi-select-list': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        value: Array<string | number | Date>;
      };
      'punica-multi-select-list-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        value: string | number | Date;
      };
      'punica-typography': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        truncate?: number;
        gutterBottom?: boolean;
        textAlign?: 'left' | 'right' | 'center' | 'justify';
        whiteSpace?: 'nowrap' | 'nowrap' | 'pre-line' | 'pre-wrap';
        fontWeight?:
          | 'thin'
          | 'regular'
          | 'medium'
          | 'semi-bold'
          | 'bold'
          | 'extra-bold';
        color?:
          | (
              | 'primary'
              | 'secondary'
              | 'error'
              | 'warning'
              | 'info'
              | 'success'
              | 'white'
            )
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
      };
      'punica-toggle-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: any;
        selected?: boolean;
        class?: string;
        size?: 'xsmall' | 'small' | 'medium' | 'large';
        disabled?: boolean;
        color?:
          | 'primary'
          | 'secondary'
          | 'error'
          | 'info'
          | 'warning'
          | 'success';
      };
      'punica-toggle-button-group': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: string;
        class?: string;
        size?: 'small' | 'medium' | 'large';
        disabled?: boolean;
        color?:
          | 'primary'
          | 'secondary'
          | 'error'
          | 'info'
          | 'warning'
          | 'success'
          | 'ghost';
        fullWidth?: boolean;
      };
      'punica-col': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
      };
      'punica-row': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        fullHeight?: boolean;
        wrap?: 'nowrap' | 'wrap-reverse' | 'wrap';
        direction?: 'column-reverse' | 'column' | 'row-reverse' | 'row';
        spacing?: 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 36 | 48 | 96;
        gap?: 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 36 | 48 | 96;
        justifyItems?:
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
        justifyContent?:
          | 'flex-start'
          | 'flex-end'
          | 'center'
          | 'space-between'
          | 'space-around'
          | 'space-evenly'
          | 'initial'
          | 'inherit';
        alignContent?:
          | 'stretch'
          | 'center'
          | 'flex-start'
          | 'flex-end'
          | 'space-between'
          | 'space-around'
          | 'initial'
          | 'inherit';
        alignItems?:
          | 'stretch'
          | 'center'
          | 'flex-start'
          | 'flex-end'
          | 'baseline'
          | 'initial'
          | 'inherit';
      };
    }
  }
}

export {};
