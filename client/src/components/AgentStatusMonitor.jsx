import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  Activity,
  Circle,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import agentService from '../services/agentService';
import { useToast } from './ui/use-toast';

export default function AgentStatusMonitor() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAgentStatus();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadAgentStatus, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadAgentStatus = async () => {
    try {
      const response = await agentService.getAllAgents();

      // Mock real-time status data (in production, this would come from WebSocket or polling)
      const agentsWithStatus = (response.data || []).map(agent => ({
        ...agent,
        realTimeStatus: {
          isOnline: Math.random() > 0.3, // 70% chance online
          currentTask: Math.random() > 0.5 ? getRandomTask() : null,
          messagesLastHour: Math.floor(Math.random() * 50),
          responseTimeAvg: Math.floor(Math.random() * 3000) + 500, // 500-3500ms
          activeSince: Date.now() - Math.floor(Math.random() * 3600000), // Random time in last hour
          cpuUsage: Math.floor(Math.random() * 80) + 10, // 10-90%
          memoryUsage: Math.floor(Math.random() * 70) + 20, // 20-90%
          tasksCompleted: Math.floor(Math.random() * 20),
          tasksInProgress: Math.floor(Math.random() * 5),
          lastActivity: Date.now() - Math.floor(Math.random() * 600000) // Last 10 minutes
        }
      }));

      setAgents(agentsWithStatus);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load agent status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agent status',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const getRandomTask = () => {
    const tasks = [
      'Processing user story 2-1',
      'Reviewing code changes',
      'Generating test cases',
      'Analyzing requirements',
      'Coordinating with team',
      'Writing documentation',
      'Running integration tests',
      'Optimizing database queries',
      'Deploying to staging'
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
  };

  const getStatusColor = (status) => {
    return status.isOnline ? 'text-green-500' : 'text-gray-400';
  };

  const getPerformanceColor = (value) => {
    if (value < 50) return 'text-green-600';
    if (value < 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatUptime = (timestamp) => {
    const uptime = Date.now() - timestamp;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatLastActivity = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  const onlineAgents = agents.filter(a => a.realTimeStatus?.isOnline).length;
  const avgResponseTime = agents.length > 0
    ? Math.round(agents.reduce((acc, a) => acc + (a.realTimeStatus?.responseTimeAvg || 0), 0) / agents.length)
    : 0;
  const totalMessages = agents.reduce((acc, a) => acc + (a.realTimeStatus?.messagesLastHour || 0), 0);
  const activeTasksCount = agents.reduce((acc, a) => acc + (a.realTimeStatus?.tasksInProgress || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Real-Time Stats */}
      <Card className="card-gradient shadow-brand">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="gradient-text text-2xl flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Real-Time Agent Status Monitor
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Live tracking of all agent activities, performance metrics, and system health
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <Button
                onClick={loadAgentStatus}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-3xl font-bold gradient-text">{onlineAgents}/{agents.length}</p>
              <p className="text-xs text-gray-600 mt-1">Agents Online</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-green-800">{totalMessages}</p>
              <p className="text-xs text-green-600 mt-1">Messages (1h)</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-purple-800">{avgResponseTime}ms</p>
              <p className="text-xs text-purple-600 mt-1">Avg Response</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-yellow-800">{activeTasksCount}</p>
              <p className="text-xs text-yellow-600 mt-1">Active Tasks</p>
            </div>
          </div>

          {lastUpdate && (
            <p className="text-xs text-gray-500 text-center mt-4">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Agent Status Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No agents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const status = agent.realTimeStatus || {};

            return (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Circle
                        className={`h-3 w-3 ${getStatusColor(status)} ${status.isOnline ? 'animate-pulse' : ''}`}
                        fill="currentColor"
                      />
                      <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
                    </div>
                    <Badge variant={status.isOnline ? 'default' : 'secondary'} className="text-xs">
                      {status.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {agent.specialization || 'General Purpose Agent'}
                  </p>
                </CardHeader>
                <CardContent>
                  {status.isOnline ? (
                    <div className="space-y-3">
                      {/* Current Task */}
                      {status.currentTask && (
                        <Alert className="border-l-4 border-blue-500 bg-blue-50">
                          <Zap className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <p className="text-sm font-semibold text-blue-900">Current Task:</p>
                            <p className="text-xs text-blue-700">{status.currentTask}</p>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Activity Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-xs text-gray-600">Completed</p>
                            <p className="font-semibold">{status.tasksCompleted}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-gray-600">In Progress</p>
                            <p className="font-semibold">{status.tasksInProgress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">CPU Usage</span>
                            <span className={`font-semibold ${getPerformanceColor(status.cpuUsage)}`}>
                              {status.cpuUsage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                status.cpuUsage < 50 ? 'bg-green-500' :
                                status.cpuUsage < 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${status.cpuUsage}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">Memory Usage</span>
                            <span className={`font-semibold ${getPerformanceColor(status.memoryUsage)}`}>
                              {status.memoryUsage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                status.memoryUsage < 50 ? 'bg-green-500' :
                                status.memoryUsage < 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${status.memoryUsage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Response Time and Uptime */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t text-sm">
                        <div>
                          <p className="text-xs text-gray-600">Response Time</p>
                          <p className="font-semibold text-purple-700">{status.responseTimeAvg}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Uptime</p>
                          <p className="font-semibold text-blue-700">{formatUptime(status.activeSince)}</p>
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Last activity: {formatLastActivity(status.lastActivity)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Agent is currently offline</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last seen: {formatLastActivity(status.lastActivity || agent.last_seen)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
