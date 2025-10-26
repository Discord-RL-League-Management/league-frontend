import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Guild {
  id: string
  name: string
  icon?: string
}

interface GuildAvatarProps {
  guild: Guild
  size?: "sm" | "md" | "lg"
  className?: string
}

/**
 * GuildAvatar - Single responsibility: Display guild avatar with fallback
 * Separation: Discord CDN URL logic isolated here
 * Uses shadcn Avatar components
 * Accepts guild object, generates URL internally
 */
export function GuildAvatar({ guild, size = "md", className }: GuildAvatarProps) {
  const avatarUrl = guild.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
    : null

  const fallbackText = guild.name.charAt(0).toUpperCase()

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-16 w-16"
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl || undefined} alt={guild.name} />
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </Avatar>
  )
}


