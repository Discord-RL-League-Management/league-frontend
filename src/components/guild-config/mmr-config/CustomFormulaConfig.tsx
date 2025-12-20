import { Label } from '@/components/ui/label.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Button } from '@/components/ui/button.js';
import { Alert, AlertDescription } from '@/components/ui/alert.js';
import type { FormulaTestResult } from '@/lib/api/mmr-calculation.js';

interface CustomFormulaConfigProps {
  mmrConfig: {
    customFormula?: string;
    formulaValidated?: boolean;
    formulaValidationError?: string;
  };
  isEditMode: boolean;
  testResult: FormulaTestResult | null;
  testing: boolean;
  validating: boolean;
  onFormulaChange: (formula: string) => void;
  onValidateFormula: () => void;
  onTestFormula: () => void;
}

/**
 * CustomFormulaConfig - Configuration UI for custom formula algorithm
 */
export function CustomFormulaConfig({
  mmrConfig,
  isEditMode,
  testResult,
  testing,
  validating,
  onFormulaChange,
  onValidateFormula,
  onTestFormula,
}: CustomFormulaConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="custom-formula">Custom Formula</Label>
        <p className="text-sm text-muted-foreground">
          Available variables: ones, twos, threes, fours, onesGames, twosGames, threesGames,
          foursGames, totalGames
          <br />
          Example: (ones * 0.1 + twos * 0.3 + threes * 0.5 + fours * 0.1)
        </p>
        <Textarea
          id="custom-formula"
          value={mmrConfig?.customFormula || ''}
          onChange={(e) => onFormulaChange(e.target.value)}
          disabled={!isEditMode}
          placeholder="Enter your custom formula..."
          className="font-mono"
          rows={4}
        />
      </div>

      {/* Validation Status */}
      {mmrConfig?.formulaValidated === false && mmrConfig?.formulaValidationError && (
        <Alert variant="destructive">
          <AlertDescription>{mmrConfig.formulaValidationError}</AlertDescription>
        </Alert>
      )}

      {mmrConfig?.formulaValidated === true && (
        <Alert>
          <AlertDescription>Formula is valid</AlertDescription>
        </Alert>
      )}

      {/* Validation/Test Buttons */}
      {isEditMode && (
        <div className="flex gap-2">
          <Button
            onClick={onValidateFormula}
            disabled={!mmrConfig?.customFormula || validating}
            variant="outline"
          >
            {validating ? 'Validating...' : 'Validate Formula'}
          </Button>
          <Button
            onClick={onTestFormula}
            disabled={!mmrConfig?.customFormula || testing}
            variant="outline"
          >
            {testing ? 'Testing...' : 'Test Formula'}
          </Button>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.valid ? 'default' : 'destructive'}>
          <AlertDescription>
            {testResult.valid ? (
              <>
                <strong>Test Result:</strong> {testResult.result} MMR
                <br />
                <span className="text-xs text-muted-foreground">
                  Test Data: 1v1={testResult.testData.ones}, 2v2={testResult.testData.twos},
                  3v3={testResult.testData.threes}, 4v4={testResult.testData.fours}
                </span>
              </>
            ) : (
              <>
                <strong>Test Failed:</strong> {testResult.error || 'Unknown error'}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}





