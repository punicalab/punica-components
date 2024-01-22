import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.button')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row gap={16}>
              <punica-col>
                <punica-button>Button Primary</punica-button>
              </punica-col>
              <punica-col>
                <punica-button variant="outlined">
                  Button Outlined
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button color="secondary">
                  Button Color Secondary
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button color="error">Button Color Error</punica-button>
              </punica-col>
              <punica-col>
                <punica-button color="info">Button Color Info</punica-button>
              </punica-col>
              <punica-col>
                <punica-button color="success">
                  Button Color Success
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button color="warning">
                  Button Color Warning
                </punica-button>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-row gap={16}>
              <punica-col>
                <punica-button size="small">Small</punica-button>
              </punica-col>
              <punica-col>
                <punica-button size="medium">Medium</punica-button>
              </punica-col>
              <punica-col>
                <punica-button size="large">Large</punica-button>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
