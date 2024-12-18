import { ReactNode } from 'react';

export const Example = (props: IHeaderProps) => {
  const { children } = props;

  return (
    <punica-row
      justifycontent="center"
      alignitems="center"
      style={{ minHeight: '100px' }}
    >
      <punica-col>{children}</punica-col>
    </punica-row>
  );
};

interface IHeaderProps {
  children: ReactNode | Array<ReactNode>;
}

Example.displayName = 'example';
