const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

router.get('/', contentController.getAllContent);
router.post('/upload', contentController.uploadContent);
router.delete('/:id', contentController.deleteContent);
router.put('/:id/links', contentController.updateContentLinks);

module.exports = router;
