import { Module as Layout } from '@/layouts/module';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const [openTop, setOpenTop] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const [openRight, setOpenRight] = useState(false);
  const [openBottom, setOpenBottom] = useState(false);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.drawer')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <punica-row spacing={2}>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpenLeft(true);
                  }}
                >
                  Left
                </punica-button>
                <punica-drawer open={openLeft} direction="left" size="small">
                  <punica-box>
                    <punica-row>
                      <punica-col>
                        <punica-icon-button
                          onClick={() => {
                            setOpenLeft(false);
                          }}
                        >
                          <i className="fa-duotone fa-circle-xmark" />
                        </punica-icon-button>
                      </punica-col>
                      <punica-col>
                        <punica-typography>
                          Lorem Ipsum is simply dummy text of the printing and
                          typesetting industry. Lorem Ipsum has been the
                          industry's standard dummy text ever since the 1500s,
                          when an unknown printer took a galley of type and
                          scrambled it to make a type specimen book. It has
                          survived not only five centuries, but also the leap
                          into electronic typesetting, remaining essentially
                          unchanged. It was popularised in the 1960s with the
                          release of Letraset sheets containing Lorem Ipsum
                          passages, and more recently with desktop publishing
                          software like Aldus PageMaker including versions of
                          Lorem Ipsum.
                        </punica-typography>
                      </punica-col>
                    </punica-row>
                  </punica-box>
                </punica-drawer>
              </punica-col>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpenBottom(true);
                  }}
                >
                  Bottom
                </punica-button>
                <punica-drawer
                  open={openBottom}
                  direction="bottom"
                  size="medium"
                >
                  <punica-box>
                    <punica-row>
                      <punica-col>
                        <punica-icon-button
                          onClick={() => {
                            setOpenBottom(false);
                          }}
                        >
                          <i className="fa-duotone fa-circle-xmark" />
                        </punica-icon-button>
                      </punica-col>
                      <punica-col>
                        <punica-typography>
                          Lorem Ipsum is simply dummy text of the printing and
                          typesetting industry. Lorem Ipsum has been the
                          industry's standard dummy text ever since the 1500s,
                          when an unknown printer took a galley of type and
                          scrambled it to make a type specimen book. It has
                          survived not only five centuries, but also the leap
                          into electronic typesetting, remaining essentially
                          unchanged. It was popularised in the 1960s with the
                          release of Letraset sheets containing Lorem Ipsum
                          passages, and more recently with desktop publishing
                          software like Aldus PageMaker including versions of
                          Lorem Ipsum.
                        </punica-typography>
                      </punica-col>
                    </punica-row>
                  </punica-box>
                </punica-drawer>
              </punica-col>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpenRight(true);
                  }}
                >
                  Right
                </punica-button>
                <punica-drawer open={openRight} direction="right" size="large">
                  <punica-box>
                    <punica-row>
                      <punica-col>
                        <punica-icon-button
                          onClick={() => {
                            setOpenRight(false);
                          }}
                        >
                          <i className="fa-duotone fa-circle-xmark" />
                        </punica-icon-button>
                      </punica-col>
                      <punica-col>
                        <punica-typography>
                          Lorem Ipsum is simply dummy text of the printing and
                          typesetting industry. Lorem Ipsum has been the
                          industry's standard dummy text ever since the 1500s,
                          when an unknown printer took a galley of type and
                          scrambled it to make a type specimen book. It has
                          survived not only five centuries, but also the leap
                          into electronic typesetting, remaining essentially
                          unchanged. It was popularised in the 1960s with the
                          release of Letraset sheets containing Lorem Ipsum
                          passages, and more recently with desktop publishing
                          software like Aldus PageMaker including versions of
                          Lorem Ipsum.
                        </punica-typography>
                      </punica-col>
                    </punica-row>
                  </punica-box>
                </punica-drawer>
              </punica-col>
              <punica-col>
                <punica-button
                  onClick={() => {
                    setOpenTop(true);
                  }}
                >
                  Top
                </punica-button>
                <punica-drawer open={openTop} direction="top" size="xlarge">
                  <punica-box>
                    <punica-row>
                      <punica-col>
                        <punica-icon-button
                          onClick={() => {
                            setOpenTop(false);
                          }}
                        >
                          <i className="fa-duotone fa-circle-xmark" />
                        </punica-icon-button>
                      </punica-col>
                      <punica-col>
                        <punica-typography>
                          Lorem Ipsum is simply dummy text of the printing and
                          typesetting industry. Lorem Ipsum has been the
                          industry's standard dummy text ever since the 1500s,
                          when an unknown printer took a galley of type and
                          scrambled it to make a type specimen book. It has
                          survived not only five centuries, but also the leap
                          into electronic typesetting, remaining essentially
                          unchanged. It was popularised in the 1960s with the
                          release of Letraset sheets containing Lorem Ipsum
                          passages, and more recently with desktop publishing
                          software like Aldus PageMaker including versions of
                          Lorem Ipsum.
                        </punica-typography>
                      </punica-col>
                    </punica-row>
                  </punica-box>
                </punica-drawer>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
