const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// Middleware to verify JWT
router.use(auth);

// Create group
router.post('/', async (req, res) => {
  const { name, memberIds } = req.body;
  if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: 'Group name and at least one member are required.' });
  }

  try {
    const uniqueMembers = [...new Set(memberIds)];
    if (!uniqueMembers.includes(req.user.id)) {
      uniqueMembers.push(req.user.id);
    }

    const group = new Group({
      name,
      members: uniqueMembers,
      createdBy: req.user.id
    });
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user groups
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id }).populate('members', 'name email');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Get single group
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id })
                             .populate('members', 'name email');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
