import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.datePicker')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-date-picker
              value="2024-09-30T21:00:00Z"
              maxDate="2024-10-30T21:00:00Z"
            >
              <punica-icon-button slot="endAdornment">
                <i className="fa-regular fa-calendar" />
              </punica-icon-button>
              <punica-icon-button slot="previous-month">
                <i className="fa-regular fa-chevron-left" />
              </punica-icon-button>
              <punica-icon-button slot="next-month">
                <i className="fa-regular fa-chevron-right" />
              </punica-icon-button>
            </punica-date-picker>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
