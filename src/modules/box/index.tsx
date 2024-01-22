import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.box')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row gap={16}>
              <punica-col>
                <punica-box style={{ padding: 32 }}>
                  <punica-button>Action</punica-button>
                </punica-box>
              </punica-col>
              <punica-col>
                <punica-box style={{ padding: 32 }} error>
                  <punica-button>Action Error</punica-button>
                </punica-box>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
