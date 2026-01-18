-- Script para verificar motoristas cadastrados e atualizar suas coordenadas

-- 1. Ver todos os motoristas cadastrados
SELECT 
  d.id,
  u.name,
  d.cnh,
  d.current_latitude,
  d.current_longitude,
  d.is_available,
  d.rating,
  d.status
FROM drivers d
INNER JOIN users u ON d.user_id = u.id;

-- 2. Ver veículos associados aos motoristas
SELECT 
  v.id,
  v.driver_id,
  v.modelo,
  v.placa,
  v.cor
FROM vehicles v;

-- 3. Atualizar um motorista para aparecer no mapa
-- IMPORTANTE: Substitua o ID pelo ID do seu motorista
-- Exemplo de coordenadas: São Paulo (-23.5505, -46.6333)

UPDATE drivers 
SET 
  current_latitude = -23.5505,    -- Latitude (substitua pela sua localização)
  current_longitude = -46.6333,   -- Longitude (substitua pela sua localização)
  is_available = true,            -- Motorista disponível
  rating = 4.8                    -- Avaliação
WHERE id = 1;  -- Substitua pelo ID do motorista que você quer atualizar

-- 4. Verificar se a atualização funcionou
SELECT 
  d.id,
  u.name,
  v.modelo,
  v.placa,
  d.current_latitude,
  d.current_longitude,
  d.is_available,
  d.rating
FROM drivers d
INNER JOIN users u ON d.user_id = u.id
LEFT JOIN vehicles v ON v.driver_id = d.id
WHERE d.id = 1;  -- Substitua pelo ID do motorista
