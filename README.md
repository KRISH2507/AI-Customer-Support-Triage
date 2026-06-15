# AI Customer Support Triage System

An intelligent customer support ticket triage system powered by Anthropic's Claude API. Automatically categorizes and prioritizes support tickets using AI, with feedback tracking and accuracy reporting.

## Features

- **Batch Ticket Processing**: Process multiple tickets in a single API call
- **AI-Powered Classification**: Uses Claude 3.5 Sonnet with temperature=0 for consistent results
- **Category Classification**: billing, bug, account, feature_request, other
- **Priority Assignment**: low, medium, high
- **Feedback System**: Track human corrections and AI predictions
- **Accuracy Reporting**: Per-category accuracy metrics and confusion matrix
- **Persistent Storage**: SQLite database with full history
- **JSON Export**: Results saved to `triage_results.json` and `accuracy_report.json`

## Tech Stack

- **Node.js** with Express.js
- **SQLite** with better-sqlite3
- **Anthropic Claude API** (Claude 3.5 Sonnet)
- **dotenv** for environment configuration

## Project Structure

```
.
├── src/
│   ├── config/
│   │   └── db.js                 # Database initialization and schema
│   ├── controllers/
│   │   └── triage.controller.js  # Request handlers
│   ├── routes/
│   │   └── triage.routes.js      # API route definitions
│   ├── services/
│   │   ├── triage.service.js     # Core triage logic
│   │   ├── feedback.service.js   # Feedback management
│   │   └── accuracy.service.js   # Accuracy calculations
│   └── server.js                 # Express app entry point
├── test-tickets.json             # 50 realistic test tickets
├── triage_results.json           # Generated results (after running)
├── accuracy_report.json          # Generated accuracy report
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Anthropic API key

### Installation

1. **Clone the repository** (or download the files)

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000
DATABASE_PATH=./triage.sqlite
```

4. **Start the server**:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Documentation

### 1. POST /api/triage

Classify a batch of support tickets.

**Request Body**:
```json
[
  {
    "ticket_id": "TKT-001",
    "subject": "Cannot process payment",
    "body": "I've been trying to update my credit card..."
  }
]
```

**Response**:
```json
{
  "success": true,
  "tickets_processed": 1,
  "processing_time": 2.45,
  "tokens_used": 1250,
  "results": [
    {
      "ticket_id": "TKT-001",
      "subject": "Cannot process payment",
      "category": "billing",
      "priority": "high",
      "confidence": 0.95
    }
  ]
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -d @test-tickets.json
```

### 2. GET /api/triage/stats

Get overall processing statistics.

**Response**:
```json
{
  "tickets_processed": 50,
  "total_processing_time": 5.67,
  "total_tokens_used": 3456,
  "category_distribution": {
    "billing": 12,
    "bug": 15,
    "account": 8,
    "feature_request": 10,
    "other": 5
  }
}
```

**cURL Example**:
```bash
curl http://localhost:3000/api/triage/stats
```

### 3. POST /api/triage/:id/feedback

Submit human feedback for a triage result.

**Parameters**:
- `id` (path): Triage result ID from database

**Request Body**:
```json
{
  "category": "billing",
  "priority": "high"
}
```

**Response**:
```json
{
  "success": true,
  "feedback_id": 1,
  "ai_prediction": {
    "category": "billing",
    "priority": "medium"
  },
  "human_correction": {
    "category": "billing",
    "priority": "high"
  },
  "match": false
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/triage/1/feedback \
  -H "Content-Type: application/json" \
  -d '{"category": "billing", "priority": "high"}'
```

### 4. GET /api/triage/accuracy

Generate accuracy report based on feedback.

