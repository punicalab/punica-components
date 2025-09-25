import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';
import './index.css';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.split')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={12}>
            <div className="card">
              <div style={{ marginBottom: '8px' }}>
                <strong>Horizontal (varsayılan)</strong> — sizes="20,40,40"
                min="10"
              </div>
              <div className="demo">
                <punica-split sizes={[20, 40, 40]} min={10}>
                  <div className="pane-demo">Sol panel</div>
                  <div className="pane-demo">Orta panel</div>
                  <div className="pane-demo">Sağ panel</div>
                </punica-split>
              </div>
            </div>
          </punica-col>
          <punica-col xs={12}>
            <div className="card">
              <div style={{ marginBottom: '8px' }}>
                <strong>Vertical</strong> — orientation="vertical" sizes="60,40"
                min="20,10"
              </div>
              <div className="demo demo-vertical">
                <punica-split
                  orientation="vertical"
                  sizes={[60, 40]}
                  min={[20, 10]}
                >
                  <div className="pane-demo">Üst panel</div>
                  <div className="pane-demo">Alt panel</div>
                </punica-split>
              </div>
            </div>
          </punica-col>
        </punica-row>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
