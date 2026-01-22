import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SessionEvaluation {
  sessionNumber: number;
  date: string;
  therapistName: string;
  babyAgeMonths: number;
  babyWeight: string | null;
  activities: string[];
  muscleTone: string | null;
  mood: string | null;
  milestones: {
    sits: boolean | null;
    crawls: boolean | null;
    walks: boolean | null;
  };
  sensory: {
    visualTracking: boolean | null;
    eyeContact: boolean | null;
    auditoryResponse: boolean | null;
  };
  externalNotes: string | null;
}

interface BabyReportData {
  babyName: string;
  babyBirthDate: string;
  babyGender: string;
  parentName: string;
  totalSessions: number;
  sessions: SessionEvaluation[];
  generatedAt: string;
  locale: string;
}

// Translation helpers
const translations: Record<string, Record<string, string>> = {
  es: {
    title: "Reporte de Progreso",
    subtitle: "Baby Spa - Hidroterapia y Estimulación Temprana",
    babyInfo: "Información del Bebé",
    name: "Nombre",
    birthDate: "Fecha de nacimiento",
    gender: "Género",
    parent: "Padre/Madre",
    totalSessions: "Total de sesiones completadas",
    sessionHistory: "Historial de Sesiones",
    session: "Sesión",
    date: "Fecha",
    therapist: "Terapeuta",
    age: "Edad",
    weight: "Peso",
    activities: "Actividades",
    muscleTone: "Tono muscular",
    mood: "Estado de ánimo",
    milestones: "Hitos del desarrollo",
    sensory: "Desarrollo sensorial",
    notes: "Observaciones",
    months: "meses",
    MALE: "Masculino",
    FEMALE: "Femenino",
    OTHER: "Otro",
    LOW: "Bajo",
    NORMAL: "Normal",
    TENSE: "Tenso",
    CALM: "Tranquilo",
    IRRITABLE: "Irritable",
    hydrotherapy: "Hidroterapia",
    massage: "Masaje",
    motorStimulation: "Estimulación motora",
    sensoryStimulation: "Estimulación sensorial",
    relaxation: "Relajación",
    sits: "Se sienta",
    crawls: "Gatea",
    walks: "Camina",
    visualTracking: "Seguimiento visual",
    eyeContact: "Contacto visual",
    auditoryResponse: "Respuesta auditiva",
    yes: "Sí",
    no: "No",
    notEvaluated: "No evaluado",
    generatedAt: "Generado el",
    page: "Página",
    of: "de",
  },
  "pt-BR": {
    title: "Relatório de Progresso",
    subtitle: "Baby Spa - Hidroterapia e Estimulação Precoce",
    babyInfo: "Informações do Bebê",
    name: "Nome",
    birthDate: "Data de nascimento",
    gender: "Gênero",
    parent: "Pai/Mãe",
    totalSessions: "Total de sessões concluídas",
    sessionHistory: "Histórico de Sessões",
    session: "Sessão",
    date: "Data",
    therapist: "Terapeuta",
    age: "Idade",
    weight: "Peso",
    activities: "Atividades",
    muscleTone: "Tônus muscular",
    mood: "Estado de humor",
    milestones: "Marcos do desenvolvimento",
    sensory: "Desenvolvimento sensorial",
    notes: "Observações",
    months: "meses",
    MALE: "Masculino",
    FEMALE: "Feminino",
    OTHER: "Outro",
    LOW: "Baixo",
    NORMAL: "Normal",
    TENSE: "Tenso",
    CALM: "Calmo",
    IRRITABLE: "Irritável",
    hydrotherapy: "Hidroterapia",
    massage: "Massagem",
    motorStimulation: "Estimulação motora",
    sensoryStimulation: "Estimulação sensorial",
    relaxation: "Relaxamento",
    sits: "Senta",
    crawls: "Engatinha",
    walks: "Anda",
    visualTracking: "Acompanhamento visual",
    eyeContact: "Contato visual",
    auditoryResponse: "Resposta auditiva",
    yes: "Sim",
    no: "Não",
    notEvaluated: "Não avaliado",
    generatedAt: "Gerado em",
    page: "Página",
    of: "de",
  },
};

