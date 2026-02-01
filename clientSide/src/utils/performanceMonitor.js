/**
 * Performance Monitoring Utility
 * Tracks and logs performance metrics for scanner operations
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing an operation
   * @param {string} label - Operation label
   */
  start(label) {
    if (!this.enabled) return;
    
    this.metrics[label] = {
      startTime: performance.now(),
      endTime: null,
      duration: null,
    };
  }

  /**
   * End timing an operation
   * @param {string} label - Operation label
   * @returns {number} Duration in milliseconds
   */
  end(label) {
    if (!this.enabled || !this.metrics[label]) return 0;
    
    const metric = this.metrics[label];
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    console.log(`⏱️ ${label}: ${metric.duration.toFixed(2)}ms`);
    
    return metric.duration;
  }

  /**
   * Measure async operation
   * @param {string} label - Operation label
   * @param {Function} fn - Async function to measure
   * @returns {Promise<*>} Result of the function
   */
  async measure(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  /**
   * Get metric by label
   * @param {string} label - Operation label
   * @returns {Object|null}
   */
  getMetric(label) {
    return this.metrics[label] || null;
  }

  /**
   * Get all metrics
   * @returns {Object}
   */
  getAllMetrics() {
    return { ...this.metrics };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {};
  }

  /**
   * Log memory usage (if available)
   */
  logMemoryUsage() {
    if (!this.enabled || !performance.memory) return;
    
    const memory = performance.memory;
    console.log('💾 Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }

  /**
   * Enable/disable monitoring
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
