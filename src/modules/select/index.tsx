import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';
import { Advanced, Basic, Rounded, Size } from './variants';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.select')} />
      <Layout.Content>
        <punica-row spacing={3}>
          <punica-col xs={12}>
            <Basic />
          </punica-col>
          <punica-col xs={12}>
            <Advanced />
          </punica-col>
          <punica-col xs={12}>
            <Rounded />
          </punica-col>
          <punica-col xs={12}>
            <Size />
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
