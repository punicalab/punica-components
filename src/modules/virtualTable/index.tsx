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
    const tbl = document.getElementById('vtable') as any;

    tbl.setRenderer((host, item, i) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      td1.textContent = `${item.firstName} ${item.lastName}`;
      const td2 = document.createElement('td');
      td2.textContent = item.company || '';
      td2.setAttribute('align', 'center');
      const td3 = document.createElement('td');
      td3.textContent = item.title || '';
      td3.setAttribute('align', 'center');
      tr.append(td1, td2, td3);

      host.appendChild(tr);
    });

    tbl.setData(makeData(0, PAGE_SIZE));

    let loading = false;
    tbl.onNearEnd = async (from) => {
      if (loading) return;
      const curr = (tbl.items || []).length;
      if (curr >= MAX_ITEMS) return;
      loading = true;
      await new Promise((r) => setTimeout(r, 120));
      const add = Math.min(PAGE_SIZE, MAX_ITEMS - curr);
      tbl.setData([...(tbl.items || []), ...makeData(curr, add)]);
      loading = false;
    };
  }, []);

  return (
    <Layout.Main>
      <Layout.Header title={t('component.virtual.list')} />
      <Layout.Content>
        <punica-virtual-table
          id="vtable"
          itemheight={48}
          overscan={6}
        ></punica-virtual-table>
      </Layout.Content>
    </Layout.Main>
  );
};

export default Module;
