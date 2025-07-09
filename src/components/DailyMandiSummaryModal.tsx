// src/components/DailyMandiSummaryModal.tsx
import React, { useRef } from 'react';
import Modal from '@/components/Modal'; // Assuming your existing Modal component
import { DailyMandiSummary } from '@/types'; // Import the DailyMandiSummary type

interface DailyMandiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: DailyMandiSummary | null;
}

const DailyMandiSummaryModal: React.FC<DailyMandiSummaryModalProps> = ({ isOpen, onClose, summaryData }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!summaryData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Daily Mandi Summary">
        <div className="p-4 text-center text-gray-600">
          No summary data available. Please select a date.
        </div>
      </Modal>
    );
  }

  const handlePrint = () => {
    if (contentRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Daily Mandi Summary</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
          body { font-family: sans-serif; margin: 20px; color: #333; }
          h1, h2, h3 { text-align: center; margin-bottom: 15px; color: #222; }
          .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 1.1em; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9em; }
          th { background-color: #f2f2f2; }
          .summary-table { width: auto; margin-left: auto; margin-right: auto; }
          .summary-table td { font-weight: bold; }
          .text-right { text-align: right; }
          .break-after { page-break-after: always; }
          .print-hidden { display: none !important; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(contentRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Daily Mandi Summary">
      <div className="p-4" ref={contentRef}>
        <h2 className="text-2xl font-bold mb-4 text-center">
          Daily Mandi Summary for {formatDate(summaryData.summaryDate)}
        </h2>

        <h3 className="section-title">Daily Activity Overview</h3>
        <table className="summary-table mx-auto mb-6">
          <tbody>
            <tr>
              <td>Total Transactions:</td>
              <td className="text-right">{summaryData.totalTransactionsCount}</td>
            </tr>
            <tr>
              <td>Total Weight Processed:</td>
              <td className="text-right">{summaryData.totalWeightProcessed.toFixed(2)} Kg</td>
            </tr>
            <tr>
              <td>Daily Collection from Vyaparis:</td>
              <td className="text-right">₹{summaryData.dailyCollectionFromVyaparis.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Daily Payments to Kisans:</td>
              <td className="text-right">₹{summaryData.dailyPaymentsToKisans.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="section-title">Overall Mandi Financial Position</h3>
        <table className="summary-table mx-auto mb-6">
          <tbody>
            <tr>
              <td>Total Mandi Owes to Kisans:</td>
              <td className="text-right">₹{summaryData.totalMandiOwesToKisans.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Vyaparis Owe to Mandi:</td>
              <td className="text-right">₹{summaryData.totalVyaparisOweToMandi.toFixed(2)}</td>
            </tr>
            <tr className="font-bold text-lg">
              <td>Net Mandi Balance:</td>
              <td className={`text-right ${summaryData.netMandiBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹{summaryData.netMandiBalance.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end gap-4 mt-6 print-hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Print Summary
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DailyMandiSummaryModal;
