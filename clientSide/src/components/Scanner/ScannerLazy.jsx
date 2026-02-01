import React, { lazy, Suspense } from 'react';

// Lazy load the Scanner component
const ScannerComponent = lazy(() => import('./Scanner'));

/**
 * Lazy-loaded Scanner wrapper
 * Reduces initial bundle size by loading scanner only when needed
 */
const ScannerLazy = (props) => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 9999,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <div>Loading scanner...</div>
          </div>
        </div>
      }
    >
      <ScannerComponent {...props} />
    </Suspense>
  );
};

export default ScannerLazy;
