const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.get('/', employeeController.getAllEmployees);
router.get('/stats', employeeController.getEmployeeStats);
router.get('/:userId/progress', employeeController.getEmployeeProgress);
router.post('/progress', employeeController.updateProgress);

module.exports = router;
