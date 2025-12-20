import { useSettingsStore } from '@/stores/index.js';
import type { MmrCalculationConfig } from '@/types/settings.js';

interface MmrConfig {
  algorithm?: 'WEIGHTED_AVERAGE' | 'PEAK_MMR' | 'CUSTOM' | 'ASCENDANCY';
  weights?: {
    ones?: number;
    twos?: number;
    threes?: number;
    fours?: number;
  };
  minGamesPlayed?: {
    ones?: number;
    twos?: number;
    threes?: number;
    fours?: number;
  };
  ascendancyWeights?: {
    current?: number;
    peak?: number;
  };
  customFormula?: string;
  formulaValidated?: boolean;
  formulaValidationError?: string;
}

/**
 * useMmrConfigHandlers - Custom hook for MMR configuration handlers
 * Extracts handler logic from MmrCalculationSection to reduce complexity
 */
export function useMmrConfigHandlers(
  isEditMode: boolean,
  draftSettings: ReturnType<typeof useSettingsStore.getState>['draftSettings'],
  mmrConfig: MmrConfig | undefined
) {
  const updateDraftSettings = useSettingsStore((state) => state.updateDraftSettings);

  const handleAlgorithmChange = (algorithm: 'WEIGHTED_AVERAGE' | 'PEAK_MMR' | 'CUSTOM' | 'ASCENDANCY') => {
    if (!isEditMode) return;
    const { ascendancyWeights, ...restConfig } = mmrConfig || {};
    const newMmrCalculation: Partial<MmrCalculationConfig> = {
      ...restConfig,
      algorithm: algorithm || 'WEIGHTED_AVERAGE',
    };
    // Only include ascendancyWeights if both current and peak are numbers
    if (ascendancyWeights?.current !== undefined && ascendancyWeights?.peak !== undefined) {
      newMmrCalculation.ascendancyWeights = {
        current: ascendancyWeights.current,
        peak: ascendancyWeights.peak,
      };
    }
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: newMmrCalculation as MmrCalculationConfig,
    });
  };

  const handleWeightChange = (playlist: 'ones' | 'twos' | 'threes' | 'fours', value: string) => {
    if (!isEditMode) return;
    const numValue = value === '' ? undefined : parseFloat(value);
    const { ascendancyWeights, ...restConfig } = mmrConfig || {};
    const newMmrCalculation: Partial<MmrCalculationConfig> = {
      ...restConfig,
      algorithm: mmrConfig?.algorithm || 'WEIGHTED_AVERAGE',
      weights: {
        ...mmrConfig?.weights,
        [playlist]: numValue,
      },
    };
    // Only include ascendancyWeights if both current and peak are numbers
    if (ascendancyWeights?.current !== undefined && ascendancyWeights?.peak !== undefined) {
      newMmrCalculation.ascendancyWeights = {
        current: ascendancyWeights.current,
        peak: ascendancyWeights.peak,
      };
    }
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: newMmrCalculation as MmrCalculationConfig,
    });
  };

  const handleMinGamesChange = (
    playlist: 'ones' | 'twos' | 'threes' | 'fours',
    value: string,
  ) => {
    if (!isEditMode) return;
    const numValue = value === '' ? undefined : parseInt(value, 10);
    const { ascendancyWeights, ...restConfig } = mmrConfig || {};
    const newMmrCalculation: Partial<MmrCalculationConfig> = {
      ...restConfig,
      algorithm: mmrConfig?.algorithm || 'WEIGHTED_AVERAGE',
      minGamesPlayed: {
        ...mmrConfig?.minGamesPlayed,
        [playlist]: numValue,
      },
    };
    // Only include ascendancyWeights if both current and peak are numbers
    if (ascendancyWeights?.current !== undefined && ascendancyWeights?.peak !== undefined) {
      newMmrCalculation.ascendancyWeights = {
        current: ascendancyWeights.current,
        peak: ascendancyWeights.peak,
      };
    }
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: newMmrCalculation as MmrCalculationConfig,
    });
  };

  const handleAscendancyWeightChange = (field: 'current' | 'peak', value: string) => {
    if (!isEditMode) return;
    const numValue = value === '' ? undefined : parseFloat(value);
    const isValidNumber = numValue !== undefined && !isNaN(numValue);
    
    // Ensure both current and peak are always numbers (required by AscendancyWeights type)
    const currentWeight = mmrConfig?.ascendancyWeights?.current ?? 0.25;
    const peakWeight = mmrConfig?.ascendancyWeights?.peak ?? 0.75;
    
    // Build config without ascendancyWeights, then add the properly typed one
    const { algorithm, weights, minGamesPlayed, customFormula, formulaValidated, formulaValidationError } = mmrConfig || {};
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: {
        algorithm: algorithm || 'ASCENDANCY',
        ...(weights && { weights }),
        ...(minGamesPlayed && { minGamesPlayed }),
        ...(customFormula && { customFormula }),
        ...(formulaValidated !== undefined && { formulaValidated }),
        ...(formulaValidationError !== undefined && { formulaValidationError }),
        ascendancyWeights: {
          current: field === 'current' ? (isValidNumber ? numValue : currentWeight) : currentWeight,
          peak: field === 'peak' ? (isValidNumber ? numValue : peakWeight) : peakWeight,
        },
      } as MmrCalculationConfig,
    });
  };

  const handleFormulaChange = (formula: string) => {
    if (!isEditMode) return;
    const { ascendancyWeights, ...restConfig } = mmrConfig || {};
    const newMmrCalculation: Partial<MmrCalculationConfig> = {
      ...restConfig,
      algorithm: mmrConfig?.algorithm || 'CUSTOM',
      customFormula: formula,
      formulaValidated: false,
      formulaValidationError: undefined,
    };
    // Only include ascendancyWeights if both current and peak are numbers
    if (ascendancyWeights?.current !== undefined && ascendancyWeights?.peak !== undefined) {
      newMmrCalculation.ascendancyWeights = {
        current: ascendancyWeights.current,
        peak: ascendancyWeights.peak,
      };
    }
    updateDraftSettings({
      ...draftSettings,
      mmrCalculation: newMmrCalculation as MmrCalculationConfig,
    });
  };

  return {
    handleAlgorithmChange,
    handleWeightChange,
    handleMinGamesChange,
    handleAscendancyWeightChange,
    handleFormulaChange,
  };
}





