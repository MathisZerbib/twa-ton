const request = require('supertest');
const { app, httpServer } = require('../index');

describe('TON-Eats API — Uber Eats / Deliveroo Style Backend', () => {

  afterAll((done) => {
    if (httpServer && httpServer.listening) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  describe('GET /api/merchants', () => {
    it('should return 3 restaurants', async () => {
      const res = await request(app).get('/api/merchants');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('each merchant should have a valid TON wallet and a menu', async () => {
      const res = await request(app).get('/api/merchants');
      res.body.forEach(merchant => {
        expect(merchant.merchantWallet).toMatch(/^0Q[A-Za-z0-9_-]{46}/);
        expect(Array.isArray(merchant.products)).toBeTruthy();
        expect(merchant.products.length).toBeGreaterThan(0);
      });
    });

    it('Pizza Paradiso should have a unique address', async () => {
      const res = await request(app).get('/api/merchants');
      const pizza = res.body.find(m => m.name === 'Pizza Paradiso');
      expect(pizza).toBeDefined();
      expect(pizza.merchantWallet).toBe('0QB_sD5qN82kKGIuhIlEtHLXPdvf6fjGt7KUrAmW6IcJS7X3');
    });
  });

  describe('GET /api/prices', () => {
    it('should return a fallback price object', async () => {
      const res = await request(app).get('/api/prices/ton-usdt');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('priceUsd');
    });
  });
});
