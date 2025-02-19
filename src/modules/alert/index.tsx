import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.alert')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-alert variant="standard" severity="success">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-check" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum is simply dummy text of the printing and
                typesetting industry.
              </punica-alert-content>
              <punica-alert-action>
                <i className="fa-xl fa-solid fa-xmark"></i>
              </punica-alert-action>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="standard" severity="info">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-info" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
              <punica-alert-action>
                <i className="fa-xl fa-sharp-duotone fa-solid fa-circle-xmark"></i>
              </punica-alert-action>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="standard" severity="error">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-xmark" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="standard" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="success">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-check" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="info">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-info" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="error">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-xmark" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="success">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-check" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="info">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-info" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="error">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-xmark" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-content>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </punica-alert-content>
            </punica-alert>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
