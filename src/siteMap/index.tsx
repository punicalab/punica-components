import MainMasterPage from '@/masterPage';
import { CustomRouteObject } from '@/model';
import Startup from '@/startup';
import { ModuleLoader } from '@/utils';

export const SiteMap: Array<CustomRouteObject> = [
  {
    path: '/',
    element: (
      <MainMasterPage>
        <Startup />
      </MainMasterPage>
    ),
    children: [
      {
        translateKey: 'component.accordion',
        index: true,
        path: '/',
        element: <ModuleLoader module="accordion" />
      },
      {
        translateKey: 'component.alert',
        path: '/alert',
        element: <ModuleLoader module="alert" />
      },
      {
        translateKey: 'component.avatar',
        path: '/avatar',
        element: <ModuleLoader module="avatar" />
      },
      {
        translateKey: 'component.badge',
        path: '/badge',
        element: <ModuleLoader module="badge" />
      },
      {
        translateKey: 'component.box',
        path: '/box',
        element: <ModuleLoader module="box" />
      },
      {
        translateKey: 'component.button',
        path: '/button',
        element: <ModuleLoader module="button" />
      },
      {
        translateKey: 'component.card',
        path: '/card',
        element: <ModuleLoader module="card" />
      },
      {
        translateKey: 'component.checkbox',
        path: '/checkbox',
        element: <ModuleLoader module="checkbox" />
      },
      {
        translateKey: 'component.chip',
        path: '/chip',
        element: <ModuleLoader module="chip" />
      },
      {
        translateKey: 'component.container',
        path: '/container',
        element: <ModuleLoader module="container" />
      },
      {
        translateKey: 'component.dialog',
        path: '/dialog',
        element: <ModuleLoader module="dialog" />
      },
      {
        translateKey: 'component.divider',
        path: '/divider',
        element: <ModuleLoader module="divider" />
      },
      {
        translateKey: 'component.drawer',
        path: '/drawer',
        element: <ModuleLoader module="drawer" />
      },
      {
        translateKey: 'component.grid',
        path: '/grid',
        element: <ModuleLoader module="grid" />
      },
      {
        translateKey: 'component.hidden',
        path: '/hidden',
        element: <ModuleLoader module="hidden" />
      },
      {
        translateKey: 'component.icon',
        path: '/icon',
        element: <ModuleLoader module="icon" />
      },
      {
        translateKey: 'component.iconButton',
        path: '/iconButton',
        element: <ModuleLoader module="iconButton" />
      },
      {
        translateKey: 'component.input',
        path: '/input',
        element: <ModuleLoader module="input" />
      },
      {
        translateKey: 'component.menu',
        path: '/menu',
        element: <ModuleLoader module="menu" />
      },
      {
        translateKey: 'component.modal',
        path: '/modal',
        element: <ModuleLoader module="modal" />
      },
      {
        translateKey: 'component.multiSelectList',
        path: '/multiSelectList',
        element: <ModuleLoader module="multiSelectList" />
      },
      {
        translateKey: 'component.pagination',
        path: '/pagination',
        element: <ModuleLoader module="pagination" />
      },
      {
        translateKey: 'component.paper',
        path: '/paper',
        element: <ModuleLoader module="paper" />
      },
      {
        translateKey: 'component.popover',
        path: '/popover',
        element: <ModuleLoader module="popover" />
      },
      {
        translateKey: 'component.select',
        path: '/select',
        element: <ModuleLoader module="select" />
      },
      {
        translateKey: 'component.singleSelectList',
        path: '/singleSelectList',
        element: <ModuleLoader module="singleSelectList" />
      },
      {
        translateKey: 'component.skeleton',
        path: '/skeleton',
        element: <ModuleLoader module="skeleton" />
      },
      {
        translateKey: 'component.switch',
        path: '/switch',
        element: <ModuleLoader module="switch" />
      },
      {
        translateKey: 'component.tab',
        path: '/tab',
        element: <ModuleLoader module="tab" />
      },
      {
        translateKey: 'component.textarea',
        path: '/textarea',
        element: <ModuleLoader module="textarea" />
      },
      {
        translateKey: 'component.typography',
        path: '/typography',
        element: <ModuleLoader module="typography" />
      }
    ]
  }
];
