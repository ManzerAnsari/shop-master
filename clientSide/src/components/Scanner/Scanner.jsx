import React, { useState, useEffect, useRef } from 'react';
import scannerService from '../../services/scannerService';
import { SCANNER_MODES } from '../../config/scannerConfig';
import './Scanner.css';

const Scanner = ({ mode = SCANNER_MODES.LOOKUP, onScan, onClose, isOpen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const scannerInitialized = useRef(false);

  const SCAN_COOLDOWN = 1000; // 1 second cooldown between scans

  useEffect(() => {
    if (isOpen && !scannerInitialized.current) {
      initializeScanner();
    }

    return () => {
      if (scannerInitialized.current) {
        cleanup();
      }
    };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      // ESC to close
      if (e.key === 'Escape') {
        handleClose();
      }
      
      // C to switch camera
      if (e.key === 'c' || e.key === 'C') {
        if (cameras.length > 1 && !isLoading && !error) {
          handleSwitchCamera();
        }
      }
      
      // R to retry
      if (e.key === 'r' || e.key === 'R') {
        if (error && error.showRetry) {
          handleRetry();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, cameras, isLoading, error]);

  const initializeScanner = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check camera permissions
      const hasPermission = await scannerService.checkCameraPermissions();
      if (!hasPermission) {
        // Try to request permission by initializing
        await scannerService.initializeScanner('scanner-video');
      }

      // Get available cameras
      const availableCameras = await scannerService.getCameras();
      if (availableCameras.length === 0) {
        throw new Error('No cameras found on this device');
      }

      setCameras(availableCameras);

      // Initialize and start scanning
      await scannerService.initializeScanner('scanner-video');
      await scannerService.startScanning(handleScanDetection);

      scannerInitialized.current = true;
      setIsLoading(false);
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleScanDetection = (result) => {
    // Implement cooldown to prevent duplicate scans
    const now = Date.now();
    if (now - lastScanTime < SCAN_COOLDOWN) {
      return;
    }

    setLastScanTime(now);
    setShowSuccess(true);

    // Hide success message after animation
    setTimeout(() => {
      setShowSuccess(false);
    }, 1000);

    // Call parent callback
    if (onScan) {
      onScan(result);
    }
  };

  const handleSwitchCamera = async () => {
    try {
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);

      await scannerService.switchCamera(
        cameras[nextIndex].id,
        handleScanDetection
      );
    } catch (err) {
      console.error('Failed to switch camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  };

  const cleanup = async () => {
    try {
      await scannerService.clear();
      scannerInitialized.current = false;
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  const handleClose = async () => {
    await cleanup();
    if (onClose) {
      onClose();
    }
  };

  const handleRetry = () => {
    setError(null);
    initializeScanner();
  };

  const getErrorMessage = (err) => {
    const message = err.message || err.toString();

    if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
      return {
        title: 'Camera Access Denied',
        message: 'Please allow camera access in your browser settings to use the scanner.',
        showRetry: true,
        showManualEntry: true,
      };
    }

    if (message.includes('No cameras found')) {
      return {
        title: 'No Camera Found',
        message: 'No camera was detected on your device. You can use manual entry instead.',
        showRetry: false,
        showManualEntry: true,
      };
    }

    if (message.includes('in use') || message.includes('NotReadableError')) {
      return {
        title: 'Camera In Use',
        message: 'The camera is being used by another application. Please close other apps and try again.',
        showRetry: true,
        showManualEntry: true,
      };
    }

    return {
      title: 'Scanner Error',
      message: 'Failed to start the scanner. Please try again or use manual entry.',
      showRetry: true,
      showManualEntry: true,
    };
  };

  const getModeInstructions = () => {
    switch (mode) {
      case SCANNER_MODES.CHECKOUT:
        return 'Scan product barcodes to add them to the cart';
      case SCANNER_MODES.INVENTORY:
        return 'Scan products to update inventory levels';
      case SCANNER_MODES.LOOKUP:
      default:
        return 'Position the barcode or QR code within the frame';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="scanner-modal" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
      <div className="scanner-header">
        <div id="scanner-title" className="scanner-title">
          {mode === SCANNER_MODES.CHECKOUT && 'Scan to Add Product'}
          {mode === SCANNER_MODES.INVENTORY && 'Scan for Inventory'}
          {mode === SCANNER_MODES.LOOKUP && 'Scan Product'}
        </div>
        <button 
          className="scanner-close-btn" 
          onClick={handleClose} 
          aria-label="Close scanner (Press ESC)"
          title="Close (ESC)"
        >
          ×
        </button>
      </div>

      <div className="scanner-container" role="region" aria-label="Camera scanner view">
        <div id="scanner-video"></div>

        {!isLoading && !error && (
          <>
            <div className="scanner-overlay">
              <div className="scanner-corners">
                <div className="scanner-corner top-left"></div>
                <div className="scanner-corner top-right"></div>
                <div className="scanner-corner bottom-left"></div>
                <div className="scanner-corner bottom-right"></div>
              </div>
            </div>

            <div className="scanner-instructions">
              <div>{getModeInstructions()}</div>
              <div className="scanner-shortcuts" aria-label="Keyboard shortcuts">
                <small>
                  ESC: Close | {cameras.length > 1 ? 'C: Switch Camera | ' : ''}
                  {error?.showRetry ? 'R: Retry' : ''}
                </small>
              </div>
            </div>

            {cameras.length > 1 && (
              <div className="scanner-controls">
                <button 
                  className="scanner-control-btn" 
                  onClick={handleSwitchCamera}
                  aria-label="Switch camera (Press C)"
                  title="Switch Camera (C)"
                >
                  <span aria-hidden="true">🔄</span>
                  Switch Camera
                </button>
              </div>
            )}
          </>
        )}

        {isLoading && (
          <div className="scanner-loading" role="status" aria-live="polite">
            <div className="scanner-spinner" aria-hidden="true"></div>
            <div>Initializing camera...</div>
          </div>
        )}

        {error && (
          <div className="scanner-error" role="alert" aria-live="assertive">
            <div className="scanner-error-title">{error.title}</div>
            <div className="scanner-error-message">{error.message}</div>
            <div className="scanner-error-actions">
              {error.showRetry && (
                <button 
                  className="scanner-error-btn" 
                  onClick={handleRetry}
                  aria-label="Try again (Press R)"
                  title="Try Again (R)"
                >
                  Try Again
                </button>
              )}
              {error.showManualEntry && mode === SCANNER_MODES.LOOKUP && (
                <button
                  className="scanner-error-btn scanner-error-btn-secondary"
                  onClick={() => {
                    handleClose();
                    // Manual entry will be handled by parent component
                  }}
                  aria-label="Use manual entry instead"
                >
                  Manual Entry
                </button>
              )}
              <button
                className="scanner-error-btn scanner-error-btn-secondary"
                onClick={handleClose}
                aria-label="Close scanner (Press ESC)"
                title="Close (ESC)"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="scanner-success-feedback" role="status" aria-live="polite">
            <span aria-hidden="true">✓</span> Scanned!
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
