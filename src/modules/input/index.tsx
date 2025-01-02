import { Module as Layout } from '@/layouts/module';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  useEffect(() => {
    console.log(inputRef.current);
    const input = inputRef.current;

    input.inputFocus();
  }, [inputRef]);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.input')} />
      <Layout.Content>
        <punica-row gap={16}>
          <punica-col xs={12}>
            <punica-row gap={16}>
              <punica-col>
                <punica-input
                  placeholder="Lorem Ipsum..."
                  ref={inputRef}
                ></punica-input>
              </punica-col>
              <punica-col>
                <punica-input placeholder="Lorem Ipsum...">
                  <i slot="startAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
              <punica-col>
                <punica-input placeholder="Lorem Ipsum...">
                  <i slot="endAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
              <punica-col>
                <punica-input placeholder="Lorem Ipsum..." error>
                  <i slot="endAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
              <punica-col xs={12}>
                <punica-input placeholder="Lorem Ipsum..." rounded>
                  <i slot="endAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
              <punica-col>
                <punica-input placeholder="Lorem Ipsum..." size="small">
                  <i slot="endAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
              <punica-col>
                <punica-input placeholder="Lorem Ipsum..." size="medium">
                  <i slot="endAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
              <punica-col>
                <punica-input placeholder="Lorem Ipsum..." size="large">
                  <i slot="endAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
              <punica-col xs={12}>
                <punica-input placeholder="Lorem Ipsum..." fullwidth>
                  <i slot="endAdornment" className="fa-duotone fa-house" />
                </punica-input>
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
