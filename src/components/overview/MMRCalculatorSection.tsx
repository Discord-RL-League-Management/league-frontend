import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Link } from 'react-router-dom';
import { Calculator } from 'lucide-react';

interface MMRCalculatorSectionProps {
  guildId: string;
}

/**
 * MMRCalculatorSection Component
 * 
 * Displays MMR calculator link and description.
 */
export function MMRCalculatorSection({ guildId }: MMRCalculatorSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>MMR Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Calculate your internal MMR using this guild's configured algorithm
        </p>
        <Link to={`/dashboard/guild/${guildId}/DemoCalculator`}>
          <Button className="w-full sm:w-auto">
            <Calculator className="mr-2 h-4 w-4" />
            Open Calculator
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

