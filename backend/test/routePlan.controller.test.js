const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const { expect } = chai;

const Bin = require('../models/Bin');
const RoutePlan = require('../models/RoutePlan');
const { createRoutePlan, listRoutePlans, getRoutePlan, deleteRoutePlan } = require('../controllers/routePlanController');

// reusable fake res
function makeRes() {
  return { status: sinon.stub().returnsThis(), json: sinon.spy() };
}

// helper for RoutePlan.find().sort()
function stubFindSort(resultArray) {
  const sortStub = sinon.stub().returns(resultArray);
  const findStub = sinon.stub(RoutePlan, 'find').returns({ sort: sortStub });
  return { findStub, sortStub };
}

describe('RoutePlan Controller - Ticket 4.1', () => {
  afterEach(() => sinon.restore());

  describe('createRoutePlan', () => {
    it('creates a plan using greedy nearest neighbor and returns 201', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      // Depot near Brisbane CBD
      const depot = { lat: -27.4699, lng: 153.0251 };

      // Three bins with distinct locations
      const bins = [
        { _id: new mongoose.Types.ObjectId(), userId, name: 'Roma St',    location: { lat: -27.466, lng: 153.017 } },
        { _id: new mongoose.Types.ObjectId(), userId, name: 'Howard Smith', location: { lat: -27.457, lng: 153.043 } },
        { _id: new mongoose.Types.ObjectId(), userId, name: 'QUT Gardens',  location: { lat: -27.478, lng: 153.029 } },
      ];

      // Candidates returned by Bin.find
      const binFindStub = sinon.stub(Bin, 'find').resolves(bins);

      // Capture what we create
      const createdDoc = { _id: new mongoose.Types.ObjectId(), userId, stops: [], totalDistanceKm: 0 };
      const createStub = sinon.stub(RoutePlan, 'create').callsFake(async (payload) => {
        // basic shape checks
        expect(payload.userId).to.equal(userId);
        expect(payload.depot).to.deep.equal(depot);
        expect(payload.stops.length).to.equal(3);
        // ensure each stop references a bin and has distance
        payload.stops.forEach(s => {
          expect(!!s.binId).to.be.true;
          expect(typeof s.distanceFromPrevKm).to.equal('number');
        });
        // total distance should be > 0
        expect(payload.totalDistanceKm).to.be.greaterThan(0);
        return { ...createdDoc, ...payload };
      });

      const req = { user: { id: userId }, body: { depot, threshold: 80 } };
      const res = makeRes();

      await createRoutePlan(req, res);

      expect(binFindStub.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });

    it('400 when depot missing/invalid', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const req = { user: { id: userId }, body: { depot: { lat: -27.47 } } }; // missing lng
      const res = makeRes();

      await createRoutePlan(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
    });

    it('400 when no bins need pickup', async () => {
      sinon.stub(Bin, 'find').resolves([]);
      const req = { user: { id: 'u1' }, body: { depot: { lat: 0, lng: 0 } } };
      const res = makeRes();

      await createRoutePlan(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'No bins require pickup at this time' })).to.be.true;
    });

    it('500 on DB error', async () => {
      sinon.stub(Bin, 'find').throws(new Error('DB Error'));
      const req = { user: { id: 'u1' }, body: { depot: { lat: 0, lng: 0 } } };
      const res = makeRes();

      await createRoutePlan(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });

  describe('listRoutePlans', () => {
    it('returns plans sorted by createdAt desc', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const plans = [{ _id: 'p1' }, { _id: 'p2' }];

      const { findStub, sortStub } = stubFindSort(plans);

      const req = { user: { id: userId } };
      const res = makeRes();

      await listRoutePlans(req, res);

      expect(findStub.calledOnceWith({ userId })).to.be.true;
      expect(sortStub.calledOnceWith({ createdAt: -1 })).to.be.true;
      expect(res.json.calledWith(plans)).to.be.true;
    });

    it('500 on error', async () => {
      const findStub = sinon.stub(RoutePlan, 'find').throws(new Error('DB Error'));
      const req = { user: { id: 'u' } };
      const res = makeRes();

      await listRoutePlans(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

      findStub.restore();
    });
  });

  describe('getRoutePlan', () => {
    it('returns a plan', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const id = new mongoose.Types.ObjectId().toString();
      const plan = { _id: id, userId };

      const findOneStub = sinon.stub(RoutePlan, 'findOne').resolves(plan);

      const req = { user: { id: userId }, params: { id } };
      const res = makeRes();

      await getRoutePlan(req, res);

      expect(findOneStub.calledOnceWith({ _id: id, userId })).to.be.true;
      expect(res.json.calledWith(plan)).to.be.true;
    });

    it('404 when not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(RoutePlan, 'findOne').resolves(null);

      const req = { user: { id: userId }, params: { id } };
      const res = makeRes();

      await getRoutePlan(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Route plan not found' })).to.be.true;
    });

    it('500 on error', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(RoutePlan, 'findOne').throws(new Error('DB Error'));

      const req = { user: { id: 'u' }, params: { id } };
      const res = makeRes();

      await getRoutePlan(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });

  describe('deleteRoutePlan', () => {
    it('deletes a plan', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const id = new mongoose.Types.ObjectId().toString();

      const planDoc = { deleteOne: sinon.stub().resolves() };
      const findOneStub = sinon.stub(RoutePlan, 'findOne').resolves(planDoc);

      const req = { user: { id: userId }, params: { id } };
      const res = makeRes();

      await deleteRoutePlan(req, res);

      expect(findOneStub.calledOnceWith({ _id: id, userId })).to.be.true;
      expect(planDoc.deleteOne.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'Route plan deleted' })).to.be.true;
    });

    it('404 when not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(RoutePlan, 'findOne').resolves(null);

      const req = { user: { id: 'u' }, params: { id } };
      const res = makeRes();

      await deleteRoutePlan(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Route plan not found' })).to.be.true;
    });

    it('500 on error', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(RoutePlan, 'findOne').throws(new Error('DB Error'));

      const req = { user: { id: 'u' }, params: { id } };
      const res = makeRes();

      await deleteRoutePlan(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });
});
