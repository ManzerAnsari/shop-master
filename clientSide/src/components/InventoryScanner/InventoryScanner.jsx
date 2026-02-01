import React, { useState } from 'react';
import Scanner from '../Scanner/Scanner';
import { productService } from '../../services/productService';
import { SCANNER_MODES } from '../../config/scannerConfig';
import { Icon } from '@iconify/react';
import './InventoryScanner.css';

const InventoryScanner = ({ onClose, onUpdate }) => {
  const [scannerOpen, setScannerOpen] = useState(true);
  const [scannedItems, setScannedItems] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async (result) => {
    setLoading(true);
    setError(null);

    try {
      // Look up product by barcode
      const product = await productService.findByBarcode(result.code);
      setCurrentProduct(product);
      setNewStock(product.stock.toString());
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

  const handleUpdateStock = async () => {
    if (!currentProduct || newStock === '') return;

    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      setError({
        type: 'validation',
        message: 'Please enter a valid stock quantity (0 or greater)',
      });
      return;
    }

    setLoading(true);
    try {
      // Update product stock
      await productService.update(currentProduct._id, { stock: stockValue });

      // Add to scanned items list
      const updatedItem = {
        ...currentProduct,
        oldStock: currentProduct.stock,
        newStock: stockValue,
        timestamp: new Date(),
      };

      setScannedItems([updatedItem, ...scannedItems]);

      // Notify parent component
      if (onUpdate) {
        onUpdate(updatedItem);
      }

      // Reset for next scan
      setCurrentProduct(null);
      setNewStock('');
      setError(null);
      setScannerOpen(true);
    } catch (err) {
      setError({
        type: 'error',
        message: 'Failed to update stock. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setCurrentProduct(null);
    setNewStock('');
    setError(null);
    setScannerOpen(true);
  };

  const handleFinish = () => {
    if (onClose) {
      onClose(scannedItems);
    }
  };

  const getTotalAdjustment = () => {
    return scannedItems.reduce((sum, item) => sum + (item.newStock - item.oldStock), 0);
  };

  return (
    <div className="inventory-scanner">
      {scannerOpen && !currentProduct && (
        <Scanner
          mode={SCANNER_MODES.INVENTORY}
          onScan={handleScan}
          onClose={() => onClose && onClose(scannedItems)}
          isOpen={scannerOpen}
        />
      )}

      {currentProduct && (
        <div className="stock-update-container">
          <div className="stock-update-header">
            <h2>Update Stock Level</h2>
            <button onClick={() => onClose && onClose(scannedItems)} className="close-btn">
              ×
            </button>
          </div>

          <div className="product-info">
            <div className="product-name">{currentProduct.name}</div>
            <div className="product-meta">
              <span className="category-badge">{currentProduct.category}</span>
              {currentProduct.barcode && (
                <span className="barcode-text">
                  {currentProduct.barcodeType}: {currentProduct.barcode}
                </span>
              )}
            </div>
          </div>

          <div className="stock-display">
            <div className="stock-item">
              <label>Current Stock</label>
              <div className="stock-value current">{currentProduct.stock} units</div>
            </div>
            <Icon icon="mdi:arrow-right" width="24" className="arrow-icon" />
            <div className="stock-item">
              <label>New Stock</label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="stock-input"
                min="0"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateStock();
                  }
                }}
              />
            </div>
          </div>

          {newStock !== '' && !isNaN(parseInt(newStock)) && (
            <div className="stock-change">
              {parseInt(newStock) - currentProduct.stock > 0 ? (
                <div className="change-positive">
                  <Icon icon="mdi:arrow-up" width="20" />
                  +{parseInt(newStock) - currentProduct.stock} units
                </div>
              ) : parseInt(newStock) - currentProduct.stock < 0 ? (
                <div className="change-negative">
                  <Icon icon="mdi:arrow-down" width="20" />
                  {parseInt(newStock) - currentProduct.stock} units
                </div>
              ) : (
                <div className="change-neutral">No change</div>
              )}
            </div>
          )}

          {error && error.type === 'validation' && (
            <div className="error-message">{error.message}</div>
          )}

          <div className="stock-actions">
            <button onClick={handleSkip} className="skip-btn">
              Skip
            </button>
            <button
              onClick={handleUpdateStock}
              className="update-btn"
              disabled={loading || newStock === ''}
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>

          <div className="quick-adjust">
            <span>Quick Adjust:</span>
            <button onClick={() => setNewStock((parseInt(newStock) || 0) + 10)}>
              +10
            </button>
            <button onClick={() => setNewStock((parseInt(newStock) || 0) + 50)}>
              +50
            </button>
            <button onClick={() => setNewStock((parseInt(newStock) || 0) + 100)}>
              +100
            </button>
            <button
              onClick={() => setNewStock(Math.max(0, (parseInt(newStock) || 0) - 10))}
            >
              -10
            </button>
          </div>
        </div>
      )}

      {scannedItems.length > 0 && !scannerOpen && !currentProduct && (
        <div className="summary-container">
          <div className="summary-header">
            <h2>Inventory Update Summary</h2>
            <button onClick={handleFinish} className="close-btn">
              ×
            </button>
          </div>

          <div className="summary-stats">
            <div className="stat-card">
              <Icon icon="mdi:package-variant" width="32" />
              <div className="stat-value">{scannedItems.length}</div>
              <div className="stat-label">Products Scanned</div>
            </div>
            <div className="stat-card">
              <Icon
                icon={getTotalAdjustment() >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'}
                width="32"
              />
              <div className={`stat-value ${getTotalAdjustment() >= 0 ? 'positive' : 'negative'}`}>
                {getTotalAdjustment() >= 0 ? '+' : ''}
                {getTotalAdjustment()}
              </div>
              <div className="stat-label">Total Adjustment</div>
            </div>
          </div>

          <div className="scanned-items-list">
            <h3>Updated Products</h3>
            {scannedItems.map((item, index) => (
              <div key={index} className="scanned-item">
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-time">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="item-change">
                  <span className="old-stock">{item.oldStock}</span>
                  <Icon icon="mdi:arrow-right" width="16" />
                  <span className="new-stock">{item.newStock}</span>
                  <span
                    className={`change-badge ${
                      item.newStock - item.oldStock >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {item.newStock - item.oldStock >= 0 ? '+' : ''}
                    {item.newStock - item.oldStock}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-actions">
            <button onClick={() => setScannerOpen(true)} className="scan-more-btn">
              <Icon icon="mdi:barcode-scan" width="20" />
              Scan More Products
            </button>
            <button onClick={handleFinish} className="finish-btn">
              <Icon icon="mdi:check-circle" width="20" />
              Finish & Close
            </button>
          </div>
        </div>
      )}

      {error && !currentProduct && (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Scan Error</h3>
          <p>{error.message}</p>
          <button onClick={() => setScannerOpen(true)} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {loading && !scannerOpen && !currentProduct && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default InventoryScanner;
