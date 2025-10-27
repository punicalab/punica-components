import { Module as Layout } from '@/layouts/module';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 500;
const MAX_ITEMS = 4000;

const Module = () => {
  const { t } = useTranslation();

  /**
   *
   * @param offset
   * @param count
   * @returns
   */
  const makeData = useCallback((offset, count) => {
    const arr = new Array(count);
    for (let i = 0; i < count; i++) {
      const n = offset + i + 1;
      arr[i] = {
        firstName: 'User',
        lastName: String(n),
        company: 'Eventpack',
        title: 'Designer'
      };
    }
    return arr;
  }, []);

  /**
   *
   */
  useEffect(() => {
    const vlist = document.getElementById('vlist') as any;
    const meta = document.getElementById('meta');
    const rowScript = document.getElementById(
      'row-template'
    ) as HTMLScriptElement;

    const tpl = document.createElement('template');
    tpl.innerHTML = rowScript.textContent || '';

    vlist.setRenderer((host, item) => {
      const node = tpl.content.firstElementChild!.cloneNode(true) as Element;
      const nameP = node.querySelector('.name');
      const companyP = node.querySelector('.participant-company p');
      const titleP = node.querySelector('.participant-job-title p');
      const avatar = node.querySelector(
        '.dynamic-content-user-avatar'
      ) as HTMLElement | null;

      if (nameP) nameP.textContent = `${item.firstName} ${item.lastName}`;
      if (companyP) {
        companyP.textContent = item.company || '';
        (companyP.parentElement as HTMLElement).toggleAttribute(
          'hidden',
          !item.company
        );
      }
      if (titleP) {
        titleP.textContent = item.title || '';
        (titleP.parentElement as HTMLElement).toggleAttribute(
          'hidden',
          !item.title
        );
      }
      if (avatar) {
        avatar.textContent = (
          (item.firstName?.[0] || '') + (item.lastName?.[0] || '')
        ).toUpperCase();
        avatar.dataset.firstName = item.firstName || '';
        avatar.dataset.lastName = item.lastName || '';
      }

      host.appendChild(node);
    });

    let loading = false;
    vlist.setData(makeData(0, PAGE_SIZE));
    updateMeta();

    vlist.onNearEnd = async (fromIndex) => {
      if (loading) return;
      const current = (vlist.items || []).length;
      if (current >= MAX_ITEMS) return;

      loading = true;

      await new Promise((r) => setTimeout(r, 150));

      const canAdd = Math.min(PAGE_SIZE, MAX_ITEMS - current);
      const more = makeData(current, canAdd);
      vlist.setData([...(vlist.items || []), ...more]);
      loading = false;
      updateMeta();
    };

    function updateMeta() {
      const n = (vlist.items || []).length;
      meta.textContent = `Kayıt: ${n} / ${MAX_ITEMS} • Sayfa boyutu: ${PAGE_SIZE}`;
    }
  }, []);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.virtual.list')} />
      <Layout.Content>
        <header>
          <strong>virtual-list</strong>
          <span id="meta"></span>
        </header>
        <script id="row-template" type="text/template">
          {`<punica-list-view-item>
              <div class="dynamic-content-user-avatar" slot="startAdornment"
                  style="align-items:center;background-color:#DBE0E4;border-radius:24px;color:#000;display:flex;font-size:20px;height:36px;justify-content:center;overflow:hidden;width:36px;">
                EE
              </div>
              <div slot="icon">
                <svg aria-hidden="true" viewBox="0 0 576 512" width="18" height="18">
                  <path fill="currentColor"
                    d="M541 229.16 512 206.63V104a24 24 0 0 0-24-24h-56a24 24 0 0 0-24 24v24.6L314.52 43a35.34 35.34 0 0 0-45 0L35 229.16a12 12 0 0 0-1.6 16.9l25.5 31a12 12 0 0 0 16.9 1.6l22.1-18.2V456a24 24 0 0 0 24 24h112a24 24 0 0 0 24-24V360h96v96a24 24 0 0 0 24 24h112a24 24 0 0 0 24-24V260.46l22.1 18.2a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.6-16.9z"/>
                </svg>
              </div>
              <punica-row slot="label" class="name">
              sdfds
              </punica-row>
            </punica-list-view-item>`}
        </script>
        <punica-virtual-list id="vlist" itemheight={48} overscan={6} />
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
