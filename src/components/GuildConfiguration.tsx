import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/index.ts';
import { BotCommandChannelsSection } from './guild-config/BotCommandChannelsSection.tsx';
import { RegisterCommandChannelsSection } from './guild-config/RegisterCommandChannelsSection.tsx';
import { AuditLogTab } from './guild-config/AuditLogTab.tsx';
import { PermissionGuard } from '../components/PermissionGuard.tsx';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

interface GuildConfigurationProps {
  guildId: string;
  onBack?: () => void;
}

export default function GuildConfiguration({ guildId }: GuildConfigurationProps) {
  const [activeTab, setActiveTab] = useState('config');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Use separate selectors to avoid object-returning selector issues with closure variables
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const retry = useSettingsStore((state) => state.retry);
  const updateDraftSettings = useSettingsStore((state) => state.updateDraftSettings);
  const saveDraftSettings = useSettingsStore((state) => state.saveDraftSettings);
  const cancelEdit = useSettingsStore((state) => state.cancelEdit);
  const allSettings = useSettingsStore((state) => state.settings[guildId] || null);
  const draftSettings = useSettingsStore((state) => state.draftSettings);
  const loading = useSettingsStore((state) => state.loading);
  const error = useSettingsStore((state) => state.error);

  useEffect(() => {
    loadSettings(guildId);
    // loadSettings from Zustand is stable, so we don't need it in deps
  }, [guildId]);

  const handleReset = async () => {
    try {
      await resetSettings(guildId);
      setIsEditMode(false);
    } catch (err: unknown) {
      console.error('Failed to reset settings:', err);
    }
  };

  const handleEdit = () => {
    // Initialize draft with current settings
    if (allSettings) {
      updateDraftSettings(allSettings);
    }
    setIsEditMode(true);
  };

  const handleCancel = () => {
    cancelEdit();
    setIsEditMode(false);
  };

  const handleSave = async () => {
    try {
      await saveDraftSettings(guildId);
      setIsEditMode(false);
    } catch (err: unknown) {
      console.error('Failed to save settings:', err);
      // Error is already set in store, just keep edit mode
    }
  };

  if (loading && !allSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  if (!allSettings) {
    // If there's an error, show it. Otherwise, settings should be auto-created by the backend
    if (error) {
      return (
        <div className="max-w-7xl mx-auto">
          <ErrorDisplay error={error} onRetry={() => retry(guildId)} />
        </div>
      );
    }
    
    // This should never happen now - backend auto-creates settings
    // But keep this as a fallback just in case
    return (
      <div className="max-w-7xl mx-auto text-center py-8">
        <p className="text-muted-foreground">No settings found</p>
        <p className="text-sm text-muted-foreground mt-2">Settings should be automatically created. Please refresh or retry.</p>
        <Button
          onClick={() => retry(guildId)}
          className="mt-4"
        >
          Retry Loading
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Guild Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure bot behavior and channel settings
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isEditMode ? (
            <Button
              onClick={handleEdit}
            >
              Edit Configuration
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                disabled={loading}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
          {error && (
            <Button
              onClick={() => retry(guildId)}
              variant="outline"
            >
              Retry Failed Update
            </Button>
          )}
          {isEditMode && (
            <Button
              onClick={handleReset}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Resetting...' : 'Reset to Defaults'}
            </Button>
          )}
        </div>
      </div>

      {/* View/Edit Mode Indicator */}
      <Alert>
        <AlertDescription>
          {isEditMode ? '✏️ Edit Mode - Make changes to configuration' : '👁️ View Mode - View configuration only'}
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <div>
          <ErrorDisplay error={error} />
        </div>
      )}

      {/* Loading Indicator */}
      {loading && allSettings && (
        <Alert>
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <AlertDescription>Updating settings...</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 sm:flex-none">
              <span className="mr-2">{tab.icon}</span>
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="config" className="mt-6">
          <Accordion type="multiple" defaultValue={['channels']} className="space-y-4">
            <AccordionItem value="channels" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                Channel Settings
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="mb-6 p-4 bg-muted rounded-lg border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Bot Command Channels:</strong> Where the bot listens for all commands.
                    <br />
                    <strong className="text-foreground">Register Command Channels:</strong> Override for /register command specifically.
                    If empty, uses Bot Command Channels or all channels.
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BotCommandChannelsSection guildId={guildId} isEditMode={isEditMode} />
                  <RegisterCommandChannelsSection guildId={guildId} isEditMode={isEditMode} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <PermissionGuard guildId={guildId} requireAdmin>
            <AuditLogTab guildId={guildId} />
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

