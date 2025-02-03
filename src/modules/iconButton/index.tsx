import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.iconButton')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-icon-button>
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button color="primary">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button color="secondary">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button color="error">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button color="info">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button color="success">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button color="warning">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-icon-button size="small">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button size="medium">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
              <punica-col>
                <punica-icon-button size="large">
                  <i className="fa-duotone fa-trash" />
                </punica-icon-button>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
