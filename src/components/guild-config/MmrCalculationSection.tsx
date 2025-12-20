import { useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Label } from '@/components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js';
import { useSettingsStore } from '@/stores/index.js';
import { useMmrFormula } from '@/hooks/useMmrFormula.js';
import { useMmrConfigHandlers } from '@/hooks/useMmrConfigHandlers.js';
import { WeightedAverageConfig } from './mmr-config/WeightedAverageConfig.js';
import { PeakMmrConfig } from './mmr-config/PeakMmrConfig.js';
import { AscendancyConfig } from './mmr-config/AscendancyConfig.js';
import { CustomFormulaConfig } from './mmr-config/CustomFormulaConfig.js';

interface MmrCalculationSectionProps {
  guildId: string;
  isEditMode?: boolean;
}

const MmrCalculationSectionComponent = ({
  guildId,
  isEditMode = false,
}: MmrCalculationSectionProps) => {
  const allSettings = useSettingsStore((state) => state.settings[guildId] || null);
  const draftSettings = useSettingsStore((state) => state.draftSettings);
  const updateDraftSettings = useSettingsStore((state) => state.updateDraftSettings);
  const displaySettings = isEditMode && draftSettings ? draftSettings : (allSettings || null);
  const mmrConfig = displaySettings?.mmrCalculation;

  const {
    testResult,
    validationResult,
    testing,
    validating,
    validateFormula,
    testFormula,
  } = useMmrFormula();

  const {
    handleAlgorithmChange,
    handleWeightChange,
    handleMinGamesChange,
    handleAscendancyWeightChange,
    handleFormulaChange,
  } = useMmrConfigHandlers(isEditMode, draftSettings, mmrConfig);

  const handleValidateFormula = async () => {
    if (!mmrConfig?.customFormula) return;
    await validateFormula(mmrConfig.customFormula);
  };

  const handleTestFormula = async () => {
    if (!mmrConfig?.customFormula) return;
    await testFormula(mmrConfig.customFormula);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <SelectItem value="ASCENDANCY">Ascendancy</SelectItem>
              <SelectItem value="CUSTOM">Custom Formula</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mmrConfig?.algorithm === 'WEIGHTED_AVERAGE' && (
          <WeightedAverageConfig
            mmrConfig={mmrConfig}
            isEditMode={isEditMode}
            onWeightChange={handleWeightChange}
            onMinGamesChange={handleMinGamesChange}
          />
        )}

        {mmrConfig?.algorithm === 'PEAK_MMR' && (
          <PeakMmrConfig
            mmrConfig={mmrConfig}
            isEditMode={isEditMode}
            onMinGamesChange={handleMinGamesChange}
          />
        )}

        {mmrConfig?.algorithm === 'ASCENDANCY' && (
          <AscendancyConfig
            mmrConfig={mmrConfig}
            isEditMode={isEditMode}
            onAscendancyWeightChange={handleAscendancyWeightChange}
          />
        )}

        {mmrConfig?.algorithm === 'CUSTOM' && (
          <CustomFormulaConfig
            mmrConfig={mmrConfig}
            isEditMode={isEditMode}
            testResult={testResult}
            testing={testing}
            validating={validating}
            onFormulaChange={handleFormulaChange}
            onValidateFormula={handleValidateFormula}
            onTestFormula={handleTestFormula}
          />
        )}
      </CardContent>
    </Card>
  );
};

export const MmrCalculationSection = memo(MmrCalculationSectionComponent);
