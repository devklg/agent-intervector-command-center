import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  Network,
  Users,
  GitBranch,
  Activity,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Filter,
  Info
} from 'lucide-react';
import neo4jService from '../services/neo4jService';
import { useToast } from './ui/use-toast';

export default function AgentNetworkGraph() {
  const [networkData, setNetworkData] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('network'); // network, dependencies, communities
  const [filterType, setFilterType] = useState('all'); // all, active, collaborating
  const canvasRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNetworkData();
  }, [viewMode, filterType]);

  const loadNetworkData = async () => {
    setIsLoading(true);
    try {
      let data;

      switch (viewMode) {
        case 'network':
          // Load agent network data
          data = await generateMockNetworkData();
          break;
        case 'dependencies':
          // Load task dependency graph
          data = await generateMockDependencyData();
          break;
        case 'communities':
          // Load community detection data
          data = await generateMockCommunityData();
          break;
        default:
          data = await generateMockNetworkData();
      }

      setNetworkData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load network data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load network visualization',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  // Mock data generators - Replace with actual Neo4j service calls
  const generateMockNetworkData = () => {
    const agents = [
      { id: 'agent-1', name: 'Project Manager', type: 'coordinator', connections: 8, centrality: 0.95 },
      { id: 'agent-2', name: 'Tech Lead', type: 'developer', connections: 6, centrality: 0.78 },
      { id: 'agent-3', name: 'Frontend Dev', type: 'developer', connections: 4, centrality: 0.62 },
      { id: 'agent-4', name: 'Backend Dev', type: 'developer', connections: 5, centrality: 0.71 },
      { id: 'agent-5', name: 'QA Engineer', type: 'tester', connections: 3, centrality: 0.54 },
      { id: 'agent-6', name: 'DevOps', type: 'operations', connections: 4, centrality: 0.68 },
      { id: 'agent-7', name: 'UX Designer', type: 'designer', connections: 3, centrality: 0.45 },
      { id: 'agent-8', name: 'Data Analyst', type: 'analyst', connections: 2, centrality: 0.38 }
    ];

    const relationships = [
      { from: 'agent-1', to: 'agent-2', type: 'COORDINATES_WITH', strength: 0.9 },
      { from: 'agent-1', to: 'agent-3', type: 'COORDINATES_WITH', strength: 0.7 },
      { from: 'agent-1', to: 'agent-4', type: 'COORDINATES_WITH', strength: 0.7 },
      { from: 'agent-1', to: 'agent-5', type: 'COORDINATES_WITH', strength: 0.6 },
      { from: 'agent-2', to: 'agent-3', type: 'COLLABORATES_WITH', strength: 0.8 },
      { from: 'agent-2', to: 'agent-4', type: 'COLLABORATES_WITH', strength: 0.9 },
      { from: 'agent-2', to: 'agent-6', type: 'COLLABORATES_WITH', strength: 0.7 },
      { from: 'agent-3', to: 'agent-7', type: 'COLLABORATES_WITH', strength: 0.8 },
      { from: 'agent-4', to: 'agent-6', type: 'COLLABORATES_WITH', strength: 0.75 },
      { from: 'agent-5', to: 'agent-3', type: 'REVIEWS', strength: 0.6 },
      { from: 'agent-5', to: 'agent-4', type: 'REVIEWS', strength: 0.6 },
      { from: 'agent-8', to: 'agent-1', type: 'REPORTS_TO', strength: 0.5 }
    ];

    return { agents, relationships };
  };

  const generateMockDependencyData = () => {
    const tasks = [
      { id: 'task-1', name: 'API Design', status: 'completed', agent: 'Tech Lead' },
      { id: 'task-2', name: 'Database Schema', status: 'completed', agent: 'Backend Dev' },
      { id: 'task-3', name: 'Auth Implementation', status: 'in_progress', agent: 'Backend Dev' },
      { id: 'task-4', name: 'UI Components', status: 'in_progress', agent: 'Frontend Dev' },
      { id: 'task-5', name: 'API Integration', status: 'blocked', agent: 'Frontend Dev' },
      { id: 'task-6', name: 'Testing Suite', status: 'pending', agent: 'QA Engineer' }
    ];

    const dependencies = [
      { from: 'task-1', to: 'task-3', type: 'DEPENDS_ON' },
      { from: 'task-2', to: 'task-3', type: 'DEPENDS_ON' },
      { from: 'task-3', to: 'task-5', type: 'BLOCKS' },
      { from: 'task-1', to: 'task-4', type: 'DEPENDS_ON' },
      { from: 'task-4', to: 'task-5', type: 'DEPENDS_ON' },
      { from: 'task-5', to: 'task-6', type: 'DEPENDS_ON' }
    ];

    return { agents: tasks, relationships: dependencies };
  };

  const generateMockCommunityData = () => {
    const agents = [
      { id: 'agent-1', name: 'Project Manager', community: 'leadership', connections: 8 },
      { id: 'agent-2', name: 'Tech Lead', community: 'leadership', connections: 6 },
      { id: 'agent-3', name: 'Frontend Dev', community: 'frontend', connections: 4 },
      { id: 'agent-4', name: 'Backend Dev', community: 'backend', connections: 5 },
      { id: 'agent-5', name: 'QA Engineer', community: 'quality', connections: 3 },
      { id: 'agent-6', name: 'DevOps', community: 'backend', connections: 4 },
      { id: 'agent-7', name: 'UX Designer', community: 'frontend', connections: 3 },
      { id: 'agent-8', name: 'Data Analyst', community: 'leadership', connections: 2 }
    ];

    const relationships = [
      { from: 'agent-1', to: 'agent-2', type: 'SAME_COMMUNITY' },
      { from: 'agent-3', to: 'agent-7', type: 'SAME_COMMUNITY' },
      { from: 'agent-4', to: 'agent-6', type: 'SAME_COMMUNITY' }
    ];

    return { agents, relationships };
  };

  const getNodeColor = (node) => {
    if (viewMode === 'dependencies') {
      switch (node.status) {
        case 'completed': return '#10b981';
        case 'in_progress': return '#3b82f6';
        case 'blocked': return '#ef4444';
        case 'pending': return '#94a3b8';
        default: return '#6b7280';
      }
    } else if (viewMode === 'communities') {
      switch (node.community) {
        case 'leadership': return '#8b5cf6';
        case 'frontend': return '#06b6d4';
        case 'backend': return '#f59e0b';
        case 'quality': return '#10b981';
        default: return '#6b7280';
      }
    } else {
      switch (node.type) {
        case 'coordinator': return '#8b5cf6';
        case 'developer': return '#3b82f6';
        case 'tester': return '#10b981';
        case 'designer': return '#ec4899';
        case 'operations': return '#f59e0b';
        case 'analyst': return '#06b6d4';
        default: return '#6b7280';
      }
    }
  };

  const renderVisualization = () => {
    if (!networkData) return null;

    const { agents, relationships } = networkData;
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Simple circular layout
    const positions = agents.map((agent, index) => {
      const angle = (index * 2 * Math.PI) / agents.length;
      return {
        ...agent,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="border rounded-lg bg-white">
        {/* Draw relationships */}
        <g>
          {relationships.map((rel, i) => {
            const fromNode = positions.find(p => p.id === rel.from);
            const toNode = positions.find(p => p.id === rel.to);
            if (!fromNode || !toNode) return null;

            return (
              <line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#94a3b8"
                strokeWidth={rel.strength ? rel.strength * 3 : 2}
                opacity={0.6}
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </g>

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Draw nodes */}
        <g>
          {positions.map((node) => (
            <g
              key={node.id}
              onClick={() => setSelectedAgent(node)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={20 + (node.centrality ? node.centrality * 10 : node.connections * 2)}
                fill={getNodeColor(node)}
                stroke="#fff"
                strokeWidth="3"
                opacity={selectedAgent?.id === node.id ? 1 : 0.9}
              />
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#1f2937"
              >
                {node.name}
              </text>
              {viewMode === 'network' && (
                <text
                  x={node.x}
                  y={node.y + 50}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {node.connections} connections
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
    );
  };

  const getStats = () => {
    if (!networkData) return null;

    const { agents, relationships } = networkData;

    return {
      totalNodes: agents.length,
      totalRelationships: relationships.length,
      avgConnections: (relationships.length * 2 / agents.length).toFixed(1),
      mostConnected: agents.reduce((max, agent) =>
        (agent.connections || 0) > (max.connections || 0) ? agent : max
      , agents[0])
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-gradient shadow-brand">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="gradient-text text-2xl flex items-center gap-2">
                <Network className="h-6 w-6" />
                Agent Network Graph
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Interactive visualization of agent relationships and task dependencies powered by Neo4j
              </p>
            </div>
            <Button onClick={loadNetworkData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <Button
              onClick={() => setViewMode('network')}
              variant={viewMode === 'network' ? 'default' : 'outline'}
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Agent Network
            </Button>
            <Button
              onClick={() => setViewMode('dependencies')}
              variant={viewMode === 'dependencies' ? 'default' : 'outline'}
              size="sm"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Task Dependencies
            </Button>
            <Button
              onClick={() => setViewMode('communities')}
              variant={viewMode === 'communities' ? 'default' : 'outline'}
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              Communities
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-2xl font-bold gradient-text">{stats.totalNodes}</p>
                <p className="text-xs text-gray-600 mt-1">Total Nodes</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-800">{stats.totalRelationships}</p>
                <p className="text-xs text-blue-600 mt-1">Relationships</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-800">{stats.avgConnections}</p>
                <p className="text-xs text-purple-600 mt-1">Avg Connections</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-bold text-green-800">{stats.mostConnected?.name}</p>
                <p className="text-xs text-green-600 mt-1">Most Connected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Network Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="relative">
                {renderVisualization()}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              {selectedAgent ? 'Node Details' : 'Graph Legend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAgent ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getNodeColor(selectedAgent) }}
                    />
                    <h3 className="font-bold text-lg">{selectedAgent.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {selectedAgent.type || selectedAgent.status || selectedAgent.community}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {selectedAgent.connections && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connections:</span>
                      <span className="font-semibold">{selectedAgent.connections}</span>
                    </div>
                  )}
                  {selectedAgent.centrality && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Centrality:</span>
                      <span className="font-semibold">{(selectedAgent.centrality * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {selectedAgent.agent && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="font-semibold">{selectedAgent.agent}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => setSelectedAgent(null)}
                >
                  Close Details
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Click on any node to see detailed information about agents or tasks.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Node Types:</p>
                  {viewMode === 'network' && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-purple-600" />
                        <span>Coordinator</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                        <span>Developer</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        <span>Tester</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-pink-600" />
                        <span>Designer</span>
                      </div>
                    </>
                  )}
                  {viewMode === 'dependencies' && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                        <span>In Progress</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-red-600" />
                        <span>Blocked</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span>Pending</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
