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
              <punica-card-media>
                <img src="https://mui.com/static/images/cards/contemplative-reptile.jpg" />
              </punica-card-media>
              <punica-card-content>
                <div>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </div>
              </punica-card-content>
              <punica-card-actions>
                <punica-button>Action 1</punica-button>
                <punica-button>Action 2</punica-button>
              </punica-card-actions>
            </punica-card>
          </punica-col>
          <punica-col xs={12}>
            <punica-card rounded>
              <punica-card-media>
                <img src="https://mui.com/static/images/cards/contemplative-reptile.jpg" />
              </punica-card-media>
              <punica-card-content>
                <div>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </div>
              </punica-card-content>
              <punica-card-actions>
                <punica-button>Action 1</punica-button>
                <punica-button>Action 2</punica-button>
              </punica-card-actions>
            </punica-card>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
