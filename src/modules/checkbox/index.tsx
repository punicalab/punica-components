import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.checkbox')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row wrap="nowrap" spacing={2}>
              <punica-col>
                <punica-checkbox label="Checkbox" disabled />
              </punica-col>
              <punica-col>
                <punica-checkbox label="Checkbox" checked />
              </punica-col>
              <punica-col>
                <punica-checkbox label="Checkbox" indeterminate />
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
