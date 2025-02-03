import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.hidden')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2} wrap="nowrap">
              <punica-col>
                <punica-icon>
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon color="error">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon color="info">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon color="primary">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon color="success">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon color="warning">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={2} wrap="nowrap">
              <punica-col>
                <punica-icon size="xsmall">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon size="small">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon size="medium">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon size="large">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon size="xlarge">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
              <punica-col>
                <punica-icon size="2xlarge">
                  <i className="fa-duotone fa-house" />
                </punica-icon>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
