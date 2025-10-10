import { Module as Layout } from '@/layouts/module';
import { useTranslation } from 'react-i18next';

const Module = () => {
  const { t } = useTranslation();

  return (
    <Layout.Main>
      <Layout.Header title={t('component.context.menu')} />
      <Layout.Content>
        <punica-row spacing={2}>
          <punica-col xs={4}>
            <punica-box
              id="file-area"
              style={{
                borderRadius: '12px',
                padding: '24px',
                background: 'white',
                border: '1px dashed',
                display: 'flex',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              <strong>File Area</strong> — sağ tık
            </punica-box>
          </punica-col>
          <punica-col xs={4}>
            <punica-box
              id="editor-area"
              style={{
                borderRadius: '12px',
                padding: '24px',
                background: 'white',
                border: '1px dashed',
                display: 'flex',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              <strong>Editor</strong> — sağ tık
            </punica-box>
          </punica-col>
          <punica-col xs={4}>
            <punica-box
              id="blank-area"
              style={{
                borderRadius: '12px',
                padding: '24px',
                background: 'white',
                border: '1px dashed',
                display: 'flex',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              <strong>Blank</strong> — sağ tık
            </punica-box>
          </punica-col>
        </punica-row>
        <punica-context-menu
          id="ctx"
          target="#file-area, #editor-area, #blank-area"
        >
          <punica-context-menu-item
            label="Open"
            value="open"
            icon="📂"
            keyboard="Enter"
          ></punica-context-menu-item>

          <punica-context-menu-item label="New" icon="✚">
            <punica-context-menu-item
              label="File"
              value="new-file"
              icon="📄"
              keyboard="⌘N"
            ></punica-context-menu-item>
            <punica-context-menu-item
              label="Folder"
              value="new-folder"
              icon="📁"
            ></punica-context-menu-item>
            <punica-context-menu-separator></punica-context-menu-separator>
            <punica-context-menu-item label="From Template" icon="📦">
              <punica-context-menu-item
                label="React App"
                value="tpl-react"
              ></punica-context-menu-item>
              <punica-context-menu-item
                label="FastAPI Service"
                value="tpl-fastapi"
              ></punica-context-menu-item>
              <punica-context-menu-item
                label="Next.js App"
                value="tpl-next"
              ></punica-context-menu-item>
            </punica-context-menu-item>
          </punica-context-menu-item>

          <punica-context-menu-separator></punica-context-menu-separator>

          <punica-context-menu-item label="Refactor" icon="🧩">
            <punica-context-menu-item
              label="Rename Symbol…"
              value="rename"
              keyboard="F2"
              icon="✏️"
            ></punica-context-menu-item>
            <punica-context-menu-item label="Extract…" icon="🪄">
              <punica-context-menu-item
                label="to Function"
                value="extract-fn"
              ></punica-context-menu-item>
              <punica-context-menu-item
                label="to Variable"
                value="extract-var"
              ></punica-context-menu-item>
            </punica-context-menu-item>
            <punica-context-menu-item
              label="Convert to…"
              icon="🔁"
              disabled
            ></punica-context-menu-item>
          </punica-context-menu-item>

          <punica-context-menu-separator></punica-context-menu-separator>

          <punica-context-menu-item
            label="Delete"
            value="delete"
            icon="🗑"
            keyboard="⌘⌫"
          ></punica-context-menu-item>
        </punica-context-menu>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
