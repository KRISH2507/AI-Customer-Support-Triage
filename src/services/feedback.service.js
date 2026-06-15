const { getDb, saveDatabase } = require('../config/db');

function submitFeedback(triageId, humanCategory, humanPriority) {
  try {
    const db = getDb();
    
    // Get the AI prediction
    const result = db.exec(`
      SELECT category as ai_category, priority as ai_priority
      FROM triage_results
      WHERE id = ?
    `, [triageId]);

    if (!result[0] || !result[0].values[0]) {
      throw new Error('Triage result not found');
    }

    const triageResult = {
      ai_category: result[0].values[0][0],
      ai_priority: result[0].values[0][1]
    };

    // Check if feedback matches AI prediction
    const categoryMatch = triageResult.ai_category === humanCategory;
    const priorityMatch = triageResult.ai_priority === humanPriority;
    const isMatch = categoryMatch && priorityMatch ? 1 : 0;

    // Insert feedback
    db.run(
      `INSERT INTO feedback (triage_id, ai_category, ai_priority, human_category, human_priority, is_match)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [triageId, triageResult.ai_category, triageResult.ai_priority, humanCategory, humanPriority, isMatch]
    );

    saveDatabase();

    // Get the inserted ID
    const idResult = db.exec('SELECT last_insert_rowid()');
    const feedbackId = idResult[0].values[0][0];

    return {
      success: true,
      feedback_id: feedbackId,
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
