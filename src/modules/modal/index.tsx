import { Module as Layout } from '@/layouts/module';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openRounded, setRoundedOpen] = useState(false);

  /**
   *
   */
  const handleClick = () => {
    setOpen(true);
  };

  /**
   *
   */
  const handleRoundedClick = () => {
    setRoundedOpen(true);
  };

  /**
   *
   */
  const handleClose = () => {
    setOpen(false);
  };

  /**
   *
   */
  const handleRoundedClose = () => {
    setRoundedOpen(false);
  };

  return (
    <Layout.Main>
      <Layout.Header title={t('component.modal')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-button onClick={handleClick}>Show Modal</punica-button>
            <punica-button
              onClick={handleRoundedClick}
              style={{ marginLeft: 12 }}
            >
              Show Rounded Modal
            </punica-button>
            <punica-modal open={open} width={600} height={500}>
              <punica-modal-header>
                <punica-typography variant="headline6">
                  Header
                </punica-typography>
              </punica-modal-header>
              <punica-modal-content>
                <punica-typography>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry. Lorem Ipsum has been the industry's
                  standard dummy text ever since the 1500s, when an unknown
                  printer took a galley of type and scrambled it to make a type
                  specimen book. It has survived not only five centuries, but
                  also the leap into electronic typesetting, remaining
                  essentially unchanged. It was popularised in the 1960s with
                  the release of Letraset sheets containing Lorem Ipsum
                  passages, and more recently with desktop publishing software
                  like Aldus PageMaker including versions of Lorem Ipsum.
                </punica-typography>
                <punica-select value="item3" placeholder="Lorem Ipsum...">
                  <punica-select-item value="item1">Item 1</punica-select-item>
                  <punica-select-item value="item2">Item 2</punica-select-item>
                  <punica-select-item value="item3">Item 3</punica-select-item>
                  <punica-select-item value="item4">Item 4</punica-select-item>
                  <punica-select-item value="item5">Item 5</punica-select-item>
                  <punica-select-item value="item6">Item 6</punica-select-item>
                  <punica-select-item value="item7">Item 7</punica-select-item>
                  <punica-select-item value="item8">Item 8</punica-select-item>
                  <punica-select-item value="item9">Item 9</punica-select-item>
                  <punica-select-item value="item10">
                    Item 10
                  </punica-select-item>
                  <punica-icon slot="caret">
                    <i className="fa-solid fa-caret-down" />
                  </punica-icon>
                  <punica-icon slot="clear">
                    <i className="fa-regular fa-xmark" />
                  </punica-icon>
                  <punica-icon slot="adornment">
                    <i className="fa-brands fa-html5" />
                  </punica-icon>
                  <punica-icon slot="preload">
                    <i className="fa-duotone fa-spinner-third fa-spin" />
                  </punica-icon>
                </punica-select>
              </punica-modal-content>
              <punica-modal-footer>
                <punica-button
                  style={{ width: '100px' }}
                  variant="outlined"
                  onClick={handleClose}
                >
                  Action 1
                </punica-button>
                <punica-button onClick={handleClose}>Action 2</punica-button>
              </punica-modal-footer>
            </punica-modal>
            <punica-modal rounded open={openRounded} width={600} height={500}>
              <punica-modal-header>
                <punica-typography variant="headline6">
                  Header
                </punica-typography>
              </punica-modal-header>
              <punica-modal-content>
                <punica-typography>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry. Lorem Ipsum has been the industry's
                  standard dummy text ever since the 1500s, when an unknown
                  printer took a galley of type and scrambled it to make a type
                  specimen book. It has survived not only five centuries, but
                  also the leap into electronic typesetting, remaining
                  essentially unchanged. It was popularised in the 1960s with
                  the release of Letraset sheets containing Lorem Ipsum
                  passages, and more recently with desktop publishing software
                  like Aldus PageMaker including versions of Lorem Ipsum.
                </punica-typography>
              </punica-modal-content>
              <punica-modal-footer>
                <punica-button
                  rounded
                  style={{ width: '100px' }}
                  variant="outlined"
                  onClick={handleRoundedClose}
                >
                  Action 1
                </punica-button>
                <punica-button rounded onClick={handleRoundedClose}>
                  Action 2
                </punica-button>
              </punica-modal-footer>
            </punica-modal>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
