import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Clock, X, RefreshCw, UserX } from 'lucide-react';
import taskService from '../services/taskService';
import { useToast } from './ui/use-toast';

export default function TaskTracker({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);
  const [handoffChain, setHandoffChain] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, incomplete, breakdowns, handoff
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadTaskData();
      const interval = setInterval(loadTaskData, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [projectId]);

  const loadTaskData = async () => {
    try {
      const [tasksRes, breakdownsRes, handoffRes] = await Promise.all([
        taskService.getProjectTasks(projectId),
        taskService.detectBreakdowns(),
        taskService.getHandoffChain(projectId)
      ]);

      setTasks(tasksRes.data?.tasks || []);
      setBreakdowns(breakdownsRes.data?.breakdowns || []);
      setHandoffChain(handoffRes.data?.chain || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load task data:', error);
      setIsLoading(false);
    }
  };

  const handleRetry = async (taskId) => {
    try {
      await taskService.retryTask(taskId);
      toast({ title: 'Task Retried', description: 'Task has been reset to pending status' });
      loadTaskData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to retry task', variant: 'destructive' });
    }
  };

  const handleReassign = async (taskId, newAgent) => {
    try {
      await taskService.reassignTask(taskId, newAgent, 'Manual reassignment from dashboard');
      toast({ title: 'Task Reassigned', description: `Task reassigned to ${newAgent}` });
      loadTaskData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reassign task', variant: 'destructive' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
      blocked: 'bg-yellow-100 text-yellow-800',
      incomplete: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    };
    return colors[severity] || 'border-gray-500 bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const incompleteTasks = tasks.filter(t => t.status === 'incomplete' || t.completion_percentage < 100);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('incomplete')}
          className={`px-4 py-2 ${activeTab === 'incomplete' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600'}`}
        >
          Incomplete ({incompleteTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('breakdowns')}
          className={`px-4 py-2 ${activeTab === 'breakdowns' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}
        >
          Breakdowns ({breakdowns.length})
        </button>
        <button
          onClick={() => setActiveTab('handoff')}
          className={`px-4 py-2 ${activeTab === 'handoff' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
        >
          Handoff Chain
        </button>
      </div>

      {/* Breakdown Detection Panel - The most critical feature */}
      {activeTab === 'breakdowns' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-red-500" />
                Task Breakdown Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdowns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                  <p>No task breakdowns detected. All tasks are progressing normally.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {breakdowns.map((breakdown, idx) => (
                    <div key={idx} className={`border-l-4 ${getSeverityColor(breakdown.issues[0]?.severity)} p-4 rounded`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-lg">{breakdown.task.name}</p>
                          <p className="text-sm text-gray-600">Agent: {breakdown.task.assigned_agent}</p>
                          <p className="text-sm text-gray-600">
                            Status: <Badge className={getStatusColor(breakdown.task.status)}>{breakdown.task.status}</Badge>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{breakdown.task.completion_percentage}%</p>
                          <p className="text-xs text-gray-500">Complete</p>
                        </div>
                      </div>

                      {/* Issues Detected */}
                      <div className="mt-3 space-y-2">
                        <p className="font-medium text-sm">Issues Detected:</p>
                        {breakdown.issues.map((issue, i) => (
                          <Alert key={i} className="border-l-4 border-red-500">
                            <AlertDescription>
                              <span className="font-semibold">{issue.type.replace(/_/g, ' ').toUpperCase()}:</span> {issue.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>

                      {/* Subtasks Breakdown */}
                      {breakdown.task.subtasks && breakdown.task.subtasks.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium text-sm mb-2">Subtask Progress:</p>
                          <div className="space-y-1">
                            {breakdown.task.subtasks.map((subtask, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                {subtask.status === 'completed' ? (
                                  <CheckCircle size={16} className="text-green-500" />
                                ) : subtask.status === 'failed' ? (
                                  <X size={16} className="text-red-500" />
                                ) : subtask.status === 'in_progress' ? (
                                  <Clock size={16} className="text-blue-500" />
                                ) : (
                                  <AlertCircle size={16} className="text-gray-400" />
                                )}
                                <span className={subtask.status === 'completed' ? 'line-through text-gray-500' : ''}>
                                  {subtask.name}
                                </span>
                                <Badge className={getStatusColor(subtask.status)}>{subtask.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* File Evidence */}
                      {breakdown.task.files_expected && breakdown.task.files_expected.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium text-sm mb-2">File Evidence:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-gray-600">Modified:</p>
                              {breakdown.task.files_modified.map((file, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <CheckCircle size={12} className="text-green-500" />
                                  <span className="text-xs">{file}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Expected but missing:</p>
                              {breakdown.task.files_expected
                                .filter(f => !breakdown.task.files_modified.includes(f))
                                .map((file, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <X size={12} className="text-red-500" />
                                    <span className="text-xs text-red-600">{file}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Failure Reason */}
                      {breakdown.task.failure_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800">Failure Reason:</p>
                          <p className="text-sm text-red-700">{breakdown.task.failure_reason}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" onClick={() => handleRetry(breakdown.task.task_id)}>
                          <RefreshCw size={16} className="mr-1" />
                          Retry Task
                        </Button>
                        <Button size="sm" variant="outline">
                          <UserX size={16} className="mr-1" />
                          Reassign
                        </Button>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Detected at: {new Date(breakdown.detected_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Handoff Chain Tab */}
      {activeTab === 'handoff' && (
        <Card>
          <CardHeader>
            <CardTitle>Task Handoff Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {handoffChain.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <Badge className="min-w-[120px]">{step.agent}</Badge>
                  <span className="flex-1 text-sm">{step.task_name}</span>
                  <Badge className={getStatusColor(step.status)}>{step.status}</Badge>
                  <span className="text-sm text-gray-600">{step.completion_percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tasks / Incomplete Tasks Tabs */}
      {(activeTab === 'all' || activeTab === 'incomplete') && (
        <div className="grid gap-4">
          {(activeTab === 'all' ? tasks : incompleteTasks).map((task) => (
            <Card key={task.task_id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{task.name}</span>
                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span>Agent: <strong>{task.assigned_agent}</strong></span>
                    <span>Priority: <Badge>{task.priority}</Badge></span>
                    <span>Progress: <strong>{task.completion_percentage}%</strong></span>
                  </div>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Subtasks:</p>
                      <div className="space-y-1">
                        {task.subtasks.map((st, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {st.status === 'completed' ? (
                              <CheckCircle size={14} className="text-green-500" />
                            ) : (
                              <Clock size={14} className="text-gray-400" />
                            )}
                            <span className={st.status === 'completed' ? 'line-through' : ''}>{st.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
