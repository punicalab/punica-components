import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.alert')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-alert severity="success">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-check"></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert severity="info">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-info"></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert severity="error">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-xmark"></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert severity="warning">
              <i
                slot="icon"
                className="fa-xl fa-duotone fa-circle-exclamation"
              ></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="success">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-check"></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="info">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-info" />
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="error">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-xmark"></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="warning">
              <i
                slot="icon"
                className="fa-xl fa-duotone fa-circle-exclamation"
              ></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="success">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-check"></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="info">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-info" />
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="error">
              <i slot="icon" className="fa-xl fa-duotone fa-circle-xmark"></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="warning">
              <i
                slot="icon"
                className="fa-xl fa-duotone fa-circle-exclamation"
              ></i>
              <span slot="title">Lorem ipsum</span>
              <span slot="description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </span>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="warning">
              <i
                slot="icon"
                className="fa-xl fa-duotone fa-circle-exclamation"
              ></i>
              <span slot="title">Lorem ipsum</span>
            </punica-alert>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
