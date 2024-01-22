import { ReactNode } from 'react';

export const Example = (props: IHeaderProps) => {
  const { children } = props;

  return (
    <punica-row
      justifyContent="center"
      alignItems="center"
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
