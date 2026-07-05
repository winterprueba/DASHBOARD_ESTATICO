# Tablero LISA GeoJSON con Leaflet y GitHub Pages

Este proyecto es una version estatica del tablero. No usa Python ni servidor backend, por lo que puede publicarse en GitHub Pages.

## Estructura

```text
.
|-- index.html
|-- css/
|   `-- style.css
|-- js/
|   `-- map.js
|-- data/
|   `-- *.geojson
|-- .nojekyll
`-- README.md
```

Los GeoJSON se dejan separados por ciudad e indicador para que el navegador cargue solo la capa seleccionada. Esto es mas liviano que combinar todos los indicadores de una ciudad en un unico archivo.

## Ver localmente

Abre una terminal dentro de esta carpeta y ejecuta:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://localhost:8000
```

Si abres `index.html` con doble clic, el navegador puede bloquear la carga de archivos GeoJSON por restricciones de seguridad.

## Subir a GitHub Pages

1. Sube todos estos archivos al repositorio.
2. En GitHub entra al repositorio.
3. Ve a **Settings > Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/root`.
6. Guarda.
7. Espera unos minutos hasta que GitHub genere la URL publica.

## Actualizar capas

Si agregas nuevos GeoJSON, copialos en `data/` y agrega una entrada en el arreglo `DATASETS` dentro de `js/map.js`.
