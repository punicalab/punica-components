import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.timePicker')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-time-picker>
              <punica-icon-button slot="endAdornment">
                <i className="fa-regular fa-clock" />
              </punica-icon-button>
              <punica-icon-button slot="hour-up">
                <i className="fa-regular fa-chevron-up" />
              </punica-icon-button>
              <punica-icon-button slot="hour-down">
                <i className="fa-regular fa-chevron-down" />
              </punica-icon-button>
              <punica-icon-button slot="minutes-up">
                <i className="fa-regular fa-chevron-up" />
              </punica-icon-button>
              <punica-icon-button slot="minutes-down">
                <i className="fa-regular fa-chevron-down" />
              </punica-icon-button>
            </punica-time-picker>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
