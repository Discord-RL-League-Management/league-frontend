import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  message?: string
  className?: string
}

/**
 * LoadingState - Single responsibility: Display full-page loading state
 * Composition component using LoadingSpinner + text message
 * No business logic, pure presentation
 */
export function LoadingState({ 
  message = "Loading...", 
  className 
}: LoadingStateProps) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-background",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-lg">{message}</p>
      </div>
    </div>
  )
}


