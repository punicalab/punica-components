import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.button')} />
      <Layout.Content>
        <punica-button rounded variant="outlined" size="medium" color="primary">
          Button Outlined
        </punica-button>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-button rounded variant="text" size="medium">
                  Text Button Primary
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                >
                  Button Primary
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  variant="outlined"
                  size="medium"
                  color="primary"
                >
                  Button Outlined
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  color="secondary"
                  size="small"
                  variant="filled"
                >
                  Button Color Secondary
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  color="error"
                  size="small"
                  variant="filled"
                >
                  Button Color Error
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  color="info"
                  size="small"
                  variant="filled"
                >
                  Button Color Info
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  color="success"
                  size="small"
                  variant="filled"
                >
                  Button Color Success
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  color="warning"
                  size="small"
                  variant="filled"
                >
                  Button Color Warning
                </punica-button>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-button size="small" color="primary" variant="filled">
                  Small
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button size="medium" color="primary" variant="filled">
                  Medium
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button size="large" color="primary" variant="filled">
                  Large
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  size="large"
                  color="primary"
                  variant="filled"
                  disabled
                >
                  Disabled
                </punica-button>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
