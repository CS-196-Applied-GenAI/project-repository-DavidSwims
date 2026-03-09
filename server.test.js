const request = require('supertest');
jest.mock('./db', () => ({
  pool: {},
  testConnection: jest.fn(),
}));
const db = require('./db');
const { app, server } = require('./server');

describe('server.js', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /', () => {
    it('returns 200 with server status message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Server is running' });
    });
  });

  describe('GET /api/health', () => {
    it('returns 200 when DB connection succeeds', async () => {
      db.testConnection.mockResolvedValue({ success: true, result: 2 });
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', database: 'connected' });
    });

    it('returns 500 when DB connection fails', async () => {
      db.testConnection.mockRejectedValue(new Error('Connection refused'));
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ status: 'error', database: 'disconnected' });
    });
  });
});
