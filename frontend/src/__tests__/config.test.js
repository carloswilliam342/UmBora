import config, { API_URL } from '../config';

describe('Config', () => {
  it('deve exportar API_URL corretamente', () => {
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
  });

  it('deve ter API_URL como exportação default também', () => {
    expect(config.API_URL).toBe(API_URL);
  });
});
