import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  rootId: string;
}

const Portal: React.FC<Props> = ({ children, rootId = 'portal-root' }) => {
  const mount = document.getElementById(rootId);

  return mount ? createPortal(children, mount) : <>{children}</>;
};

export default Portal;
