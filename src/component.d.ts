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
        size?: 'small' | 'medium' | 'large';
        class?: string;
        rounded?: boolean;
        disabled?: boolean;
        fullwidth?: boolean;
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
        minimumTargetWidth?: boolean;
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
        fullwidth?: boolean;
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
      };
      'punica-alert': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        variant?: 'standard' | 'filled' | 'outlined';
        severity?: 'error' | 'info' | 'warning' | 'success';
      };
      'punica-alert-action': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-alert-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-alert-content': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      'punica-app-bar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        fullwidth?: boolean;
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
      };
      'punica-textarea': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        placeholder?: string;
        fullwidth?: boolean;
        disabled?: boolean;
        error?: boolean;
        value?: string;
        rounded?: boolean;
        rows?: number;
      };
      'punica-container': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        maxwidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        disablegutters?: boolean;
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
      'punica-date-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        open?: boolean;
        value?: Date | string;
        timezone?: string;
        minDate?: Date | string;
        maxDate?: Date | string;
      };
      'punica-drawer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        size: 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge' | 'fullSize';
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
        fullwidth?: boolean;
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
        fullwidth?: boolean;
        fullheight?: boolean;
      };
      'punica-divider': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        flexItem?: boolean;
        orientation?: 'horizontal' | 'vertical';
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
        width: number | string;
        height: number | string;
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
      > & { class?: string; open: boolean; rounded?: boolean; width?: number };
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
        disabled?: boolean;
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
        fullwidth?: boolean;
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
        selectedvalue: string | number;
      };
      'punica-list-view': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        enabledivider?: boolean;
      };
      'punica-list-view-item': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
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
      'punica-time-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        open?: boolean;
      };
      'punica-typography': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        truncate?: number;
        textalign?: 'left' | 'right' | 'center' | 'justify';
        whitespace?: 'nowrap' | 'nowrap' | 'pre-line' | 'pre-wrap';
        fontweight?:
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
        value?: any;
        class?: string;
        size?: 'small' | 'medium' | 'large';
        disabled?: boolean;
        fullwidth?: boolean;
        fullwidth?: boolean;
        orientation?: 'horizontal' | 'vertical';
      };
      'punica-toolbar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        variant?: 'dense' | 'regular';
        disablegutters?: boolean;
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
      };
    }
  }
}

export {};
