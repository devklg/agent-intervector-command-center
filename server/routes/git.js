const express = require('express');
const router = express.Router();
const InMemoryService = require('../services/inMemoryService');

// Use in-memory service
const dataService = new InMemoryService();

// POST /api/git/commit - Receive commit notifications from git hooks
router.post('/commit', async (req, res) => {
  try {
    const { agent_name, branch, commit_hash, commit_message, files_changed, lines_added, lines_deleted, author } = req.body;

    if (!agent_name || !branch) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agent_name, branch'
      });
    }

    // Update agent's git activity
    const gitData = {
      branch,
      last_commit: {
        hash: commit_hash,
        message: commit_message,
        timestamp: new Date().toISOString(),
        author,
        files_changed: parseInt(files_changed) || 0,
        lines_added: parseInt(lines_added) || 0,
        lines_deleted: parseInt(lines_deleted) || 0
      },
      commit_count: 1 // Will be incremented in service
    };

    const agent = await dataService.updateGitActivity(agent_name, gitData);

    if (!agent) {
      // Agent doesn't exist yet - auto-register it
      const newAgent = await dataService.addAgent({
        name: agent_name,
        type: 'developer',
        specialties: ['story-implementation'],
        status: 'busy',
        priority: 'HIGH',
        current_task: `Working on ${branch}`,
        git_activity: {
          branch,
          last_commit: gitData.last_commit,
          commit_count: 1,
          commits: [gitData.last_commit]
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Agent auto-registered and git activity tracked',
        data: newAgent
      });
    }

    // Also create a message in the communication log
    await dataService.addMessage({
      from_agent: agent_name,
      to_agent: 'Bob-ScrumMaster',
      message_type: 'git_commit',
      priority: 'LOW',
      subject: `Commit: ${commit_hash}`,
      content: `Branch: ${branch}\nCommit: ${commit_message}\nFiles: ${files_changed} changed (+${lines_added} -${lines_deleted})`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Git activity tracked successfully',
      data: agent
    });
  } catch (error) {
    console.error('Error tracking git activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/git/activity - General activity updates (for Claude Code hooks)
router.post('/activity', async (req, res) => {
  try {
    const { agent_name, branch, activity_type, description } = req.body;

    if (!agent_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: agent_name'
      });
    }

    // Send activity as a message
    await dataService.addMessage({
      from_agent: agent_name,
      to_agent: 'Bob-ScrumMaster',
      message_type: 'activity',
      priority: 'LOW',
      subject: activity_type || 'Agent Activity',
      content: description || 'Agent is active',
      timestamp: new Date().toISOString()
    });

    // Update agent status if branch is provided
    if (branch) {
      let agent = await dataService.getAgentByName(agent_name);
      if (agent) {
        await dataService.updateAgent(agent.id, {
          status: 'busy',
          current_task: `Working on ${branch}`
        });
      }
    }

    res.json({
      success: true,
      message: 'Activity tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/git/agent/:name - Get git activity for a specific agent
router.get('/agent/:name', async (req, res) => {
  try {
    const agent = await dataService.getAgentByName(req.params.name);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      data: {
        name: agent.name,
        git_activity: agent.git_activity || null,
        status: agent.status,
        current_task: agent.current_task,
        last_updated: agent.last_updated
      }
    });
  } catch (error) {
    console.error('Error getting agent git activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
