import useEventListener from '@/hooks/useEventListener';
import { Module as Layout } from '@/layouts/module';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [open, setOpen] = useState(null);

  /**
   *
   */
  useEventListener(
    'onClose',
    () => {
      setOpen(false);
    },
    ref.current
  );

  /**
   *
   */
  const handleClick = () => {
    setOpen(true);
  };

  /**
   *
   */
  const hanldeMenuClick = () => {
    setOpen(false);
  };

  return (
    <Layout.Main>
      <Layout.Header title={t('component.menu')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12} style={{ position: 'relative' }}>
            <punica-icon-button size="small" onClick={handleClick}>
              <punica-icon>
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </punica-icon>
            </punica-icon-button>
            <punica-menu open={open} ref={ref}>
              <punica-menu-item onClick={hanldeMenuClick}>
                Menu Item 1
              </punica-menu-item>
              <punica-menu-item onClick={hanldeMenuClick}>
                Menu Item 2
              </punica-menu-item>
              <punica-menu-item onClick={hanldeMenuClick}>
                Menu Item 3
              </punica-menu-item>
              <punica-menu-item onClick={hanldeMenuClick}>
                Menu Item 4
              </punica-menu-item>
              <punica-menu-item onClick={hanldeMenuClick}>
                Menu Item 5
              </punica-menu-item>
              <punica-menu-item onClick={hanldeMenuClick}>
                Menu Item 6
              </punica-menu-item>
            </punica-menu>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
