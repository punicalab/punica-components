import { Suspense, lazy } from 'react';
import useDynamicScript from '../hooks/useDynamicScript';
import loadComponent from '../loadComponent';
import { ISystem } from '../model';

const System = (props: ISystemProps) => {
  const { system, params } = props;
  const { module, url, scope } = system;
  const { ready, failed } = useDynamicScript(url);

  if (!ready || failed) {
    return <h2></h2>;
  }

  const Component = lazy(loadComponent(scope, module));

  return (
    <Suspense fallback="">
      <Component {...params} />
    </Suspense>
  );
};

interface ISystemProps {
  system: ISystem;
  params: any;
}

export default System;
