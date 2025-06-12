# Guía de Estilos - ClinicLink Frontend

## 🎨 Paleta de Colores

### Colores Principales
- **Color Primario**: `#009688` (Teal)
- **Color Secundario**: `#42a5b6` (Teal claro)
- **Color de Acento**: `#00bcd4` (Cyan)

### Colores de Fondo
- **Fondo Principal**: `#e0e0e0` (Gris claro)
- **Fondo de Contenido**: `#f5f5f5` (Gris muy claro)
- **Fondo de Tarjetas**: `#ffffff` (Blanco)
- **Fondo de Login**: `linear-gradient(135deg, #009688, #42a5b6)`

### Colores de Estado
- **Éxito**: `#4caf50` (Verde)
- **Error/Peligro**: `#f44336` / `#dc3545` (Rojo)
- **Advertencia**: `#ff9800` (Naranja)
- **Información**: `#0277bd` (Azul)

### Colores de Texto
- **Texto Principal**: `#333333`
- **Texto Secundario**: `#666666`
- **Texto en Inputs**: `#495057`
- **Texto Claro**: `#78909c`

## 📝 Tipografía

### Fuentes
- **Fuente Principal**: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- **Fuente Alternativa**: `Arial, sans-serif`

### Tamaños de Fuente
- **Títulos Principales (h1)**: `26px` - `28px`
- **Títulos Secundarios (h2)**: `20px` - `24px`
- **Texto de Navegación**: `15px`
- **Texto de Formularios**: `16px`
- **Texto Base**: `1rem` (16px)
- **Texto Pequeño**: `12px` - `14px`

### Pesos de Fuente
- **Normal**: `400`
- **Medio**: `500`
- **Semi-bold**: `600`
- **Bold**: `700`

## 🧩 Componentes

### Navegación
```css
.nav-container {
  background-color: #009688;
  width: 350px;
  height: 100vh;
  color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.nav-link {
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.05));
}

.nav-link:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  transform: translateX(8px);
}
```

### Botones

#### Botón Primario
```css
.btn-primary {
  background-color: #009688;
  border-color: #009688;
  color: white;
  font-weight: 500;
  height: 50px;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}
```

#### Botón de Éxito
```css
.btn-iniciar {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}
```

#### Botón de Peligro
```css
.btn-anular {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}
```

### Formularios

#### Campos de Entrada
```css
.form-control {
  width: 100%;
  height: 50px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  color: #495057;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #009688;
}
```

#### Etiquetas
```css
.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
  font-size: 16px;
}
```

### Tarjetas

#### Tarjeta Base
```css
.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s, transform 0.2s;
  margin-bottom: 20px;
  border: none;
}

.card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

#### Encabezado de Tarjeta
```css
.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 15px 20px;
}

.card-title {
  color: #333;
  font-weight: 600;
  font-size: 1.1rem;
}
```

### Alertas

#### Alerta de Error
```css
.alert-danger {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  padding: 15px;
}
```

#### Alerta de Éxito
```css
.alert-success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}
```

#### Alerta de Información
```css
.alert-info {
  background-color: #e3f2fd;
  color: #0277bd;
  border: 1px solid #bbdefb;
}
```

## 📐 Espaciado y Layout

### Márgenes y Padding
- **Espaciado Pequeño**: `10px`
- **Espaciado Medio**: `15px` - `20px`
- **Espaciado Grande**: `25px` - `30px`
- **Padding de Contenido**: `20px` - `30px`
- **Padding de Formularios**: `0.75rem 1.25rem`

### Dimensiones
- **Ancho de Navegación**: `350px`
- **Altura de Elementos de Formulario**: `50px`
- **Radio de Borde**: `4px` - `12px`
- **Radio de Borde de Tarjetas**: `8px` - `25px`

## 🎭 Efectos y Transiciones

### Sombras
```css
/* Sombra suave */
box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

/* Sombra media */
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

/* Sombra pronunciada */
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
```

### Transiciones
```css
/* Transición estándar */
transition: all 0.3s ease;

/* Transición suave */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Transición específica */
transition: border-color 0.3s, background-color 0.3s;
```

### Gradientes
```css
/* Gradiente principal */
background: linear-gradient(135deg, #009688, #42a5b6);

/* Gradiente de navegación */
background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: `> 1024px`
- **Tablet**: `768px - 1024px`
- **Mobile**: `< 768px`
- **Small Mobile**: `< 480px`

### Navegación Responsive
```css
/* Tablet */
@media (max-width: 1024px) {
  .nav-container {
    width: 280px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .nav-container {
    width: 100%;
    height: 160px;
    position: fixed;
    top: 0;
  }
}
```

## 🔧 Tecnologías Utilizadas

- **Framework**: Angular 19.2.0
- **CSS Framework**: Bootstrap 5.3.6
- **Iconos**: Bootstrap Icons 1.13.1
- **Preprocesador**: CSS nativo
- **Metodología**: Component-based styling

## 📋 Convenciones de Nomenclatura

### Clases CSS
- **Componentes**: `.component-name`
- **Estados**: `.active`, `.hover`, `.disabled`
- **Modificadores**: `.btn-primary`, `.card-header`
- **Utilidades**: `.text-center`, `.mb-20`

### Estructura de Archivos
- Cada componente tiene su propio archivo CSS
- Estilos globales en `src/styles.css`
- Configuración de Bootstrap en `angular.json`

## 🎨 Ejemplos de Uso

### Estructura HTML Típica
```html
<div class="content-header">
  <h2>Título de la Sección</h2>
</div>

<div class="content-body">
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Título de la Tarjeta</h3>
    </div>
    <div class="card-body">
      <form>
        <div class="form-group">
          <label for="input1">Etiqueta del Campo</label>
          <input type="text" class="form-control" id="input1">
        </div>
        <button type="submit" class="btn btn-primary">Enviar</button>
      </form>
    </div>
  </div>
</div>
```

### Implementación de Alertas
```html
<div class="alert alert-success">
  <i class="bi bi-check-circle"></i>
  Operación realizada con éxito
</div>

<div class="alert alert-danger">
  <i class="bi bi-exclamation-triangle"></i>
  Error en la operación
</div>
```

### Botones con Iconos
```html
<button class="btn btn-primary">
  <i class="bi bi-plus"></i>
  Agregar Nuevo
</button>

<button class="btn btn-iniciar">
  <i class="bi bi-play"></i>
  Iniciar
</button>

<button class="btn btn-anular">
  <i class="bi bi-x"></i>
  Cancelar
</button>
```

## 📚 Recursos Adicionales

### Iconos Bootstrap
- **Documentación**: [Bootstrap Icons](https://icons.getbootstrap.com/)
- **CDN**: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css`

### Bootstrap Framework
- **Versión**: 5.3.6
- **Documentación**: [Bootstrap 5](https://getbootstrap.com/docs/5.3/)

### Angular Material (Opcional)
Para futuras implementaciones, se puede considerar Angular Material para componentes más avanzados:
- **Documentación**: [Angular Material](https://material.angular.io/)

---

Esta guía de estilos proporciona una base sólida para mantener la consistencia visual en toda la aplicación ClinicLink, asegurando una experiencia de usuario coherente y profesional.