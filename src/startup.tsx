import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

const Startup = () => {
  const [start, setStart] = useState(false);

  /**
   *
   */
  useEffect(() => {
    setStart(true);
  }, []);

  return start ? <Outlet /> : <></>;
};

export default Startup;
