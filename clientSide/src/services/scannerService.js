import { Html5Qrcode } from 'html5-qrcode';
import { SCANNER_CONFIG } from '../config/scannerConfig';
import performanceMonitor from '../utils/performanceMonitor';

/**
 * Scanner Service
 * Handles barcode and QR code scanning using device camera
 */

class ScannerService {
  constructor() {
    this.scanner = null;
    this.isScanning = false;
    this.currentCameraId = null;
  }

  /**
   * Initialize scanner with camera stream
   * @param {string} elementId - ID of the HTML element to render camera feed
   * @param {Object} options - Scanner configuration options
   * @returns {Promise<Html5Qrcode>} Initialized scanner instance
   */
  async initializeScanner(elementId, options = {}) {
    return performanceMonitor.measure('Scanner Initialization', async () => {
      try {
        // Create scanner instance
        this.scanner = new Html5Qrcode(elementId);
        
        // Merge default config with custom options
        const config = {
          fps: options.fps || SCANNER_CONFIG.fps,
          qrbox: options.qrbox || SCANNER_CONFIG.qrbox,
          aspectRatio: options.aspectRatio || SCANNER_CONFIG.aspectRatio,
          formatsToSupport: options.formats || SCANNER_CONFIG.supportedFormats,
        };

        return { scanner: this.scanner, config };
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
        throw new Error('Scanner initialization failed: ' + error.message);
      }
    });
  }

  /**
   * Start continuous scanning
   * @param {Function} onDetect - Callback function when code is detected
   * @param {Object} config - Scanner configuration
   * @returns {Promise<void>}
   */
  async startScanning(onDetect, config = {}) {
    if (!this.scanner) {
      throw new Error('Scanner not initialized. Call initializeScanner first.');
    }

    if (this.isScanning) {
      console.warn('Scanner is already running');
      return;
    }

    try {
      const cameras = await this.getCameras();
      
      if (cameras.length === 0) {
        throw new Error('No cameras found on this device');
      }

      // Select camera (prefer rear camera on mobile)
      this.currentCameraId = this.selectCamera(cameras);

      const scanConfig = {
        fps: config.fps || SCANNER_CONFIG.fps,
        qrbox: config.qrbox || SCANNER_CONFIG.qrbox,
        aspectRatio: config.aspectRatio || SCANNER_CONFIG.aspectRatio,
        formatsToSupport: config.formats || SCANNER_CONFIG.supportedFormats,
      };

      // Initialize retry tracking
      this.decodeFailureCount = 0;
      this.lastDecodeAttempt = Date.now();

      // Start scanning
      await this.scanner.start(
        this.currentCameraId,
        scanConfig,
        (decodedText, decodedResult) => {
          // Reset failure count on successful scan
          this.decodeFailureCount = 0;
          
          // Check if format is supported
          const formatName = decodedResult.result.format.formatName;
          if (!this.isSupportedFormat(formatName)) {
            console.warn('Unsupported barcode format:', formatName);
            // Still call onDetect but with warning flag
            onDetect({
              code: decodedText,
              type: formatName.includes('QR') ? 'qr' : 'barcode',
              format: formatName,
              timestamp: new Date(),
              unsupported: true,
            });
            return;
          }
          
          // Provide feedback
          this.provideFeedback();
          
          // Call the detection callback
          onDetect({
            code: decodedText,
            type: formatName.includes('QR') ? 'qr' : 'barcode',
            format: formatName,
            timestamp: new Date(),
          });
        },
        (errorMessage) => {
          // Handle decode failures with retry logic
          this.handleDecodeError(errorMessage);
        }
      );

      this.isScanning = true;
    } catch (error) {
      console.error('Failed to start scanning:', error);
      throw new Error('Failed to start camera: ' + error.message);
    }
  }

  /**
   * Handle decode errors with retry logic
   * @param {string} errorMessage - Error message from scanner
   */
  handleDecodeError(errorMessage) {
    // Ignore routine "not found" messages
    if (errorMessage.includes('NotFoundException')) {
      return;
    }

    // Track decode failures
    const now = Date.now();
    if (now - this.lastDecodeAttempt < 5000) {
      this.decodeFailureCount++;
    } else {
      this.decodeFailureCount = 1;
    }
    this.lastDecodeAttempt = now;

    // Log persistent failures
    if (this.decodeFailureCount >= 10) {
      console.warn('Multiple decode failures detected. Barcode may be damaged or partially visible.');
      this.decodeFailureCount = 0; // Reset to avoid spam
    }

    // Log other errors
    if (!errorMessage.includes('NotFoundException')) {
      console.debug('Scan error:', errorMessage);
    }
  }

