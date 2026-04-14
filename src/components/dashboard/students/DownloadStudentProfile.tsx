"use client";

import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Student, Group } from '@/types/schema';
import { formatFullName } from '@/utils/format';

interface DownloadStudentProfileProps {
  student: Student & { groups: Group[] };
}

export default function DownloadStudentProfile({ student }: DownloadStudentProfileProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const primaryColor = "#0F515C";
      
      // Header
      doc.setFillColor(15, 81, 92);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("TAYSIR ERP - FICHE ÉTUDIANT", 20, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Généré le ${new Date().toLocaleDateString()}`, 160, 25);

      // Body - Identity
      doc.setTextColor(15, 81, 92);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMATIONS PERSONNELLES", 20, 55);
      
      doc.setDrawColor(15, 81, 92);
      doc.line(20, 58, 190, 58);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Nom complet :", 20, 70);
      doc.setFont("helvetica", "normal");
      doc.text(formatFullName(student.firstName, student.lastName), 60, 70);

      doc.setFont("helvetica", "bold");
      doc.text("Statut :", 20, 80);
      doc.setFont("helvetica", "normal");
      doc.text(student.isActive ? "ACTIF" : "INACTIF", 60, 80);

      doc.setFont("helvetica", "bold");
      doc.text("Âge / Type :", 20, 90);
      doc.setFont("helvetica", "normal");
      doc.text(student.isMinor ? "MINEUR" : "ADULTE", 60, 90);

      doc.setFont("helvetica", "bold");
      doc.text("Adresse :", 20, 100);
      doc.setFont("helvetica", "normal");
      const address = student.address || "Non renseignée";
      doc.text(doc.splitTextToSize(address, 130), 60, 100);

      // Contact
      doc.setTextColor(15, 81, 92);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("COORDONNÉES", 20, 120);
      doc.line(20, 123, 190, 123);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      if (student.isMinor) {
        doc.setFont("helvetica", "bold");
        doc.text("Parent / Tuteur :", 20, 135);
        doc.setFont("helvetica", "normal");
        doc.text(student.parentName || "N/A", 60, 135);

        doc.setFont("helvetica", "bold");
        doc.text("Téléphone Parent :", 20, 145);
        doc.setFont("helvetica", "normal");
        doc.text(student.parentPhone || "N/A", 60, 145);
      } else {
        doc.setFont("helvetica", "bold");
        doc.text("Téléphone :", 20, 135);
        doc.setFont("helvetica", "normal");
        doc.text(student.phone || "N/A", 60, 135);

        doc.setFont("helvetica", "bold");
        doc.text("Email :", 20, 145);
        doc.setFont("helvetica", "normal");
        doc.text(student.email || "N/A", 60, 145);
      }

      // Academic
      doc.setTextColor(15, 81, 92);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CURSUS ACADÉMIQUE", 20, 165);
      doc.line(20, 168, 190, 168);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Groupes inscrits :", 20, 180);
      doc.setFont("helvetica", "normal");
      const groups = student.groups.map(g => g.name).join(", ") || "Aucun groupe";
      doc.text(doc.splitTextToSize(groups, 130), 60, 180);

      doc.setFont("helvetica", "bold");
      doc.text("Date d'inscription :", 20, 195);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(student.registrationDate).toLocaleDateString(), 60, 195);

      // Footer brand
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Taysir Scolaire - Système de Gestion d'Établissement", 105, 285, { align: "center" });

      doc.save(`Fiche_${student.lastName}_${student.firstName}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-taysir-teal text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
    >
      {isGenerating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      <span>Télécharger la fiche</span>
    </button>
  );
}
