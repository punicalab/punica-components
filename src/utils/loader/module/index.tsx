import { lazy, Suspense } from 'react';

const ModuleLoader = (props: { module: string }) => {
  const { module } = props;
  const LazyElement = lazy(() => import(`@/modules/${module}`));

  return (
    <Suspense fallback="">
      <LazyElement />
    </Suspense>
  );
};

export default ModuleLoader;
