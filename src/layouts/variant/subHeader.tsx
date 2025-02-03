export const SubHeader = (props: ISubHeaderProps) => {
  const { children } = props;

  return (
    <punica-row wrap="nowrap" alignitems="center" spacing={0.5}>
      <punica-col>
        <punica-typography variant="body2">{children}</punica-typography>
      </punica-col>
    </punica-row>
  );
};

interface ISubHeaderProps {
  children: string;
}

SubHeader.displayName = 'subHeader';
