'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { FileText, Download, BarChart3, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';

export default function TraceabilityReportsPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const generateBatchRecord = async () => {
    setIsGenerating('batch');
    try {
      // Simulate fetching batch data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Electronic Batch Record', 14, 22);
      doc.setFontSize(10);
      doc.text('Generated: ' + new Date().toLocaleString(), 14, 30);
      
      // Batch Info
      doc.setFontSize(12);
      doc.text('Batch Details', 14, 45);
      (doc as any).autoTable({
        startY: 50,
        head: [['Field', 'Value']],
        body: [
          ['Batch Number', 'BATCH-456'],
          ['Product', 'Industrial Lubricant XL'],
          ['Start Time', '2026-02-28 14:30:00'],
          ['End Time', '2026-02-28 18:45:00'],
          ['Status', 'COMPLETED'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Materials Consumed
      doc.text('Materials Consumed', 14, (doc as any).lastAutoTable.finalY + 15);
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Material', 'Lot Number', 'Quantity', 'Expiry']],
        body: [
          ['98% Acid', 'A123', '250 kg', '2027-02-28'],
          ['Base Solvent', 'S789', '150 kg', '2027-02-28'],
          ['Catalyst', 'C456', '5 kg', '2027-03-01'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Signatures
      doc.text('Electronic Signatures', 14, (doc as any).lastAutoTable.finalY + 15);
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['User', 'Role', 'Action', 'Timestamp']],
        body: [
          ['John Operator', 'OPERATOR', 'Executed', '2026-02-28 18:45:00'],
          ['Jane QA', 'QA_MANAGER', 'Reviewed', '2026-02-28 19:10:00'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save('Batch_Record_BATCH-456.pdf');
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGenerating(null);
    }
  };

  const generateMaterialBalance = async () => {
    setIsGenerating('balance');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Material Balance Report', 14, 22);
      doc.setFontSize(10);
      doc.text('Period: Last 30 Days', 14, 30);
      
      (doc as any).autoTable({
        startY: 40,
        head: [['Material', 'Starting Inv', 'Received', 'Consumed', 'Ending Inv', 'Variance']],
        body: [
          ['98% Acid', '10,000 kg', '5,000 kg', '12,500 kg', '2,450 kg', '-50 kg (0.4%)'],
          ['Base Solvent', '8,000 kg', '0 kg', '4,500 kg', '3,500 kg', '0 kg (0.0%)'],
          ['Catalyst', '200 kg', '50 kg', '180 kg', '68 kg', '-2 kg (0.8%)'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save('Material_Balance_Report.pdf');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateYieldVariance = async () => {
    setIsGenerating('yield');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Yield Variance Analysis', 14, 22);
      
      (doc as any).autoTable({
        startY: 40,
        head: [['Batch', 'Product', 'Target Yield', 'Actual Yield', 'Variance', 'Waste']],
        body: [
          ['BATCH-456', 'Lubricant XL', '400 kg', '380 kg', '-5.0%', '27 kg'],
          ['BATCH-457', 'Coolant Prem', '1000 kg', '995 kg', '-0.5%', '2 kg'],
          ['BATCH-458', 'Hydraulic Fl', '500 kg', '510 kg', '+2.0%', '0 kg'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] }
      });
      doc.save('Yield_Variance_Analysis.pdf');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateSupplierPerformance = async () => {
    setIsGenerating('supplier');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Supplier Performance (Lot Quality)', 14, 22);
      
      (doc as any).autoTable({
        startY: 40,
        head: [['Supplier', 'Lots Received', 'Rejected', 'Defect Rate', 'Avg Delivery Delay']],
        body: [
          ['ChemCorp Inc.', '45', '1', '2.2%', '0.5 days'],
          ['Solvents R Us', '120', '0', '0.0%', '0.1 days'],
          ['CatChem', '12', '2', '16.6%', '2.5 days'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }
      });
      doc.save('Supplier_Performance_Report.pdf');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance & Reports</h1>
          <p className="text-slate-500">Automated PDF generation for traceability and compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batch Record */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-indigo-600" />
              Electronic Batch Record (EBR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-6">
              Generate a complete, immutable PDF record of a specific batch, including all consumed materials, produced items, process parameters, and electronic signatures (21 CFR Part 11 compliant format).
            </p>
            <button 
              onClick={generateBatchRecord}
              disabled={isGenerating !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating === 'batch' ? (
                <span className="animate-pulse">Generating PDF...</span>
              ) : (
                <>
                  <Download size={18} />
                  Download Sample EBR
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Material Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="text-emerald-600" />
              Material Balance Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-6">
              Reconcile physical inventory with system records. Identifies discrepancies between received, consumed, and remaining raw materials to detect potential loss or unrecorded usage.
            </p>
            <button 
              onClick={generateMaterialBalance}
              disabled={isGenerating !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating === 'balance' ? (
                <span className="animate-pulse">Generating PDF...</span>
              ) : (
                <>
                  <Download size={18} />
                  Download Balance Report
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Yield Variance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="text-amber-600" />
              Yield Variance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-6">
              Compare theoretical yield against actual production output. Highlights batches with significant deviations and correlates them with waste generation for process optimization.
            </p>
            <button 
              onClick={generateYieldVariance}
              disabled={isGenerating !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating === 'yield' ? (
                <span className="animate-pulse">Generating PDF...</span>
              ) : (
                <>
                  <Download size={18} />
                  Download Yield Analysis
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-red-600" />
              Supplier Performance (Lot Quality)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-6">
              Evaluate vendors based on the quality of incoming raw material lots. Tracks rejection rates, quarantine incidents, and delivery delays to support supplier audits and compliance.
            </p>
            <button 
              onClick={generateSupplierPerformance}
              disabled={isGenerating !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating === 'supplier' ? (
                <span className="animate-pulse">Generating PDF...</span>
              ) : (
                <>
                  <Download size={18} />
                  Download Supplier Report
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
