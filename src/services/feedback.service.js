const db = require('../config/db');

function submitFeedback(triageId, humanCategory, humanPriority) {
  try {
    // Get the AI prediction
    const triageResult = db.prepare(`
      SELECT category as ai_category, priority as ai_priority
      FROM triage_results
      WHERE id = ?
    `).get(triageId);

    if (!triageResult) {
      throw new Error('Triage result not found');
    }

    // Check if feedback matches AI prediction
    const categoryMatch = triageResult.ai_category === humanCategory;
    const priorityMatch = triageResult.ai_priority === humanPriority;
    const isMatch = categoryMatch && priorityMatch ? 1 : 0;

    // Insert feedback
    const stmt = db.prepare(`
      INSERT INTO feedback (triage_id, ai_category, ai_priority, human_category, human_priority, is_match)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      triageId,
      triageResult.ai_category,
      triageResult.ai_priority,
      humanCategory,
      humanPriority,
      isMatch
    );

    return {
      success: true,
      feedback_id: result.lastInsertRowid,
      ai_prediction: {
        category: triageResult.ai_category,
        priority: triageResult.ai_priority
      },
      human_correction: {
        category: humanCategory,
        priority: humanPriority
      },
      match: isMatch === 1
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }
}

module.exports = {
  submitFeedback
};
