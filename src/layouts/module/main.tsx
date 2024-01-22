import { ReactNode, useMemo } from 'react';

export const Main = (props: IMainProps) => {
  const { children } = props;

  /**
   *
   */
  const childMap = useMemo(() => {
    const map = {};

    children.forEach((c) => {
      //@ts-ignore
      map[c.type.displayName] = c;
    });

    return map;
  }, [children]);

  return (
    <div className="module">
      {childMap['header']}
      {childMap['content']}
    </div>
  );
};

interface IMainProps {
  children: Array<ReactNode>;
}

Main.displayName = 'main';
