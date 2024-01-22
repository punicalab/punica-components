import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.hidden')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-hidden direction="down" breakPoint="sm">
              <punica-typography>SM - DOWN</punica-typography>
            </punica-hidden>
            <punica-hidden direction="up" breakPoint="sm">
              SM - UP
            </punica-hidden>
          </punica-col>
          <punica-col xs={12}>
            <punica-hidden direction="down" breakPoint="md">
              <punica-typography>MD - DOWN</punica-typography>
            </punica-hidden>
            <punica-hidden direction="up" breakPoint="md">
              MD - UP
            </punica-hidden>
          </punica-col>
          <punica-col xs={12}>
            <punica-hidden direction="down" breakPoint="lg">
              <punica-typography>LG - DOWN</punica-typography>
            </punica-hidden>
            <punica-hidden direction="up" breakPoint="lg">
              LG - UP
            </punica-hidden>
          </punica-col>
          <punica-col xs={12}>
            <punica-hidden direction="down" breakPoint="xl">
              <punica-typography>XL - DOWN</punica-typography>
            </punica-hidden>
            <punica-hidden direction="up" breakPoint="xl">
              XL - UP
            </punica-hidden>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
