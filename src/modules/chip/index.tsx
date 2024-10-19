import { Module as Layout } from '@/layouts/module';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const ref = useRef(null);

  /**
   *
   */
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.addEventListener('onPop', function (event) {});
  }, [ref]);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.chip')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row wrap="nowrap" gap={16}>
              <punica-col>
                <punica-chip variant="filled" color="primary" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="filled" color="error" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="filled" color="success" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="filled" color="warning" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="filled" color="info" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip
                  ref={ref}
                  variant="filled"
                  color="info"
                  size="medium"
                >
                  Content
                  <i
                    slot="delete"
                    className="fa-lg fa-duotone fa-circle-xmark"
                  />
                </punica-chip>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col xs={12}>
            <punica-row wrap="nowrap" gap={16}>
              <punica-col>
                <punica-chip variant="outlined" color="default" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="outlined" color="primary" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="outlined" color="error" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="outlined" color="success" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="outlined" color="warning" size="medium">
                  Content
                </punica-chip>
              </punica-col>
              <punica-col>
                <punica-chip variant="outlined" color="info" size="medium">
                  Content
                </punica-chip>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
