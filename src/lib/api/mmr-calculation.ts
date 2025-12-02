import { api } from './client.ts';

/**
 * Tracker data interface for MMR calculation
 */
export interface TrackerData {
  ones?: number;
  twos?: number;
  threes?: number;
  fours?: number;
  onesGamesPlayed?: number;
  twosGamesPlayed?: number;
  threesGamesPlayed?: number;
  foursGamesPlayed?: number;
}

/**
 * Formula test result
 */
export interface FormulaTestResult {
  result: number;
  testData: TrackerData;
  valid: boolean;
  error?: string;
}

/**
 * Formula validation result
 */
export interface FormulaValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * MMR Calculation API Client
 */
export const mmrCalculationApi = {
  /**
   * Test a custom MMR formula with sample or custom data
   */
  async testFormula(
    formula: string,
    testData?: TrackerData,
  ): Promise<FormulaTestResult> {
    const response = await api.post<FormulaTestResult>(
      '/api/mmr-calculation/test-formula',
      {
        formula,
        testData,
      },
    );
    return response.data;
  },

  /**
   * Validate a custom MMR formula syntax
   */
  async validateFormula(
    formula: string,
  ): Promise<FormulaValidationResult> {
    const response = await api.post<FormulaValidationResult>(
      '/api/mmr-calculation/validate-formula',
      {
        formula,
      },
    );
    return response.data;
  },
};

