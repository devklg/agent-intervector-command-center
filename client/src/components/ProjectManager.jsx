import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input, Label, Textarea } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { FolderKanban, Plus, Users } from 'lucide-react';
import projectService from '../services/projectService';
import agentService from '../services/agentService';

export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    assigned_agents: [],
    priority: 'MEDIUM',
    deadline: '',
    tasks: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, agentsRes] = await Promise.all([
        projectService.getAllProjects(),
        agentService.getAllAgents()
      ]);
      setProjects(projectsRes.data || []);
      setAgents(agentsRes.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!newProject.name) {
        toast({
          title: 'Validation Error',
          description: 'Project name is required',
          variant: 'destructive'
        });
        return;
      }

      const response = await projectService.createProject(newProject);
      if (response.success) {
        toast({ title: 'Project Created', description: `Project ${newProject.name} created successfully` });
        setShowCreateDialog(false);
        setNewProject({
          name: '',
          description: '',
          assigned_agents: [],
          priority: 'MEDIUM',
          deadline: '',
          tasks: []
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive'
      });
    }
  };

  const toggleAgentAssignment = (agentName) => {
    setNewProject({
      ...newProject,
      assigned_agents: newProject.assigned_agents.includes(agentName)
        ? newProject.assigned_agents.filter(a => a !== agentName)
        : [...newProject.assigned_agents, agentName]
    });
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Project Manager</h2>
          <p className="text-gray-600">Manage multi-agent projects and tasks</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{project.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.completion_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.completion_percentage || 0}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {project.assigned_agents?.length || 0} agents assigned
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <FolderKanban className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {project.metadata?.active_tasks || 0} active tasks
                    </span>
                  </div>

                  {project.deadline && (
                    <div className="text-sm text-gray-600">
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent onClose={() => setShowCreateDialog(false)}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Project description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newProject.priority}
                  onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign Agents</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {agents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No agents available</p>
                ) : (
                  agents.map((agent) => (
                    <label key={agent.id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={newProject.assigned_agents.includes(agent.agent_name)}
                        onChange={() => toggleAgentAssignment(agent.agent_name)}
                        className="rounded"
                      />
                      <span className="text-sm">{agent.agent_name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {agent.status}
                      </Badge>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500">
                {newProject.assigned_agents.length} agent(s) selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
