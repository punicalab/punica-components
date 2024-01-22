export const Header = (props: IHeaderProps) => {
  const { link, children } = props;

  return (
    <punica-row wrap="nowrap" alignItems="center" gap={4}>
      <punica-col>
        <punica-typography variant="headline5">{children}</punica-typography>
      </punica-col>
      {link ? (
        <punica-col>
          <a href={`#${link}`}>
            <punica-icon>
              <i className="fa-regular fa-link"></i>
            </punica-icon>
          </a>
        </punica-col>
      ) : (
        <></>
      )}
    </punica-row>
  );
};

interface IHeaderProps {
  children: string;
  link?: string;
}

Header.displayName = 'header';
