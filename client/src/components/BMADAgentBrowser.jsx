import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Search, Play, Info, Filter, Grid, List, Copy, Zap } from 'lucide-react';
import bmadAgentService from '../services/bmadAgentService';
import { useToast } from './ui/use-toast';

export default function BMADAgentBrowser() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [agentToActivate, setAgentToActivate] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAgentsData();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [agents, selectedCategory, searchQuery]);

  const loadAgentsData = async () => {
    try {
      const [agentsRes, categoriesRes] = await Promise.all([
        bmadAgentService.getAllAgents(),
        bmadAgentService.getCategories()
      ]);

      setAgents(agentsRes.data?.agents || []);
      setCategories(categoriesRes.data?.categories || {});
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load BMAD agents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load BMAD agents',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = agents;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(agent => agent.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.title.toLowerCase().includes(lowerQuery) ||
        agent.role.toLowerCase().includes(lowerQuery) ||
        agent.description.toLowerCase().includes(lowerQuery) ||
        agent.specialty.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredAgents(filtered);
  };

  const handleAgentSelect = (agent) => {
    setSelectedAgent(selectedAgent?.id === agent.id ? null : agent);
  };

  const handleActivateAgent = (agent) => {
    // Open activation dialog and reset workflow selection
    setAgentToActivate(agent);
    setSelectedWorkflow(null);
    setActivationDialogOpen(true);
  };

  const handleConfirmActivation = async () => {
    if (!agentToActivate) return;

    const agentCommand = agentToActivate.slash_command || `/bmad:bmm:agents:${agentToActivate.id}`;
    const workflowCommand = selectedWorkflow ? `\n*${selectedWorkflow}` : '';

    const activationPrompt = `I want to activate ${agentToActivate.name} (${agentToActivate.title}), the BMAD agent for ${agentToActivate.specialty}.

Agent Command: ${agentCommand}${workflowCommand}

${selectedWorkflow ? `Starting workflow: ${selectedWorkflow}` : 'Please activate this agent now so I can work with ' + agentToActivate.name + ' on the following tasks:'}
${!selectedWorkflow ? agentToActivate.when_to_use.map((use, i) => `${i + 1}. ${use}`).join('\n') : ''}

${!selectedWorkflow ? 'Available workflows: ' + agentToActivate.workflows.join(', ') : ''}`;

    try {
      // Copy activation prompt to clipboard
      await navigator.clipboard.writeText(activationPrompt);

      const workflowText = selectedWorkflow ? ` with ${selectedWorkflow} workflow` : '';
      toast({
        title: `${agentToActivate.name} Activation Prompt Copied!${workflowText}`,
        description: `Paste this into Claude Code to activate ${agentToActivate.name}. The agent will load and be ready to help you.`
      });

      // Log the invocation request to backend
      await bmadAgentService.invokeAgent(agentToActivate.id, selectedWorkflow || 'activate');

      setActivationDialogOpen(false);
      setAgentToActivate(null);
      setSelectedWorkflow(null);
    } catch (error) {
      toast({
        title: 'Activation Failed',
        description: 'Could not prepare agent activation',
        variant: 'destructive'
      });
    }
  };

  const handleCopyActivationPrompt = async (agent) => {
    const activationPrompt = `You are ${agent.name}, ${agent.title}.

Role: ${agent.role}

Specialty: ${agent.specialty}

Description: ${agent.description}

When to use this agent:
${agent.when_to_use.map((use, i) => `${i + 1}. ${use}`).join('\n')}

Available workflows: ${agent.workflows.join(', ')}

Please activate this agent persona and assist with the requested task.`;

    try {
      await navigator.clipboard.writeText(activationPrompt);
      toast({
        title: 'Activation Prompt Copied!',
        description: `${agent.name}'s activation prompt copied to clipboard for Claude mobile`
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const getCategoryColor = (category) => {
    const categoryData = categories[category];
    if (!categoryData) return 'bg-gray-100 text-gray-800';

    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
      pink: 'bg-pink-100 text-pink-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800'
    };

    return colorMap[categoryData.color] || 'bg-gray-100 text-gray-800';
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
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🧙</span>
            BMAD Agent Browser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents by name, role, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <Filter size={16} className="text-gray-600" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({agents.length})
              </button>
              {Object.entries(categories).map(([key, cat]) => {
                const count = agents.filter(a => a.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                      selectedCategory === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} className="mr-1" />
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List size={16} className="mr-1" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredAgents.length} of {agents.length} agents
        {selectedCategory !== 'all' && ` in ${categories[selectedCategory]?.name}`}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Agent Cards/List */}
      {filteredAgents.length === 0 ? (
        <Alert>
          <AlertDescription>
            No agents found matching your criteria. Try adjusting your filters.
          </AlertDescription>
        </Alert>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedAgent?.id === agent.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => handleActivateAgent(agent)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{agent.icon}</span>
                    {agent.name}
                  </span>
                  <Badge className={getCategoryColor(agent.category)}>
                    {categories[agent.category]?.name || agent.category}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-gray-600">{agent.title}</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">{agent.description}</p>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{agent.module_name}</Badge>
                    <Badge variant="outline">{agent.phase}</Badge>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Specialty:</span> {agent.specialty}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateAgent(agent);
                      }}
                    >
                      <Zap size={14} className="mr-1" />
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyActivationPrompt(agent);
                      }}
                    >
                      <Copy size={14} className="mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleActivateAgent(agent)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-3xl">{agent.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{agent.name}</span>
                        <span className="text-sm text-gray-600">- {agent.title}</span>
                        <Badge className={getCategoryColor(agent.category)}>
                          {categories[agent.category]?.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{agent.description}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">{agent.module_name}</Badge>
                        <Badge variant="outline">{agent.phase}</Badge>
                        <span className="text-gray-600">Specialty: {agent.specialty}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateAgent(agent);
                      }}
                    >
                      <Zap size={14} className="mr-1" />
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyActivationPrompt(agent);
                      }}
                    >
                      <Copy size={14} className="mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Activation Dialog */}
      <Dialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-3xl">{agentToActivate?.icon}</span>
              Activate {agentToActivate?.name}
            </DialogTitle>
          </DialogHeader>

          {agentToActivate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-1">{agentToActivate.title}</h4>
                <p className="text-sm text-gray-600">{agentToActivate.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Role:</h4>
                <p className="text-sm text-gray-700">{agentToActivate.role}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Specialty:</h4>
                <p className="text-sm text-gray-700">{agentToActivate.specialty}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">When to Use:</h4>
                <ul className="text-sm space-y-1">
                  {agentToActivate.when_to_use.map((use, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Select Workflow (Optional):</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Choose a workflow to start immediately after activation, or leave unselected to activate the agent only.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedWorkflow(null)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      selectedWorkflow === null
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    None (Agent Only)
                  </button>
                  {agentToActivate.workflows.map((workflow, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedWorkflow(workflow)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                        selectedWorkflow === workflow
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      *{workflow}
                    </button>
                  ))}
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  {selectedWorkflow ? (
                    <>
                      Clicking "Activate Agent" will copy the activation prompt with the <strong>*{selectedWorkflow}</strong> workflow command.
                      Paste it into Claude Code to activate {agentToActivate.name} and start the workflow immediately!
                    </>
                  ) : (
                    <>
                      Clicking "Activate Agent" will copy the activation prompt to your clipboard.
                      Paste it into Claude Code to activate {agentToActivate.name} and start working together!
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActivationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmActivation} className="bg-blue-600 hover:bg-blue-700">
              <Zap className="h-4 w-4 mr-2" />
              Activate {agentToActivate?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
