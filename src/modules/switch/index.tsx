import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  /**
   *
   */
  const handleChange = (event) => {};

  return (
    <Layout.Main>
      <Layout.Header title={t('component.switch')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-switch></punica-switch>
          </punica-col>
          <punica-col xs={12}>
            <punica-switch
              initstate={true}
              onInput={handleChange}
            ></punica-switch>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
