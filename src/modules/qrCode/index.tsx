import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Module = () => {
  const { t } = useTranslation();
  const [qrValue, setQrValue] = useState(
    'https://github.com/punica-components'
  );

  return (
    <Layout.Main>
      <Layout.Header title={t('component.qrCode') || 'QR Code'} />
      <Layout.Content>
        <punica-row spacing={4}>
          <punica-col xs={12}>
            <punica-typography variant="headline6">
              Basic QR Code
            </punica-typography>
            <punica-qr-code
              value="https://github.com/punica-components"
              size="256"
            />
          </punica-col>

          <punica-col xs={12}>
            <punica-typography variant="headline6">
              Custom Colors
            </punica-typography>
            <punica-row spacing={2}>
              <punica-col>
                <punica-qr-code
                  value="https://github.com/punica-components"
                  size="200"
                  foreground="#1976d2"
                  background="#ffffff"
                />
              </punica-col>
              <punica-col>
                <punica-qr-code
                  value="https://github.com/punica-components"
                  size="200"
                  foreground="#2e7d32"
                  background="#f1f8e9"
                />
              </punica-col>
              <punica-col>
                <punica-qr-code
                  value="https://github.com/punica-components"
                  size="200"
                  foreground="#d32f2f"
                  background="#ffebee"
                />
              </punica-col>
            </punica-row>
          </punica-col>

          <punica-col xs={12}>
            <punica-typography variant="headline6">
              Different Sizes
            </punica-typography>
            <punica-row spacing={2}>
              <punica-col>
                <punica-qr-code
                  value="https://github.com/punica-components"
                  size="128"
                />
              </punica-col>
              <punica-col>
                <punica-qr-code
                  value="https://github.com/punica-components"
                  size="256"
                />
              </punica-col>
              <punica-col>
                <punica-qr-code
                  value="https://github.com/punica-components"
                  size="384"
                />
              </punica-col>
            </punica-row>
          </punica-col>

          <punica-col xs={12}>
            <punica-typography variant="headline6">
              Dynamic QR Code
            </punica-typography>
            <punica-row spacing={2}>
              <punica-col xs={12} md={6}>
                <punica-input
                  placeholder="Enter URL or Text"
                  value={qrValue}
                  onInput={(e: any) => setQrValue(e.target.value)}
                  fullwidth={true}
                />
              </punica-col>
              <punica-col xs={12} md={6}>
                <punica-qr-code value={qrValue} size="256" />
              </punica-col>
            </punica-row>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
