const mockQuery = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    query: mockQuery,
  })),
}));

const mysql = require('mysql2/promise');

describe('db.js', () => {
  beforeEach(() => {
    jest.resetModules();
    mockQuery.mockReset();
  });

  describe('testConnection', () => {
    it('returns result when pool query succeeds', async () => {
      mockQuery.mockResolvedValue([[{ result: 2 }]]);

      const { testConnection } = require('./backend/db');
      const result = await testConnection();

      expect(result).toEqual({ success: true, result: 2 });
      expect(mockQuery).toHaveBeenCalledWith('SELECT 1 + 1 AS result');
    });

    it('throws when connection fails (covers error-handling branch)', async () => {
      mockQuery.mockRejectedValue(new Error('Connection refused'));

      const { testConnection } = require('./backend/db');

      await expect(testConnection()).rejects.toThrow('Connection refused');
    });

    it('uses default config when env vars are missing', async () => {
      const originalEnv = { ...process.env };
      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;
      delete process.env.DB_PORT;
      jest.resetModules();
      jest.doMock('dotenv', () => ({ config: jest.fn() }));

      mysql.createPool.mockImplementation((config) => {
        expect(config.host).toBe('localhost');
        expect(config.user).toBe('root');
        expect(config.database).toBe('twitter_clone');
        return { query: mockQuery };
      });
      mockQuery.mockResolvedValue([[{ result: 2 }]]);

      const { testConnection } = require('./backend/db');
      const result = await testConnection();
      expect(result).toEqual({ success: true, result: 2 });

      Object.assign(process.env, originalEnv);
    });
  });
});
