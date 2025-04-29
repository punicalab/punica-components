import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.badge')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row wrap="nowrap" spacing={2}>
              <punica-col>
                <punica-badge size="medium" badgecontent={8} color="primary">
                  <i className="fa-duotone fa-envelope fa-xl" />
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge size="medium" badgecontent={10} color="error">
                  <i className="fa-duotone fa-envelope fa-xl" />
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge size="medium" badgecontent={8} color="success">
                  <i className="fa-duotone fa-envelope fa-xl" />
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge size="medium" badgecontent={8} color="info">
                  <i className="fa-duotone fa-envelope fa-xl" />
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge size="medium" badgecontent={8} color="warning">
                  <i className="fa-duotone fa-envelope fa-xl" />
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge size="small" badgecontent={8} color="error">
                  <i className="fa-duotone fa-envelope fa-xl" />
                </punica-badge>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
