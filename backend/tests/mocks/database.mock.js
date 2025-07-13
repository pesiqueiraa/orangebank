const mockDb = {
  query: jest.fn().mockImplementation((query) => {
    // Default implementation
    return { rows: [] };
  }),
  getClient: jest.fn().mockImplementation(() => {
    return {
      query: jest.fn().mockImplementation((query) => {
        if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
          return Promise.resolve();
        }
        return Promise.resolve({ rows: [] });
      }),
      release: jest.fn()
    };
  })
};

module.exports = mockDb;