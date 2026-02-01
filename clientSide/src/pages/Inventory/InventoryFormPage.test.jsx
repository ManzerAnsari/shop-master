import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InventoryFormPage from './InventoryFormPage';
import qrCodeService from '../../services/qrCodeService';

// Mock the services
vi.mock('../../services/qrCodeService', () => ({
  default: {
    generateQRCode: vi.fn(),
    downloadQRCode: vi.fn(),
    printLabel: vi.fn(),
    downloadPrintableLabel: vi.fn(),
  },
}));

// Mock useParams and useNavigate
const mockUseParams = vi.fn();
const mockUseNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockUseNavigate(),
  };
});

describe('InventoryFormPage - QR Code Generation (Task 10.1)', () => {
  const mockNavigate = vi.fn();
  const mockProduct = {
    key: '1',
    name: 'Premium Headphones',
    category: 'Electronics',
    purchasePrice: 80,
    sellingPrice: 100,
    stock: 45,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  /**
   * Test: QR code generation from product page
   * Requirement: 4.1 - Display option to generate QR code
   */
  it('should display Generate QR Code button when editing a product', () => {
    render(
      <BrowserRouter>
        <InventoryFormPage />
      </BrowserRouter>
    );

    const generateButton = screen.getByText(/Generate QR Code/i);
    expect(generateButton).toBeDefined();
  });

  /**
   * Test: QR code generation and display
   * Requirements: 4.1, 4.2 - Generate QR code containing product ID
   */
  it('should generate and display QR code when button is clicked', async () => {
    const mockQRDataUrl = 'data:image/png;base64,mockQRCode';
    qrCodeService.generateQRCode.mockResolvedValue(mockQRDataUrl);

    render(
      <BrowserRouter>
        <InventoryFormPage />
      </BrowserRouter>
    );

    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(qrCodeService.generateQRCode).toHaveBeenCalledWith(
        mockProduct.key,
        expect.objectContaining({
          width: 300,
          margin: 2,
        })
      );
    });

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByText(/Product QR Code/i)).toBeDefined();
    });
  });

  /**
   * Test: QR code download functionality
   * Requirement: 4.3 - Provide download option
   */
  it('should download QR code when download button is clicked', async () => {
    const mockQRDataUrl = 'data:image/png;base64,mockQRCode';
    qrCodeService.generateQRCode.mockResolvedValue(mockQRDataUrl);
    qrCodeService.downloadQRCode.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <InventoryFormPage />
      </BrowserRouter>
    );

    // Open QR modal
    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Download QR Code/i)).toBeDefined();
    });

    // Click download button
    const downloadButton = screen.getByText(/Download QR Code/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(qrCodeService.downloadQRCode).toHaveBeenCalledWith(
        mockProduct.key,
        expect.stringContaining('qr_'),
        expect.objectContaining({
          width: 300,
          margin: 2,
        })
      );
    });
  });

  /**
   * Test: QR label printing format
   * Requirements: 4.3, 4.5 - Print QR label with product name and price
   */
  it('should print QR label with product information when print button is clicked', async () => {
    const mockQRDataUrl = 'data:image/png;base64,mockQRCode';
    qrCodeService.generateQRCode.mockResolvedValue(mockQRDataUrl);
    qrCodeService.printLabel.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <InventoryFormPage />
      </BrowserRouter>
    );

    // Open QR modal
    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Print Label/i)).toBeDefined();
    });

    // Click print button
    const printButton = screen.getByText(/Print Label/i);
    fireEvent.click(printButton);

    await waitFor(() => {
      expect(qrCodeService.printLabel).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockProduct.key,
          name: mockProduct.name,
          sellingPrice: mockProduct.sellingPrice,
        })
      );
    });
  });

  /**
   * Test: Download printable label
   * Requirement: 4.5 - Format labels with product name and price
   */
  it('should download printable label when download label button is clicked', async () => {
    const mockQRDataUrl = 'data:image/png;base64,mockQRCode';
    qrCodeService.generateQRCode.mockResolvedValue(mockQRDataUrl);
    qrCodeService.downloadPrintableLabel.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <InventoryFormPage />
      </BrowserRouter>
    );

    // Open QR modal
    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Download Label/i)).toBeDefined();
    });

    // Click download label button
    const downloadLabelButton = screen.getByText(/Download Label/i);
    fireEvent.click(downloadLabelButton);

    await waitFor(() => {
      expect(qrCodeService.downloadPrintableLabel).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockProduct.key,
          name: mockProduct.name,
          sellingPrice: mockProduct.sellingPrice,
        }),
        expect.stringContaining('label_')
      );
    });
  });

  /**
   * Test: QR code not available for new products
   * Validates proper state management
   */
  it('should not show Generate QR Code button for new products', () => {
    mockUseParams.mockReturnValue({ id: undefined });

    render(
      <BrowserRouter>
        <InventoryFormPage />
      </BrowserRouter>
    );

    const generateButton = screen.queryByText(/Generate QR Code/i);
    expect(generateButton).toBeNull();
  });

  /**
   * Test: Error handling for QR generation
   * Validates graceful error handling
   */
  it('should handle QR generation errors gracefully', async () => {
    qrCodeService.generateQRCode.mockRejectedValue(new Error('Generation failed'));

    render(
      <BrowserRouter>
        <InventoryFormPage />
      </BrowserRouter>
    );

    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(qrCodeService.generateQRCode).toHaveBeenCalled();
    });

    // Modal should not be visible on error
    await waitFor(() => {
      const modal = screen.queryByText(/Product QR Code/i);
      expect(modal).toBeNull();
    });
  });
});
