import { ReactElement } from 'react';
import { IndexRouteObject, NonIndexRouteObject } from 'react-router-dom';

type CustomRouteObjectParams = {
  authority?: string | Array<string>;
  translateKey?: string;
  icon?: ReactElement;
};

type CustomIndexRouteObject = IndexRouteObject & CustomRouteObjectParams;

type CustomNonIndexRouteObject = Omit<NonIndexRouteObject, 'children'> &
  CustomRouteObjectParams & {
    children?: (CustomIndexRouteObject | CustomNonIndexRouteObject)[];
  };

export type CustomRouteObject =
  | CustomIndexRouteObject
  | CustomNonIndexRouteObject;
