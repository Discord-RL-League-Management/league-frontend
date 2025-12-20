import { Label } from '@/components/ui/label.js';
import { Input } from '@/components/ui/input.js';

interface PeakMmrConfigProps {
  mmrConfig: {
    minGamesPlayed?: {
      ones?: number;
      twos?: number;
      threes?: number;
      fours?: number;
    };
  };
  isEditMode: boolean;
  onMinGamesChange: (playlist: 'ones' | 'twos' | 'threes' | 'fours', value: string) => void;
}

/**
 * PeakMmrConfig - Configuration UI for peak MMR algorithm
 */
export function PeakMmrConfig({
  mmrConfig,
  isEditMode,
  onMinGamesChange,
}: PeakMmrConfigProps) {
  return (
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
              onChange={(e) => onMinGamesChange(playlist, e.target.value)}
              disabled={!isEditMode}
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}





