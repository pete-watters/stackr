import { useRef, useState, useEffect, type ReactNode, type SVGAttributes } from 'react';

export interface ChartContainerProps extends Omit<SVGAttributes<SVGSVGElement>, 'viewBox'> {
  width?: number;
  height?: number;
  responsive?: boolean;
  children: ReactNode;
}

export function ChartContainer({
  width = 400,
  height = 200,
  responsive = true,
  children,
  style,
  ...props
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width);

  useEffect(() => {
    if (!responsive || !containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [responsive]);

  const svgWidth = responsive ? containerWidth : width;

  return (
    <div ref={containerRef} style={{ width: '100%', ...style }}>
      <svg
        width={svgWidth}
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        {...props}
      >
        {children}
      </svg>
    </div>
  );
}
