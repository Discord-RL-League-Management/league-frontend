import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button.js"
import { Badge } from "@/components/ui/badge.js"
import { UserAvatar } from "@/components/user-avatar.js"
import { cn } from "@/lib/utils.js"

interface User {
  id: string
  username: string
  globalName?: string
  avatar?: string
}

interface NavigationBarProps {
  user: User
  onLogout: () => void
  className?: string
}

/**
 * NavigationBar - Single responsibility: Display top navigation only
 * Composition: Uses UserAvatar, Button, Badge
 * Accepts user and logout callback as props
 * No auth logic, delegates to parent
 */
export function NavigationBar({ user, onLogout, className }: NavigationBarProps) {
  const displayName = user.globalName || user.username

  return (
    <nav className={cn(
      "bg-card border-b border-border",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity">
            League Management
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="sm" />
              <Badge variant="secondary">{displayName}</Badge>
            </div>
            
            <Button
              variant="destructive"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}















