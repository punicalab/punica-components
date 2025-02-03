import { ReactNode, cloneElement, useMemo } from 'react';

export const Main = (props: IMainProps) => {
  const { id, children } = props;

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
    <punica-row id={id} direction="column" spacing={1.5}>
      <punica-col xs={12}>
        {cloneElement(childMap['header'], {
          link: id
        })}
      </punica-col>
      <punica-col xs={12}>{childMap['subHeader']}</punica-col>
      <punica-col xs={12}>
        <punica-box
          style={{
            borderRadius: 'var(--spacing-4)',
            background: 'white',
            width: '100%'
          }}
        >
          <punica-row direction="column" spacing={1.5}>
            <punica-col>{childMap['example']}</punica-col>
            <punica-col>{childMap['code']}</punica-col>
          </punica-row>
        </punica-box>
      </punica-col>
    </punica-row>
  );
};

interface IMainProps {
  children: Array<ReactNode>;
  id: string;
}

Main.displayName = 'main';
