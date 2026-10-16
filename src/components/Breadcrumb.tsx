import React from 'react';
import Link from 'next/link';

type Crumb = {
  label: string;
  to?: string;
};

type Props = {
  items: Crumb[];
};

export default function Breadcrumb({ items }: Props) {
  return (
    <div className="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const content = item.to && isLast === false ? (
          <Link href={item.to}>{item.label}</Link>
        ) : (
          <span>{item.label}</span>
        );
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {content}
            {isLast ? null : <span>›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}
