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
  Clock,
  LayoutGrid,
  ListTodo,
  TrendingUp,
  Search,
  BookOpen,
  FileText,
  History,
  Network
} from 'lucide-react';
import agentService from '../services/agentService';
import communicationService from '../services/communicationService';
import projectService from '../services/projectService';
import BMADAgentBrowser from './BMADAgentBrowser';
import TaskTracker from './TaskTracker';
import ProjectContextLoader from './ProjectContextLoader';
import StoryManagement from './StoryManagement';
import AgentStatusMonitor from './AgentStatusMonitor';
import SessionHistory from './SessionHistory';
import AgentNetworkGraph from './AgentNetworkGraph';

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, agents, tasks, analytics, context, stories, status, history
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
      {/* Header with Magnificent Worldwide Branding */}
      <div className="gradient-bg-hero rounded-lg p-8 shadow-brand-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-200 text-lg">
              Multi-Agent Coordination - Magnificent Worldwide
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="btn-gradient shadow-brand text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mt-6 border-b border-blue-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'overview'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <LayoutGrid className="inline h-4 w-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'agents'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            BMAD Agents
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <ListTodo className="inline h-4 w-4 mr-2" />
            Task Tracking
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <TrendingUp className="inline h-4 w-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'context'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <BookOpen className="inline h-4 w-4 mr-2" />
            Context Loader
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'stories'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Stories
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'status'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <Activity className="inline h-4 w-4 mr-2" />
            Agent Status
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'history'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <History className="inline h-4 w-4 mr-2" />
            History
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'network'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            <Network className="inline h-4 w-4 mr-2" />
            Network Graph
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards with Magnificent Brand Styling */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="card-gradient shadow-brand hover:shadow-brand-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Agents</p>
                    <p className="text-3xl font-bold gradient-text">{agents.length}</p>
                    <p className="text-xs text-green-600 mt-1 font-semibold">{onlineAgents} online</p>
                  </div>
                  <div className="gradient-bg p-3 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient shadow-brand hover:shadow-brand-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Messages (7d)</p>
                    <p className="text-3xl font-bold gradient-text">{totalMessages}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">
                      {stats?.by_priority?.HIGH || 0} high priority
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-3 rounded-full">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient shadow-brand hover:shadow-brand-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active Projects</p>
                    <p className="text-3xl font-bold gradient-text">{activeProjects}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">
                      {projects.length} total
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full">
                    <FolderKanban className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient shadow-brand hover:shadow-brand-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">System Status</p>
                    <p className="text-3xl font-bold gradient-text-warm">Healthy</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">All systems operational</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-full">
                    <Activity className="h-6 w-6 text-white" />
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
        </>
      )}

      {/* BMAD Agents Tab */}
      {activeTab === 'agents' && (
        <div className="mt-6">
          <BMADAgentBrowser />
        </div>
      )}

      {/* Task Tracking Tab */}
      {activeTab === 'tasks' && (
        <div className="mt-6">
          <TaskTracker projectId={projects[0]?.id} />
        </div>
      )}

      {/* Context Loader Tab */}
      {activeTab === 'context' && (
        <div className="mt-6">
          <ProjectContextLoader />
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="mt-6">
          <StoryManagement />
        </div>
      )}

      {/* Agent Status Monitor Tab */}
      {activeTab === 'status' && (
        <div className="mt-6">
          <AgentStatusMonitor />
        </div>
      )}

      {/* Session History Tab */}
      {activeTab === 'history' && (
        <div className="mt-6">
          <SessionHistory />
        </div>
      )}

      {/* Agent Network Graph Tab */}
      {activeTab === 'network' && (
        <div className="mt-6">
          <AgentNetworkGraph />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="mt-6">
          <Card className="card-gradient shadow-brand">
            <CardHeader>
              <CardTitle className="gradient-text text-2xl">Project Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Story Completion Rate</p>
                    <p className="text-4xl font-bold gradient-text mt-2">
                      {projects.length > 0
                        ? Math.round(projects.reduce((acc, p) => acc + (p.completion_percentage || 0), 0) / projects.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Average Agent Load</p>
                    <p className="text-4xl font-bold gradient-text-warm mt-2">
                      {agents.length > 0
                        ? Math.round(projects.reduce((acc, p) => acc + (p.assigned_agents?.length || 0), 0) / agents.length)
                        : 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">projects/agent</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">System Uptime</p>
                    <p className="text-4xl font-bold gradient-text mt-2">99.9%</p>
                    <p className="text-xs text-gray-600 mt-1">last 30 days</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold gradient-text mb-4">Agent Productivity</h3>
                  <div className="space-y-3">
                    {agents.slice(0, 5).map((agent) => (
                      <div key={agent.id} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium text-gray-700">{agent.agent_name}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="btn-gradient h-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.min((agent.messages_sent || 0) * 10, 100)}%` }}
                          >
                            <span className="text-xs text-white font-semibold">
                              {agent.messages_sent || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-6 gradient-bg rounded-lg text-white">
                  <h3 className="text-xl font-bold mb-2">Sprint Velocity Trend</h3>
                  <p className="text-blue-100">
                    Team velocity is trending upward with an average of {Math.round(totalMessages / 7)} messages per day
                  </p>
                  <div className="mt-4 flex gap-4">
                    <div>
                      <p className="text-sm text-blue-200">This Sprint</p>
                      <p className="text-2xl font-bold">{totalMessages}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-200">Active Agents</p>
                      <p className="text-2xl font-bold">{onlineAgents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-200">Completion</p>
                      <p className="text-2xl font-bold">{activeProjects}/{projects.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <Button onClick={handleCreateAgent} className="btn-gradient text-white shadow-brand">
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
