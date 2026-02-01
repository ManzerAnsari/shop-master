/**
 * Device Detection Utilities
 * Provides functions to detect device type, OS, and capabilities
 */

/**
 * Detect device type
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 */
export const detectDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
};

/**
 * Check if device is mobile
 * @returns {boolean}
 */
export const isMobileDevice = () => {
  return detectDeviceType() === 'mobile';
};

/**
 * Check if device is tablet
 * @returns {boolean}
 */
export const isTabletDevice = () => {
  return detectDeviceType() === 'tablet';
};

/**
 * Check if device is desktop
 * @returns {boolean}
 */
export const isDesktopDevice = () => {
  return detectDeviceType() === 'desktop';
};

/**
 * Check if device is iOS
 * @returns {boolean}
 */
export const isIOS = () => {
  return /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
};

/**
 * Check if device is Android
 * @returns {boolean}
 */
export const isAndroid = () => {
  return /android/i.test(navigator.userAgent.toLowerCase());
};

/**
 * Check if device is Windows
 * @returns {boolean}
 */
export const isWindows = () => {
  return /windows/i.test(navigator.userAgent.toLowerCase());
};

/**
 * Check if device is Mac
 * @returns {boolean}
 */
export const isMac = () => {
  return /macintosh|mac os x/i.test(navigator.userAgent.toLowerCase());
};

/**
 * Get device OS
 * @returns {string} 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown'
 */
export const getDeviceOS = () => {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  if (isWindows()) return 'windows';
  if (isMac()) return 'mac';
  if (/linux/i.test(navigator.userAgent.toLowerCase())) return 'linux';
  return 'unknown';
};

/**
 * Check if device has touch support
 * @returns {boolean}
 */
export const hasTouchSupport = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Check if device is in portrait orientation
 * @returns {boolean}
 */
export const isPortrait = () => {
  return window.innerHeight > window.innerWidth;
};

/**
 * Check if device is in landscape orientation
 * @returns {boolean}
 */
export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Get screen size category
 * @returns {string} 'small' | 'medium' | 'large' | 'xlarge'
 */
export const getScreenSize = () => {
  const width = window.innerWidth;
  
  if (width < 640) return 'small';
  if (width < 1024) return 'medium';
  if (width < 1280) return 'large';
  return 'xlarge';
};

/**
 * Check if device supports camera
 * @returns {Promise<boolean>}
 */
export const hasCameraSupport = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Failed to check camera support:', error);
    return false;
  }
};

/**
 * Get device information object
 * @returns {Promise<Object>} Device information
 */
export const getDeviceInfo = async () => {
  return {
    type: detectDeviceType(),
    os: getDeviceOS(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isDesktop: isDesktopDevice(),
    hasTouch: hasTouchSupport(),
    orientation: isPortrait() ? 'portrait' : 'landscape',
    screenSize: getScreenSize(),
    hasCamera: await hasCameraSupport(),
    userAgent: navigator.userAgent,
  };
};

/**
 * Get recommended camera facing mode for device
 * @returns {string} 'environment' | 'user'
 */
export const getRecommendedCameraFacing = () => {
  const deviceType = detectDeviceType();
  
  // Mobile and tablet devices should use rear camera by default
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    return 'environment';
  }
  
  // Desktop devices should use front camera (webcam) by default
  return 'user';
};

export default {
  detectDeviceType,
  isMobileDevice,
  isTabletDevice,
  isDesktopDevice,
  isIOS,
  isAndroid,
  isWindows,
  isMac,
  getDeviceOS,
  hasTouchSupport,
  isPortrait,
  isLandscape,
  getScreenSize,
  hasCameraSupport,
  getDeviceInfo,
  getRecommendedCameraFacing,
};
