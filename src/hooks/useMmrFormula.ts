import { useState, useCallback } from 'react';
import {
  mmrCalculationApi,
  type TrackerData,
  type FormulaTestResult,
  type FormulaValidationResult,
} from '../lib/api/mmr-calculation.js';

/**
 * Custom hook for MMR formula testing and validation
 * Single Responsibility: Formula testing logic and state management
 */
export function useMmrFormula() {
  const [testResult, setTestResult] = useState<FormulaTestResult | null>(null);
  const [validationResult, setValidationResult] =
    useState<FormulaValidationResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testData, setTestData] = useState<TrackerData>({
    ones: 1200,
    twos: 1400,
    threes: 1600,
    fours: 1000,
    onesGamesPlayed: 150,
    twosGamesPlayed: 300,
    threesGamesPlayed: 500,
    foursGamesPlayed: 50,
  });

  /**
   * Validate formula syntax
   */
  const validateFormula = useCallback(async (formula: string) => {
    if (!formula || formula.trim().length === 0) {
      setValidationResult({
        valid: false,
        error: 'Formula cannot be empty',
      });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await mmrCalculationApi.validateFormula(formula);
      setValidationResult(result);
    } catch (error: any) {
      setValidationResult({
        valid: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to validate formula',
      });
    } finally {
      setValidating(false);
    }
  }, []);

  /**
   * Test formula with current or custom test data
   */
  const testFormula = useCallback(
    async (formula: string, customTestData?: TrackerData) => {
      if (!formula || formula.trim().length === 0) {
        setTestResult({
          result: 0,
          testData: customTestData || testData,
          valid: false,
          error: 'Formula cannot be empty',
        });
        return;
      }

      setTesting(true);
      setTestResult(null);

      try {
        const dataToUse = customTestData || testData;
        const result = await mmrCalculationApi.testFormula(formula, dataToUse);
        setTestResult(result);
      } catch (error: any) {
        setTestResult({
          result: 0,
          testData: customTestData || testData,
          valid: false,
          error:
            error.response?.data?.message ||
            error.message ||
            'Failed to test formula',
        });
      } finally {
        setTesting(false);
      }
    },
    [testData],
  );

  /**
   * Update test data
   */
  const updateTestData = useCallback((data: Partial<TrackerData>) => {
    setTestData((prev) => ({ ...prev, ...data }));
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setTestResult(null);
    setValidationResult(null);
    setTestData({
      ones: 1200,
      twos: 1400,
      threes: 1600,
      fours: 1000,
      onesGamesPlayed: 150,
      twosGamesPlayed: 300,
      threesGamesPlayed: 500,
      foursGamesPlayed: 50,
    });
  }, []);

  return {
    // State
    testResult,
    validationResult,
    testData,
    testing,
    validating,
    // Actions
    validateFormula,
    testFormula,
    updateTestData,
    reset,
  };
}





