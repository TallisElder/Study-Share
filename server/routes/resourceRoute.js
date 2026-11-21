const express = require('express');
const router = express.Router();
const { createResource, getAllResources, getResourcesByUser, deleteResource } = require('../database/resource');
const verifyToken = require('../controllers/verifyToken');

// CREATE resource
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { title, description, subject, link } = req.body;

        // Create resource and return the full document
        const newResource = await createResource(
            title,
            description,
            subject,
            link,
            req.user.userId,
            req.user.username
        );

        res.status(201).json(newResource);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET all resources
router.get('/', verifyToken, async (req, res) => {
    try {
        const resources = await getAllResources();
        res.json(resources);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET resources created by the logged-in user
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const resources = await getResourcesByUser(req.user.userId);
        res.json(resources);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE resource (only creator can delete)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await deleteResource(req.params.id, req.user.userId);
        res.json({ message: "Deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
