const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Prediction = require('../models/Prediction');
const mongoose = require('mongoose');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const owner = req.session.user.id;
    const ownerId = new mongoose.Types.ObjectId(owner);
    const [patients, assessmentIds, recent] = await Promise.all([
      Patient.countDocuments({ owner }),
      Prediction.distinct('assessmentId', { owner }),
      Prediction.aggregate([
        { $match: { owner: ownerId } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: { patient: '$patient', assessmentId: '$assessmentId' }, row: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$row' } },
        { $sort: { createdAt: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'patients', localField: 'patient', foreignField: '_id', as: 'patient' } },
        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, assessmentId: 1, condition: 1, riskLevel: 1, createdAt: 1, patient: { _id: '$patient._id', name: '$patient.name', patientId: '$patient.patientId', condition: '$patient.condition' } } },
      ]),
    ]);

    res.json({
      role: req.session.user.role,
      patients,
      predictions: assessmentIds.length,
      recent,
    });
  } catch (error) { next(error); }
});

module.exports = router;
