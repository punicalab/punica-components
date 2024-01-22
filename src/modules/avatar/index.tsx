import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.avatar')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row wrap="nowrap" spacing={16}>
              <punica-col>
                <punica-avatar color="warning" variant="circular">
                  AK
                </punica-avatar>
              </punica-col>
              <punica-col>
                <punica-avatar variant="circular">
                  <img src="/assets/avatar/avatar.jpg"></img>
                </punica-avatar>
              </punica-col>
              <punica-col>
                <punica-avatar variant="rounded">
                  <img src="/assets/avatar/avatar.jpg"></img>
                </punica-avatar>
              </punica-col>
              <punica-col>
                <punica-avatar variant="square">
                  <img src="/assets/avatar/avatar.jpg"></img>
                </punica-avatar>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
