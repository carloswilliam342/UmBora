# Guia de Testes no Postman - Sistema de Caronas

## 🚀 Configuração Inicial

### 1. Certifique-se que o Backend está Rodando

```bash
cd backend
npm start
```

O servidor deve estar rodando em: `http://localhost:3000`

---

## 📋 Testes dos Endpoints

### 1. POST - Cadastrar Nova Carona

**URL:** `http://localhost:3000/api/rides/create`

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "driverId": 1,
  "origin": {
    "address": "Av. Paulista, 1000 - São Paulo, SP",
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "destination": {
    "address": "Av. Faria Lima, 2000 - São Paulo, SP",
    "latitude": -23.5689,
    "longitude": -46.6890
  },
    "departureTime": "2026-01-20T08:00:00Z",
    "availableSeats": 3,
    "pricePerSeat": 15.00
}
```

**Resposta Esperada (201):**
```json
{
  "success": true,
  "message": "Carona cadastrada com sucesso!",
  "rideId": 1
}
```

**Possíveis Erros:**
- `400`: Campos obrigatórios faltando
- `500`: Erro no servidor (verificar se driverId existe)

---

### 2. GET - Listar Caronas de um Motorista

**URL:** `http://localhost:3000/api/rides/driver/1`

**Método:** `GET`

**Resposta Esperada (200):**
```json
{
  "success": true,
  "rides": [
    {
      "id": 1,
      "origin": {
        "address": "Av. Paulista, 1000 - São Paulo, SP",
        "latitude": -23.5505,
        "longitude": -46.6333
      },
      "destination": {
        "address": "Av. Faria Lima, 2000 - São Paulo, SP",
        "latitude": -23.5689,
        "longitude": -46.689
      },
      "departureTime": "2026-01-20T08:00:00.000Z",
      "availableSeats": 3,
      "pricePerSeat": 15,
      "status": "available",
      "createdAt": "2026-01-18T21:00:00.000Z"
    }
  ]
}
```

---

### 3. GET - Buscar Caronas Disponíveis Próximas

**URL:** `http://localhost:3000/api/rides/available?lat=-23.5505&lng=-46.6333&radius=10`

**Método:** `GET`

**Query Parameters:**
- `lat`: -23.5505 (latitude do passageiro)
- `lng`: -46.6333 (longitude do passageiro)
- `radius`: 10 (raio em km, opcional, padrão 10)

**Resposta Esperada (200):**
```json
{
  "success": true,
  "count": 1,
  "rides": [
    {
      "id": 1,
      "driver": {
        "name": "Carlos",
        "rating": 4.8,
        "vehicle": {
          "model": "Fiat Uno",
          "plate": "ABC-1234",
          "color": "Vermelho"
        }
      },
      "origin": {
        "address": "Av. Paulista, 1000 - São Paulo, SP",
        "latitude": -23.5505,
        "longitude": -46.6333
      },
      "destination": {
        "address": "Av. Faria Lima, 2000 - São Paulo, SP",
        "latitude": -23.5689,
        "longitude": -46.689
      },
      "departureTime": "2026-01-20T08:00:00.000Z",
      "availableSeats": 3,
      "pricePerSeat": 15,
      "distance": "2.15"
    }
  ]
}
```

---

### 4. PUT - Atualizar Carona

**URL:** `http://localhost:3000/api/rides/1`

**Método:** `PUT`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON) - Exemplo 1: Atualizar Horário:**
```json
{
  "departureTime": "2026-01-20T09:00:00Z"
}
```

**Body (JSON) - Exemplo 2: Atualizar Vagas e Preço:**
```json
{
  "availableSeats": 2,
  "pricePerSeat": 20.00
}
```

**Body (JSON) - Exemplo 3: Mudar Status:**
```json
{
  "status": "in_progress"
}
```

**Resposta Esperada (200):**
```json
{
  "success": true,
  "message": "Carona atualizada com sucesso"
}
```

---

### 5. DELETE - Cancelar Carona

**URL:** `http://localhost:3000/api/rides/1`

**Método:** `DELETE`

**Resposta Esperada (200):**
```json
{
  "success": true,
  "message": "Carona cancelada com sucesso"
}
```

**Nota:** Isso não deleta a carona do banco, apenas muda o status para 'cancelled'.

---

## 🧪 Sequência de Testes Recomendada

### Teste Completo Passo a Passo:

1. **Verificar se há motoristas no banco:**
   ```bash
   cd backend
   node scripts/check_drivers.js
   ```
   - Anote o `driverId` (ex: 1)

