const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');

router.get('/', qrController.getAllQRs);
router.get('/:id', qrController.getQRWithContent);
router.post('/', qrController.createQR);

module.exports = router;
