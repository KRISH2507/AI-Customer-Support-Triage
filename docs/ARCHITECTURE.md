# Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  (curl, Postman, Frontend Application, API Consumers)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                           │
│                     (Port 3000 - Node.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    ROUTES LAYER                          │  │
│  │  /api/triage                                             │  │
│  │  /api/triage/stats                                       │  │
│  │  /api/triage/:id/feedback                                │  │
│  │  /api/triage/accuracy                                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CONTROLLERS LAYER                           │  │
│  │  - Request validation                                    │  │
│  │  - Response formatting                                   │  │
│  │  - Error handling                                        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               SERVICES LAYER                             │  │
│  │                                                           │  │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │ Triage Service  │  │   Feedback   │  │  Accuracy  │ │  │
│  │  │  - AI Logic     │  │   Service    │  │  Service   │ │  │
│  │  │  - Batch Process│  │  - Track     │  │  - Reports │ │  │
│  │  └────────┬────────┘  └──────┬───────┘  └─────┬──────┘ │  │
│  │           │                   │                 │         │  │
│  └───────────┼───────────────────┼─────────────────┼────────┘  │
│              │                   │                 │            │
└──────────────┼───────────────────┼─────────────────┼────────────┘
               │                   │                 │
               ▼                   ▼                 ▼
┌──────────────────────────┐  ┌─────────────────────────────────┐
│   ANTHROPIC CLAUDE API   │  │      DATABASE LAYER              │
│   (Claude 3.5 Sonnet)    │  │     SQLite (sql.js)             │
│                          │  │                                  │
│  • Batch Classification  │  │  Tables:                         │
│  • JSON Response         │  │  - triage_results                │
│  • Temperature = 0       │  │  - feedback                      │
│  • Token Tracking        │  │  - batch_stats                   │
└──────────────────────────┘  └──────────────────┬───────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────┐
                              │      FILE SYSTEM                   │
                              │  - triage_results.json             │
                              │  - accuracy_report.json            │
                              │  - triage.sqlite                   │
                              └────────────────────────────────────┘
```

## Data Flow

### 1. Ticket Triage Flow
```
1. Client sends POST /api/triage with ticket array
   ↓
2. Controller validates request structure
   ↓
3. Triage Service constructs prompt with all tickets
   ↓
4. Single API call to Claude 3.5 Sonnet
   ↓
5. Parse JSON response with classifications
   ↓
6. Store results in SQLite database
   ↓
7. Export to triage_results.json
   ↓
8. Return response with classifications
```

### 2. Feedback Flow
```
1. Client sends POST /api/triage/:id/feedback
   ↓
2. Controller validates category and priority
   ↓
3. Feedback Service retrieves AI prediction from DB
   ↓
4. Compare AI prediction with human correction
   ↓
5. Store feedback with match/mismatch flag
   ↓
6. Return comparison result
```

### 3. Accuracy Reporting Flow
```
1. Client sends GET /api/triage/accuracy
   ↓
2. Accuracy Service queries feedback table
   ↓
3. Calculate overall accuracy
   ↓
4. Calculate per-category accuracy
   ↓
5. Calculate per-priority accuracy
   ↓
6. Generate confusion matrix
   ↓
7. Export to accuracy_report.json
   ↓
8. Return comprehensive report
```

## Technology Stack Details

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework for API endpoints
- **sql.js**: Pure JavaScript SQLite implementation

### AI/ML
- **Anthropic Claude 3.5 Sonnet**: LLM for ticket classification
- **Temperature 0**: Deterministic outputs

### Database
- **SQLite**: Lightweight embedded database
- **3 Tables**: triage_results, feedback, batch_stats

### Configuration
- **dotenv**: Environment variable management

## Key Features

1. **Batch Processing**: Single API call for multiple tickets
2. **Feedback Loop**: Human-in-the-loop validation
3. **Accuracy Tracking**: Confusion matrix and metrics
4. **Persistent Storage**: SQLite + JSON exports
5. **RESTful API**: Standard HTTP methods
6. **Error Handling**: Comprehensive validation
