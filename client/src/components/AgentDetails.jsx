import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { ArrowLeft, Activity, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import agentService from '../services/agentService';

export default function AgentDetails() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, [agentId]);

  const loadAgentData = async () => {
    try {
      const [agentRes, statsRes, tasksRes] = await Promise.all([
        agentService.getAgent(agentId),
        agentService.getAgentStats(agentId, 7),
        agentService.getAgentTasks(agentId)
      ]);

      setAgent(agentRes.data);
      setStats(statsRes.data);
      setTasks(tasksRes.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agent details',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm(`Are you sure you want to deactivate agent ${agentId}?`)) {
      try {
        await agentService.deleteAgent(agentId);
        toast({
          title: 'Agent Deactivated',
          description: `Agent ${agentId} has been deactivated`
        });
        navigate('/');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to deactivate agent',
          variant: 'destructive'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Not Found</h3>
        <p className="text-gray-500 mb-4">The requested agent could not be found.</p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(agent.status)}`}></div>
              <h2 className="text-3xl font-bold text-gray-900">{agent.agent_name}</h2>
            </div>
            <p className="text-gray-600 mt-1">{agent.specialization || 'Agent Details'}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDeactivate}>
          Deactivate Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-2xl font-bold capitalize">{agent.status}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold">{stats?.messages_sent || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages Received</p>
                <p className="text-2xl font-bold">{stats?.messages_received || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Threads</p>
                <p className="text-2xl font-bold">{stats?.active_threads || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Info */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-600">Agent Type</dt>
              <dd className="mt-1">
                <Badge>{agent.metadata?.agent_type || 'developer'}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Specialization</dt>
              <dd className="mt-1 text-sm text-gray-900">{agent.specialization || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Current Task</dt>
              <dd className="mt-1 text-sm text-gray-900">{agent.current_task || 'No active task'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Last Seen</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(agent.last_seen).toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {agent.recent_messages && agent.recent_messages.length > 0 ? (
            <div className="space-y-3">
              {agent.recent_messages.slice(0, 10).map((message, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.from_agent}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-sm">{message.to_agent}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.message_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{message.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No messages yet</p>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{task.subject}</h4>
                    <Badge variant={task.status === 'delivered' ? 'default' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{task.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No tasks assigned yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
