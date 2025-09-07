import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  /**
   *
   * @param variant
   * @param placement
   */
  const demo = (variant: string, placement: string) => {
    window['Toast'].show({
      title: variant[0].toUpperCase() + variant.slice(1),
      message: `This is a ${variant} toast (${placement})`,
      variant,
      placement,
      duration: 3000
    });
  };

  return (
    <Layout.Main>
      <Layout.Header title={t('component.toast')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    demo('success', 'top-right');
                  }}
                >
                  Success (top-right)
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    demo('warning', 'top-left');
                  }}
                >
                  Warning (top-left)
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    demo('info', 'top-center');
                  }}
                >
                  Info (top-center)
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    demo('info', 'bottom-center');
                  }}
                >
                  Info (bottom-center)
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    demo('success', 'bottom-left');
                  }}
                >
                  Success (bottom-left)
                </punica-button>
              </punica-col>
              <punica-col>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    demo('error', 'bottom-right');
                  }}
                >
                  Error (bottom-right)
                </punica-button>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
        <punica-toaster></punica-toaster>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
