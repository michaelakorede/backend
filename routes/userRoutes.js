const express = require('express');
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser); // Public
router.post('/login', loginUser);       // Public
router.get('/profile', authMiddleware, getUserProfile); // Private

module.exports = router;
