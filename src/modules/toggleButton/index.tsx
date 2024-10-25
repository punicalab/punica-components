import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.toggleButton')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row gap={16}>
              <punica-col>
                <punica-toggle-button value="delete" disabled>
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="primary" selected>
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="secondary">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="error">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="info">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="success">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="warning">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-row gap={16}>
              <punica-col>
                <punica-toggle-button value="delete" size="small">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" size="medium">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" size="large">
                  <i className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
