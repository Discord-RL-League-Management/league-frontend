import { useEffect, memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Label } from '@/components/ui/label.js';
import { useSettingsStore, useChannelsStore } from '@/stores/index.js';
import type { DiscordChannel } from '@/types/index.js';
import { Checkbox } from '@/components/ui/checkbox.js';
import { LoadingSpinner } from '@/components/loading-spinner.js';
import { ErrorDisplay } from '@/components/error-display.js';

interface BotCommandChannelsSectionProps {
  guildId: string;
  isEditMode?: boolean;
}

const BotCommandChannelsSectionComponent = ({ guildId, isEditMode = false }: BotCommandChannelsSectionProps) => {
  // Use separate selectors to avoid object-returning selector issues with closure variables
  const allSettings = useSettingsStore((state) => state.settings[guildId] || null);
  const draftSettings = useSettingsStore((state) => state.draftSettings);
  const updateDraftSettings = useSettingsStore((state) => state.updateDraftSettings);
  const loading = useSettingsStore((state) => state.loading);
  
  // Use draft settings in edit mode, original settings in view mode
  const displaySettings = isEditMode && draftSettings ? draftSettings : (allSettings || null);
  const botCommandChannels = displaySettings?.bot_command_channels || [];
  
  // Use channelsStore instead of local state - separate selectors
  const fetchChannels = useChannelsStore((state) => state.fetchChannels);
  const getChannels = useChannelsStore((state) => state.getChannels);
  const channelsLoading = useChannelsStore((state) => state.loading);
  const channelsError = useChannelsStore((state) => state.error);

  const discordChannels = getChannels(guildId);

  useEffect(() => {
    fetchChannels(guildId);
  }, [guildId, fetchChannels]);

  // Group channels by category and filter out category channels from selectable items
  const { categories, channelsByCategory, uncategorizedChannels } = useMemo(() => {
    // Discord channel types: 4 = GUILD_CATEGORY, 0 = GUILD_TEXT, 2 = GUILD_VOICE, 5 = GUILD_ANNOUNCEMENT
    const GUILD_CATEGORY = 4;
    const GUILD_TEXT = 0;
    const GUILD_ANNOUNCEMENT = 5;

    // Get category channels (type === 4)
    const categoryChannels = discordChannels.filter(ch => ch.type === GUILD_CATEGORY);
    
    // Get selectable channels (text or announcement channels only, not categories)
    const selectableChannels = discordChannels.filter(
      ch => ch.type === GUILD_TEXT || ch.type === GUILD_ANNOUNCEMENT
    );

    // Group selectable channels by parent category
    const channelsByCategoryMap = new Map<string, DiscordChannel[]>();
    const uncategorized: DiscordChannel[] = [];

    selectableChannels.forEach(channel => {
      if (channel.parent_id) {
        const existing = channelsByCategoryMap.get(channel.parent_id) || [];
        channelsByCategoryMap.set(channel.parent_id, [...existing, channel]);
      } else {
        uncategorized.push(channel);
      }
    });

    // Create a map of category ID to category channel
    const categoryMap = new Map<string, DiscordChannel>();
    categoryChannels.forEach(cat => {
      categoryMap.set(cat.id, cat);
    });

    // Sort categories by their position (if available) or alphabetically
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    // Sort channels within each category
    const sortedChannelsByCategory = new Map<string, DiscordChannel[]>();
    channelsByCategoryMap.forEach((channels, categoryId) => {
      sortedChannelsByCategory.set(
        categoryId,
        channels.sort((a, b) => a.name.localeCompare(b.name))
      );
    });

    return {
      categories: sortedCategories,
      channelsByCategory: sortedChannelsByCategory,
      uncategorizedChannels: uncategorized.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [discordChannels]);

  const isChannelSelected = (channelId: string): boolean => {
    return botCommandChannels.some(ch => ch.id === channelId);
  };

  const handleChannelToggle = (channelId: string, checked: boolean) => {
    if (!isEditMode) return;

    if (checked) {
      // Add channel
      const channel = discordChannels.find(ch => ch.id === channelId);
      if (!channel) return;

      const newChannels = [
        ...botCommandChannels,
        { id: channel.id, name: channel.name },
      ];
      updateDraftSettings({ bot_command_channels: newChannels });
    } else {
      const newChannels = botCommandChannels.filter(ch => ch.id !== channelId);
      updateDraftSettings({ bot_command_channels: newChannels });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bot Command Channels</CardTitle>
          <CardDescription>
            Select channels where the bot listens for commands. Leave empty to allow commands in all channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {channelsError && (
            <ErrorDisplay error={channelsError} />
          )}

          {channelsLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-muted-foreground">Loading channels...</span>
            </div>
          ) : (
            <>
              {discordChannels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No channels available</p>
              ) : (
                <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                  {/* Render channels grouped by category */}
                  {categories.map((category) => {
                    const categoryChannels = channelsByCategory.get(category.id) || [];
                    if (categoryChannels.length === 0) return null;

                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
                          {category.name}
                        </div>
                        <div className="space-y-2 pl-4">
                          {categoryChannels.map((channel) => {
                            const isSelected = isChannelSelected(channel.id);
                            return (
                              <div key={channel.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`channel-${channel.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleChannelToggle(channel.id, checked === true)
                                  }
                                  disabled={loading || channelsLoading || !isEditMode}
                                  className={!isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
                                />
                                <Label
                                  htmlFor={`channel-${channel.id}`}
                                  className="flex-1 cursor-pointer text-sm font-normal"
                                >
                                  {channel.name}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Render uncategorized channels */}
                  {uncategorizedChannels.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
                        Uncategorized
                      </div>
                      <div className="space-y-2 pl-4">
                        {uncategorizedChannels.map((channel) => {
                          const isSelected = isChannelSelected(channel.id);
                          return (
                            <div key={channel.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`channel-${channel.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleChannelToggle(channel.id, checked === true)
                                }
                                disabled={loading || channelsLoading || !isEditMode}
                                className={!isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
                              />
                              <Label
                                htmlFor={`channel-${channel.id}`}
                                className="flex-1 cursor-pointer text-sm font-normal"
                              >
                                {channel.name}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {botCommandChannels.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No channels selected - bot will listen in all channels
                </p>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Selected channels:</Label>
                  <div className="flex flex-wrap gap-2">
                    {botCommandChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                      >
                        {channel.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const BotCommandChannelsSection = memo(BotCommandChannelsSectionComponent);
BotCommandChannelsSection.displayName = 'BotCommandChannelsSection';

