import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface User {
  id: string
  username: string
  globalName?: string
  avatar?: string
}

interface UserAvatarProps {
  user: User
  size?: "sm" | "md" | "lg"
  className?: string
}

/**
 * UserAvatar - Single responsibility: Display user avatar with fallback
 * Separation: Discord CDN URL logic isolated here
 * Uses shadcn Avatar components
 * Accepts user object, generates URL internally
 */
export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : 'https://cdn.discordapp.com/embed/avatars/0.png'

  const displayName = user.globalName || user.username
  const fallbackText = displayName.charAt(0).toUpperCase()

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </Avatar>
  )
}



