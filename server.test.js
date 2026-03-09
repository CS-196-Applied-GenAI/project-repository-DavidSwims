const request = require('supertest');
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
});
