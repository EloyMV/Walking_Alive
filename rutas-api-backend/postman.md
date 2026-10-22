# Ejemplos de Peticiones HTTP

Puedes importar las siguientes peticiones en Postman o probar con `curl`.

### 1. Obtener todas las rutas
- **Método**: `GET`
- **URL**: `http://localhost:3000/api/routes`

---

### 2. Obtener una ruta por ID
- **Método**: `GET`
- **URL**: `http://localhost:3000/api/routes/60d5ec49f1b2c81234567890`

---

### 3. Crear nueva ruta
- **Método**: `POST`
- **URL**: `http://localhost:3000/api/routes`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "title": "Ruta de los Cañones del Sil",
  "location": "Ribeira Sacra (Ourense/Lugo)",
  "distanceKm": 14.2,
  "difficulty": "moderada",
  "description": "Recorrido entre miradores y viñedos con vistas al río Sil."
}
```

---

### 4. Actualizar ruta
- **Método**: `PATCH`
- **URL**: `http://localhost:3000/api/routes/60d5ec49f1b2c81234567890`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "distanceKm": 15.0,
  "difficulty": "difícil"
}
```

---

### 5. Eliminar ruta
- **Método**: `DELETE`
- **URL**: `http://localhost:3000/api/routes/60d5ec49f1b2c81234567890`
