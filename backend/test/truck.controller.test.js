const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { expect } = chai;

const Truck = require('../models/Truck');
const { getTrucks, getTruck, addTruck, updateTruck, deleteTruck } = require('../controllers/truckController');

function makeRes() { return { status: sinon.stub().returnsThis(), json: sinon.spy() }; }
function stubFindChain(resultArray) {
  const sortStub = sinon.stub().returns(resultArray);
  const findStub = sinon.stub(Truck, 'find').returns({ sort: sortStub });
  return { findStub, sortStub };
}

describe('Truck Controller - Ticket 5.1', () => {
  afterEach(() => sinon.restore());

  describe('addTruck', () => {
    it('creates a truck', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const req = { user: { id: userId }, body: {
        name: 'Truck 1', plateNumber: 'ABC-123', capacityLitres: 5000, fuelType: 'diesel'
      }};
      const created = { _id: new mongoose.Types.ObjectId(), ...req.body, userId };
      const createStub = sinon.stub(Truck, 'create').resolves(created);

      const res = makeRes();
      await addTruck(req, res);

      expect(createStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(created)).to.be.true;
    });

    it('400 on duplicate plate', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      sinon.stub(Truck, 'create').throws({ code: 11000 });
      const req = { user: { id: userId }, body: { plateNumber: 'DUP', capacityLitres: 100 } };
      const res = makeRes();

      await addTruck(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('500 on error', async () => {
      sinon.stub(Truck, 'create').throws(new Error('DB Error'));
      const req = { user: { id: 'u' }, body: { plateNumber: 'X', capacityLitres: 100 } };
      const res = makeRes();
      await addTruck(req, res);
      expect(res.status.calledWith(500)).to.be.true;
    });
  });

  describe('getTrucks', () => {
    it('returns list with sort', async () => {
      const { findStub, sortStub } = stubFindChain([{ _id: 't1' }]);
      const req = { user: { id: 'u' }, query: {} };
      const res = makeRes();

      await getTrucks(req, res);

      expect(findStub.calledOnce).to.be.true;
      expect(sortStub.calledOnceWith({ createdAt: -1 })).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });

    it('500 on error', async () => {
      const findStub = sinon.stub(Truck, 'find').throws(new Error('DB Error'));
      const req = { user: { id: 'u' }, query: {} };
      const res = makeRes();
      await getTrucks(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      findStub.restore();
    });
  });

  describe('getTruck', () => {
    it('returns one', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const doc = { _id: id };
      const findOneStub = sinon.stub(Truck, 'findOne').resolves(doc);
      const req = { user: { id: 'u' }, params: { id } };
      const res = makeRes();

      await getTruck(req, res);
      expect(findOneStub.calledOnce).to.be.true;
      expect(res.json.calledWith(doc)).to.be.true;
    });

    it('404 when not found', async () => {
      sinon.stub(Truck, 'findOne').resolves(null);
      const req = { user: { id: 'u' }, params: { id: 'x' } };
      const res = makeRes();

      await getTruck(req, res);
      expect(res.status.calledWith(404)).to.be.true;
    });

    it('500 on error', async () => {
      sinon.stub(Truck, 'findOne').throws(new Error('DB Error'));
      const req = { user: { id: 'u' }, params: { id: 'x' } };
      const res = makeRes();

      await getTruck(req, res);
      expect(res.status.calledWith(500)).to.be.true;
    });
  });

  describe('updateTruck', () => {
    it('updates fields', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const doc = { _id: id, save: sinon.stub().resolvesThis(), name: 'Old', capacityLitres: 100 };
      const findOneStub = sinon.stub(Truck, 'findOne').resolves(doc);

      const req = { user: { id: 'u' }, params: { id }, body: { name: 'New', capacityLitres: 200 } };
      const res = makeRes();

      await updateTruck(req, res);

      expect(findOneStub.calledOnce).to.be.true;
      expect(doc.name).to.equal('New');
      expect(doc.capacityLitres).to.equal(200);
      expect(doc.save.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });

    it('404 when missing', async () => {
      sinon.stub(Truck, 'findOne').resolves(null);
      const req = { user: { id: 'u' }, params: { id: 'x' }, body: {} };
      const res = makeRes();

      await updateTruck(req, res);
      expect(res.status.calledWith(404)).to.be.true;
    });

    it('400 on duplicate plate', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const doc = { _id: id, save: sinon.stub().throws({ code: 11000 }) };
      sinon.stub(Truck, 'findOne').resolves(doc);
      const req = { user: { id: 'u' }, params: { id }, body: { plateNumber: 'DUP' } };
      const res = makeRes();

      await updateTruck(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('500 on error', async () => {
      sinon.stub(Truck, 'findOne').throws(new Error('DB Error'));
      const req = { user: { id: 'u' }, params: { id: 'x' }, body: {} };
      const res = makeRes();

      await updateTruck(req, res);
      expect(res.status.calledWith(500)).to.be.true;
    });
  });

  describe('deleteTruck', () => {
    it('deletes', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const doc = { _id: id, deleteOne: sinon.stub().resolves() };
      const findOneStub = sinon.stub(Truck, 'findOne').resolves(doc);
      const req = { user: { id: 'u' }, params: { id } };
      const res = makeRes();

      await deleteTruck(req, res);
      expect(findOneStub.calledOnce).to.be.true;
      expect(doc.deleteOne.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'Truck deleted' })).to.be.true;
    });

    it('404 when not found', async () => {
      sinon.stub(Truck, 'findOne').resolves(null);
      const req = { user: { id: 'u' }, params: { id: 'x' } };
      const res = makeRes();

      await deleteTruck(req, res);
      expect(res.status.calledWith(404)).to.be.true;
    });

    it('500 on error', async () => {
      sinon.stub(Truck, 'findOne').throws(new Error('DB Error'));
      const req = { user: { id: 'u' }, params: { id: 'x' } };
      const res = makeRes();

      await deleteTruck(req, res);
      expect(res.status.calledWith(500)).to.be.true;
    });
  });
});
