import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input, Label, Textarea } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { MessageSquare, Send, Search } from 'lucide-react';
import communicationService from '../services/communicationService';
import agentService from '../services/agentService';

export default function CommunicationCenter() {
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [newMessage, setNewMessage] = useState({
    from_agent: 'SYSTEM',
    to_agent: '',
    message_type: 'coordination_request',
    priority: 'MEDIUM',
    subject: '',
    content: ''
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [messagesRes, agentsRes] = await Promise.all([
        communicationService.getCommunicationLog({ limit: 100 }),
        agentService.getAllAgents()
      ]);
      setMessages(messagesRes.data || []);
      setAgents(agentsRes.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      const response = await communicationService.sendMessage(newMessage);
      if (response.success) {
        toast({ title: 'Message Sent', description: 'Your message has been delivered' });
        setShowSendDialog(false);
        setNewMessage({
          from_agent: 'SYSTEM',
          to_agent: '',
          message_type: 'coordination_request',
          priority: 'MEDIUM',
          subject: '',
          content: ''
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    try {
      const response = await communicationService.searchMessages(searchQuery);
      setMessages(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Search failed',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
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
          <h2 className="text-3xl font-bold text-gray-900">Communication Center</h2>
          <p className="text-gray-600">Intervector message coordination system</p>
        </div>
        <Button onClick={() => setShowSendDialog(true)} className="bg-blue-600">
          <Send className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No messages found</p>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 rounded-r">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{message.from_agent}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-semibold text-sm">{message.to_agent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-white text-xs ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {message.message_type}
                      </Badge>
                    </div>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                  <p className="text-sm text-gray-600">{message.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent onClose={() => setShowSendDialog(false)}>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Agent</Label>
              <Input
                value={newMessage.from_agent}
                onChange={(e) => setNewMessage({ ...newMessage, from_agent: e.target.value })}
                placeholder="Sender agent name"
              />
            </div>
            <div className="space-y-2">
              <Label>To Agent</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newMessage.to_agent}
                onChange={(e) => setNewMessage({ ...newMessage, to_agent: e.target.value })}
              >
                <option value="">Select agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.agent_name}>
                    {agent.agent_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Message Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newMessage.message_type}
                  onChange={(e) => setNewMessage({ ...newMessage, message_type: e.target.value })}
                >
                  <option value="coordination_request">Coordination Request</option>
                  <option value="task_assignment">Task Assignment</option>
                  <option value="status_update">Status Update</option>
                  <option value="knowledge_share">Knowledge Share</option>
                  <option value="system_notification">System Notification</option>
                  <option value="emergency_alert">Emergency Alert</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newMessage.priority}
                  onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                placeholder="Message subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                placeholder="Enter your message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
