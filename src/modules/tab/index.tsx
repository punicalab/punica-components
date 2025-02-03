import { Module as Layout } from '@/layouts/module';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [selected, setSelected] = useState('tab1');

  /**
   *
   */
  const handleChange = (event: CustomEvent) => {
    setSelected(event.detail.value);
  };

  /**
   *
   */
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.addEventListener('change', handleChange);
  }, [ref]);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.tab')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col>
            <punica-row spacing={2}>
              <punica-col xs={12}>
                <punica-tab orientation="horizontal" value={selected} ref={ref}>
                  <punica-tab-item value="tab1">sdfsd</punica-tab-item>
                  <punica-tab-item value="tab2">sdfsd</punica-tab-item>
                  <punica-tab-item value="tab3">sdfsd</punica-tab-item>
                </punica-tab>
              </punica-col>
              <punica-col xs={12}>
                <punica-tab-panel value="tab1" selectedvalue={selected}>
                  <punica-typography variant="headline5">
                    {selected.toUpperCase()}
                  </punica-typography>
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
                </punica-tab-panel>
                <punica-tab-panel value="tab2" selectedvalue={selected}>
                  <punica-typography variant="headline5">
                    {selected.toUpperCase()}
                  </punica-typography>
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
                </punica-tab-panel>
                <punica-tab-panel value="tab3" selectedvalue={selected}>
                  <punica-typography variant="headline5">
                    {selected.toUpperCase()}
                  </punica-typography>
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
                </punica-tab-panel>
              </punica-col>
            </punica-row>
          </punica-col>
          <punica-col>
            <punica-row spacing={2} wrap="nowrap">
              <punica-col xs={2}>
                <punica-tab
                  orientation="vertical"
                  value={selected}
                  ref={ref}
                  fullwidth
                >
                  <punica-tab-item value="tab1">sdfsd</punica-tab-item>
                  <punica-tab-item value="tab2">sdfsd</punica-tab-item>
                  <punica-tab-item value="tab3">sdfsd</punica-tab-item>
                </punica-tab>
              </punica-col>
              <punica-col xs={10}>
                <punica-tab-panel value="tab1" selectedvalue={selected}>
                  <punica-typography variant="headline5">
                    {selected.toUpperCase()}
                  </punica-typography>
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
                </punica-tab-panel>
                <punica-tab-panel value="tab2" selectedvalue={selected}>
                  <punica-typography variant="headline5">
                    {selected.toUpperCase()}
                  </punica-typography>
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
                </punica-tab-panel>
                <punica-tab-panel value="tab3" selectedvalue={selected}>
                  <punica-typography variant="headline5">
                    {selected.toUpperCase()}
                  </punica-typography>
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
                </punica-tab-panel>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
