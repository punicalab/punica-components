import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.toggleButton')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-toggle-button value="delete">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-grid" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="primary" selected>
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="secondary">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="error">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="info">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="success">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" color="warning">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-toggle-button value="delete" size="small">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" size="medium">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
                </punica-toggle-button>
              </punica-col>
              <punica-col>
                <punica-toggle-button value="delete" size="large">
                  <i slot="active" className="fa-duotone fa-trash" />
                  <i slot="passive" className="fa-duotone fa-trash" />
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
