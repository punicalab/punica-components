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
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="standard" severity="info">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-info" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="standard" severity="error">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-xmark" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="standard" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="success">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-check" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="info">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-info" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="error">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-xmark" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="filled" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="success">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-check" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="info">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-info" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="error">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-xmark" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
          <punica-col xs={12}>
            <punica-alert variant="outlined" severity="warning">
              <punica-alert-icon>
                <i className="fa-xl fa-duotone fa-circle-exclamation" />
              </punica-alert-icon>
              <punica-alert-title>
                <span>Lorem ipsum</span>
              </punica-alert-title>
              <punica-alert-description>
                <span>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </span>
              </punica-alert-description>
            </punica-alert>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
