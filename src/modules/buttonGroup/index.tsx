import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.buttonGroup')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-button-group size="small" variant="outlined">
              <punica-button rounded>Small 1</punica-button>
              <punica-button rounded>Small 2</punica-button>
              <punica-button rounded>Small 3</punica-button>
            </punica-button-group>
          </punica-col>
          <punica-col xs={12}>
            <punica-button-group color="error" disabled variant="filled">
              <punica-button rounded>Disabled 1</punica-button>
              <punica-button rounded>Disabled 2</punica-button>
              <punica-button rounded>Disabled 3</punica-button>
            </punica-button-group>
          </punica-col>
          <punica-col xs={12}>
            <punica-button-group
              size="large"
              variant="filled"
              color="secondary"
            >
              <punica-button rounded>Large Filled 1</punica-button>
              <punica-button rounded>Large Filled 2</punica-button>
              <punica-button rounded>Large Filled 3</punica-button>
            </punica-button-group>
          </punica-col>
          <punica-col xs={12}>
            <punica-button-group variant="outlined" fullwidth>
              <punica-button rounded>Full Width 1</punica-button>
              <punica-button rounded>Full Width 2</punica-button>
              <punica-button rounded>Full Width 3</punica-button>
            </punica-button-group>
          </punica-col>
          <punica-col xs={12}>
            <punica-button-group variant="outlined">
              <punica-button rounded>Full Width 1</punica-button>
              <punica-button rounded>Full Width 2</punica-button>
              <punica-button rounded>Full Width 3</punica-button>
            </punica-button-group>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