2. **Cadastrar primeira carona (Postman):**
   - POST `/api/rides/create`
   - Use o `driverId` do passo 1
   - Anote o `rideId` retornado

3. **Listar caronas do motorista:**
   - GET `/api/rides/driver/1`
   - Deve retornar a carona cadastrada

4. **Buscar caronas disponíveis:**
   - GET `/api/rides/available?lat=-23.5505&lng=-46.6333&radius=10`
   - Deve retornar a carona se estiver próxima

5. **Atualizar a carona:**
   - PUT `/api/rides/1`
   - Altere o número de vagas ou preço

6. **Verificar atualização:**
   - GET `/api/rides/driver/1`
   - Confirme que os dados foram atualizados

7. **Cancelar a carona:**
   - DELETE `/api/rides/1`

8. **Verificar cancelamento:**
   - GET `/api/rides/driver/1`
   - Status deve estar como 'cancelled'

---

## 📊 Verificar no Banco de Dados

Após os testes, você pode verificar diretamente no banco:

```sql
-- Ver todas as caronas
SELECT * FROM rides;

-- Ver caronas com detalhes do motorista
SELECT 
  r.*,
  u.name as driver_name,
  v.modelo as vehicle_model
FROM rides r
INNER JOIN drivers d ON r.driver_id = d.id
INNER JOIN users u ON d.user_id = u.id
LEFT JOIN vehicles v ON v.driver_id = d.id;

-- Ver apenas caronas disponíveis
SELECT * FROM rides WHERE status = 'available';

-- Ver caronas futuras
SELECT * FROM rides WHERE departure_time > NOW();
```

---

## 🔧 Troubleshooting

### Erro: "driverId não encontrado"
**Solução:** Certifique-se que o motorista existe:
```bash
node backend/scripts/check_drivers.js
```

### Erro: "Campos obrigatórios faltando"
**Solução:** Verifique se o JSON está completo:
- `driverId` ✓
- `origin` (com address, latitude, longitude) ✓
- `destination` (com address, latitude, longitude) ✓
- `departureTime` ✓
- `availableSeats` ✓

### Carona não aparece na busca
**Possíveis causas:**
1. Status não é 'available'
2. Horário de partida já passou
3. Está fora do raio de busca
4. Coordenadas incorretas

---

## 💡 Dicas para o Postman

### Criar uma Collection

1. Abra o Postman
2. Clique em "New Collection"
3. Nome: "UmBora - Sistema de Caronas"
4. Adicione todas as 5 requisições acima

### Usar Variáveis

Crie variáveis de ambiente:
- `base_url`: `http://localhost:3000`
- `driver_id`: `1`
- `ride_id`: `1`

Então use: `{{base_url}}/api/rides/create`

### Salvar Exemplos

Para cada endpoint, salve exemplos de:
- Requisição bem-sucedida
- Requisição com erro
- Diferentes cenários

---

## 📝 Exemplos de Dados para Testes

### Carona 1: São Paulo → Campinas
```json
{
  "driverId": 1,
  "origin": {
    "address": "Av. Paulista, 1000 - São Paulo, SP",
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "destination": {
    "address": "Centro - Campinas, SP",
    "latitude": -22.9099,
    "longitude": -47.0626
  },
  "departureTime": "2026-01-21T07:00:00Z",
  "availableSeats": 4,
  "pricePerSeat": 25.00
}
```

### Carona 2: Carona Gratuita
```json
{
  "driverId": 1,
  "origin": {
    "address": "Shopping Iguatemi - São Paulo, SP",
    "latitude": -23.5676,
    "longitude": -46.6897
  },
  "destination": {
    "address": "USP - São Paulo, SP",
    "latitude": -23.5558,
    "longitude": -46.7319
  },
  "departureTime": "2026-01-22T18:00:00Z",
  "availableSeats": 2,
  "pricePerSeat": 0
}
```

---

## ✅ Checklist de Testes

- [ ] Backend rodando em localhost:3000
- [ ] Motorista existe no banco (driverId válido)
- [ ] POST /create - Cadastrar carona
- [ ] GET /driver/:id - Listar caronas do motorista
- [ ] GET /available - Buscar caronas próximas
- [ ] PUT /:id - Atualizar carona
- [ ] DELETE /:id - Cancelar carona
- [ ] Verificar dados no banco de dados
- [ ] Testar com diferentes coordenadas
- [ ] Testar com diferentes horários
- [ ] Testar validações de erro

---

Pronto! Com este guia você consegue testar todos os endpoints do sistema de caronas no Postman! 🚀
