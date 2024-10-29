import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.appBar')} />
      <Layout.Content>
        <punica-row gap={16} style={{ height: '1500px' }}>
          <punica-col xs={12}>
            <punica-app-bar color="primary" position="sticky">
              <punica-toolbar>
                <punica-icon-button style={{ marginRight: 16 }}>
                  <i className="fa-duotone fa-bars" />
                </punica-icon-button>
                <punica-typography style={{ flexGrow: 1 }}>
                  News
                </punica-typography>
                <punica-toggle-button value="delete">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
                <punica-toggle-button value="delete">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
                <punica-button>Login</punica-button>
              </punica-toolbar>
            </punica-app-bar>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
