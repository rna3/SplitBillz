const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

router.use((req, res, next) => {
  console.log('Expense route hit:', req.method, req.url, 'userId:', req.user?.id || 'unknown');
  next();
});
router.use(auth);

// Add expense
router.post('/', async (req, res) => {
  const { description, amount, groupId, splits } = req.body;
  console.log('Received expense request:', { description, amount, groupId, splits, userId: req.user.id });

  if (!description || !amount || !groupId || !splits || !Array.isArray(splits)) {
    console.log('Validation failed: Missing or invalid expense data');
    return res.status(400).json({ msg: 'Missing or invalid expense data' });
  }

  for (let split of splits) {
    if (!split.user || typeof split.amount !== 'number' || split.amount < 0) {
      console.log('Validation failed: Invalid split data', split);
      return res.status(400).json({ msg: 'Invalid split data' });
    }
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('Group not found:', groupId);
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(
      memberId => memberId.toString() === req.user.id
    );
    if (!isMember) {
      console.log('User not a member of group:', { userId: req.user.id, groupId });
      return res.status(403).json({ msg: 'Not a member of this group' });
    }

    const expense = new Expense({
      description,
      amount,
      group: groupId,
      paidBy: req.user.id,
      splits
    });
    await expense.save();
    console.log('Expense saved:', { expenseId: expense._id, groupId });

    // Update group's expenses array
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { expenses: expense._id } }, // Use $addToSet to avoid duplicates
      { new: true, runValidators: true }
    );
    if (!updatedGroup) {
      console.log('Failed to update group with expense:', { expenseId: expense._id, groupId });
      return res.status(500).json({ msg: 'Failed to update group with expense' });
    }
    console.log('Group updated with expense:', { expenseId: expense._id, groupId, expenses: updatedGroup.expenses });

    res.json(expense);
  } catch (err) {
    console.error('Error saving expense:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get group expenses
router.get('/group/:groupId', async (req, res) => {
  try {
    console.log('Fetching expenses for group:', req.params.groupId);
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name')
      .populate('splits.user', 'name');
    console.log('Expenses fetched:', expenses);
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete an expense
router.delete('/:expenseId', async (req, res) => {
  try {
    console.log('Deleting expense:', req.params.expenseId);
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) {
      console.log('Expense not found:', req.params.expenseId);
      return res.status(404).json({ msg: 'Expense not found' });
    }

    if (expense.paidBy.toString() !== req.user.id) {
      console.log('Unauthorized to delete expense:', { userId: req.user.id, expenseId: req.params.expenseId });
      return res.status(403).json({ msg: 'Unauthorized to delete this expense' });
    }

    await Expense.deleteOne({ _id: req.params.expenseId });
    await Group.updateOne({ _id: expense.group }, { $pull: { expenses: req.params.expenseId } });
    console.log('Expense deleted:', req.params.expenseId);
    res.json({ msg: 'Expense deleted' });
  } catch (err) {
    console.error('Error deleting expense:', { message: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;