import { useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Label } from '@/components/ui/label.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Button } from '@/components/ui/button.js';
import { Alert, AlertDescription } from '@/components/ui/alert.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js';
import { useSettingsStore } from '@/stores/index.js';
import { useMmrFormula } from '@/hooks/useMmrFormula.js';
import type { MmrCalculationConfig } from '@/types/index.js';

interface MmrCalculationSectionProps {
  guildId: string;
  isEditMode?: boolean;
}

const MmrCalculationSectionComponent = ({
  guildId,
  isEditMode = false,
}: MmrCalculationSectionProps) => {
  // Settings management (separate concern)
  const allSettings = useSettingsStore((state) => state.settings[guildId] || null);
  const draftSettings = useSettingsStore((state) => state.draftSettings);
  const updateDraftSettings = useSettingsStore((state) => state.updateDraftSettings);
  const displaySettings = isEditMode && draftSettings ? draftSettings : (allSettings || null);
  const mmrConfig = displaySettings?.mmrCalculation;

  // Formula testing (separate concern)
  const {
    testResult,
    validationResult,
    testData,
    testing,
    validating,
    validateFormula,
    testFormula,
    updateTestData,
  } = useMmrFormula();

  // Update draft settings when config changes
  const handleAlgorithmChange = (algorithm: 'WEIGHTED_AVERAGE' | 'PEAK_MMR' | 'CUSTOM') => {
    if (!isEditMode) return;
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: {
        ...mmrConfig,
        algorithm,
      },
    });
  };

  const handleWeightChange = (playlist: 'ones' | 'twos' | 'threes' | 'fours', value: string) => {
    if (!isEditMode) return;
    const numValue = value === '' ? undefined : parseFloat(value);
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: {
        ...mmrConfig,
        weights: {
          ...mmrConfig?.weights,
          [playlist]: numValue,
        },
      },
    });
  };

  const handleMinGamesChange = (
    playlist: 'ones' | 'twos' | 'threes' | 'fours',
    value: string,
  ) => {
    if (!isEditMode) return;
    const numValue = value === '' ? undefined : parseInt(value, 10);
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: {
        ...mmrConfig,
        minGamesPlayed: {
          ...mmrConfig?.minGamesPlayed,
          [playlist]: numValue,
        },
      },
    });
  };

  const handleFormulaChange = (formula: string) => {
    if (!isEditMode) return;
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: {
        ...mmrConfig,
        customFormula: formula,
        formulaValidated: false,
        formulaValidationError: undefined,
      },
    });
  };

  const handleValidateFormula = async () => {
    if (!mmrConfig?.customFormula) return;
    await validateFormula(mmrConfig.customFormula);
  };

  const handleTestFormula = async () => {
    if (!mmrConfig?.customFormula) return;
    await testFormula(mmrConfig.customFormula);
  };

  // Update validation result in settings when validation completes
  useEffect(() => {
    if (validationResult && mmrConfig?.customFormula && isEditMode) {
      updateDraftSettings({
        ...draftSettings,
        mmrCalculation: {
          ...mmrConfig,
          formulaValidated: validationResult.valid,
          formulaValidationError: validationResult.error,
        },
      });
    }
  }, [validationResult, mmrConfig?.customFormula, isEditMode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>MMR Calculation</CardTitle>
        <CardDescription>
          Configure how internal MMR is calculated from tracker data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Algorithm Selection */}
        <div className="space-y-2">
          <Label htmlFor="algorithm">Algorithm</Label>
          <Select
            value={mmrConfig?.algorithm || 'WEIGHTED_AVERAGE'}
            onValueChange={handleAlgorithmChange}
            disabled={!isEditMode}
          >
            <SelectTrigger id="algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEIGHTED_AVERAGE">Weighted Average</SelectItem>
              <SelectItem value="PEAK_MMR">Peak MMR</SelectItem>
              <SelectItem value="CUSTOM">Custom Formula</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weighted Average Configuration */}
        {mmrConfig?.algorithm === 'WEIGHTED_AVERAGE' && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Weights</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Weights should sum to 1.0 for best results (0.0 - 1.0)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['ones', 'twos', 'threes', 'fours'] as const).map((playlist) => (
                <div key={playlist} className="space-y-2">
                  <Label htmlFor={`weight-${playlist}`}>
                    {playlist === 'ones' ? '1v1' : playlist === 'twos' ? '2v2' : playlist === 'threes' ? '3v3' : '4v4'}
                  </Label>
                  <Input
                    id={`weight-${playlist}`}
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={mmrConfig?.weights?.[playlist] ?? ''}
                    onChange={(e) => handleWeightChange(playlist, e.target.value)}
                    disabled={!isEditMode}
                    placeholder="0.0"
                  />
                </div>
              ))}
            </div>

            <div>
              <Label className="text-base font-semibold">Minimum Games Played</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Only count playlists with at least this many games
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['ones', 'twos', 'threes', 'fours'] as const).map((playlist) => (
                <div key={playlist} className="space-y-2">
                  <Label htmlFor={`min-games-${playlist}`}>
                    {playlist === 'ones' ? '1v1' : playlist === 'twos' ? '2v2' : playlist === 'threes' ? '3v3' : '4v4'}
                  </Label>
                  <Input
                    id={`min-games-${playlist}`}
                    type="number"
                    min="0"
                    value={mmrConfig?.minGamesPlayed?.[playlist] ?? ''}
                    onChange={(e) => handleMinGamesChange(playlist, e.target.value)}
                    disabled={!isEditMode}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Peak MMR Configuration */}
        {mmrConfig?.algorithm === 'PEAK_MMR' && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Minimum Games Played</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Only consider playlists with at least this many games
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['ones', 'twos', 'threes', 'fours'] as const).map((playlist) => (
                <div key={playlist} className="space-y-2">
                  <Label htmlFor={`min-games-${playlist}`}>
                    {playlist === 'ones' ? '1v1' : playlist === 'twos' ? '2v2' : playlist === 'threes' ? '3v3' : '4v4'}
                  </Label>
                  <Input
                    id={`min-games-${playlist}`}
                    type="number"
                    min="0"
                    value={mmrConfig?.minGamesPlayed?.[playlist] ?? ''}
                    onChange={(e) => handleMinGamesChange(playlist, e.target.value)}
                    disabled={!isEditMode}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Formula Configuration */}
        {mmrConfig?.algorithm === 'CUSTOM' && (
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
                onChange={(e) => handleFormulaChange(e.target.value)}
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
                  onClick={handleValidateFormula}
                  disabled={!mmrConfig?.customFormula || validating}
                  variant="outline"
                >
                  {validating ? 'Validating...' : 'Validate Formula'}
                </Button>
                <Button
                  onClick={handleTestFormula}
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
                    <strong>Test Failed:</strong> {testResult.error}
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const MmrCalculationSection = memo(MmrCalculationSectionComponent);

