import axios from 'axios';
import { searchAddress, reverseGeocode } from '../geocodingService';

jest.mock('axios');

describe('Geocoding Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchAddress', () => {
    it('deve retornar array vazio se a query for muito curta', async () => {
      const result = await searchAddress('ab');
      expect(result).toEqual([]);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('deve retornar resultados formatados quando a chamada for bem-sucedida', async () => {
      const mockResponse = {
        data: [
          {
            display_name: 'Rua das Flores, São Paulo',
            lat: '-23.55052',
            lon: '-46.633308',
            type: 'residential',
            address: {
              city: 'São Paulo',
              state: 'SP',
              country: 'Brasil'
            }
          }
        ]
      };
      
      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchAddress('Rua das Flores');
      
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/search'), expect.any(Object));
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        displayName: 'Rua das Flores, São Paulo',
        address: 'Rua das Flores, São Paulo',
        latitude: -23.55052,
        longitude: -46.633308,
        type: 'residential',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil'
      });
    });

    it('deve retornar array vazio em caso de erro na API', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await searchAddress('Rua das Flores');
      
      expect(result).toEqual([]);
      
      consoleSpy.mockRestore();
    });
  });

  describe('reverseGeocode', () => {
    it('deve retornar o endereço formatado quando a chamada for bem-sucedida', async () => {
      const mockResponse = {
        data: {
          display_name: 'Av Paulista, São Paulo',
          lat: '-23.561',
          lon: '-46.656',
          address: {
            city: 'São Paulo',
            state: 'SP',
            country: 'Brasil'
          }
        }
      };
      
      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await reverseGeocode(-23.561, -46.656);
      
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/reverse'), expect.any(Object));
      expect(result).toEqual({
        displayName: 'Av Paulista, São Paulo',
        address: 'Av Paulista, São Paulo',
        latitude: -23.561,
        longitude: -46.656,
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil'
      });
    });

    it('deve retornar null em caso de erro na API', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await reverseGeocode(-23.561, -46.656);
      
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });
});
