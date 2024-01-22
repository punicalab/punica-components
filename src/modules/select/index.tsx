import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';
import { Advanced, Basic } from './variants';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.select')} />
      <Layout.Content>
        <punica-row gap={24}>
          <punica-col xs={12}>
            <Basic />
          </punica-col>
          <punica-col xs={12}>
            <Advanced />
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
