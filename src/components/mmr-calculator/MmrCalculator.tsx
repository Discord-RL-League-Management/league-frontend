import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Label } from '@/components/ui/label.js';
import { Input } from '@/components/ui/input.js';
import { Button } from '@/components/ui/button.js';
import { Alert, AlertDescription } from '@/components/ui/alert.js';
import { mmrCalculationApi, type TrackerData } from '@/lib/api/mmr-calculation.js';
import { Calculator } from 'lucide-react';

interface MmrCalculatorProps {
  guildId: string;
}

/**
 * MmrCalculator - Public calculator component for all users
 * Allows anyone to calculate MMR using the guild's configured algorithm
 */
export function MmrCalculator({ guildId }: MmrCalculatorProps) {
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
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const handleCalculateMmr = async () => {
    setCalculating(true);
    setCalculationError(null);
    setCalculatedResult(null);

    try {
      const result = await mmrCalculationApi.calculateMmr(guildId, calculatorData);
      setCalculatedResult(result.result);
    } catch (error: any) {
      setCalculationError(
        error.response?.data?.message || error.message || 'Failed to calculate MMR',
      );
      setCalculatedResult(null);
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
        <div className="grid grid-cols-2 gap-4">
          {(['ones', 'twos', 'threes', 'fours'] as const).map((playlist) => (
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

