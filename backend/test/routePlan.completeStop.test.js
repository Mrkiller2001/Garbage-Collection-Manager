const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const { expect } = chai;

const Bin = require('../models/Bin');
const RoutePlan = require('../models/RoutePlan');
const { completeStop } = require('../controllers/routePlanController');

function makeRes() {
  return { status: sinon.stub().returnsThis(), json: sinon.spy() };
}

describe('RoutePlan completeStop - Ticket 5.1', () => {
  afterEach(() => sinon.restore());

  it('marks stop serviced, resets bin, and completes route if all done', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const routeId = new mongoose.Types.ObjectId().toString();
    const binId1 = new mongoose.Types.ObjectId().toString();
    const binId2 = new mongoose.Types.ObjectId().toString();

    const planDoc = {
      _id: routeId,
      userId,
      status: 'planned',
      stops: [
        { binId: binId1, name: 'A', location: { lat:0, lng:0 }, distanceFromPrevKm: 1, servicedAt: new Date() }, // already done
        { binId: binId2, name: 'B', location: { lat:0, lng:1 }, distanceFromPrevKm: 2 } // to be done
      ],
      save: sinon.stub().resolvesThis()
    };

    const binDoc = {
      _id: binId2,
      userId,
      latestFillPct: 80,
      status: 'needs_pickup',
      latestReadingAt: null,
      save: sinon.stub().resolvesThis()
    };

    sinon.stub(RoutePlan, 'findOne').resolves(planDoc);
    sinon.stub(Bin, 'findOne').resolves(binDoc);

    const req = { user: { id: userId }, params: { id: routeId, binId: binId2 } };
    const res = makeRes();

    await completeStop(req, res);

    // stop updated
    const stop = planDoc.stops[1];
    expect(!!stop.servicedAt).to.be.true;

    // bin reset
    expect(binDoc.latestFillPct).to.equal(0);
    expect(binDoc.status).to.equal('normal');
    expect(!!binDoc.latestReadingAt).to.be.true;

    // route completed since all stops now serviced
    expect(planDoc.status).to.equal('completed');
    expect(planDoc.save.calledOnce).to.be.true;
    expect(binDoc.save.calledOnce).to.be.true;

    expect(res.status.called).to.be.false;
    expect(res.json.calledOnce).to.be.true;
  });

  it('404 when plan not found', async () => {
    sinon.stub(RoutePlan, 'findOne').resolves(null);
    const req = { user: { id: 'u' }, params: { id: 'r', binId: 'b' } };
    const res = makeRes();

    await completeStop(req, res);
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Route plan not found' })).to.be.true;
  });

  it('404 when stop not found', async () => {
    const planDoc = { _id: 'r', userId: 'u', stops: [], save: sinon.stub().resolvesThis() };
    sinon.stub(RoutePlan, 'findOne').resolves(planDoc);

    const req = { user: { id: 'u' }, params: { id: 'r', binId: new mongoose.Types.ObjectId().toString() } };
    const res = makeRes();

    await completeStop(req, res);
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Stop not found in this route' })).to.be.true;
  });

  it('idempotent if stop already serviced', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const routeId = new mongoose.Types.ObjectId().toString();
    const binId = new mongoose.Types.ObjectId().toString();

    const planDoc = {
      _id: routeId,
      userId,
      status: 'completed',
      stops: [{ binId, servicedAt: new Date(), location:{lat:0,lng:0}, name:'A', distanceFromPrevKm:1 }],
      save: sinon.stub().resolvesThis()
    };

    const findPlan = sinon.stub(RoutePlan, 'findOne').resolves(planDoc);
    const findBin = sinon.stub(Bin, 'findOne'); // should not be called

    const req = { user: { id: userId }, params: { id: routeId, binId } };
    const res = makeRes();

    await completeStop(req, res);

    expect(findPlan.calledOnce).to.be.true;
    expect(findBin.called).to.be.false; // no reset on already serviced
    expect(res.json.calledOnce).to.be.true;
  });

  it('500 on error', async () => {
    sinon.stub(RoutePlan, 'findOne').throws(new Error('DB Error'));
    const req = { user: { id: 'u' }, params: { id: 'r', binId: 'b' } };
    const res = makeRes();

    await completeStop(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});
