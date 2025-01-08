import { ReactNode } from 'react';

export const Content = (props: IContentProps) => {
  const { children } = props;

  return (
    <div className="content">
      <punica-container disablegutters>{children}</punica-container>
    </div>
  );
};

interface IContentProps {
  children: ReactNode;
}

Content.displayName = 'content';
