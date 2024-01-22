import { ReactElement } from 'react';
import { ISystem } from './model';
import { System, SystemWithSkeleton } from './system';

const FragmentLoader = (props: {
  system: ISystem;
  params?: any;
  skeleton?: ReactElement;
}) => {
  const { system, skeleton, params = {} } = props;

  return (
    <>
      {skeleton == null && <System system={system} params={params} />}
      {skeleton && (
        <SystemWithSkeleton
          system={system}
          params={params}
          skeleton={skeleton}
        />
      )}
    </>
  );
};

export default FragmentLoader;
