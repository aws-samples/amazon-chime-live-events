import React from 'react';
import RcTooltip from 'rc-tooltip';

type Position = 'top' | 'right' | 'bottom' | 'left';

const Tooltip = ({
  position = 'top',
  tooltip,
  children,
}: {
  children: React.ReactElement;
  tooltip: string;
  position?: Position;
}) => (
  <RcTooltip
    mouseLeaveDelay={0}
    placement={position}
    trigger={['hover', 'focus']}
    overlay={<div>{tooltip}</div>}
  >
    {children}
  </RcTooltip>
);

export default Tooltip;
