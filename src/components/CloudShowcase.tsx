"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import type { Init as CloudInit } from './CloudBackdropReview';

const CloudBackdropReview = dynamic(() => import('./CloudBackdropReview'), {
  ssr: false,
  loading: () => <div style={{ width: 'min(100%, 1200px)', margin: '0 auto', height: 380 }} />,
});

type Props = {
  className?: string;
  initial?: CloudInit;
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


