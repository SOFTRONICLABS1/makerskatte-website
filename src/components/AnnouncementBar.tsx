import React from 'react';

type Props = {
  text: string;
};

export default function AnnouncementBar({ text }: Props) {
  return <div className="announcement">{text}</div>;
}
