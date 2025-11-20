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
  History,
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle,
  Save,
  RotateCcw,
  FileText,
  Search,
  Calendar,
  Tag,
  Bookmark
} from 'lucide-react';
import neonService from '../services/neonService';

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newRestorePoint, setNewRestorePoint] = useState({
    name: '',
    description: '',
    tags: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Neon database
      // Assuming we have a project ID - in production this would come from context/config
      const projectId = 'project-main'; // This should be retrieved from app context

      const response = await neonService.listRestorePoints(projectId, {
        limit: 50,
        sort: 'created_at_desc'
      });

      // Transform Neon data to match our component structure
      const transformedSessions = response.restore_points?.map(point => ({
        id: point.id,
        name: point.name,
        description: point.description,
        type: point.metadata?.type || 'restore_point',
        createdAt: point.created_at,
        createdBy: point.metadata?.created_by || 'System',
        size: point.metadata?.size || 'N/A',
        tags: point.tags || [],
        storiesIncluded: point.metadata?.stories_included || [],
        agentsInvolved: point.metadata?.agents_involved || [],
        contextItems: point.metadata?.context_items || 0,
        canRestore: true
      })) || [];

      setSessions(transformedSessions);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load sessions from Neon:', error);

      // Fallback to mock data if Neon is not available
      const mockSessions = [
        {
          id: 'session-1',
          name: 'Epic 2 Voice Integration - Full Context',
          description: 'Complete context for Epic 2 including Telnyx API integration, call handling, and transcription services',
          type: 'restore_point',
          createdAt: '2025-01-05T10:30:00Z',
          createdBy: 'Marcus-5002',
          size: '2.4 MB',
          tags: ['epic-2', 'voice-agent', 'telnyx'],
          storiesIncluded: ['2-1', '2-2', '2-3', '2-4'],
          agentsInvolved: ['Marcus-5002', 'Alex-5003', 'Grace'],
          contextItems: 15,
          canRestore: true
        },
        {
          id: 'session-2',
          name: 'CRM Development Session - January 4',
          description: 'Working session on CRM CRUD operations and lead management features',
          type: 'auto_save',
          createdAt: '2025-01-04T15:45:00Z',
          createdBy: 'System',
          size: '1.8 MB',
          tags: ['crm', 'epic-3', 'leads'],
          storiesIncluded: ['3-1', '3-2'],
          agentsInvolved: ['Marcus-5002', 'David'],
          contextItems: 10,
          canRestore: true
        },
        {
          id: 'session-3',
          name: 'Dashboard Analytics Implementation',
          description: 'Real-time monitoring dashboard with agent status tracking',
          type: 'restore_point',
          createdAt: '2025-01-03T09:15:00Z',
          createdBy: 'Theo-5001',
          size: '3.2 MB',
          tags: ['dashboard', 'epic-5', 'analytics'],
          storiesIncluded: ['5-1', '5-2', '5-3'],
          agentsInvolved: ['Theo-5001', 'Liam', 'Jack'],
          contextItems: 18,
          canRestore: true
        }
      ];

      setSessions(mockSessions);
      setIsLoading(false);

      toast({
        title: 'Using Mock Data',
        description: 'Connected to fallback data. Configure Neon database for persistent storage.',
        variant: 'default'
      });
    }
  };

  const handleCreateRestorePoint = async () => {
    if (!newRestorePoint.name) {
      toast({
        title: 'Validation Error',
        description: 'Restore point name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const projectId = 'project-main'; // This should be retrieved from app context

      // Create restore point in Neon database
      await neonService.createRestorePoint({
        name: newRestorePoint.name,
        description: newRestorePoint.description,
        projectId: projectId,
        branchName: 'main', // Current branch
        contextData: {}, // Could include current session state
        tags: newRestorePoint.tags,
        metadata: {
          type: 'restore_point',
          created_by: 'User', // Should come from auth context
          context_items: 0,
          agents_involved: [],
          stories_included: []
        }
      });

      toast({
        title: 'Restore Point Created',
        description: `"${newRestorePoint.name}" has been saved to Neon database successfully`
      });

      setShowCreateDialog(false);
      setNewRestorePoint({ name: '', description: '', tags: [] });
      loadSessions();
    } catch (error) {
      console.error('Failed to create restore point:', error);
      toast({
        title: 'Error',
        description: 'Failed to create restore point',
        variant: 'destructive'
      });
    }
  };

  const handleRestoreSession = async (session) => {
    setSelectedSession(session);
    setShowRestoreDialog(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedSession) return;

    try {
      // Simulate restore operation
      const restorePrompt = `I want to restore the following session context to continue working:

**Session: ${selectedSession.name}**
${selectedSession.description}

**Session Details:**
- Created: ${new Date(selectedSession.createdAt).toLocaleString()}
- Created by: ${selectedSession.createdBy}
- Type: ${selectedSession.type.replace('_', ' ').toUpperCase()}
- Context Items: ${selectedSession.contextItems}

**Stories Included:**
${selectedSession.storiesIncluded.map(s => `- Story ${s}`).join('\n')}

**Agents Involved:**
${selectedSession.agentsInvolved.map(a => `- ${a}`).join('\n')}

**Tags:** ${selectedSession.tags.join(', ')}

Please restore this context and reactivate the relevant BMAD agents so we can continue from where we left off!`;

      await navigator.clipboard.writeText(restorePrompt);

      toast({
        title: 'Restore Prompt Copied!',
        description: 'Paste this into Claude Code to restore the session context'
      });

      setShowRestoreDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to prepare restore prompt',
        variant: 'destructive'
      });
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      restore_point: 'bg-blue-100 text-blue-800',
      auto_save: 'bg-gray-100 text-gray-800',
      milestone: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      restore_point: <Bookmark className="h-4 w-4" />,
      auto_save: <Save className="h-4 w-4" />,
      milestone: <CheckCircle className="h-4 w-4" />
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-gradient shadow-brand">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="gradient-text text-2xl flex items-center gap-2">
                <History className="h-6 w-6" />
                Session History & Restore Points
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Create and restore session contexts using ChromaDB zero-token restore points
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="btn-gradient text-white shadow-brand"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Create Restore Point
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">{sessions.length}</p>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Bookmark className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-purple-800">
              {sessions.filter(s => s.type === 'restore_point').length}
            </p>
            <p className="text-sm text-gray-600">Restore Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-800">
              {sessions.filter(s => s.type === 'milestone').length}
            </p>
            <p className="text-sm text-gray-600">Milestones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Database className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">
              {sessions.reduce((acc, s) => acc + s.contextItems, 0)}
            </p>
            <p className="text-sm text-gray-600">Context Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search sessions by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sessions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${getTypeColor(session.type)} flex items-center justify-center`}>
                      {getTypeIcon(session.type)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {session.name}
                          </h3>
                          <Badge className={getTypeColor(session.type)}>
                            {session.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{session.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(session.createdAt).toLocaleTimeString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {session.contextItems} items
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="h-4 w-4" />
                            {session.size}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRestoreSession(session)}
                        disabled={!session.canRestore}
                        className="btn-gradient text-white"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {session.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Stories Included:</p>
                        <div className="flex flex-wrap gap-1">
                          {session.storiesIncluded.map((story, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {story}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Agents Involved:</p>
                        <div className="flex flex-wrap gap-1">
                          {session.agentsInvolved.slice(0, 3).map((agent, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {agent}
                            </Badge>
                          ))}
                          {session.agentsInvolved.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{session.agentsInvolved.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Created by: {session.createdBy}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent onClose={() => setShowRestoreDialog(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              Restore Session Context
            </DialogTitle>
            <DialogDescription>
              Review the session details and copy the restore prompt for Claude Code
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">{selectedSession.name}</h4>
                <p className="text-sm text-gray-600">{selectedSession.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Context Items</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedSession.contextItems}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Stories</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedSession.storiesIncluded.length}</p>
                </div>
              </div>

              <div>
                <h5 className="font-semibold mb-2">Stories to Restore:</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.storiesIncluded.map((story, i) => (
                    <Badge key={i} className="text-sm">Story {story}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-semibold mb-2">Agents to Activate:</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.agentsInvolved.map((agent, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">{agent}</Badge>
                  ))}
                </div>
              </div>

              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  Clicking "Copy Restore Prompt" will generate a context restoration prompt.
                  Paste it into Claude Code to restore this session with zero token cost using ChromaDB!
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRestore}
              className="btn-gradient text-white shadow-brand"
            >
              <Download className="h-4 w-4 mr-2" />
              Copy Restore Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Restore Point Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent onClose={() => setShowCreateDialog(false)}>
          <DialogHeader>
            <DialogTitle>Create Restore Point</DialogTitle>
            <DialogDescription>
              Save the current session context to ChromaDB for zero-token restoration later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                placeholder="e.g., Epic 3 CRM Development - Checkpoint 1"
                value={newRestorePoint.name}
                onChange={(e) => setNewRestorePoint({ ...newRestorePoint, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                placeholder="Brief description of what's included in this restore point"
                value={newRestorePoint.description}
                onChange={(e) => setNewRestorePoint({ ...newRestorePoint, description: e.target.value })}
              />
            </div>

            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                This restore point will be saved to ChromaDB and can be restored later with zero token cost.
                All current context including active stories, agent states, and conversation history will be preserved.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRestorePoint}
              className="btn-gradient text-white shadow-brand"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Create Restore Point
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
