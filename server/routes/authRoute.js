const express = require('express');
const router = express.Router();
const { register, login, updatePassword, removeAccount } = require('../controllers/authController');
const verifyToken = require('../controllers/verifyToken');

//POST /api/auth/register
router.post('/register', register);

//POST /api/auth/login
router.post('/login', login);

//POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
    });
    return res.json({ message: 'Logged out successfully' });
});


router.get("/verify", verifyToken, (req, res) => {
    res.json({
        userId: req.user.userId,
        username: req.user.username
    });
});

router.patch("/change-password", verifyToken, updatePassword);
router.delete("/delete-account", verifyToken, removeAccount);

module.exports = router;
