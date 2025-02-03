import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.avatar')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col xs={12}>
                <punica-row spacing={1}>
                  <punica-col>
                    <punica-avatar color="primary" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                  <punica-col>
                    <punica-avatar color="secondary" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                  <punica-col>
                    <punica-avatar color="error" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                  <punica-col>
                    <punica-avatar color="warning" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                  <punica-col>
                    <punica-avatar color="info" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                  <punica-col>
                    <punica-avatar color="success" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                  <punica-col>
                    <punica-avatar color="white" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                  <punica-col>
                    <punica-avatar color="blue" variant="circular">
                      AK
                    </punica-avatar>
                  </punica-col>
                </punica-row>
              </punica-col>
              <punica-col xs={12}>
                <punica-avatar variant="circular">
                  <img src="/assets/avatar.jpg"></img>
                </punica-avatar>
              </punica-col>
              <punica-col>
                <punica-avatar variant="rounded">
                  <img src="/assets/avatar.jpg"></img>
                </punica-avatar>
              </punica-col>
              <punica-col>
                <punica-avatar variant="square">
                  <img src="/assets/avatar.jpg"></img>
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
