const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { createRoutePlan, listRoutePlans, getRoutePlan, deleteRoutePlan } = require('../controllers/routePlanController');

router.use(protect);
router.post('/', createRoutePlan);
router.get('/', listRoutePlans);
router.get('/:id', getRoutePlan);
router.delete('/:id', deleteRoutePlan);

module.exports = router;
