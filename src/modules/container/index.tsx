import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.container')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-container maxwidth="sm">Max Width - SM</punica-container>
          </punica-col>
          <punica-col xs={12}>
            <punica-container maxwidth="md">Max Width - MD</punica-container>
          </punica-col>
          <punica-col xs={12}>
            <punica-container maxwidth="lg">Max Width - LG</punica-container>
          </punica-col>
          <punica-col xs={12}>
            <punica-container maxwidth="xl">Max Width - XL</punica-container>
          </punica-col>
          <punica-col xs={12}>
            <punica-container maxwidth="xl" disablegutters>
              Max Width - XL & disablegutters
            </punica-container>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
