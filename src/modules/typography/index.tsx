import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.typography')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-typography variant="headline1">headline1</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="headline2">headline2</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="headline2" textAlign="center">
              headline2 center
            </punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="headline3">headline3</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="headline4">headline4</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="headline5">headline5</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="headline6">headline6</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography>default</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="body1">body1</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="body1" textAlign="center">
              body1 center
            </punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="body1" fontWeight="extra-bold">
              body1 extra-bold
            </punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="body2">body2</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="button">button</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="caption">caption</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography variant="overline">overline</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography color="primary">primary color</punica-typography>
          </punica-col>
          <punica-col xs={12}>
            <punica-typography color="blue">custom color</punica-typography>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
