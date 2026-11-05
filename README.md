# LSP Virtual Studio 3D — Simulador Web Multijugador de LEGO® Serious Play®

Aplicación web interactiva en **3D (Three.js / WebGL)** y **Multijugador en Tiempo Real (Socket.IO)** diseñada para facilitar talleres virtuales basados en la metodología **LEGO® Serious Play® (LSP)**.

## 🚀 Cómo Iniciar la Aplicación

### Opción Rápida (Doble clic)
Haz doble clic sobre el archivo [`iniciar_app.bat`](./iniciar_app.bat). Esto levantará automáticamente el servidor multijugador y abrirá el navegador en `http://localhost:5173`.

### Opción por Terminal
```bash

npm run dev
```
- **Aplicación Web 3D:** `http://localhost:5173`
- **Servidor Multijugador (Socket.IO + API REST):** `http://localhost:3001`

---

## 🧩 Características Metodológicas Incluidas

1. **Salas Multijugador en Tiempo Real con Persistencia (`data/rooms.json`)**
   - Comparte un código de sala (por defecto `ONU2026`) para que múltiples participantes y facilitadores construyan simultáneamente en la misma mesa 3D.
2. **Tablero 3D Interactivo (Three.js)**
   - Catálogo de 12 piezas representativas de los kits *Identity & Landscape* y *Connections* (Bloques 2×4, 2×2, 1×4, Placas 4×4, Torres/Faros, Puentes/Arcos, Rampas, Cilindros, Minifiguras, Banderas, Árboles de Sostenibilidad y Engranajes).
   - Paleta de 10 colores con guía de simbolismo psicológico/metafórico.
   - Apilado automático sobre piezas inferiores, rotación de 90° y ajuste fino de posición.
3. **Las 4 Fases del Core Process LSP**
   - **1. El Desafío:** Preguntas orientadoras por etapa o personalizadas en vivo por el facilitador.
   - **2. Construcción:** Cronómetro sincronizado para todos los participantes e inspector para bautizar cada pieza con su **Metáfora** y **Significado**.
   - **3. Compartir:** Registro de narrativas por etapa y función **Spotlight 3D ("Enfocar")** que dirige la cámara al modelo del participante que tiene la palabra.
   - **4. Reflexión:** Cristalización de **Principios Rectores Simples (*Simple Guiding Principles*)**, patrones comunes y compromisos.
4. **Niveles 0, 1, 2 y 3 (Sistemas y Escenarios "What-If")**
   - **Ladrillos Rojos (*Red Bricks*):** Marca piezas esenciales con un anillo dorado 3D para integrarlas en el Modelo Compartido central sin perder la voz de ningún participante.
   - **Conectores Sistémicos 3D:** Traza vínculos rígidos, flexibles o causales entre piezas con etiquetas de relación.
   - **Simulador de Eventos Emergentes:** Dispara escenarios disruptivos en tiempo real (ej. *Terremoto / Emergencia Sísmica Mayor*, *Crisis Climática 2035*, *Transición IA*) para evaluar cómo se adapta el sistema construido.
5. **Plantillas de Talleres e Informe PDF**
   -
   - Exportación inmediata a **Informe PDF estructurado** y respaldo completo en **JSON**.

