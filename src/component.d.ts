declare global {
  namespace JSX {
    interface IntrinsicElements {
      'punica-accordion': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        expanded: boolean;
        rounded?: boolean;
      };
      'punica-accordion-summary': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'punica-accordion-details': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'punica-select': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number | Date;
      };
      'punica-select-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number | Date;
      };
      'punica-popover': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        page: number;
        totalCount: number;
        size?: number;
      };
      'punica-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        size?: 'small' | 'medium' | 'large';
        variant?: 'text' | 'filled' | 'outlined';
        fullWidth?: boolean;
        loading?: boolean;
        underline?: boolean;
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
      'punica-icon-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        variant?: 'circular' | 'rounded' | 'square';
        color?: 'error' | 'info' | 'warning' | 'success';
      };
      'punica-alert': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: 'filled' | 'outlined';
        severity?: 'error' | 'info' | 'warning' | 'success';
      };
      'punica-badge': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        color?: 'primary' | 'error' | 'info' | 'warning' | 'success';
        size?: 'small' | 'large';
        badgeContent?: number;
        max?: number;
      };
      'punica-chip': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        placeholder?: string;
        fullWidth?: boolean;
        disabled?: boolean;
        error?: boolean;
        startAdornment?: HTMLElement;
        endAdornment?: HTMLElement;
        value?: string;
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
        maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        disableGutters?: boolean;
      };
      'punica-hidden': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        breakPoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        direction: 'up' | 'down';
      };
      'punica-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        size: 'small' | 'medium' | 'large' | 'xlarge';
        direction?: 'top' | 'left' | 'bottom' | 'right';
        open?: boolean;
      };
      'punica-paper': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        rounded?: boolean;
      };
      'punica-split-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'punica-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'punica-box': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        rounded?: boolean;
        error?: boolean;
        border?: boolean;
        fullWidth?: boolean;
        fullHeight?: boolean;
      };
      'punica-divider': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'punica-switch': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'punica-modal': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { open: boolean; width: number; height: number };
      'punica-dialog': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { open: boolean };
      'punica-skeleton': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant: 'text' | 'circular' | 'rectangular';
        width: string;
        height: string;
        rounded?: boolean;
      };
      'punica-checkbox': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        checked?: boolean;
        indeterminate?: boolean;
        label?: string;
      };
      'punica-menu': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
      > & { disabled?: boolean };
      'punica-tab': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        orientation: 'horizontal' | 'vertical';
        fullWidth?: boolean;
        disabled?: boolean;
        value?: string;
      };
      'punica-tab-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number;
      };
      'punica-tab-panel': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number;
        selectedValue: string | number;
      };
      'punica-single-select-list': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number | Date;
      };
      'punica-single-select-list-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number | Date;
      };
      'punica-multi-select-list': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: Array<string | number | Date>;
      };
      'punica-multi-select-list-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string | number | Date;
      };
      'punica-typography': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
      'punica-col': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
