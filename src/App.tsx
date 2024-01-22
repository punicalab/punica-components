import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { SiteMap } from '@/siteMap';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/translate';
import './theme';

const router = createBrowserRouter(SiteMap);

export default () => {
  return (
    <I18nextProvider i18n={i18next}>
      <RouterProvider router={router} />
    </I18nextProvider>
  );
};
