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
  "description": "Recorrido entre miradores y viñedos con vistas al río Sil.",
  "url_image": [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
  ]
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
  "difficulty": "difícil",
  "url_image": []
}
```

`url_image` es opcional y es una lista de URLs HTTP/HTTPS. Enviar `[]` elimina todas las imágenes del registro; las respuestas devuelven el array `url_image` directamente.

---

### 5. Eliminar ruta
- **Método**: `DELETE`
- **URL**: `http://localhost:3000/api/routes/60d5ec49f1b2c81234567890`
