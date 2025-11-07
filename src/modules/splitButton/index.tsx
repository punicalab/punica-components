import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.splitButton')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-split-button
              placement="bottom"
              variant="filled"
              color="primary"
              rounded
            >
              <span slot="label">Actions</span>

              <punica-menu>
                <punica-menu-item data-item='{"id":1}'>
                  Menu Item 1
                </punica-menu-item>
                <punica-menu-item data-item='{"id":2}'>
                  Menu Item 2
                </punica-menu-item>
                <punica-menu-item data-item='{"id":3}'>
                  Menu Item 3
                </punica-menu-item>
                <punica-menu-item data-item='{"id":4}'>
                  Menu Item 4
                </punica-menu-item>
                <punica-menu-item data-item='{"id":5}'>
                  Menu Item 5
                </punica-menu-item>
                <punica-menu-item data-item='{"id":6}'>
                  Menu Item 6
                </punica-menu-item>
              </punica-menu>
            </punica-split-button>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
