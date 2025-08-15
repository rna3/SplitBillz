const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const auth = require('../middleware/auth');

router.use(auth);

// Create group
router.post('/', async (req, res) => {
  const { name, description, members } = req.body;
  if (!name || !Array.isArray(members)) {
    return res.status(400).json({ msg: 'Name and members are required' });
  }
  try {
    const group = new Group({
      name,
      description,
      members,
      createdBy: req.user.id
    });
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update group
router.put('/:groupId', async (req, res) => {
  const { name, description, members } = req.body;
  if (!name || !Array.isArray(members)) {
    return res.status(400).json({ msg: 'Name and members are required' });
  }
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }
    group.name = name;
    group.description = description;
    group.members = members;
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get group details
router.get('/:groupId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'name email')
      .populate({
        path: 'expenses',
        populate: { path: 'paidBy splits.user', select: 'name' }
      });
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all groups for user
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({ $or: [{ createdBy: req.user.id }, { members: req.user.id }] })
      .populate('members', 'name');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;