**Response**:
```json
{
  "timestamp": "2026-06-15T10:30:00.000Z",
  "overall_accuracy": 87.5,
  "total_feedback_samples": 20,
  "correct_predictions": 17,
  "category_accuracy": [
    {
      "category": "billing",
      "total": 5,
      "correct": 4,
      "accuracy": 80.0
    }
  ],
  "priority_accuracy": [
    {
      "priority": "high",
      "total": 8,
      "correct": 7,
      "accuracy": 87.5
    }
  ],
  "confusion_matrix": [
    {
      "ai_category": "billing",
      "human_category": "billing",
      "count": 4
    }
  ]
}
```

**cURL Example**:
```bash
curl http://localhost:3000/api/triage/accuracy
```

## Testing the System

### 1. Process Test Tickets

Process the 50 included test tickets:

```bash
curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -d @test-tickets.json
```

### 2. Check Statistics

```bash
curl http://localhost:3000/api/triage/stats
```

### 3. Submit Feedback

```bash
curl -X POST http://localhost:3000/api/triage/1/feedback \
  -H "Content-Type: application/json" \
  -d '{"category": "billing", "priority": "high"}'
```

### 4. Generate Accuracy Report

```bash
curl http://localhost:3000/api/triage/accuracy
```

## Database Schema

### triage_results
- `id`: Auto-increment primary key
- `ticket_id`: Unique ticket identifier
- `subject`: Ticket subject line
- `body`: Ticket description
- `category`: AI-assigned category
- `priority`: AI-assigned priority
- `confidence`: Confidence score (0-1)
- `processing_time`: Time taken to process (seconds)
- `tokens_used`: Claude API tokens consumed
- `created_at`: Timestamp

### feedback
- `id`: Auto-increment primary key
- `triage_id`: Foreign key to triage_results
- `ai_category`: AI prediction
- `ai_priority`: AI prediction
- `human_category`: Human correction
- `human_priority`: Human correction
- `is_match`: Boolean (1 if match, 0 if mismatch)
- `created_at`: Timestamp

### batch_stats
- `id`: Auto-increment primary key
- `tickets_processed`: Count of tickets
- `total_processing_time`: Total time (seconds)
- `total_tokens_used`: Total tokens consumed
- `created_at`: Timestamp

## Key Implementation Details

### Single API Call Processing
All tickets in a batch are processed with **ONE** Claude API call for efficiency. The system:
1. Constructs a single prompt with all tickets
2. Instructs Claude to return a JSON array
3. Parses the response and stores individual results

### JSON-Only Output
- Temperature set to **0** for deterministic results
- Prompt explicitly requests JSON format only
- Response parsing extracts JSON array from Claude's output

### Error Handling
- Validates request structure
- Catches and logs API errors
- Returns meaningful error messages
- Handles database failures gracefully

## Output Files

### triage_results.json
Contains all triage results with metadata:
```json
[
  {
    "timestamp": "2026-06-15T10:00:00.000Z",
    "tickets_processed": 50,
    "processing_time": 5.67,
    "tokens_used": 3456,
    "results": [...]
  }
]
```

### accuracy_report.json
Contains accuracy metrics and confusion matrix:
```json
{
  "timestamp": "2026-06-15T11:00:00.000Z",
  "overall_accuracy": 87.5,
  "total_feedback_samples": 20,
  "category_accuracy": [...],
  "priority_accuracy": [...],
  "confusion_matrix": [...]
}
```

## Production Considerations

### Security
- API key stored in environment variables
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

### Performance
- Batch processing reduces API calls
- SQLite for fast local storage
- Prepared statements for database efficiency

### Monitoring
- Processing time tracking
- Token usage monitoring
- Accuracy metrics over time

### Scalability
- Can switch to PostgreSQL/MySQL for production
- Add rate limiting for API endpoints
- Implement job queue for large batches

## Troubleshooting

### "Invalid API key"
- Verify your `ANTHROPIC_API_KEY` in `.env`
- Ensure no extra spaces or quotes

### "Database locked"
- SQLite locks during writes
- Use a production database for concurrent access

### "Module not found"
- Run `npm install` to install dependencies
- Check Node.js version (v16+)

## License

MIT

## Author

Kalvium Assignment - AI Customer Support Triage System
