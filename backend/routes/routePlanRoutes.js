const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { createRoutePlan, listRoutePlans, getRoutePlan, deleteRoutePlan, completeStop } = require('../controllers/routePlanController');

router.use(protect);
router.post('/', createRoutePlan);
router.get('/', listRoutePlans);
router.get('/:id', getRoutePlan);
router.delete('/:id', deleteRoutePlan);
router.patch('/:id/stops/:binId/complete', completeStop);

module.exports = router;
