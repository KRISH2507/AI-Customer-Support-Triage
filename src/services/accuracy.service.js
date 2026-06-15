const { getDb } = require('../config/db');
const fs = require('fs');
const path = require('path');

function calculateAccuracy() {
  try {
    const db = getDb();
    
    // Overall accuracy
    const overallResult = db.exec(`
      SELECT 
        COUNT(*) as total_feedback,
        SUM(is_match) as correct_predictions
      FROM feedback
    `);

    const overallStats = overallResult[0] && overallResult[0].values[0] ? {
      total_feedback: overallResult[0].values[0][0],
      correct_predictions: overallResult[0].values[0][1] || 0
    } : { total_feedback: 0, correct_predictions: 0 };

    const overallAccuracy = overallStats.total_feedback > 0
      ? (overallStats.correct_predictions / overallStats.total_feedback) * 100
      : 0;

    // Per-category accuracy
    const categoryResult = db.exec(`
      SELECT 
        ai_category,
        COUNT(*) as total,
        SUM(CASE WHEN ai_category = human_category THEN 1 ELSE 0 END) as correct
      FROM feedback
      GROUP BY ai_category
    `);

    const categoryAccuracy = [];
    if (categoryResult[0]) {
      categoryResult[0].values.forEach(row => {
        const total = row[1];
        const correct = row[2] || 0;
        categoryAccuracy.push({
          category: row[0],
          total: total,
          correct: correct,
          accuracy: parseFloat(((correct / total) * 100).toFixed(2))
        });
      });
    }

    // Priority accuracy
    const priorityResult = db.exec(`
      SELECT 
        ai_priority,
        COUNT(*) as total,
        SUM(CASE WHEN ai_priority = human_priority THEN 1 ELSE 0 END) as correct
      FROM feedback
      GROUP BY ai_priority
    `);

    const priorityAccuracy = [];
    if (priorityResult[0]) {
      priorityResult[0].values.forEach(row => {
        const total = row[1];
        const correct = row[2] || 0;
        priorityAccuracy.push({
          priority: row[0],
          total: total,
          correct: correct,
          accuracy: parseFloat(((correct / total) * 100).toFixed(2))
        });
      });
    }

    // Confusion matrix for categories
    const confusionResult = db.exec(`
      SELECT 
        ai_category,
        human_category,
        COUNT(*) as count
      FROM feedback
      GROUP BY ai_category, human_category
    `);

    const confusionMatrix = [];
    if (confusionResult[0]) {
      confusionResult[0].values.forEach(row => {
        confusionMatrix.push({
          ai_category: row[0],
          human_category: row[1],
          count: row[2]
        });
      });
    }

    const report = {
      timestamp: new Date().toISOString(),
      overall_accuracy: parseFloat(overallAccuracy.toFixed(2)),
      total_feedback_samples: overallStats.total_feedback,
      correct_predictions: overallStats.correct_predictions,
      category_accuracy: categoryAccuracy,
      priority_accuracy: priorityAccuracy,
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
