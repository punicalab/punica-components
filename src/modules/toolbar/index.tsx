import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.toolbar')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-toolbar
              variant="dense"
              style={{ background: 'var(--primary-main)' }}
            >
              <punica-icon-button style={{ marginRight: 2 }}>
                <i className="fa-duotone fa-bars" />
              </punica-icon-button>
              <punica-typography style={{ flexGrow: 1 }}>
                News
              </punica-typography>
              <punica-toggle-button value="delete" color="secondary">
                <i slot="active" className="fa-duotone fa-trash" />
                <i slot="passive" className="fa-duotone fa-trash" />
              </punica-toggle-button>
              <punica-toggle-button value="delete" color="secondary">
                <i slot="active" className="fa-duotone fa-trash" />
                <i slot="passive" className="fa-duotone fa-trash" />
              </punica-toggle-button>
              <punica-button>Login</punica-button>
            </punica-toolbar>
          </punica-col>
          <punica-col xs={12}>
            <punica-toolbar style={{ background: 'var(--primary-main)' }}>
              <punica-icon-button style={{ marginRight: 2 }}>
                <i className="fa-duotone fa-bars" />
              </punica-icon-button>
              <punica-typography style={{ flexGrow: 1 }}>
                News
              </punica-typography>
              <punica-toggle-button value="delete" color="secondary">
                <i slot="active" className="fa-duotone fa-trash" />
                <i slot="passive" className="fa-duotone fa-trash" />
              </punica-toggle-button>
              <punica-toggle-button value="delete" color="secondary">
                <i slot="active" className="fa-duotone fa-trash" />
                <i slot="passive" className="fa-duotone fa-trash" />
              </punica-toggle-button>
              <punica-button>Login</punica-button>
            </punica-toolbar>
          </punica-col>
          <punica-col xs={12}>
            <punica-toolbar
              disablegutters
              style={{ background: 'var(--primary-main)' }}
            >
              <punica-icon-button style={{ marginRight: 2 }}>
                <i className="fa-duotone fa-bars" />
              </punica-icon-button>
              <punica-typography style={{ flexGrow: 1 }}>
                News
              </punica-typography>
              <punica-toggle-button value="delete" color="secondary">
                <i className="fa-duotone fa-trash" />
              </punica-toggle-button>
              <punica-toggle-button value="delete" color="secondary">
                <i className="fa-duotone fa-trash" />
              </punica-toggle-button>
              <punica-button>Login</punica-button>
            </punica-toolbar>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
