import { describe, it, expect } from 'vitest';
import {
  getContentStats,
  getOrphanReport,
  getCoverageReport,
  getStalenessReport,
} from '../../../../src/lib/governance.js';

describe('Governance Utilities', () => {
  describe('getContentStats', () => {
    it('should return counts for all content types', () => {
      const stats = getContentStats();
      expect(stats.terms).toBeGreaterThanOrEqual(10);
      expect(stats.definitions).toBeGreaterThanOrEqual(10);
      expect(stats.methods).toBeGreaterThanOrEqual(6);
      expect(stats.products).toBeGreaterThanOrEqual(1);
    });

    it('should break down terms by phase', () => {
      const stats = getContentStats();
      expect(stats.termsPerPhase).toBeDefined();
      const totalByPhase = Object.values(stats.termsPerPhase).reduce(
        (a, b) => a + b,
        0
      );
      expect(totalByPhase).toBe(stats.terms);
    });

    it('should break down definitions by product', () => {
      const stats = getContentStats();
      expect(stats.definitionsPerProduct).toBeDefined();
      expect(stats.definitionsPerProduct['global']).toBeGreaterThan(0);
    });
  });

  describe('getOrphanReport', () => {
    it('should not find orphaned terms in QuickBite example data', () => {
      const report = getOrphanReport();
      expect(report.termsWithoutDefinitions).toEqual([]);
    });

    it('should not find definitions without terms in QuickBite example data', () => {
      const report = getOrphanReport();
      expect(report.definitionsWithoutTerms).toEqual([]);
    });
  });

  describe('getCoverageReport', () => {
    it('should return coverage for global and quickbite products', () => {
      const report = getCoverageReport();
      expect(report.products.length).toBeGreaterThanOrEqual(2);

      const global = report.products.find((p) => p.product === 'global');
      expect(global).toBeDefined();
      expect(global!.coveragePercent).toBe(100);
    });

    it('should show total terms count', () => {
      const report = getCoverageReport();
      const global = report.products.find((p) => p.product === 'global');
      expect(global!.totalTerms).toBe(10);
    });
  });

  describe('getStalenessReport', () => {
    it('should return stale definitions with a short threshold', () => {
      const stale = getStalenessReport(1); // 1 day threshold — everything should be stale
      expect(stale.length).toBeGreaterThan(0);
    });

    it('should return fewer stale definitions with a long threshold', () => {
      const stale = getStalenessReport(99999); // Very long threshold
      // Only definitions without last_validated should appear
      expect(stale.length).toBeLessThanOrEqual(20);
    });
  });
});
