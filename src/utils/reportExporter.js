import { jsPDF } from 'jspdf';
import { WORKSHOP_TEMPLATES, APPLICATION_LEVELS } from '../data/lspMethodology';

export function exportWorkshopToJSON(roomState) {
  const dataStr = JSON.stringify(roomState, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LSP_Taller_${roomState.roomCode}_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportWorkshopToPDF(roomState) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const template =
    WORKSHOP_TEMPLATES.find((t) => t.id === roomState.templateId) || WORKSHOP_TEMPLATES[0];

  let y = 18;
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const checkPageBreak = (needed = 20) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 18;
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME METODOLÓGICO — LEGO® SERIOUS PLAY® VIRTUAL 3D', margin, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(template.name.slice(0, 62), margin, 22);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Código de Sala: ${roomState.roomCode}   |   Fecha: ${new Date().toLocaleDateString('es-ES')}   |   Participantes: ${
      Object.keys(roomState.participants || {}).length
    }   |   Piezas 3D: ${(roomState.bricks || []).length}`,
    margin,
    30
  );

  y = 46;

  // Section 1: Participants
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Participantes y Actores en la Mesa', margin, y);
  y += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const participantsList = Object.values(roomState.participants || {});
  if (participantsList.length === 0) {
    doc.text('Sin participantes registrados.', margin, y);
    y += 6;
  } else {
    participantsList.forEach((p) => {
      checkPageBreak(8);
      const roleLabel = p.role === 'facilitator' ? 'Facilitador LSP' : 'Participante Constructor';
      doc.text(`• ${p.name} (${roleLabel})`, margin + 3, y);
      y += 5.5;
    });
  }

  y += 4;

  // Section 2: Key Metaphors & Red Bricks (Ladrillos Rojos)
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Inventario de Metáforas 3D y "Ladrillos Rojos" (Piezas Esenciales)', margin, y);
  y += 6;

  const bricksWithMetaphor = (roomState.bricks || []).filter(
    (b) => b.metaphorTitle || b.metaphorDesc || b.isRedBrick
  );

  if (bricksWithMetaphor.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text('No se etiquetaron metáforas individuales en las piezas.', margin, y);
    y += 7;
  } else {
    bricksWithMetaphor.forEach((b, idx) => {
      checkPageBreak(18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const redTag = b.isRedBrick ? ' [★ LADRILLO ROJO ESENCIAL]' : '';
      doc.text(
        `${idx + 1}. ${b.metaphorTitle || 'Pieza con significado'} — Autor: ${b.ownerName}${redTag}`,
        margin + 2,
        y
      );
      y += 5;

      if (b.metaphorDesc) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(`Significado: ${b.metaphorDesc}`, contentWidth - 6);
        doc.text(splitDesc, margin + 5, y);
        y += splitDesc.length * 4.5 + 2;
      }
    });
  }

  y += 4;

  // Section 3: Connections (Level 3 Systems)
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Mapa de Conexiones Sistémicas (Nivel 3: Paisaje)', margin, y);
  y += 6;

  const connections = roomState.connections || [];
  if (connections.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text('No se registraron conexiones entre modelos.', margin, y);
    y += 7;
  } else {
    connections.forEach((c, idx) => {
      checkPageBreak(12);
      const fromB = (roomState.bricks || []).find((b) => b.id === c.fromBrickId);
      const toB = (roomState.bricks || []).find((b) => b.id === c.toBrickId);
      const fromName = fromB?.metaphorTitle || 'Pieza A';
      const toName = toB?.metaphorTitle || 'Pieza B';
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      const line = `${idx + 1}. [${c.label || c.type}]  ${fromName}  --->  ${toName}`;
      const splitLine = doc.splitTextToSize(line, contentWidth - 4);
      doc.text(splitLine, margin + 2, y);
      y += splitLine.length * 5;
    });
  }

  y += 4;

  // Section 4: Participant Stories (Phase 3: Share)
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Narrativas e Historias Compartidas (Fase 3: Compartir)', margin, y);
  y += 6;

  const stories = roomState.stories || [];
  if (stories.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text('No se documentaron historias escritas durante la sesión.', margin, y);
    y += 7;
  } else {
    stories.forEach((s, idx) => {
      checkPageBreak(22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${idx + 1}. ${s.title || 'Modelo Narrativo'} — ${s.participantName} (Etapa ${
          (s.stageIndex || 0) + 1
        })`,
        margin + 2,
        y
      );
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitNarr = doc.splitTextToSize(s.narrative || '', contentWidth - 6);
      doc.text(splitNarr, margin + 5, y);
      y += splitNarr.length * 4.5 + 3;
    });
  }

  y += 4;

  // Section 5: Reflections & Simple Guiding Principles (Phase 4)
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Reflexiones y Principios Rectores Simples (Simple Guiding Principles)', margin, y);
  y += 6;

  const reflections = roomState.reflections || [];
  if (reflections.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin principios rectores registrados.', margin, y);
    y += 7;
  } else {
    reflections.forEach((r, idx) => {
      checkPageBreak(14);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`• [${r.category || 'Principio Rector'}] ${r.authorName}:`, margin + 2, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      const splitRef = doc.splitTextToSize(r.text || '', contentWidth - 8);
      doc.text(splitRef, margin + 6, y);
      y += splitRef.length * 4.5 + 2.5;
    });
  }

  // Section 6: Emergent Events Tested
  if ((roomState.emergentEvents || []).length > 0) {
    y += 4;
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('6. Eventos Emergentes ("What-If" / Escenarios de Estrés Simulados)', margin, y);
    y += 6;

    roomState.emergentEvents.forEach((ev, idx) => {
      checkPageBreak(16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${ev.title}`, margin + 2, y);
      y += 4.5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitEv = doc.splitTextToSize(
        `${ev.description} — Pregunta de impacto: ${ev.impactQuestion}`,
        contentWidth - 6
      );
      doc.text(splitEv, margin + 5, y);
      y += splitEv.length * 4.5 + 2.5;
    });
  }

  doc.save(`Informe_LSP_${roomState.roomCode}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

