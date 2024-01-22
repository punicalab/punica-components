import { CopyBlock, dracula } from 'react-code-blocks';

export const Code = (props: IHeaderProps) => {
  const { children } = props;

  return (
    <CopyBlock
      text={children}
      language="html"
      theme={dracula}
      // @ts-ignore
      copied="true"
    />
  );
};

interface IHeaderProps {
  children: string;
}

Code.displayName = 'code';
