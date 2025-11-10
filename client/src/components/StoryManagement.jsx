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
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  XCircle,
  Edit,
  Eye,
  Filter,
  TrendingUp,
  Target,
  Users,
  Calendar
} from 'lucide-react';

export default function StoryManagement() {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoryDialog, setShowStoryDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, this would fetch from backend
      const mockStories = [
        {
          id: '1-1',
          epicId: 'epic-1',
          epicName: 'Project Initialization',
          title: 'Initialize Project Repository and Core Configuration',
          description: 'Set up the core project structure including Git repository, package.json, and initial configuration files.',
          status: 'completed',
          priority: 'CRITICAL',
          assignedAgents: ['Marcus-5002', 'Iris'],
          acceptanceCriteria: [
            'Git repository initialized with proper .gitignore',
            'Package.json configured with all dependencies',
            'Environment configuration files created',
            'README documentation complete'
          ],
          progress: 100,
          startDate: '2025-01-01',
          completionDate: '2025-01-03',
          estimatedHours: 8,
          actualHours: 7,
          blockers: []
        },
        {
          id: '2-1',
          epicId: 'epic-2',
          epicName: 'Voice Agent Integration',
          title: 'Integrate Telnyx Call Control API',
          description: 'Implement Telnyx Call Control API integration for initiating and managing outbound calls.',
          status: 'in_progress',
          priority: 'HIGH',
          assignedAgents: ['Marcus-5002', 'Alex-5003'],
          acceptanceCriteria: [
            'Telnyx SDK installed and configured',
            'Outbound call initiation working',
            'Call state management implemented',
            'Error handling for API failures',
            'Integration tests passing'
          ],
          progress: 60,
          startDate: '2025-01-04',
          completionDate: null,
          estimatedHours: 16,
          actualHours: 12,
          blockers: ['Waiting for Telnyx API credentials']
        },
        {
          id: '3-1',
          epicId: 'epic-3',
          epicName: 'CRM Empowerment Features',
          title: 'Implement Lead CRUD Operations',
          description: 'Build complete CRUD operations for lead management including creation, reading, updating, and deletion.',
          status: 'pending',
          priority: 'HIGH',
          assignedAgents: ['Marcus-5002', 'David'],
          acceptanceCriteria: [
            'MongoDB schema designed for leads',
            'CRUD API endpoints implemented',
            'Data validation in place',
            'API documentation complete',
            'Unit tests passing'
          ],
          progress: 0,
          startDate: null,
          completionDate: null,
          estimatedHours: 12,
          actualHours: 0,
          blockers: []
        },
        {
          id: '5-1',
          epicId: 'epic-5',
          epicName: 'Dashboard Analytics',
          title: 'Implement Real-Time Call Monitoring',
          description: 'Create real-time call monitoring dashboard with live status updates and metrics.',
          status: 'blocked',
          priority: 'MEDIUM',
          assignedAgents: ['Theo-5001', 'Liam'],
          acceptanceCriteria: [
            'WebSocket connection for live updates',
            'Real-time call status display',
            'Active call metrics dashboard',
            'Call quality indicators',
            'Performance optimization'
          ],
          progress: 15,
          startDate: '2025-01-05',
          completionDate: null,
          estimatedHours: 20,
          actualHours: 3,
          blockers: ['Depends on Story 2-1 completion', 'WebSocket infrastructure not ready']
        }
      ];

      setStories(mockStories);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load stories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stories',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleViewStory = (story) => {
    setSelectedStory(story);
    setShowStoryDialog(true);
  };

  const handleUpdateStoryStatus = async (storyId, newStatus) => {
    try {
      // Update story status
      setStories(prev =>
        prev.map(s =>
          s.id === storyId ? { ...s, status: newStatus } : s
        )
      );

      toast({
        title: 'Status Updated',
        description: `Story ${storyId} status changed to ${newStatus}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update story status',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="h-5 w-5 text-green-500" />,
      in_progress: <Play className="h-5 w-5 text-blue-500" />,
      pending: <Clock className="h-5 w-5 text-gray-500" />,
      blocked: <XCircle className="h-5 w-5 text-red-500" />
    };
    return icons[status] || <Clock className="h-5 w-5 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      blocked: 'bg-red-100 text-red-800 border-red-200'
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

  const filteredStories = stories.filter(story => {
    const matchesStatus = filterStatus === 'all' || story.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || story.priority === filterPriority;
    const matchesSearch =
      searchQuery === '' ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.id.includes(searchQuery) ||
      story.epicName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const statsData = {
    total: stories.length,
    completed: stories.filter(s => s.status === 'completed').length,
    inProgress: stories.filter(s => s.status === 'in_progress').length,
    pending: stories.filter(s => s.status === 'pending').length,
    blocked: stories.filter(s => s.status === 'blocked').length,
    avgProgress: Math.round(
      stories.reduce((acc, s) => acc + s.progress, 0) / stories.length
    )
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="card-gradient shadow-brand">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="gradient-text text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Story Management
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Track and manage user stories across all epics and sprints
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-600">Total Stories</p>
              <p className="text-3xl font-bold gradient-text">{statsData.total}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-800">{statsData.completed}</p>
              <p className="text-xs text-green-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Play className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-800">{statsData.inProgress}</p>
              <p className="text-xs text-blue-600">In Progress</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{statsData.pending}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-800">{statsData.blocked}</p>
              <p className="text-xs text-red-600">Blocked</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-800">{statsData.avgProgress}%</p>
              <p className="text-xs text-purple-600">Avg Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="all">All Priority</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stories List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No stories found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredStories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Story Icon */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(story.status)}
                  </div>

                  {/* Story Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {story.id}
                          </Badge>
                          <Badge className={getPriorityColor(story.priority)}>
                            {story.priority}
                          </Badge>
                          <Badge className={getStatusColor(story.status)}>
                            {story.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {story.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {story.epicName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {story.assignedAgents.length} agents
                          </span>
                          {story.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {story.startDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewStory(story)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{story.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="btn-gradient h-2 rounded-full transition-all"
                          style={{ width: `${story.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Blockers */}
                    {story.blockers.length > 0 && (
                      <Alert className="border-l-4 border-red-500 bg-red-50 mt-3">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                          <p className="font-semibold text-red-900 text-sm mb-1">Blockers:</p>
                          <ul className="text-sm text-red-700 list-disc list-inside">
                            {story.blockers.map((blocker, i) => (
                              <li key={i}>{blocker}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Assigned Agents */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {story.assignedAgents.map((agent, i) => (
                        <Badge key={i} variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Story Details Dialog */}
      <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
        <DialogContent onClose={() => setShowStoryDialog(false)} className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStory && getStatusIcon(selectedStory.status)}
              Story Details: {selectedStory?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedStory?.epicName}
            </DialogDescription>
          </DialogHeader>

          {selectedStory && (
            <div className="space-y-4 py-4">
              {/* Title and Status */}
              <div>
                <h3 className="font-semibold text-xl mb-2">{selectedStory.title}</h3>
                <p className="text-gray-600">{selectedStory.description}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(selectedStory.priority)}>
                  {selectedStory.priority}
                </Badge>
                <Badge className={getStatusColor(selectedStory.status)}>
                  {selectedStory.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <h4 className="font-semibold mb-2">Acceptance Criteria:</h4>
                <div className="space-y-2">
                  {selectedStory.acceptanceCriteria.map((criteria, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{criteria}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div>
                <h4 className="font-semibold mb-2">Progress: {selectedStory.progress}%</h4>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="btn-gradient h-3 rounded-full"
                    style={{ width: `${selectedStory.progress}%` }}
                  />
                </div>
              </div>

              {/* Assigned Agents */}
              <div>
                <h4 className="font-semibold mb-2">Assigned Agents:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStory.assignedAgents.map((agent, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Time Tracking */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Estimated Hours</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedStory.estimatedHours}h</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Actual Hours</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedStory.actualHours}h</p>
                </div>
              </div>

              {/* Dates */}
              {selectedStory.startDate && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Start Date:</p>
                    <p className="font-medium">{selectedStory.startDate}</p>
                  </div>
                  {selectedStory.completionDate && (
                    <div>
                      <p className="text-gray-600">Completion Date:</p>
                      <p className="font-medium">{selectedStory.completionDate}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Blockers */}
              {selectedStory.blockers.length > 0 && (
                <Alert className="border-l-4 border-red-500 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <p className="font-semibold text-red-900 mb-2">Active Blockers:</p>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {selectedStory.blockers.map((blocker, i) => (
                        <li key={i}>{blocker}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStoryDialog(false)}
            >
              Close
            </Button>
            <Button className="btn-gradient text-white">
              <Edit className="h-4 w-4 mr-2" />
              Edit Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
