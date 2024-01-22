import { lazy, ReactElement, Suspense } from 'react';
import useDynamicScript from '../hooks/useDynamicScript';
import loadComponent from '../loadComponent';
import { ISystem } from '../model';

const System = (props: ISystemProps) => {
  const { system, params, skeleton } = props;
  const { module, url, scope } = system;
  const { ready, failed } = useDynamicScript(url);

  if (!ready || failed) {
    return skeleton;
  }

  const Component = lazy(loadComponent(scope, module));

  return (
    <Suspense fallback={skeleton}>
      <Component {...params} />
    </Suspense>
  );
};

interface ISystemProps {
  system: ISystem;
  params: any;
  skeleton: ReactElement;
}

export default System;
