export const SubHeader = (props: ISubHeaderProps) => {
  const { children } = props;

  return (
    <punica-row wrap="nowrap" alignItems="center" gap={4}>
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