export function generateBabyReport(data: BabyReportData): jsPDF {
  const doc = new jsPDF();
  const locale = data.locale === "pt-BR" ? "pt-BR" : "es";
  const t = (key: string) => translations[locale][key] || key;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Colors
  const tealColor: [number, number, number] = [20, 184, 166]; // #14b8a6
  const grayColor: [number, number, number] = [107, 114, 128];
  const darkColor: [number, number, number] = [31, 41, 55];

  // Helper function for boolean display
  const boolToText = (val: boolean | null) => {
    if (val === null) return t("notEvaluated");
    return val ? t("yes") : t("no");
  };

  // Header
  doc.setFillColor(...tealColor);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(t("title"), margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(t("subtitle"), margin, 28);

  yPos = 50;

  // Baby Info Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(t("babyInfo"), margin, yPos);

  yPos += 8;
  doc.setDrawColor(...tealColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoItems = [
    [t("name"), data.babyName],
    [t("birthDate"), new Date(data.babyBirthDate).toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "es-ES")],
    [t("gender"), t(data.babyGender)],
    [t("parent"), data.parentName],
    [t("totalSessions"), data.totalSessions.toString()],
  ];

  infoItems.forEach(([label, value]) => {
    doc.setTextColor(...grayColor);
    doc.text(`${label}:`, margin, yPos);
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 50, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 7;
  });

  yPos += 10;

  // Sessions History Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(t("sessionHistory"), margin, yPos);

  yPos += 8;
  doc.setDrawColor(...tealColor);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 10;

  // Sessions table
  if (data.sessions.length > 0) {
    const tableData = data.sessions.map((session) => [
      `#${session.sessionNumber}`,
      new Date(session.date).toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "es-ES"),
      session.therapistName,
      `${session.babyAgeMonths} ${t("months")}`,
      session.babyWeight ? `${session.babyWeight} kg` : "-",
      session.activities.map((a) => t(a)).join(", "),
      session.muscleTone ? t(session.muscleTone) : "-",
      session.mood ? t(session.mood) : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          t("session"),
          t("date"),
          t("therapist"),
          t("age"),
          t("weight"),
          t("activities"),
          t("muscleTone"),
          t("mood"),
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: tealColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkColor,
      },
      alternateRowStyles: {
        fillColor: [240, 253, 250],
      },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 22 },
        2: { cellWidth: 25 },
        3: { cellWidth: 18 },
        4: { cellWidth: 15 },
        5: { cellWidth: 40 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
      },
    });

    // Get the final Y position after the table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Detailed evaluations
    data.sessions.forEach((session, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...tealColor);
      doc.text(
        `${t("session")} #${session.sessionNumber} - ${new Date(session.date).toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "es-ES")}`,
        margin,
        yPos
      );

      yPos += 7;

      // Milestones
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...darkColor);
      doc.text(t("milestones") + ":", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      const milestonesText = [
        `${t("sits")}: ${boolToText(session.milestones.sits)}`,
        `${t("crawls")}: ${boolToText(session.milestones.crawls)}`,
        `${t("walks")}: ${boolToText(session.milestones.walks)}`,
      ].join("  |  ");
      doc.text(milestonesText, margin + 5, yPos);
      yPos += 6;

      // Sensory
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...darkColor);
      doc.text(t("sensory") + ":", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      const sensoryText = [
        `${t("visualTracking")}: ${boolToText(session.sensory.visualTracking)}`,
        `${t("eyeContact")}: ${boolToText(session.sensory.eyeContact)}`,
        `${t("auditoryResponse")}: ${boolToText(session.sensory.auditoryResponse)}`,
      ].join("  |  ");
      doc.text(sensoryText, margin + 5, yPos);
      yPos += 6;

      // Notes
      if (session.externalNotes) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkColor);
        doc.text(t("notes") + ":", margin, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grayColor);
        const splitNotes = doc.splitTextToSize(session.externalNotes, pageWidth - margin * 2 - 5);
        doc.text(splitNotes, margin + 5, yPos);
        yPos += splitNotes.length * 4 + 2;
      }

      yPos += 8;

      // Add separator line between sessions (except for the last one)
      if (index < data.sessions.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos - 4, pageWidth - margin, yPos - 4);
      }
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(
      `${t("generatedAt")}: ${new Date(data.generatedAt).toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `${t("page")} ${i} ${t("of")} ${pageCount}`,
      pageWidth - margin - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc;
}
