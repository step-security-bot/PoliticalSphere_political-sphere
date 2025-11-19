/**
 * Skeleton Loading Components
 * Provides skeleton placeholders for better perceived performance
 * WCAG 2.2 AA Compliant
 */

import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  animate = true,
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  return (
    <div
      className={`skeleton ${animate ? 'skeleton-animate' : ''} ${className}`}
      style={style}
      role="presentation"
      aria-hidden="true"
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  width = '100%',
  height = '1rem',
  className = '',
}) => {
  const skeletonLines = Array.from({ length: lines }, (_, index) => {
    // Make lines progressively shorter for more realistic text appearance
    const lineWidth = index === lines - 1 ? '60%' : width;
    return (
      <Skeleton
        key={index}
        width={lineWidth}
        height={height}
        className={`skeleton-text-line ${index > 0 ? 'skeleton-text-line-margin' : ''}`}
      />
    );
  });

  return (
    <div className={`skeleton-text ${className}`} role="presentation" aria-hidden="true">
      {skeletonLines}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showContent?: boolean;
  contentLines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = true,
  showTitle = true,
  showSubtitle = true,
  showContent = true,
  contentLines = 2,
}) => {
  return (
    <div className={`skeleton-card ${className}`} role="presentation" aria-hidden="true">
      {showAvatar && (
        <Skeleton width={40} height={40} borderRadius="50%" className="skeleton-card-avatar" />
      )}

      <div className="skeleton-card-content">
        {showTitle && <Skeleton width="70%" height="1.25rem" className="skeleton-card-title" />}

        {showSubtitle && (
          <Skeleton width="50%" height="0.875rem" className="skeleton-card-subtitle" />
        )}

        {showContent && (
          <SkeletonText lines={contentLines} height="0.875rem" className="skeleton-card-text" />
        )}
      </div>
    </div>
  );
};

interface SkeletonListProps {
  items?: number;
  className?: string;
  itemProps?: Omit<SkeletonCardProps, 'className'>;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 3,
  className = '',
  itemProps = {},
}) => {
  const skeletonItems = Array.from({ length: items }, (_, index) => (
    <SkeletonCard key={index} className="skeleton-list-item" {...itemProps} />
  ));

  return (
    <div className={`skeleton-list ${className}`} role="presentation" aria-hidden="true">
      {skeletonItems}
    </div>
  );
};

export default Skeleton;
