import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { useToast } from './ui/use-toast';
import {
  FolderOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Search,
  RefreshCw,
  BookOpen,
  Target,
  Zap
} from 'lucide-react';
import projectService from '../services/projectService';
import bmadAgentService from '../services/bmadAgentService';

export default function ProjectContextLoader() {
  const [stories, setStories] = useState([]);
  const [selectedStories, setSelectedStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [contextSummary, setContextSummary] = useState(null);
  const [loadedContext, setLoadedContext] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableStories();
  }, []);

  const loadAvailableStories = async () => {
    setIsLoading(true);
    try {
      // Simulating loading stories from the docs/stories directory
      // In production, this would call a backend API
      const mockStories = [
        {
          id: '1-1',
          epic: 'Epic 1: Project Initialization',
          title: 'Initialize Project Repository and Core Configuration',
          file: '1-1-initialize-project-repository-and-core-configuration.md',
          status: 'completed',
          priority: 'CRITICAL'
        },
        {
          id: '2-1',
          epic: 'Epic 2: Voice Agent Integration',
          title: 'Integrate Telnyx Call Control API',
          file: '2-1-integrate-telnyx-call-control-api-and-initiate-outbound-calls.md',
          status: 'in_progress',
          priority: 'HIGH'
        },
        {
          id: '3-1',
          epic: 'Epic 3: CRM Empowerment Features',
          title: 'Implement Lead CRUD Operations',
          file: '3-1-implement-lead-crud-operations.md',
          status: 'pending',
          priority: 'HIGH'
        },
        {
          id: '5-1',
          epic: 'Epic 5: Dashboard Analytics',
          title: 'Implement Real-Time Call Monitoring',
          file: '5-1-implement-real-time-call-monitoring.md',
          status: 'pending',
          priority: 'MEDIUM'
        }
      ];

      setStories(mockStories);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load stories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project stories',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const toggleStorySelection = (storyId) => {
    setSelectedStories(prev =>
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleLoadContext = async () => {
    if (selectedStories.length === 0) {
      toast({
        title: 'No Stories Selected',
        description: 'Please select at least one story to load context',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare context summary
      const selectedStoryObjects = stories.filter(s => selectedStories.includes(s.id));
      const context = {
        stories: selectedStoryObjects,
        epics: [...new Set(selectedStoryObjects.map(s => s.epic))],
        totalStories: selectedStoryObjects.length,
        priorities: selectedStoryObjects.reduce((acc, s) => {
          acc[s.priority] = (acc[s.priority] || 0) + 1;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };

      setContextSummary(context);
      setShowContextDialog(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load context:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project context',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleCopyContextPrompt = async () => {
    if (!contextSummary) return;

    const contextPrompt = `I want to load the following project context for our Agent Intervector Command Center development:

**Project Context Summary:**
- Total Stories: ${contextSummary.totalStories}
- Epics Covered: ${contextSummary.epics.join(', ')}
- Priority Distribution: ${Object.entries(contextSummary.priorities)
  .map(([priority, count]) => `${priority}: ${count}`)
  .join(', ')}

**Selected Stories:**
${contextSummary.stories.map((story, i) => `${i + 1}. [${story.id}] ${story.title}
   - Epic: ${story.epic}
   - Status: ${story.status}
   - Priority: ${story.priority}
   - File: docs/stories/${story.file}`).join('\n\n')}

Please help me work on these stories. I want to activate the appropriate BMAD agents to coordinate development across these user stories.

Recommended agents for this context:
- Bob (Scrum Master) - /bmad:bmm:agents:sm
- Developer Agent - /bmad:bmm:agents:dev
- UX Designer - /bmad:bmm:agents:ux-designer
- Test Architect - /bmad:bmm:agents:tea`;

    try {
      await navigator.clipboard.writeText(contextPrompt);
      toast({
        title: 'Context Prompt Copied!',
        description: 'Paste this into Claude Code to load project context and activate agents'
      });

      setLoadedContext(contextSummary);
      setShowContextDialog(false);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy context prompt',
        variant: 'destructive'
      });
    }
  };

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.epic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.id.includes(searchQuery)
  );

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      CRITICAL: 'bg-red-500 text-white',
      HIGH: 'bg-orange-500 text-white',
      MEDIUM: 'bg-yellow-500 text-white',
      LOW: 'bg-green-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-gradient shadow-brand">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="gradient-text text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Project Context Loader
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Load project stories and epics to provide context for BMAD agent coordination
              </p>
            </div>
            <Button
              onClick={loadAvailableStories}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Currently Loaded Context */}
      {loadedContext && (
        <Alert className="border-l-4 border-blue-500 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="font-semibold text-blue-900">Context Loaded Successfully!</div>
            <div className="text-sm text-blue-700 mt-1">
              {loadedContext.totalStories} stories loaded from {loadedContext.epics.length} epic(s)
              <span className="mx-2">•</span>
              Loaded at: {new Date(loadedContext.timestamp).toLocaleString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Selection Actions */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search stories by title, epic, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleLoadContext}
          disabled={selectedStories.length === 0 || isLoading}
          className="btn-gradient text-white shadow-brand"
        >
          <Upload className="h-4 w-4 mr-2" />
          Load Context ({selectedStories.length})
        </Button>
      </div>

      {/* Stories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Stories
            <Badge variant="outline" className="ml-auto">
              {filteredStories.length} stories
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No stories found matching your search</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredStories.map((story) => (
                <div
                  key={story.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStories.includes(story.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleStorySelection(story.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedStories.includes(story.id)}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {story.id}
                          </Badge>
                          <Badge className={getPriorityColor(story.priority)}>
                            {story.priority}
                          </Badge>
                          <Badge className={getStatusColor(story.status)}>
                            {story.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {story.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{story.epic}</p>
                        <p className="text-xs text-gray-500">
                          <FileText className="inline h-3 w-3 mr-1" />
                          {story.file}
                        </p>
                      </div>
                    </div>
                    {selectedStories.includes(story.id) && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Summary Dialog */}
      <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
        <DialogContent onClose={() => setShowContextDialog(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Project Context Ready
            </DialogTitle>
            <DialogDescription>
              Review the context summary and copy the activation prompt for Claude Code
            </DialogDescription>
          </DialogHeader>

          {contextSummary && (
            <div className="space-y-4 py-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Total Stories</p>
                  <p className="text-3xl font-bold gradient-text mt-1">
                    {contextSummary.totalStories}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Epics</p>
                  <p className="text-3xl font-bold gradient-text mt-1">
                    {contextSummary.epics.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">High Priority</p>
                  <p className="text-3xl font-bold gradient-text mt-1">
                    {(contextSummary.priorities.HIGH || 0) + (contextSummary.priorities.CRITICAL || 0)}
                  </p>
                </div>
              </div>

              {/* Epics List */}
              <div>
                <h4 className="font-semibold mb-2">Epics Covered:</h4>
                <div className="space-y-1">
                  {contextSummary.epics.map((epic, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span>{epic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Stories */}
              <div>
                <h4 className="font-semibold mb-2">Selected Stories:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {contextSummary.stories.map((story, i) => (
                    <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {story.id}
                        </Badge>
                        <span className="font-medium">{story.title}</span>
                      </div>
                      <p className="text-xs text-gray-600">{story.epic}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Clicking "Copy Context Prompt" will copy a formatted prompt to your clipboard.
                  Paste it into Claude Code to load this context and activate the recommended BMAD agents!
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContextDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopyContextPrompt}
              className="btn-gradient text-white shadow-brand"
            >
              <Upload className="h-4 w-4 mr-2" />
              Copy Context Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
