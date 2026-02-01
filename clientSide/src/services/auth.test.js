import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAPI } from './auth';
import api from '../lib/axios';

// Mock the axios instance
vi.mock('../lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('verifyAPI', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should make a GET request to /auth/verify', async () => {
    // Arrange
    const mockResponse = {
      data: { valid: true, userId: '123' },
    };
    api.get.mockResolvedValue(mockResponse);

    // Act
    await verifyAPI();

    // Assert - Test that verifyAPI makes a GET request to /auth/verify
    // Requirements: 1.1
    expect(api.get).toHaveBeenCalledWith('/auth/verify');
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('should return response data correctly', async () => {
    // Arrange
    const mockResponseData = { valid: true, userId: '456' };
    const mockResponse = {
      data: mockResponseData,
    };
    api.get.mockResolvedValue(mockResponse);

    // Act
    const result = await verifyAPI();

    // Assert - Test that verifyAPI returns response data correctly
    // Requirements: 1.5
    expect(result).toEqual(mockResponseData);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('456');
  });

  it('should propagate errors for failed requests', async () => {
    // Arrange
    const mockError = new Error('Invalid token');
    mockError.response = {
      status: 401,
      data: { message: 'Invalid token' },
    };
    api.get.mockRejectedValue(mockError);

    // Act & Assert - Test that verifyAPI propagates errors for failed requests
    // Requirements: 1.3
    await expect(verifyAPI()).rejects.toThrow('Invalid token');
    expect(api.get).toHaveBeenCalledWith('/auth/verify');
  });
});
