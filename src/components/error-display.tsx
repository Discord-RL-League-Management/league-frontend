import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  className?: string
}

/**
 * ErrorDisplay - Single responsibility: Display error messages consistently
 * Uses shadcn Alert component
 * Accepts error message and optional retry callback
 * No error handling logic, only presentation
 */
export function ErrorDisplay({ error, onRetry, className }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}



