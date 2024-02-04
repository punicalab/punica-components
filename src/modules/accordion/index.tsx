import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.accordion')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-accordion expanded={true}>
              <punica-accordion-summary>
                <punica-typography slot="content">Title</punica-typography>
                <punica-icon slot="expandIcon" size="large">
                  <i className="fa-duotone fa-square-chevron-down" />
                </punica-icon>
              </punica-accordion-summary>
              <punica-accordion-details>
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
              </punica-accordion-details>
            </punica-accordion>
          </punica-col>
          <punica-col xs={12}>
            <punica-accordion expanded={false}>
              <punica-accordion-summary>
                <punica-typography slot="content">Title</punica-typography>
                <punica-icon slot="expandIcon" size="large">
                  <i className="fa-duotone fa-square-chevron-down" />
                </punica-icon>
              </punica-accordion-summary>
              <punica-accordion-details>
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
              </punica-accordion-details>
            </punica-accordion>
          </punica-col>
          <punica-col xs={12}>
            <punica-accordion expanded={false}>
              <punica-accordion-summary>
                <punica-icon slot="icon" size="large">
                  <i className="fa-duotone fa-globe" />
                </punica-icon>
                <punica-typography slot="content">Title</punica-typography>
                <punica-icon slot="expandIcon" size="large">
                  <i className="fa-duotone fa-square-chevron-down" />
                </punica-icon>
              </punica-accordion-summary>
              <punica-accordion-details>
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
              </punica-accordion-details>
            </punica-accordion>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
