const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// POST /api/activation/templates - Store activation template for a role
router.post('/templates', async (req, res) => {
  try {
    const template = await dataService.storeActivationTemplate(req.body);

    res.status(201).json({
      success: true,
      message: 'Activation template stored successfully',
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/activation/templates - List all templates (optionally filtered by project)
router.get('/templates', async (req, res) => {
  try {
    const { project_id } = req.query;
    const templates = await dataService.getAllActivationTemplates(project_id);

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/activation/templates/:projectId/:roleName - Get specific template
router.get('/templates/:projectId/:roleName', async (req, res) => {
  try {
    const { projectId, roleName } = req.params;
    const template = await dataService.getActivationTemplate(projectId, roleName);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Activation template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/activation/generate/:projectId/:roleName - Generate activation prompt
router.post('/generate/:projectId/:roleName', async (req, res) => {
  try {
    const { projectId, roleName } = req.params;
    const template = await dataService.getActivationTemplate(projectId, roleName);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Activation template not found'
      });
    }

    const project = await dataService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Generate activation prompt
    const prompt = generateActivationPrompt(template, project);

    // Auto-register the agent when prompt is generated
    const existingAgent = await dataService.getAgentByName(template.agent_name);

    if (!existingAgent) {
      await dataService.addAgent({
        name: template.agent_name,
        type: template.type,
        specialties: template.specialties,
        status: 'online',
        priority: template.priority,
        project_id: projectId,
        assigned_stories: template.assigned_stories,
        role: template.role,
        description: template.description,
        branch: template.branch_pattern
      });
    }

    res.json({
      success: true,
      message: 'Activation prompt generated and agent registered',
      data: {
        prompt,
        template,
        agent_registered: !existingAgent
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/activation/self-activate - Self-activation endpoint for agents
router.post('/self-activate', async (req, res) => {
  try {
    const { project_id, role_name } = req.body;

    if (!project_id || !role_name) {
      return res.status(400).json({
        success: false,
        error: 'project_id and role_name are required'
      });
    }

    const template = await dataService.getActivationTemplate(project_id, role_name);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: `No activation template found for role "${role_name}" in project "${project_id}"`
      });
    }

    const project = await dataService.getProjectById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if agent already exists
    let agent = await dataService.getAgentByName(template.agent_name);

    if (!agent) {
      // Register new agent
      agent = await dataService.addAgent({
        name: template.agent_name,
        type: template.type,
        specialties: template.specialties,
        status: 'online',
        priority: template.priority,
        project_id: project_id,
        assigned_stories: template.assigned_stories,
        role: template.role,
        description: template.description,
        branch: template.branch_pattern
      });
    } else {
      // Update existing agent status
      agent = await dataService.updateAgent(agent.id, {
        status: 'online',
        project_id: project_id
      });
    }

    // Generate activation prompt
    const prompt = generateActivationPrompt(template, project);

    res.json({
      success: true,
      message: `Agent ${template.agent_name} activated successfully`,
      data: {
        agent,
        prompt,
        template,
        project
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to generate activation prompt from template
function generateActivationPrompt(template, project) {
  const tasksList = template.tasks.map((task, idx) =>
    `${idx + 1}. ${task}`
  ).join('\n');

  const successCriteria = template.success_criteria.map(criteria =>
    `- [ ] ${criteria}`
  ).join('\n');

  const storiesList = template.assigned_stories.map(story =>
    `- Story ${story}`
  ).join('\n');

  const specialtiesList = template.specialties.map(s =>
    `- ${s}`
  ).join('\n');

  return `# ${template.agent_name} Agent Activation Prompt

## Agent Identity
- **Name:** ${template.agent_name}
- **Role:** ${template.role}
- **Type:** ${template.type}
- **Branch:** ${template.branch_pattern}
- **Priority:** ${template.priority}
- **Project:** ${project.name}
- **Project ID:** ${project.id}

---

## Project Context

**Project:** ${project.name}
**Description:** ${project.description}
**GitHub:** ${project.github_url || 'Not configured'}
**Repository Path:** ${project.repository_path || 'Not configured'}

---

## Assigned Stories
${storiesList}

---

## Your Mission

${template.description}

---

## Specialties
${specialtiesList}

---

## Tasks

${tasksList}

---

## Environment Setup

1. **Navigate to project repository:**
   \`\`\`bash
   cd ${project.repository_path || 'path/to/repository'}
   \`\`\`

2. **Checkout your branch:**
   \`\`\`bash
   git checkout -b ${template.branch_pattern}
   \`\`\`

3. **Register with Command Center (already done via this API):**
   Your agent profile is now active in the Command Center dashboard.

---

## Git Workflow

Your commits will be automatically tracked by the Command Center!

1. **Work on your branch:**
   \`\`\`bash
   git checkout ${template.branch_pattern}
   \`\`\`

2. **Commit frequently:**
   \`\`\`bash
   git add .
   git commit -m "${template.agent_name}: [description of changes]"
   \`\`\`

3. **Your activity appears automatically:**
   - Dashboard: http://localhost:3007
   - All commits, files, and lines tracked
   - Real-time visibility for Kevin and Bob

---

## Communication

You are now registered in the Command Center as **${template.agent_name}**.

- **Command Center API:** http://localhost:7500
- **Dashboard:** http://localhost:3007
- **Status:** online
- **Priority:** ${template.priority}

**Git hooks are active** - your commits will be tracked automatically!

---

## Success Criteria

${successCriteria}

---

## Resources

- **Command Center API:** http://localhost:7500
- **Dashboard:** http://localhost:3007
- **Project GitHub:** ${project.github_url || 'Not configured'}
- **Your Branch:** ${template.branch_pattern}

---

## Next Steps

1. Verify you're on the correct branch
2. Review the tasks above
3. Start implementing
4. Commit frequently
5. Check dashboard to see your progress

---

**Ready to start your mission!**

🚀 **Begin coding now!**

---

*Generated by Agent Intervector Command Center*
*Project: ${project.name}*
*Timestamp: ${new Date().toISOString()}*
`;
}

module.exports = router;
