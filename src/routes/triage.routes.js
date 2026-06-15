const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triage.controller');

router.post('/triage', triageController.triage);
router.get('/triage/stats', triageController.getStats);
router.post('/triage/:id/feedback', triageController.submitFeedback);
router.get('/triage/accuracy', triageController.getAccuracy);

module.exports = router;
