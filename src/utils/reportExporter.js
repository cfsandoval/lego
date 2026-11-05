import { jsPDF } from 'jspdf';
import { WORKSHOP_TEMPLATES, APPLICATION_LEVELS } from '../data/lspMethodology';

export function exportWorkshopToJSON(roomState) {
  const dataStr = JSON.stringify(roomState, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LSP_Workshop_${roomState.roomCode}_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportWorkshopToPDF(roomState, language = 'en') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const template =
    WORKSHOP_TEMPLATES.find((t) => t.id === roomState.templateId) || WORKSHOP_TEMPLATES[0];

  const isEn = language === 'en';

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
  doc.text(
    isEn
      ? 'METHODOLOGICAL REPORT — LEGO® SERIOUS PLAY® VIRTUAL 3D'
      : 'INFORME METODOLÓGICO — LEGO® SERIOUS PLAY® VIRTUAL 3D',
    margin,
    13
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  const templateName = isEn && template.nameEn ? template.nameEn : template.name;
  doc.text(templateName.slice(0, 65), margin, 22);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  const dateFormatted = new Date().toLocaleDateString(isEn ? 'en-US' : 'es-ES');
  doc.text(
    `${isEn ? 'Room Code' : 'Código de Sala'}: ${roomState.roomCode}   |   ${isEn ? 'Date' : 'Fecha'}: ${dateFormatted}   |   ${isEn ? 'Participants' : 'Participantes'}: ${
      Object.keys(roomState.participants || {}).length
    }   |   ${isEn ? '3D Bricks' : 'Piezas 3D'}: ${(roomState.bricks || []).length}`,
    margin,
    30
  );

  y = 46;

  // Section 1: Participants
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(isEn ? '1. Workshop Participants' : '1. Participantes y Actores en la Mesa', margin, y);
  y += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const participantsList = Object.values(roomState.participants || {});
  if (participantsList.length === 0) {
    doc.text(isEn ? 'No participants registered.' : 'Sin participantes registrados.', margin, y);
    y += 6;
  } else {
    participantsList.forEach((p) => {
      checkPageBreak(8);
      const roleLabel =
        p.role === 'facilitator'
          ? isEn ? 'LSP Facilitator' : 'Facilitador LSP'
          : isEn ? 'Building Participant' : 'Participante Constructor';
      doc.text(`• ${p.name} (${roleLabel})`, margin + 3, y);
      y += 5.5;
    });
  }

  y += 4;

  // Section 2: Key Metaphors & Red Bricks
  checkPageBreak(22);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isEn
      ? '2. Core Red Bricks (Essential Non-Negotiables)'
      : '2. Ladrillos Rojos Seleccionados (Núcleos Innegociables)',
    margin,
    y
  );
  y += 6;

  const redBricks = (roomState.bricks || []).filter((b) => b.isRedBrick);
  if (redBricks.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text(
      isEn
        ? 'No Red Bricks were designated during this session.'
        : 'No se marcaron Ladrillos Rojos en esta sesión.',
      margin,
      y
    );
    y += 7;
  } else {
    redBricks.forEach((rb, idx) => {
      checkPageBreak(14);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `• [${rb.ownerName || (isEn ? 'Participant' : 'Participante')}]: ${
          rb.metaphorTitle || (isEn ? 'Untitled Essential Brick' : 'Pieza Esencial sin título')
        }`,
        margin + 2,
        y
      );
      y += 4.5;
      if (rb.metaphorDesc) {
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(rb.metaphorDesc, contentWidth - 8);
        doc.text(splitText, margin + 6, y);
        y += splitText.length * 4.5 + 2;
      }
    });
  }

  y += 4;

  // Section 3: Systemic Connections
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isEn
      ? '3. Systemic Links & Relational Dynamics (Level 3 Landscape)'
      : '3. Conexiones Sistémicas y Vínculos entre Modelos (Nivel 3)',
    margin,
    y
  );
  y += 6;

  const connections = roomState.connections || [];
  if (connections.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text(
      isEn
        ? 'No systemic links were placed during this session.'
        : 'No se trazaron conexiones en esta sesión.',
      margin,
      y
    );
    y += 7;
  } else {
    connections.forEach((c) => {
      checkPageBreak(10);
      const fromB = (roomState.bricks || []).find((b) => b.id === c.fromBrickId);
      const toB = (roomState.bricks || []).find((b) => b.id === c.toBrickId);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `• [${c.type?.toUpperCase()}] "${c.label || (isEn ? 'Connection' : 'Vínculo')}": (${
          fromB?.metaphorTitle || (isEn ? 'Node A' : 'Nodo A')
        }) ↔ (${toB?.metaphorTitle || (isEn ? 'Node B' : 'Nodo B')})`,
        margin + 3,
        y
      );
      y += 5.5;
    });
  }

  y += 4;

  // Section 4: Participant Stories
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isEn
      ? '4. Participant Narratives & Storytelling (Phase 3: Share)'
      : '4. Narrativas e Historias Compartidas (Fase 3: Compartir)',
    margin,
    y
  );
  y += 6;

  const stories = roomState.stories || [];
  if (stories.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text(
      isEn
        ? 'No stories were recorded in the session.'
        : 'No se documentaron historias escritas durante la sesión.',
      margin,
      y
    );
    y += 7;
  } else {
    stories.forEach((s, idx) => {
      checkPageBreak(22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${idx + 1}. ${s.title || (isEn ? 'Model Narrative' : 'Modelo Narrativo')} — ${
          s.participantName
        } (${isEn ? 'Stage' : 'Etapa'} ${(s.stageIndex || 0) + 1})`,
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

  // Section 5: Reflections & Simple Guiding Principles
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isEn
      ? '5. Simple Guiding Principles (SGP) & Shared Takeaways (Phase 4: Reflect)'
      : '5. Reflexiones y Principios Rectores Simples (Simple Guiding Principles)',
    margin,
    y
  );
  y += 6;

  const reflections = roomState.reflections || [];
  if (reflections.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.text(
      isEn
        ? 'No guiding principles or reflections recorded.'
        : 'Sin principios rectores registrados.',
      margin,
      y
    );
    y += 7;
  } else {
    reflections.forEach((r) => {
      checkPageBreak(14);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`• [${r.category || (isEn ? 'Principle' : 'Principio')}] ${r.authorName}:`, margin + 2, y);
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
    doc.text(
      isEn
        ? '6. Emergent "What-If" Disruptions Simulated'
        : '6. Eventos Emergentes ("What-If" / Escenarios de Estrés Simulados)',
      margin,
      y
    );
    y += 6;

    roomState.emergentEvents.forEach((ev, idx) => {
      checkPageBreak(16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const evTitle = isEn && ev.titleEn ? ev.titleEn : ev.title;
      const evDesc = isEn && ev.descriptionEn ? ev.descriptionEn : ev.description;
      const evImpact = isEn && ev.impactQuestionEn ? ev.impactQuestionEn : ev.impactQuestion;
      doc.text(`${idx + 1}. ${evTitle}`, margin + 2, y);
      y += 4.5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitEv = doc.splitTextToSize(
        `${evDesc} — ${isEn ? 'Impact Question' : 'Pregunta de impacto'}: ${evImpact}`,
        contentWidth - 6
      );
      doc.text(splitEv, margin + 5, y);
      y += splitEv.length * 4.5 + 2.5;
    });
  }

  doc.save(`LSP_Report_${roomState.roomCode}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
