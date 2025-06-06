const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

router.use(auth);

// Add expense
router.post('/', async (req, res) => {
  const { description, amount, groupId, splits } = req.body;

  if (!description || !amount || !groupId || !splits || !Array.isArray(splits)) {
    return res.status(400).json({ msg: 'Missing or invalid expense data' });
  }

  for (let split of splits) {
    if (!split.user || typeof split.amount !== 'number') {
      return res.status(400).json({ msg: 'Invalid split data' });
    }
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const isMember = group.members.some(
      memberId => memberId.toString() === req.user.id
    );
    if (!isMember) {
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
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group expenses
router.get('/group/:groupId', async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name')
      .populate('splits.user', 'name');
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Delete an expense
router.delete('/:expenseId', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    if (expense.paidBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized to delete this expense' });
    }

    await expense.remove();
    res.json({ msg: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
