import QRCode from 'qrcode';

/**
 * QR Code Service
 * Handles QR code generation for products
 */

class QRCodeService {
  /**
   * Generate QR code for a product
   * @param {string} productId - Product ID to encode
   * @param {Object} options - QR code generation options
   * @returns {Promise<string>} Data URL of the generated QR code
   */
  async generateQRCode(productId, options = {}) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: options.type || 'image/png',
        quality: options.quality || 0.92,
        margin: options.margin || 1,
        width: options.width || 300,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF',
        },
      };

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(productId, qrOptions);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed: ' + error.message);
    }
  }

  /**
   * Generate printable QR label with product information
   * @param {Object} product - Product object with details
   * @param {Object} options - Label generation options
   * @returns {Promise<Blob>} Blob containing the printable label
   */
  async generatePrintableLabel(product, options = {}) {
    try {
      // Create canvas for label
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions
      const width = options.width || 400;
      const height = options.height || 500;
      canvas.width = width;
      canvas.height = height;

      // Fill background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Generate QR code
      const qrCodeDataUrl = await this.generateQRCode(product._id, {
        width: 250,
        margin: 2,
      });

      // Load QR code image
      const qrImage = await this.loadImage(qrCodeDataUrl);

      // Draw QR code centered
      const qrSize = 250;
      const qrX = (width - qrSize) / 2;
      const qrY = 50;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Draw product name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(product.name, width / 2, qrY + qrSize + 40);

      // Draw product price
      ctx.font = '18px Arial';
      const priceText = `Price: $${product.sellingPrice?.toFixed(2) || product.price?.toFixed(2)}`;
      ctx.fillText(priceText, width / 2, qrY + qrSize + 70);

      // Draw product ID
      ctx.font = '12px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(`ID: ${product._id}`, width / 2, qrY + qrSize + 95);

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Failed to generate printable label:', error);
      throw new Error('Label generation failed: ' + error.message);
    }
  }

  /**
   * Download QR code as image file
   * @param {string} productId - Product ID
   * @param {string} filename - Desired filename (without extension)
   * @param {Object} options - QR code options
   */
  async downloadQRCode(productId, filename = 'qr-code', options = {}) {
    try {
      const qrCodeDataUrl = await this.generateQRCode(productId, options);

      // Create download link
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      throw new Error('QR code download failed: ' + error.message);
    }
  }

  /**
   * Download printable label
   * @param {Object} product - Product object
   * @param {string} filename - Desired filename (without extension)
   * @param {Object} options - Label options
   */
  async downloadPrintableLabel(product, filename = 'product-label', options = {}) {
    try {
      const blob = await this.generatePrintableLabel(product, options);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download label:', error);
      throw new Error('Label download failed: ' + error.message);
    }
  }

  /**
   * Print QR label
   * @param {Object} product - Product object
   * @param {Object} options - Label options
   */
  async printLabel(product, options = {}) {
    try {
      const blob = await this.generatePrintableLabel(product, options);
      const url = URL.createObjectURL(blob);

      // Open print dialog
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(url);
        };
      } else {
        throw new Error('Failed to open print window. Please check popup blocker settings.');
      }
    } catch (error) {
      console.error('Failed to print label:', error);
      throw new Error('Label printing failed: ' + error.message);
    }
  }

  /**
   * Generate QR code as SVG string
   * @param {string} productId - Product ID
   * @param {Object} options - QR code options
   * @returns {Promise<string>} SVG string
   */
  async generateQRCodeSVG(productId, options = {}) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: 'svg',
        margin: options.margin || 1,
        width: options.width || 300,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF',
        },
      };

      const svgString = await QRCode.toString(productId, qrOptions);
      return svgString;
    } catch (error) {
      console.error('Failed to generate SVG QR code:', error);
      throw new Error('SVG QR code generation failed: ' + error.message);
    }
  }

  /**
   * Helper method to load image from data URL
   * @param {string} dataUrl - Image data URL
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  /**
   * Validate QR code data
   * @param {string} data - Data to validate
   * @returns {boolean}
   */
  validateQRData(data) {
    if (!data || typeof data !== 'string') {
      return false;
    }
    // Add custom validation logic as needed
    return data.length > 0 && data.length <= 2953; // QR code max capacity
  }
}

// Export singleton instance
const qrCodeService = new QRCodeService();
export default qrCodeService;
