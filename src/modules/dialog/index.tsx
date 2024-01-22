import { Module as Layout } from '@/layouts/module';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openOK, setOpenOK] = useState(false);
  const [openYesOrNo, setOpenYesOrNo] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.dialog')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row gap={16}>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  Show Dialog
                </punica-button>
                <punica-dialog open={open}>
                  <punica-typography slot="content">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </punica-typography>
                  <punica-button
                    slot="footer"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    Action 1
                  </punica-button>
                  <punica-button
                    slot="footer"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    Action 2
                  </punica-button>
                </punica-dialog>
              </punica-col>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpenOK(true);
                  }}
                >
                  Show Dialog OK
                </punica-button>
                <punica-dialog-ok open={openOK}>
                  <punica-typography slot="text">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s
                  </punica-typography>
                </punica-dialog-ok>
              </punica-col>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpenYesOrNo(true);
                  }}
                >
                  Show Dialog Yes Or No
                </punica-button>
                <punica-dialog-yes-or-no open={openYesOrNo}>
                  <punica-typography slot="text">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s
                  </punica-typography>
                </punica-dialog-yes-or-no>
              </punica-col>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpenDelete(true);
                  }}
                >
                  Show Dialog Delete
                </punica-button>
                <punica-dialog-delete open={openDelete}>
                  <punica-typography slot="text">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s
                  </punica-typography>
                </punica-dialog-delete>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
