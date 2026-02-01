import React, { useState } from 'react';
import Scanner from '../Scanner/Scanner';
import { productService } from '../../services/productService';
import { SCANNER_MODES } from '../../config/scannerConfig';
import './ProductLookup.css';

const ProductLookup = ({ onClose }) => {
  const [scannerOpen, setScannerOpen] = useState(true);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  const handleScan = async (result) => {
    setLoading(true);
    setError(null);

    try {
      // Look up product by barcode
      const foundProduct = await productService.findByBarcode(result.code);
      setProduct(foundProduct);
      setScannerOpen(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setError({
          type: 'not_found',
          message: `No product found with barcode: ${result.code}`,
          barcode: result.code,
        });
      } else {
        setError({
          type: 'error',
          message: 'Failed to lookup product. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const foundProduct = await productService.findByBarcode(manualBarcode.trim());
      setProduct(foundProduct);
      setManualEntry(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setError({
          type: 'not_found',
          message: `No product found with barcode: ${manualBarcode}`,
          barcode: manualBarcode,
        });
      } else {
        setError({
          type: 'error',
          message: 'Failed to lookup product. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToManual = () => {
    setScannerOpen(false);
    setManualEntry(true);
  };

  const handleSwitchToScanner = () => {
    setManualEntry(false);
    setScannerOpen(true);
    setError(null);
  };

  const handleReset = () => {
    setProduct(null);
    setError(null);
    setManualBarcode('');
    setScannerOpen(true);
    setManualEntry(false);
  };

  return (
    <div className="product-lookup">
      {scannerOpen && !product && !manualEntry && (
        <Scanner
          mode={SCANNER_MODES.LOOKUP}
          onScan={handleScan}
          onClose={onClose}
          isOpen={scannerOpen}
        />
      )}

      {!scannerOpen && !product && !manualEntry && (
        <div className="lookup-options">
          <button onClick={handleSwitchToScanner} className="option-btn">
            Scan Barcode
          </button>
          <button onClick={handleSwitchToManual} className="option-btn">
            Enter Manually
          </button>
        </div>
      )}

      {manualEntry && (
        <div className="manual-entry-container">
          <div className="manual-entry-header">
            <h2>Enter Barcode Manually</h2>
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>

          <form onSubmit={handleManualLookup} className="manual-entry-form">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode number"
              className="manual-input"
              autoFocus
            />
            <div className="manual-actions">
              <button type="submit" className="lookup-btn" disabled={loading}>
                {loading ? 'Looking up...' : 'Lookup'}
              </button>
              <button
                type="button"
                onClick={handleSwitchToScanner}
                className="switch-btn"
              >
                Use Scanner Instead
              </button>
            </div>
          </form>

          {error && (
            <div className="error-message">
              <p>{error.message}</p>
              {error.type === 'not_found' && (
                <button className="create-product-btn">
                  Create New Product
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {product && (
        <div className="product-details-container">
          <div className="product-details-header">
            <h2>Product Found</h2>
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>

          <div className="product-details">
            <div className="product-info-section">
              <h3>{product.name}</h3>
              <div className="product-meta">
                <span className="product-category">{product.category}</span>
                {product.barcode && (
                  <span className="product-barcode">
                    {product.barcodeType}: {product.barcode}
                  </span>
                )}
              </div>
            </div>

            <div className="product-pricing">
              <div className="price-item">
                <label>Purchase Price:</label>
                <span className="price">${product.purchasePrice?.toFixed(2)}</span>
              </div>
              <div className="price-item">
                <label>Selling Price:</label>
                <span className="price highlight">
                  ${product.sellingPrice?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="product-stock">
              <label>Current Stock:</label>
              <span className={`stock-value ${product.stock <= 10 ? 'low' : ''}`}>
                {product.stock} units
              </span>
            </div>

            {product.expiryDate && (
              <div className="product-expiry">
                <label>Expiry Date:</label>
                <span>{new Date(product.expiryDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="product-actions">
            <button onClick={handleReset} className="scan-another-btn">
              Scan Another Product
            </button>
            <button onClick={onClose} className="done-btn">
              Done
            </button>
          </div>
        </div>
      )}

      {error && !manualEntry && (
        <div className="lookup-error-container">
          <div className="error-icon">⚠️</div>
          <h3>{error.type === 'not_found' ? 'Product Not Found' : 'Lookup Error'}</h3>
          <p>{error.message}</p>

          {error.type === 'not_found' && (
            <button className="create-product-btn">
              Create New Product with Barcode {error.barcode}
            </button>
          )}

          <div className="error-actions">
            <button onClick={handleReset} className="try-again-btn">
              Try Again
            </button>
            <button onClick={handleSwitchToManual} className="manual-entry-btn">
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {loading && !scannerOpen && (
        <div className="lookup-loading">
          <div className="spinner"></div>
          <p>Looking up product...</p>
        </div>
      )}
    </div>
  );
};

export default ProductLookup;
