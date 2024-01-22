export const Header = (props: IHeaderProps) => {
  const { title } = props;

  return (
    <div className="header">
      <punica-typography variant="headline4">{title}</punica-typography>
    </div>
  );
};

interface IHeaderProps {
  title: string;
}

Header.displayName = 'header';
