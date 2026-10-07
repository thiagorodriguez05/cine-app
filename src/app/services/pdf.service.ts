import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  async generarEntradasPdf(
    pelicula: string,
    fecha: string,
    hora: string,
    sala: string,
    formato: string,
    idioma: string,
    entradas: {
      id: number;
      codigo_qr: string;
      precio: number;
      fila: string;
      numero: number;
      tipo: string;
    }[]
  ): Promise<void> {

    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GESTIÓN CINE', 20, 25);

    pdf.setFontSize(16);
    pdf.text(pelicula, 20, 40);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    pdf.text(`Fecha: ${fecha}`, 20, 52);
    pdf.text(`Horario: ${hora}`, 20, 59);
    pdf.text(`Sala: ${sala}`, 20, 66);
    pdf.text(`Formato: ${formato}`, 20, 73);
    pdf.text(`Idioma: ${idioma}`, 20, 80);

    let posicionY = 100;

    for (const entrada of entradas) {

      if (posicionY > 240) {
        pdf.addPage();
        posicionY = 25;
      }

      pdf.setDrawColor(180);
      pdf.roundedRect(
        15,
        posicionY - 10,
        180,
        70,
        4,
        4
      );

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');

      pdf.text(
        `ENTRADA #${entrada.id}`,
        25,
        posicionY
      );

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      pdf.text(
        `Butaca: ${entrada.fila}${entrada.numero}`,
        25,
        posicionY + 12
      );

      pdf.text(
        `Tipo de butaca: ${entrada.tipo}`,
        25,
        posicionY + 20
      );

      pdf.text(
        `Precio: $${entrada.precio.toLocaleString('es-AR')}`,
        25,
        posicionY + 28
      );

      const qrDataUrl = await QRCode.toDataURL(
        entrada.codigo_qr,
        {
          width: 150,
          margin: 1
        }
      );

      pdf.addImage(
        qrDataUrl,
        'PNG',
        140,
        posicionY - 5,
        45,
        45
      );

      posicionY += 80;
    }

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    pdf.text(
      'Presentá este código QR para validar tu entrada.',
      20,
      285
    );

    pdf.save('entradas-cine.pdf');
  }
}