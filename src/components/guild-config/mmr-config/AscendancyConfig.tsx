import { Label } from '@/components/ui/label.js';
import { Input } from '@/components/ui/input.js';
import { Alert, AlertDescription } from '@/components/ui/alert.js';

interface AscendancyConfigProps {
  mmrConfig: {
    ascendancyWeights?: {
      current?: number;
      peak?: number;
    };
  };
  isEditMode: boolean;
  onAscendancyWeightChange: (field: 'current' | 'peak', value: string) => void;
}

/**
 * AscendancyConfig - Configuration UI for ascendancy algorithm
 */
export function AscendancyConfig({
  mmrConfig,
  isEditMode,
  onAscendancyWeightChange,
}: AscendancyConfigProps) {
  const current = mmrConfig?.ascendancyWeights?.current ?? 0.25;
  const peak = mmrConfig?.ascendancyWeights?.peak ?? 0.75;
  const sum = current + peak;
  const showWeightWarning = Math.abs(sum - 1.0) > 0.01;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Current vs Peak Weights</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how much to weight Current MMR vs Peak MMR. Peak is typically weighted higher (e.g., 0.75) than Current (e.g., 0.25). Weights should sum to 1.0 for best results.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ascendancy-current-weight">Current Weight (Q)</Label>
          <Input
            id="ascendancy-current-weight"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={current}
            onChange={(e) => onAscendancyWeightChange('current', e.target.value)}
            disabled={!isEditMode}
            placeholder="0.25"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ascendancy-peak-weight">Peak Weight (R)</Label>
          <Input
            id="ascendancy-peak-weight"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={peak}
            onChange={(e) => onAscendancyWeightChange('peak', e.target.value)}
            disabled={!isEditMode}
            placeholder="0.75"
          />
        </div>
      </div>
      {showWeightWarning && (
        <Alert>
          <AlertDescription>
            Weights sum to {sum.toFixed(2)}, not 1.0. This may produce unexpected results.
          </AlertDescription>
        </Alert>
      )}
      <div className="p-4 bg-muted rounded-lg border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Ascendancy Algorithm:</strong> Calculates a weighted average of 2s and 3s performance based on game percentages. The algorithm combines Current and Peak MMR for each playlist, then weights the final score by the proportion of games played in each mode.
        </p>
      </div>
    </div>
  );
}





