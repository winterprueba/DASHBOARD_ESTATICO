# Tablero LISA GeoJSON con Leaflet y GitHub Pages v1.2.4

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
|   |-- *.geojson
|   `-- fase4/
|       `-- *.geojson
|-- .nojekyll
`-- README.md
```

Los GeoJSON se dejan separados por ciudad, fase y tipo de analisis para que el navegador cargue solo la capa seleccionada. Esto es mas liviano que combinar todos los indicadores de una ciudad en un unico archivo.

## Cambios v1.2.4

- Se agregaron 36 capas nuevas de fase 4 en `data/fase4/`.
- Se agrego filtro de coleccion/fase.
- Se agrego filtro de tipo de analisis.
- Se agrego filtro dinamico por campo de categoria.
- El color recomendado usa `lisa_color`, `categoria_color` o `cluster_color` cuando el GeoJSON los trae.
- Los controles de p-value se ocultan en capas que no tienen `p_value`.

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

Si agregas nuevos GeoJSON, copialos en `data/` o en una subcarpeta y agrega una entrada en el arreglo `DATASETS` dentro de `js/map.js`.
