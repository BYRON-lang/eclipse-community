import React from 'react';
import { useSettings } from '@/contexts/settings-context';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Volume2, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationSettings() {
  const { settings, updateNotificationSettings, playNotificationSound } = useSettings();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={18} />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how you want to be notified about new activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications-enabled" className="flex-1">
            Enable notifications
          </Label>
          <Switch
            id="notifications-enabled"
            checked={settings.notifications.enabled}
            onCheckedChange={(checked) =>
              updateNotificationSettings({ enabled: checked })
            }
          />
        </div>

        <div className="space-y-3">
          <Label>Notification sound</Label>
          <Select
            value={settings.notifications.sound}
            onValueChange={(value) =>
              updateNotificationSettings({ sound: value as any })
            }
            disabled={!settings.notifications.enabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a sound" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="iphone">iPhone</SelectItem>
              <SelectItem value="galaxy">Galaxy</SelectItem>
              <SelectItem value="mixkit">Mixkit Pop</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={playNotificationSound}
              disabled={!settings.notifications.enabled || settings.notifications.sound === 'none'}
            >
              Test Sound
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider" className="flex items-center gap-2">
              <Volume2 size={16} />
              Volume
            </Label>
            <span className="text-sm text-eclipse-muted">
              {Math.round(settings.notifications.volume * 100)}%
            </span>
          </div>
          <Slider
            id="volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={[settings.notifications.volume]}
            onValueChange={(value) =>
              updateNotificationSettings({ volume: value[0] })
            }
            disabled={!settings.notifications.enabled}
          />
        </div>

        <div className="space-y-4 pt-2">
          <Label className="text-sm font-medium">Notify me about:</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="new-message-switch" className="flex-1 text-sm">
              New messages
            </Label>
            <Switch
              id="new-message-switch"
              checked={settings.notifications.newMessage}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ newMessage: checked })
              }
              disabled={!settings.notifications.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="new-thread-switch" className="flex-1 text-sm">
              New threads
            </Label>
            <Switch
              id="new-thread-switch"
              checked={settings.notifications.newThread}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ newThread: checked })
              }
              disabled={!settings.notifications.enabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="mentions-switch" className="flex-1 text-sm">
              Mentions
            </Label>
            <Switch
              id="mentions-switch"
              checked={settings.notifications.mentions}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ mentions: checked })
              }
              disabled={!settings.notifications.enabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}