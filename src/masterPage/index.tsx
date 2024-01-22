import { SiteMap } from '@/siteMap';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MainMasterPage = (props: { children: ReactNode }) => {
  const { children } = props;
  const { t } = useTranslation();

  return (
    <main className="main-layout">
      <nav className="navigation">
        <section className="logo">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'master-sidebar-item-active' : ''
            }
          >
            <img src="/assets/logo.svg" width="45px" />
          </NavLink>
        </section>
        <section className="menu pt-24 pb-24">
          <punica-row direction="column" alignItems="center">
            {SiteMap[0].children.map((site, index) => (
              <NavLink
                key={index}
                to={site.path}
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <punica-typography key={index} style={{ paddingLeft: '8px' }}>
                  {t(site.translateKey)}
                </punica-typography>
              </NavLink>
            ))}
          </punica-row>
        </section>
      </nav>
      <section className="content">
        <punica-container maxWidth="lg">{children}</punica-container>
      </section>
    </main>
  );
};

export default MainMasterPage;
