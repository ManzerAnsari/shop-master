// Scanner configuration and supported formats
export const SCANNER_CONFIG = {
  // Supported barcode formats
  supportedFormats: [
    'UPC_A',
    'UPC_E',
    'EAN_8',
    'EAN_13',
    'CODE_128',
    'CODE_39',
    'QR_CODE',
  ],

  // Scanner settings
  fps: 10, // Frames per second for scanning
  qrbox: { width: 250, height: 250 }, // Scan box dimensions
  aspectRatio: 1.0, // Camera aspect ratio

  // Scan behavior
  scanDelay: 500, // Milliseconds between scans to prevent duplicates
  beepOnScan: true, // Audio feedback on successful scan
  vibrateOnScan: true, // Haptic feedback on mobile devices
  vibrateDuration: 200, // Vibration duration in ms

  // Camera preferences
  preferredCamera: 'environment', // 'environment' for rear camera, 'user' for front
  
  // Retry settings
  maxRetries: 3, // Maximum decode attempts for damaged barcodes
  retryDelay: 1000, // Delay between retry attempts in ms
};

// Scanner modes
export const SCANNER_MODES = {
  LOOKUP: 'lookup',
  CHECKOUT: 'checkout',
  INVENTORY: 'inventory',
};

// Barcode format display names
export const BARCODE_FORMAT_NAMES = {
  UPC_A: 'UPC-A',
  UPC_E: 'UPC-E',
  EAN_8: 'EAN-8',
  EAN_13: 'EAN-13',
  CODE_128: 'Code 128',
  CODE_39: 'Code 39',
  QR_CODE: 'QR Code',
};

export default SCANNER_CONFIG;
