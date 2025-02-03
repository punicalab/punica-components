import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.textarea')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-textarea placeholder="Lorem Ipsum..."></punica-textarea>
              </punica-col>
              <punica-col>
                <punica-textarea
                  placeholder="Lorem Ipsum..."
                  error
                ></punica-textarea>
              </punica-col>
              <punica-col xs={12}>
                <punica-textarea
                  placeholder="Lorem Ipsum..."
                  fullwidth
                ></punica-textarea>
              </punica-col>
              <punica-col xs={12}>
                <punica-textarea
                  rows={5}
                  placeholder="Lorem Ipsum..."
                  fullwidth
                ></punica-textarea>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
