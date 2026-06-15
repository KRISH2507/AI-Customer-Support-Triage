const db = require('../config/db');
const fs = require('fs');
const path = require('path');

function calculateAccuracy() {
  try {
    // Overall accuracy
    const overallStats = db.prepare(`
      SELECT 
        COUNT(*) as total_feedback,
        SUM(is_match) as correct_predictions
      FROM feedback
    `).get();

    const overallAccuracy = overallStats.total_feedback > 0
      ? (overallStats.correct_predictions / overallStats.total_feedback) * 100
      : 0;

    // Per-category accuracy
    const categoryAccuracy = db.prepare(`
      SELECT 
        ai_category,
        COUNT(*) as total,
        SUM(CASE WHEN ai_category = human_category THEN 1 ELSE 0 END) as correct,
        ROUND(CAST(SUM(CASE WHEN ai_category = human_category THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as accuracy_percentage
      FROM feedback
      GROUP BY ai_category
    `).all();

    // Priority accuracy
    const priorityAccuracy = db.prepare(`
      SELECT 
        ai_priority,
        COUNT(*) as total,
        SUM(CASE WHEN ai_priority = human_priority THEN 1 ELSE 0 END) as correct,
        ROUND(CAST(SUM(CASE WHEN ai_priority = human_priority THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as accuracy_percentage
      FROM feedback
      GROUP BY ai_priority
    `).all();

    // Confusion matrix for categories
    const confusionMatrix = db.prepare(`
      SELECT 
        ai_category,
        human_category,
        COUNT(*) as count
      FROM feedback
      GROUP BY ai_category, human_category
    `).all();

    const report = {
      timestamp: new Date().toISOString(),
      overall_accuracy: parseFloat(overallAccuracy.toFixed(2)),
      total_feedback_samples: overallStats.total_feedback,
      correct_predictions: overallStats.correct_predictions,
      category_accuracy: categoryAccuracy.map(row => ({
        category: row.ai_category,
        total: row.total,
        correct: row.correct,
        accuracy: row.accuracy_percentage
      })),
      priority_accuracy: priorityAccuracy.map(row => ({
        priority: row.ai_priority,
        total: row.total,
        correct: row.correct,
        accuracy: row.accuracy_percentage
      })),
      confusion_matrix: confusionMatrix
    };

    // Save to JSON file
    const outputPath = path.join(__dirname, '../../accuracy_report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    return report;
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    throw new Error(`Failed to calculate accuracy: ${error.message}`);
  }
}

module.exports = {
  calculateAccuracy
};
