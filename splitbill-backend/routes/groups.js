const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.use((req, res, next) => {
  console.log('Group route hit:', req.method, req.url, 'userId:', req.user?.id || 'unknown');
  next();
});
router.use(auth);

// Get all groups
router.get('/', async (req, res) => {
  try {
    console.log('Fetching groups for user:', req.user.id);
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'name')
      .populate('createdBy', 'name');
    console.log('Groups fetched:', groups);
    res.json(groups);
  } catch (err) {
    console.error('Error fetching groups:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get a single group
router.get('/:groupId', async (req, res) => {
  try {
    console.log('Fetching group:', req.params.groupId);
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'name')
      .populate('createdBy', 'name')
      .populate('expenses');
    if (!group) {
      console.log('Group not found:', req.params.groupId);
      return res.status(404).json({ msg: 'Group not found' });
    }
    console.log('Group fetched:', group);
    res.json(group);
  } catch (err) {
    console.error('Error fetching group:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Create a group
router.post('/', async (req, res) => {
  const { name, description, members } = req.body;
  console.log('Creating group:', { name, description, members, createdBy: req.user.id });
  if (!name || !members || !Array.isArray(members)) {
    console.log('Validation failed: Missing or invalid group data');
    return res.status(400).json({ msg: 'Missing or invalid group data' });
  }
  try {
    const group = new Group({
      name,
      description,
      members,
      createdBy: req.user.id,
      expenses: []
    });
    await group.save();
    console.log('Group created:', { groupId: group._id });
    res.json(group);
  } catch (err) {
    console.error('Error creating group:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update a group
router.put('/:groupId', async (req, res) => {
  const { name, description, members } = req.body;
  console.log('Updating group:', { groupId: req.params.groupId, name, description, members });
  if (!name || !members || !Array.isArray(members)) {
    console.log('Validation failed: Missing or invalid group data');
    return res.status(400).json({ msg: 'Missing or invalid group data' });
  }
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      console.log('Group not found:', req.params.groupId);
      return res.status(404).json({ msg: 'Group not found' });
    }
    if (group.createdBy.toString() !== req.user.id) {
      console.log('Unauthorized to update group:', { userId: req.user.id, groupId: req.params.groupId });
      return res.status(403).json({ msg: 'Unauthorized to update this group' });
    }
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.groupId,
      { name, description, members },
      { new: true, runValidators: true }
    );
    console.log('Group updated:', { groupId: updatedGroup._id });
    res.json(updatedGroup);
  } catch (err) {
    console.error('Error updating group:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete a group
router.delete('/:groupId', async (req, res) => {
  try {
    console.log('Deleting group:', req.params.groupId);
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      console.log('Group not found:', req.params.groupId);
      return res.status(404).json({ msg: 'Group not found' });
    }
    if (group.createdBy.toString() !== req.user.id) {
      console.log('Unauthorized to delete group:', { userId: req.user.id, groupId: req.params.groupId });
      return res.status(403).json({ msg: 'Unauthorized to delete this group' });
    }
    // Delete associated expenses
    await Expense.deleteMany({ group: req.params.groupId });
    console.log('Expenses deleted for group:', req.params.groupId);
    // Delete the group
    await Group.deleteOne({ _id: req.params.groupId });
    console.log('Group deleted:', req.params.groupId);
    res.json({ msg: 'Group deleted' });
  } catch (err) {
    console.error('Error deleting group:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;