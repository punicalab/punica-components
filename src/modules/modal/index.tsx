import { Module as Layout } from '@/layouts/module';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  /**
   *
   */
  const handleClick = () => {
    setOpen(true);
  };

  /**
   *
   */
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Layout.Main>
      <Layout.Header title={t('component.modal')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-button onClick={handleClick}>Show Modal</punica-button>
            <punica-modal open={open}>
              <punica-typography slot="header" variant="headline6">
                Header
              </punica-typography>
              <punica-typography slot="content">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book. It has
                survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged. It was
                popularised in the 1960s with the release of Letraset sheets
                containing Lorem Ipsum passages, and more recently with desktop
                publishing software like Aldus PageMaker including versions of
                Lorem Ipsum.
              </punica-typography>
              <punica-button slot="footer" onClick={handleClose}>
                Action 1
              </punica-button>
              <punica-button slot="footer" onClick={handleClose}>
                Action 2
              </punica-button>
            </punica-modal>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
