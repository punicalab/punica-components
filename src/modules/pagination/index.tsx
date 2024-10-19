import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.pagination')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-pagination page={4} totalCount={200}>
              <slot slot="prevPage">
                <i className="fa-regular fa-angle-left" />
              </slot>
              <slot slot="nextPage">
                <i className="fa-regular fa-angle-right" />
              </slot>
            </punica-pagination>
          </punica-col>
          <punica-col xs={12}>
            <punica-pagination page={1} totalCount={200}>
              <slot slot="prevPage">
                <i className="fa-regular fa-angle-left" />
              </slot>
              <slot slot="nextPage">
                <i className="fa-regular fa-angle-right" />
              </slot>
            </punica-pagination>
          </punica-col>
          <punica-col xs={12}>
            <punica-pagination page={5} totalCount={200}>
              <slot slot="prevPage">
                <i className="fa-regular fa-angle-left" />
              </slot>
              <slot slot="nextPage">
                <i className="fa-regular fa-angle-right" />
              </slot>
            </punica-pagination>
          </punica-col>
          <punica-col xs={12}>
            <punica-pagination page={10} totalCount={200}>
              <slot slot="prevPage">
                <i className="fa-regular fa-angle-left" />
              </slot>
              <slot slot="nextPage">
                <i className="fa-regular fa-angle-right" />
              </slot>
            </punica-pagination>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
