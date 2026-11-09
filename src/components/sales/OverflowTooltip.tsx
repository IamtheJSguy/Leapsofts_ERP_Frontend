import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip, type TooltipProps } from '@mui/material';

type OverflowTooltipProps = TooltipProps & {
  title: string;
  children: React.ReactElement;
};

export const OverflowTooltip = ({ title, children, ...props }: OverflowTooltipProps) => {
  const textElementRef = useRef<HTMLElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    if (textElementRef.current) {
      setIsOverflowing(textElementRef.current.scrollWidth > textElementRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow]);

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        ref: textElementRef,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          checkOverflow();
          const childProps = children.props as { onMouseEnter?: (ev: React.MouseEvent<HTMLElement>) => void };
          childProps.onMouseEnter?.(e);
        },
      } as Record<string, unknown>)
    : (
        <span
          ref={textElementRef}
          onMouseEnter={checkOverflow}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {children}
        </span>
      );

  return (
    <Tooltip title={title} disableHoverListener={!isOverflowing} {...props}>
      {child}
    </Tooltip>
  );
};
