const Anthropic = require('@anthropic-ai/sdk');
const { getDb, saveDatabase } = require('../config/db');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function triageTickets(tickets) {
  const startTime = Date.now();

  // Prepare prompt for Claude
  const prompt = `You are a customer support AI that categorizes support tickets. Analyze the following tickets and classify each one.

Categories: billing, bug, account, feature_request, other
Priorities: low, medium, high

For each ticket, provide:
- category: one of the valid categories
- priority: one of the valid priorities
- confidence: a number between 0 and 1

Tickets to classify:
${JSON.stringify(tickets, null, 2)}

Respond with ONLY a JSON array matching this structure:
[
  {
    "ticket_id": "string",
    "category": "string",
    "priority": "string",
    "confidence": number
  }
]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    // Extract JSON from response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const classifications = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

    // Store results in database
    const db = getDb();
    const results = tickets.map((ticket, index) => {
      const classification = classifications[index];
      
      db.run(
        `INSERT INTO triage_results (ticket_id, subject, body, category, priority, confidence, processing_time, tokens_used)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ticket.ticket_id, ticket.subject, ticket.body, classification.category, classification.priority, 
         classification.confidence, processingTime, tokensUsed]
      );

      return {
        ticket_id: ticket.ticket_id,
        subject: ticket.subject,
        category: classification.category,
        priority: classification.priority,
        confidence: classification.confidence
      };
    });

    // Store batch stats
    db.run(
      `INSERT INTO batch_stats (tickets_processed, total_processing_time, total_tokens_used)
       VALUES (?, ?, ?)`,
      [tickets.length, processingTime, tokensUsed]
    );
    
    saveDatabase();

    // Save to JSON file
    const outputPath = path.join(__dirname, '../../triage_results.json');
    const existingData = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf-8')) : [];
    existingData.push({
      timestamp: new Date().toISOString(),
      tickets_processed: tickets.length,
      processing_time: processingTime,
      tokens_used: tokensUsed,
      results: results
    });
    fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2));

    return {
      success: true,
      tickets_processed: tickets.length,
      processing_time: processingTime,
      tokens_used: tokensUsed,
      results: results
    };
  } catch (error) {
    console.error('Error in triage:', error);
    throw new Error(`Triage failed: ${error.message}`);
  }
}

function getStats() {
  try {
    const db = getDb();
    
    const statsResult = db.exec(`
      SELECT 
        SUM(tickets_processed) as total_tickets,
        SUM(total_processing_time) as total_time,
        SUM(total_tokens_used) as total_tokens
      FROM batch_stats
    `);
    
    const stats = statsResult[0] && statsResult[0].values[0] ? {
      total_tickets: statsResult[0].values[0][0],
      total_time: statsResult[0].values[0][1],
      total_tokens: statsResult[0].values[0][2]
    } : { total_tickets: 0, total_time: 0, total_tokens: 0 };

    const categoryDistResult = db.exec(`
      SELECT category, COUNT(*) as count
      FROM triage_results
      GROUP BY category
    `);

    const distribution = {};
    if (categoryDistResult[0]) {
      categoryDistResult[0].values.forEach(row => {
        distribution[row[0]] = row[1];
      });
    }

    return {
      tickets_processed: stats.total_tickets || 0,
      total_processing_time: stats.total_time || 0,
      total_tokens_used: stats.total_tokens || 0,
      category_distribution: distribution
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw new Error(`Failed to get stats: ${error.message}`);
  }
}

module.exports = {
  triageTickets,
  getStats
};
