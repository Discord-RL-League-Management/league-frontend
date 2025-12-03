import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Label } from '@/components/ui/label.js';
import { Input } from '@/components/ui/input.js';
import { Button } from '@/components/ui/button.js';
import { Alert, AlertDescription } from '@/components/ui/alert.js';
import { mmrCalculationApi, type TrackerData } from '@/lib/api/mmr-calculation.js';
import { useSettingsStore } from '@/stores/index.js';
import { Calculator } from 'lucide-react';

interface MmrCalculatorProps {
  guildId: string;
}

/**
 * Determine which playlists are needed based on algorithm
 */
function getRequiredPlaylists(algorithm: string | undefined, config: any): Array<'ones' | 'twos' | 'threes' | 'fours'> {
  switch (algorithm) {
    case 'ASCENDANCY':
      // Ascendancy only uses 2s and 3s
      return ['twos', 'threes'];
    case 'WEIGHTED_AVERAGE':
      // Show playlists that have weights configured (or all if none configured)
      if (config?.weights) {
        const playlists: Array<'ones' | 'twos' | 'threes' | 'fours'> = [];
        if (config.weights.ones !== undefined && config.weights.ones > 0) playlists.push('ones');
        if (config.weights.twos !== undefined && config.weights.twos > 0) playlists.push('twos');
        if (config.weights.threes !== undefined && config.weights.threes > 0) playlists.push('threes');
        if (config.weights.fours !== undefined && config.weights.fours > 0) playlists.push('fours');
        return playlists.length > 0 ? playlists : ['ones', 'twos', 'threes', 'fours'];
      }
      return ['ones', 'twos', 'threes', 'fours'];
    case 'PEAK_MMR':
    case 'CUSTOM':
    default:
      // Show all playlists for peak MMR and custom
      return ['ones', 'twos', 'threes', 'fours'];
  }
}

/**
 * MmrCalculator - Public calculator component for all users
 * Allows anyone to calculate MMR using the guild's configured algorithm
 */
export function MmrCalculator({ guildId }: MmrCalculatorProps) {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const allSettings = useSettingsStore((state) => state.settings[guildId] || null);
  const mmrConfig = allSettings?.mmrCalculation;

  // Load settings on mount
  useEffect(() => {
    if (!allSettings) {
      void loadSettings(guildId);
    }
  }, [guildId, allSettings, loadSettings]);

  // Determine which playlists to show
  const requiredPlaylists = useMemo(
    () => getRequiredPlaylists(mmrConfig?.algorithm, mmrConfig),
    [mmrConfig],
  );

  const [calculatorData, setCalculatorData] = useState<TrackerData>({
    ones: undefined,
    twos: undefined,
    threes: undefined,
    fours: undefined,
    onesGamesPlayed: undefined,
    twosGamesPlayed: undefined,
    threesGamesPlayed: undefined,
    foursGamesPlayed: undefined,
  });
  const [calculatedResult, setCalculatedResult] = useState<number | null>(null);
  const [calculatedAlgorithm, setCalculatedAlgorithm] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const handleCalculateMmr = async () => {
    setCalculating(true);
    setCalculationError(null);
    setCalculatedResult(null);
    setCalculatedAlgorithm(null);

    try {
      const result = await mmrCalculationApi.calculateMmrDemo(guildId, calculatorData);
      setCalculatedResult(result.result);
      setCalculatedAlgorithm(result.algorithm);
    } catch (error: any) {
      setCalculationError(
        error.response?.data?.message || error.message || 'Failed to calculate MMR',
      );
      setCalculatedResult(null);
      setCalculatedAlgorithm(null);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <CardTitle>MMR Calculator</CardTitle>
        </div>
        <CardDescription>
          Enter your tracker MMR values to calculate your internal MMR using this guild's algorithm
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mmrConfig?.algorithm && (
          <Alert>
            <AlertDescription>
              <strong>Algorithm:</strong> {mmrConfig.algorithm === 'WEIGHTED_AVERAGE' ? 'Weighted Average' : mmrConfig.algorithm === 'PEAK_MMR' ? 'Peak MMR' : mmrConfig.algorithm === 'ASCENDANCY' ? 'Ascendancy' : 'Custom Formula'}
              {mmrConfig.algorithm === 'ASCENDANCY' && (
                <span className="text-xs text-muted-foreground block mt-1">
                  Only 2v2 and 3v3 data are needed for this algorithm
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4">
          {requiredPlaylists.map((playlist) => (
            <div key={playlist} className="space-y-2">
              <Label>
                {playlist === 'ones'
                  ? '1v1'
                  : playlist === 'twos'
                    ? '2v2'
                    : playlist === 'threes'
                      ? '3v3'
                      : '4v4'}
              </Label>
              <Input
                type="number"
                min="0"
                value={calculatorData[playlist] ?? ''}
                onChange={(e) =>
                  setCalculatorData({
                    ...calculatorData,
                    [playlist]: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                placeholder="MMR"
              />
              <Input
                type="number"
                min="0"
                value={calculatorData[`${playlist}GamesPlayed` as keyof TrackerData] ?? ''}
                onChange={(e) =>
                  setCalculatorData({
                    ...calculatorData,
                    [`${playlist}GamesPlayed`]: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                placeholder="Games played"
              />
            </div>
          ))}
        </div>

        <Button
          onClick={handleCalculateMmr}
          disabled={calculating}
          className="w-full sm:w-auto"
        >
          {calculating ? 'Calculating...' : 'Calculate MMR'}
        </Button>

        {calculatedResult !== null && (
          <Alert>
            <AlertDescription>
              <strong>Calculated MMR:</strong> {calculatedResult.toLocaleString()}
              {calculatedAlgorithm && (
                <>
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Algorithm: {calculatedAlgorithm}
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {calculationError && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {calculationError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

