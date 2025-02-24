import { Module as Layout } from '@/layouts/module';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openRounded, setOpenRounded] = useState(false);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.dialog')} />
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
                    setOpen(true);
                  }}
                >
                  Show Dialog
                </punica-button>
                <punica-button
                  rounded
                  variant="filled"
                  size="medium"
                  color="primary"
                  style={{ marginLeft: 12 }}
                  onClick={() => {
                    setOpenRounded(true);
                  }}
                >
                  Show Dialog Rounded
                </punica-button>
                <punica-dialog open={open} width={500}>
                  <punica-dialog-header>
                    <punica-typography variant="headline6">
                      Lorem Ipsum.
                    </punica-typography>
                  </punica-dialog-header>
                  <punica-dialog-content>
                    <punica-typography>
                      Lorem Ipsum is simply dummy text of the printing and
                      typesetting industry. Lorem Ipsum has been the industry's
                      standard dummy text ever since the 1500s, when an unknown
                      printer took a galley of type and scrambled it to make a
                      type specimen book. It has survived not only five
                      centuries, but also the leap into electronic typesetting,
                      remaining essentially unchanged. It was popularised in the
                      1960s with the release of Letraset sheets containing Lorem
                      Ipsum passages, and more recently with desktop publishing
                      software like Aldus PageMaker including versions of Lorem
                      Ipsum.
                    </punica-typography>
                  </punica-dialog-content>
                  <punica-dialog-footer>
                    <punica-button
                      rounded
                      variant="filled"
                      size="medium"
                      color="primary"
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      Action 1
                    </punica-button>
                    <punica-button
                      rounded
                      variant="filled"
                      size="medium"
                      color="primary"
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      Action 2
                    </punica-button>
                  </punica-dialog-footer>
                </punica-dialog>
                <punica-dialog open={openRounded} rounded>
                  <punica-dialog-header>
                    <punica-typography variant="headline6">
                      Lorem Ipsum.
                    </punica-typography>
                  </punica-dialog-header>
                  <punica-dialog-content>
                    <punica-typography>
                      Lorem Ipsum is simply dummy text of the printing and
                      typesetting industry. Lorem Ipsum has been the industry's
                      standard dummy text ever since the 1500s, when an unknown
                      printer took a galley of type and scrambled it to make a
                      type specimen book. It has survived not only five
                      centuries, but also the leap into electronic typesetting,
                      remaining essentially unchanged. It was popularised in the
                      1960s with the release of Letraset sheets containing Lorem
                      Ipsum passages, and more recently with desktop publishing
                      software like Aldus PageMaker including versions of Lorem
                      Ipsum.
                    </punica-typography>
                  </punica-dialog-content>
                  <punica-dialog-footer>
                    <punica-button
                      rounded
                      variant="filled"
                      size="medium"
                      color="primary"
                      onClick={() => {
                        setOpenRounded(false);
                      }}
                    >
                      Action 1
                    </punica-button>
                    <punica-button
                      rounded
                      variant="filled"
                      size="medium"
                      color="primary"
                      onClick={() => {
                        setOpenRounded(false);
                      }}
                    >
                      Action 2
                    </punica-button>
                  </punica-dialog-footer>
                </punica-dialog>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
