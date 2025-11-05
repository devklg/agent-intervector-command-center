import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input, Label } from './ui/input';
import { useToast } from './ui/use-toast';
import { Settings as SettingsIcon, Database, Zap, Shield, Bell } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [systemHealth, setSystemHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    try {
      const response = await api.get('/health');
      setSystemHealth(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load system health:', error);
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    toast({ title: 'Testing Connection...', description: 'Checking system health' });
    await loadSystemHealth();
    if (systemHealth?.status === 'healthy') {
      toast({ title: 'Connection Successful', description: 'All systems operational' });
    } else {
      toast({
        title: 'Connection Warning',
        description: 'Some components may be degraded',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">System configuration and health monitoring</p>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Current system status and component health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Overall Status</p>
              <p className="text-sm text-gray-600">
                {systemHealth?.status === 'healthy' ? 'All systems operational' : 'Some issues detected'}
              </p>
            </div>
            <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'}>
              {systemHealth?.status || 'unknown'}
            </Badge>
          </div>

          {systemHealth?.components && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Components</p>
              {Object.entries(systemHealth.components).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm capitalize">{name}</span>
                  <Badge variant={status === 'healthy' ? 'default' : 'destructive'}>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {systemHealth?.memory && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Memory Usage</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">
                  {systemHealth.memory.used} / {systemHealth.memory.total} {systemHealth.memory.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(systemHealth.memory.used / systemHealth.memory.total) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {systemHealth?.uptime !== undefined && (
            <div className="text-sm">
              <span className="text-gray-600">Uptime: </span>
              <span className="font-medium">{Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m</span>
            </div>
          )}

          <Button onClick={handleTestConnection} variant="outline" className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* ChromaDB Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            ChromaDB Configuration
          </CardTitle>
          <CardDescription>Vector database connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ChromaDB Host</Label>
            <Input
              defaultValue={process.env.REACT_APP_CHROMA_HOST || 'localhost'}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>ChromaDB Port</Label>
            <Input
              defaultValue={process.env.REACT_APP_CHROMA_PORT || '7501'}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>API Endpoint</Label>
            <Input
              defaultValue={process.env.REACT_APP_API_URL || 'http://localhost:7500'}
              disabled
            />
          </div>
          <p className="text-xs text-gray-500">
            Configuration is read from environment variables and cannot be changed at runtime.
          </p>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-gray-600">Service</span>
            <span className="text-sm font-medium">{systemHealth?.service || 'Agent Command Center'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-gray-600">Version</span>
            <span className="text-sm font-medium">{systemHealth?.version || '1.0.0'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-gray-600">Protocol Version</span>
            <span className="text-sm font-medium">Intervector v1.0</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-600">Last Updated</span>
            <span className="text-sm font-medium">
              {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Features & Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Zero-Token Coordination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Intervector Communication</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Session Restore Points</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Multi-Agent Coordination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Vector-Based Search</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Real-Time Updates</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
