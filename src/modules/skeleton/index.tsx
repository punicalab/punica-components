import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.skeleton')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-skeleton variant="circular" width="100px" height="100px" />
          </punica-col>
          <punica-col xs={12}>
            <punica-skeleton
              variant="rectangular"
              width="100px"
              height="20px"
            />
          </punica-col>
          <punica-col xs={12}>
            <punica-skeleton variant="text" width="100px" height="20px" />
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
