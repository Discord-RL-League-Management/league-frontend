import { GuildAvatar } from "@/components/guild-avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Guild {
  id: string
  name: string
  icon?: string
  roles: string[]
}

interface GuildListProps {
  guilds: Guild[]
  selectedGuildId?: string
  onGuildSelect: (guild: Guild) => void
  className?: string
}

/**
 * GuildList - Single responsibility: Display guild list for selection
 * Pure presentation component, receives guilds array as prop
 * Clear boundary between data and UI
 */
export function GuildList({ 
  guilds, 
  selectedGuildId, 
  onGuildSelect, 
  className 
}: GuildListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-lg font-semibold text-foreground">Select Server</h3>
      <div className="grid gap-2">
        {guilds.map((guild) => (
          <Card
            key={guild.id}
            className={cn(
              "p-3 cursor-pointer transition-colors hover:bg-accent",
              selectedGuildId === guild.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground"
            )}
            onClick={() => onGuildSelect(guild)}
          >
            <div className="flex items-center gap-3">
              <GuildAvatar guild={guild} size="sm" />
              <div className="text-left">
                <div className="font-medium">{guild.name}</div>
                <div className="text-sm opacity-75">
                  <Badge variant="outline" className="text-xs">
                    {guild.roles.includes('admin') ? 'Admin' : 'Member'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
