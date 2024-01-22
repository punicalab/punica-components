import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.grid')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row gap={4}>
              <punica-col xs={12} md={5}>
                <punica-paper rounded>XS-12 MD-5</punica-paper>
              </punica-col>
              <punica-col xs={12} md={4}>
                <punica-paper rounded>XS-12 MD-4</punica-paper>
              </punica-col>
              <punica-col xs={12} md={3}>
                <punica-paper rounded>XS-12 MD-3</punica-paper>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-divider />
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={4}>
              <punica-col xs={12} md={5}>
                <punica-paper rounded>XS-12 MD-5</punica-paper>
              </punica-col>
              <punica-col xs={12} md={4}>
                <punica-paper rounded>XS-12 MD-4</punica-paper>
              </punica-col>
              <punica-col xs={12} md={3}>
                <punica-paper rounded>XS-12 MD-3</punica-paper>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-divider />
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={16}>
              <punica-col xs={3}>
                <punica-paper rounded>XS-3</punica-paper>
              </punica-col>
              <punica-col xs={3}>
                <punica-paper rounded>XS-3</punica-paper>
              </punica-col>
              <punica-col xs={3}>
                <punica-paper rounded>XS-3</punica-paper>
              </punica-col>
              <punica-col xs={3}>
                <punica-paper rounded>XS-3</punica-paper>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-divider />
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={16}>
              <punica-col xs={12} sm={3} md={3} lg={3} xl={3}>
                <punica-paper rounded>XS-12 SM-3 MD-3 LG-3 XL-3</punica-paper>
              </punica-col>
              <punica-col xs={12} sm={3} md={3} lg={3} xl={3}>
                <punica-paper rounded>XS-12 SM-3 MD-3 LG-3 XL-3</punica-paper>
              </punica-col>
              <punica-col xs={12} sm={3} md={3} lg={3} xl={3}>
                <punica-paper rounded>XS-12 SM-3 MD-3 LG-3 XL-3</punica-paper>
              </punica-col>
              <punica-col xs={12} sm={3} md={3} lg={3} xl={3}>
                <punica-paper rounded>XS-12 SM-3 MD-3 LG-3 XL-3</punica-paper>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-divider />
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={16} alignItems="center">
              <punica-col xs={12} sm={6} md={3} lg={2} xl={4}>
                <punica-paper rounded>XS-12 SM-6 MD-3 LG-2 XL-4</punica-paper>
              </punica-col>
              <punica-col xs={12} sm={2} md={3} lg={2} xl={2}>
                <punica-paper rounded>XS-12 SM-2 MD-3 LG-2 XL-2</punica-paper>
              </punica-col>
              <punica-col xs={12} sm={2} md={3} lg={2} xl={4}>
                <punica-paper rounded>XS-12 SM-2 MD-3 LG-2 XL-4</punica-paper>
              </punica-col>
              <punica-col xs={12} sm={2} md={3} lg={6} xl={2}>
                <punica-paper rounded>XS-12 SM-2 MD-3 LG-6 XL-2</punica-paper>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-divider />
          </punica-col>
          <punica-col xs={12}>
            <punica-row spacing={16} justifyContent="center">
              <punica-col xs={4}>
                <punica-paper rounded>XS-4 JUSTIFYCONTENT CENTER</punica-paper>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
