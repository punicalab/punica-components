import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.badge')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row wrap="nowrap" gap={16}>
              <punica-col>
                <punica-badge badgeContent={8}>
                  <i className="fa-duotone fa-envelope fa-xl"></i>
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge badgeContent={10} color="error">
                  <i className="fa-duotone fa-envelope fa-xl"></i>
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge badgeContent={8} color="success">
                  <i className="fa-duotone fa-envelope fa-xl"></i>
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge badgeContent={8} color="info">
                  <i className="fa-duotone fa-envelope fa-xl"></i>
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge badgeContent={8} color="warning">
                  <i className="fa-duotone fa-envelope fa-xl"></i>
                </punica-badge>
              </punica-col>
              <punica-col>
                <punica-badge badgeContent={8} color="error" size="small">
                  <i className="fa-duotone fa-envelope fa-xl"></i>
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
