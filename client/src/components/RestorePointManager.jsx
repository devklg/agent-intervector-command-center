import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Save, Search, RotateCcw, Clock, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from './ui/use-toast';
import * as restoreService from '../services/restoreService';

export default function RestorePointManager() {
  const [restorePoints, setRestorePoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const createRestorePoint = async () => {
    setIsCreating(true);
    try {
      const response = await restoreService.createRestorePoint({
        type: 'manual',
        manual_trigger: true,
        session_data: {
          summary: 'Kevin manual restore point',
          tool_calls: 47, // Would get from actual dashboard state
          duration: 2.3, // Would get from session timer
          active_agents: ['PROMETHEUS', 'THEO-5001', 'MARCUS-5002']
        }
      });
      
      if (response.success) {
        toast({
          title: "Restore Point Created",
          description: `Successfully created restore point: ${response.restore_point_id}`,
        });
        loadRestorePoints();
      }
    } catch (error) {
      console.error('Failed to create restore point:', error);
      toast({
        title: "Error",
        description: "Failed to create restore point. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const loadRestorePoints = async () => {
    try {
      setIsLoading(true);
      const response = await restoreService.searchRestorePoints(searchQuery);
      setRestorePoints(response.restore_points || []);
    } catch (error) {
      console.error('Failed to load restore points:', error);
      toast({
        title: "Error",
        description: "Failed to load restore points. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const restoreFromPoint = async (id) => {
    try {
      const response = await restoreService.loadRestorePoint(id);
      
      if (response.success) {
        toast({
          title: "System Restored",
          description: "Successfully restored from restore point. Reloading dashboard...",
        });
        // Refresh dashboard or redirect
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to restore:', error);
      toast({
        title: "Restoration Failed",
        description: "Failed to restore from point. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    loadRestorePoints();
  }, [searchQuery]);
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'milestone': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'session_state': return <Clock className="h-4 w-4 text-green-500" />;
      default: return <Save className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ChromaDB Restore Points
        </h1>
        <p className="text-gray-600">
          Token-free session restoration system designed by PROMETHEUS & THEO-5001
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Restore Point Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={createRestorePoint}
              disabled={isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Restore Point'}
            </Button>
            
            <div className="flex-1 max-w-md">
              <Input 
                placeholder="Search restore points..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Button 
              variant="outline"
              onClick={loadRestorePoints}
              disabled={isLoading}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading restore points...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {restorePoints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Save className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No restore points found</p>
                  <p className="text-sm">Create your first restore point to get started</p>
                </div>
              ) : (
                restorePoints.map((point) => (
                  <div key={point.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(point.type)}
                          <h4 className="font-medium text-lg">
                            {point.session_context?.conversation_summary || 'Session Restore Point'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(point.timestamp).toLocaleString()}
                          <Badge variant="outline">{point.type}</Badge>
                          <Badge variant="secondary">{point.created_by}</Badge>
                          {point.metadata?.priority && (
                            <Badge 
                              className={`text-white ${getPriorityColor(point.metadata.priority)}`}
                            >
                              {point.metadata.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => restoreFromPoint(point.id)}
                        className="ml-4"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="font-medium text-blue-900">Progress</div>
                        <div className="text-blue-700">
                          {point.project_status?.completion_percentage || 0}%
                        </div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-medium text-green-900">Agents</div>
                        <div className="text-green-700">
                          {point.session_context?.active_agents?.length || 0}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="font-medium text-purple-900">Tools</div>
                        <div className="text-purple-700">
                          {point.session_context?.tool_calls_used || 0}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <div className="font-medium text-orange-900">Duration</div>
                        <div className="text-orange-700">
                          {point.session_context?.session_duration || 0}h
                        </div>
                      </div>
                    </div>
                    
                    {point.metadata?.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {point.metadata.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* System Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">ChromaDB System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">ChromaDB Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Collections Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Zero Token Cost</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}