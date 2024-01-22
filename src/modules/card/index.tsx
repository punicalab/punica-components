import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.card')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-card>
              <img
                slot="media"
                src="https://mui.com/static/images/cards/contemplative-reptile.jpg"
              />
              <div slot="content">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </div>
              <punica-button slot="actions">Action 1</punica-button>
              <punica-button slot="actions">Action 2</punica-button>
            </punica-card>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
