const jwt = require('jsonwebtoken');
const {
    createUser,
    loginUser,
    changeUserPassword,
    deleteUserAccount,
} = require('../database/users');

async function register(req, res) {
    try{
        const { username, password } = req.body;
        const result = await createUser(username, password);
        res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}

async function login(req, res) {
    try{

        const { username, password } = req.body;

        const result = await loginUser(username, password);

        const token = jwt.sign(
            {
                userId: result._id.toString(),
                username: result.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });

        res.status(200).json({
            message: 'Login successful',
            userId: result._id,
            username: result.username
        });

    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}

async function updatePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        await changeUserPassword(req.user.userId, currentPassword, newPassword);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeAccount(req, res) {
    try {
        await deleteUserAccount(req.user.userId);

        res.clearCookie('token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = { register, login, updatePassword, removeAccount };