  /**
   * Check if barcode format is supported
   * @param {string} formatName - Format name from scanner
   * @returns {boolean}
   */
  isSupportedFormat(formatName) {
    const supportedFormats = SCANNER_CONFIG.supportedFormats.map(f => f.toLowerCase());
    return supportedFormats.some(format => formatName.toLowerCase().includes(format));
  }

  /**
   * Stop scanning and release camera
   * @returns {Promise<void>}
   */
  async stopScanning() {
    if (!this.scanner) {
      return;
    }

    try {
      if (this.isScanning) {
        await this.scanner.stop();
        this.isScanning = false;
        this.currentCameraId = null;
      }
    } catch (error) {
      console.error('Failed to stop scanner:', error);
      throw new Error('Failed to stop camera: ' + error.message);
    }
  }

  /**
   * Get list of available cameras
   * @returns {Promise<Array>} Array of camera devices
   */
  async getCameras() {
    try {
      const devices = await Html5Qrcode.getCameras();
      return devices || [];
    } catch (error) {
      console.error('Failed to get cameras:', error);
      return [];
    }
  }

  /**
   * Switch to a different camera
   * @param {string} cameraId - ID of the camera to switch to
   * @param {Function} onDetect - Callback function for detections
   * @param {Object} config - Scanner configuration
   * @returns {Promise<void>}
   */
  async switchCamera(cameraId, onDetect, config = {}) {
    try {
      // Stop current scanning
      await this.stopScanning();
      
      // Update camera ID
      this.currentCameraId = cameraId;
      
      // Restart with new camera
      await this.startScanning(onDetect, config);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw new Error('Failed to switch camera: ' + error.message);
    }
  }

  /**
   * Detect device type
   * @returns {string} 'mobile' | 'tablet' | 'desktop'
   */
  detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
    
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  }

  /**
   * Check if device is mobile
   * @returns {boolean}
   */
  isMobileDevice() {
    return this.detectDeviceType() === 'mobile';
  }

  /**
   * Check if device is iOS
   * @returns {boolean}
   */
  isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
  }

  /**
   * Check if device is Android
   * @returns {boolean}
   */
  isAndroid() {
    return /android/i.test(navigator.userAgent.toLowerCase());
  }

  /**
   * Select appropriate camera based on device and preferences
   * @param {Array} cameras - Available camera devices
   * @returns {string} Selected camera ID
   */
  selectCamera(cameras) {
    if (cameras.length === 0) {
      throw new Error('No cameras available');
    }

    const deviceType = this.detectDeviceType();

    // On mobile devices, prefer rear camera
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const rearCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      );

      if (rearCamera) {
        console.log('Selected rear camera for mobile device:', rearCamera.label);
        return rearCamera.id;
      }
    }

    // On desktop, prefer front camera (webcam)
    if (deviceType === 'desktop') {
      const frontCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('front') ||
        camera.label.toLowerCase().includes('user') ||
        camera.label.toLowerCase().includes('webcam')
      );

      if (frontCamera) {
        console.log('Selected front camera for desktop:', frontCamera.label);
        return frontCamera.id;
      }
    }

    // Fallback to first available camera
    console.log('Using default camera:', cameras[0].label);
    return cameras[0].id;
  }

  /**
   * Provide feedback for successful scan
   */
  provideFeedback() {
    // Audio feedback
    if (SCANNER_CONFIG.beepOnScan) {
      this.playBeep();
    }

    // Haptic feedback (mobile devices)
    if (SCANNER_CONFIG.vibrateOnScan && navigator.vibrate) {
      navigator.vibrate(SCANNER_CONFIG.vibrateDuration);
    }
  }

  /**
   * Play beep sound for scan feedback
   */
  playBeep() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.debug('Audio feedback not available:', error);
    }
  }

  /**
   * Clear scanner instance and release all resources
   */
  async clear() {
    try {
      // Stop scanning first
      await this.stopScanning();
      
      // Clear scanner instance
      if (this.scanner) {
        await this.scanner.clear();
        this.scanner = null;
      }
      
      // Reset state
      this.isScanning = false;
      this.currentCameraId = null;
      this.decodeFailureCount = 0;
      this.lastDecodeAttempt = 0;
      
      console.log('Scanner resources released successfully');
    } catch (error) {
      console.error('Error clearing scanner:', error);
      // Force reset even if clear fails
      this.scanner = null;
      this.isScanning = false;
      this.currentCameraId = null;
    }
  }

  /**
   * Check if camera permissions are granted
   * @returns {Promise<boolean>}
   */
  async checkCameraPermissions() {
    try {
      if (!navigator.permissions) {
        // Permissions API not available, try to access camera directly
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }

      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state === 'granted';
    } catch (error) {
      console.error('Failed to check camera permissions:', error);
      return false;
    }
  }
}

// Export singleton instance
const scannerService = new ScannerService();
export default scannerService;
