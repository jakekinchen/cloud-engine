"use client";

import React from 'react';
import CloudBackdropReview from './CloudBackdropReview';

type Props = {
  className?: string;
  initial?: Parameters<typeof CloudBackdropReview>[0]['initial'];
};

const CloudShowcase: React.FC<Props> = ({ className, initial }) => {
  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: 'min(100%, 1200px)', margin: '0 auto' }}>
        <CloudBackdropReview initial={initial} />
      </div>
    </div>
  );
};

export default CloudShowcase;


