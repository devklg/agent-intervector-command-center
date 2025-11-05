import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input, Label } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { useToast } from './ui/use-toast';
import {
  Users,
  MessageSquare,
  FolderKanban,
  Activity,
  Plus,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import agentService from '../services/agentService';
import communicationService from '../services/communicationService';
import projectService from '../services/projectService';

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // New agent form state
  const [newAgent, setNewAgent] = useState({
    name: '',
    type: 'developer',
    specialties: [],
    description: '',
    priority: 'MEDIUM'
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [agentsRes, messagesRes, projectsRes, statsRes] = await Promise.all([
        agentService.getAllAgents(),
        communicationService.getCommunicationLog({ limit: 10 }),
        projectService.getAllProjects(),
        communicationService.getStats(7)
      ]);

      setAgents(agentsRes.data || []);
      setRecentMessages(messagesRes.data || []);
      setProjects(projectsRes.data || []);
      setStats(statsRes.data || null);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    try {
      if (!newAgent.name || !newAgent.type) {
        toast({
          title: 'Validation Error',
          description: 'Agent name and type are required',
          variant: 'destructive'
        });
        return;
      }

      const response = await agentService.createAgent(newAgent);

      if (response.success) {
        toast({
          title: 'Agent Created',
          description: `Agent ${newAgent.name} has been successfully registered`
        });

        setShowCreateDialog(false);
        setNewAgent({
          name: '',
          type: 'developer',
          specialties: [],
          description: '',
          priority: 'MEDIUM'
        });
        setSpecialtyInput('');
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create agent',
        variant: 'destructive'
      });
    }
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !newAgent.specialties.includes(specialtyInput.trim())) {
      setNewAgent({
        ...newAgent,
        specialties: [...newAgent.specialties, specialtyInput.trim()]
      });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty) => {
    setNewAgent({
      ...newAgent,
      specialties: newAgent.specialties.filter(s => s !== specialty)
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const onlineAgents = agents.filter(a => a.status === 'online').length;
  const totalMessages = stats?.total_messages || 0;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Agent Intervector Command Center Overview</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900">{agents.length}</p>
                <p className="text-xs text-green-600 mt-1">{onlineAgents} online</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages (7d)</p>
                <p className="text-3xl font-bold text-gray-900">{totalMessages}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.by_priority?.HIGH || 0} high priority
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">{activeProjects}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {projects.length} total
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FolderKanban className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-3xl font-bold text-green-600">Healthy</p>
                <p className="text-xs text-gray-500 mt-1">All systems operational</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registered Agents</CardTitle>
          <Link to="/agents">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No agents registered yet</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.slice(0, 6).map((agent) => (
                <Link
                  key={agent.id}
                  to={`/agents/${agent.agent_name}`}
                  className="block"
                >
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                        <h4 className="font-semibold text-gray-900">{agent.agent_name}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {agent.metadata?.agent_type || 'developer'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {agent.specialization || 'General purpose agent'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Last seen: {new Date(agent.last_seen).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Messages</CardTitle>
            <Link to="/communication">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No messages yet</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.slice(0, 5).map((message, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.from_agent}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-sm">{message.to_agent}</span>
                      <Badge className={`text-white text-xs ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Projects</CardTitle>
            <Link to="/projects">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{project.name}</h4>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{project.completion_percentage || 0}% complete</span>
                      <span>•</span>
                      <span>{project.assigned_agents?.length || 0} agents</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent onClose={() => setShowCreateDialog(false)}>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Register a new agent in the Intervector Command Center
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name *</Label>
              <Input
                id="agent-name"
                placeholder="e.g., AGENT-NAME or Claude-Worker-1"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-type">Agent Type *</Label>
              <select
                id="agent-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newAgent.type}
                onChange={(e) => setNewAgent({ ...newAgent, type: e.target.value })}
              >
                <option value="coordinator">Coordinator</option>
                <option value="developer">Developer</option>
                <option value="specialist">Specialist</option>
                <option value="monitor">Monitor</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <div className="flex gap-2">
                <Input
                  id="specialties"
                  placeholder="e.g., frontend, backend, ai"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                />
                <Button type="button" onClick={addSpecialty} size="sm">
                  Add
                </Button>
              </div>
              {newAgent.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newAgent.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-2"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of agent's role"
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newAgent.priority}
                onChange={(e) => setNewAgent({ ...newAgent, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAgent}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
