import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.toggleButtonGroup')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-toggle-button-group value="grid">
              <punica-toggle-button value="delete">
                <i className="fa-duotone fa-trash" />
              </punica-toggle-button>
              <punica-toggle-button value="grid">
                <i className="fa-duotone fa-grid" />
              </punica-toggle-button>
              <punica-toggle-button disabled value="list">
                <i className="fa-duotone fa-list" />
              </punica-toggle-button>
            </punica-toggle-button-group>
          </punica-col>

          <punica-col xs={12}>
            <punica-toggle-button-group value="AM">
              <punica-toggle-button value="AM">
                <punica-typography>AM</punica-typography>
              </punica-toggle-button>
              <punica-toggle-button value="PM">
                <punica-typography>PM</punica-typography>
              </punica-toggle-button>
            </punica-toggle-button-group>
          </punica-col>
          <punica-col xs={12}>
            <punica-toggle-button-group value="AM" orientation="vertical">
              <punica-toggle-button value="AM">
                <punica-typography>AM</punica-typography>
              </punica-toggle-button>
              <punica-toggle-button value="PM">
                <punica-typography>PM</punica-typography>
              </punica-toggle-button>
            </punica-toggle-button-group>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
