/**
 * Settings Type Definitions
 * All settings-related types for guild configuration
 */

/**
 * Channel configuration
 */
export interface ChannelConfig {
  id: string;
  name: string;
}

/**
 * MMR calculation weights
 */
export interface MmrWeights {
  ones?: number;
  twos?: number;
  threes?: number;
  fours?: number;
}

/**
 * Minimum games played thresholds
 */
export interface MinGamesPlayed {
  ones?: number;
  twos?: number;
  threes?: number;
  fours?: number;
}

/**
 * Ascendancy algorithm weights configuration
 */
export interface AscendancyWeights {
  /**
   * Current MMR weight (Q) - typically 0.25
   */
  current: number;
  /**
   * Peak MMR weight (R) - typically 0.75
   */
  peak: number;
}

/**
 * MMR calculation configuration
 */
export interface MmrCalculationConfig {
  algorithm: 'WEIGHTED_AVERAGE' | 'PEAK_MMR' | 'CUSTOM' | 'ASCENDANCY';
  weights?: MmrWeights;
  minGamesPlayed?: MinGamesPlayed;
  customFormula?: string;
  ascendancyWeights?: AscendancyWeights;
  formulaValidated?: boolean;
  formulaValidationError?: string;
}

/**
 * Main guild settings type
 */
export interface GuildSettingsType {
  bot_command_channels?: ChannelConfig[];
  register_command_channels?: ChannelConfig[];
  mmrCalculation?: MmrCalculationConfig;
}

