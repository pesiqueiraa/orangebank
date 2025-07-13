const mockDb = {
  query: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }))
};

module.exports = mockDb;