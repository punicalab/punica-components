import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.singleSelectList')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-single-select-list value="item3">
              <punica-single-select-list-item value="item1">
                Item 1
              </punica-single-select-list-item>
              <punica-single-select-list-item value="item2">
                Item 2
              </punica-single-select-list-item>
              <punica-single-select-list-item value="item3">
                Item 3
              </punica-single-select-list-item>
              <punica-single-select-list-item value="item4">
                Item 4
              </punica-single-select-list-item>
              <punica-single-select-list-item value="item5">
                Item 5
              </punica-single-select-list-item>
              <punica-single-select-list-item value="item6">
                Item 6
              </punica-single-select-list-item>
            </punica-single-select-list>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
