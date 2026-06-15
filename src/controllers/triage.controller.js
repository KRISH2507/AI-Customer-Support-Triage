const triageService = require('../services/triage.service');
const feedbackService = require('../services/feedback.service');
const accuracyService = require('../services/accuracy.service');

async function triage(req, res) {
  try {
    const tickets = req.body;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array of tickets' });
    }

    // Validate ticket structure
    for (const ticket of tickets) {
      if (!ticket.ticket_id || !ticket.subject || !ticket.body) {
        return res.status(400).json({ 
          error: 'Each ticket must have ticket_id, subject, and body' 
        });
      }
    }

    const result = await triageService.triageTickets(tickets);
    res.json(result);
  } catch (error) {
    console.error('Triage error:', error);
    res.status(500).json({ error: error.message });
  }
}

function getStats(req, res) {
  try {
    const stats = triageService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
}

function submitFeedback(req, res) {
  try {
    const triageId = parseInt(req.params.id);
    const { category, priority } = req.body;

    if (!category || !priority) {
      return res.status(400).json({ error: 'category and priority are required' });
    }

    const validCategories = ['billing', 'bug', 'account', 'feature_request', 'other'];
    const validPriorities = ['low', 'medium', 'high'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const result = feedbackService.submitFeedback(triageId, category, priority);
    res.json(result);
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: error.message });
  }
}

function getAccuracy(req, res) {
  try {
    const report = accuracyService.calculateAccuracy();
    res.json(report);
  } catch (error) {
    console.error('Accuracy error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  triage,
  getStats,
  submitFeedback,
  getAccuracy
};
