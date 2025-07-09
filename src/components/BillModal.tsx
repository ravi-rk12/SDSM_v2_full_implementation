// src/components/BillModal.tsx
import React, { useRef } from 'react';
import Modal from '@/components/Modal'; // Assuming your existing Modal component
import { Transaction, Payment, Kisan, Vyapari, BillStatement } from '@/types'; // Import BillStatement from types

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData: BillStatement | null; // billData is now always BillStatement
}

const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, billData }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!billData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Generate Bill">
        <div className="p-4 text-center text-gray-600">
          No bill data available. Please select an entity and date range.
        </div>
      </Modal>
    );
  }

  const { entityType, entityName, entityContact, entityAddress, entityGst,
          statementDate, startDate, endDate, openingBalance, transactions,
          currentBakaya, summary } = billData;

  const handlePrint = () => {
    if (contentRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Mandi Bill</title>');
        // Optional: Include basic print styles
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
          .print-hidden { display: none !important; } /* Ensure this is here for printing */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
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

  // Helper to format date for display
  const formatDate = (date: Date) => date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const billTitle = `${entityType === 'kisan' ? 'Kisan' : 'Vyapari'} Statement for ${entityName}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={billTitle}>
      <div className="p-4" ref={contentRef}>
        <h2 className="text-2xl font-bold mb-4 text-center">
          {billTitle}
        </h2>
        <div className="mb-6 border-b pb-4">
          <p><strong>{entityType === 'kisan' ? 'Kisan Name:' : 'Vyapari Name:'}</strong> {entityName || 'N/A'}</p>
          {entityAddress && <p><strong>Address:</strong> {entityAddress}</p>}
          {entityContact && <p><strong>Contact:</strong> {entityContact}</p>}
          {entityGst && <p><strong>GSTIN:</strong> {entityGst}</p>}
          <p><strong>Statement Date:</strong> {formatDate(statementDate)}</p>
          {startDate && endDate && (
            <p><strong>Period:</strong> {formatDate(startDate)} to {formatDate(endDate)}</p>
          )}
        </div>

        <h3 className="section-title">Summary of Period</h3>
        <table className="summary-table mx-auto mb-6">
          <tbody>
            {startDate && endDate && ( // Only show opening balance if a period is selected
              <tr>
                <td>Opening Balance:</td>
                <td className="text-right">₹{openingBalance.toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td>Total Weight Processed:</td>
              <td className="text-right">{summary.totalWeight.toFixed(2)} Kg</td>
            </tr>
            {entityType === 'kisan' ? (
              <>
                <tr>
                  <td>Total Gross Amount (Kisan):</td>
                  <td className="text-right">₹{summary.totalAmountToKisanGross.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Commission Deducted:</td>
                  <td className="text-right">₹{summary.totalCommission.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Cash Paid to Kisan:</td>
                  <td className="text-right">₹{summary.totalCashPaidToKisan.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Net Amount Change (Mandi owes Kisan):</td>
                  <td className="text-right">₹{summary.netAmountChangeInPeriod.toFixed(2)}</td>
                </tr>
              </>
            ) : ( // Vyapari
              <>
                <tr>
                  <td>Total Gross Amount (Vyapari):</td>
                  <td className="text-right">₹{summary.totalAmountFromVyapariGross.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Commission Charged:</td>
                  <td className="text-right">₹{summary.totalCommission.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Net Amount Change (Vyapari owes Mandi):</td>
                  <td className="text-right">₹{summary.netAmountChangeInPeriod.toFixed(2)}</td>
                </tr>
              </>
            )}
            <tr className="font-bold text-lg">
              <td>Current Total Bakaya:</td>
              <td className={`text-right ${currentBakaya >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹{currentBakaya.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {transactions.length > 0 && (
          <>
            <h3 className="section-title">Transactions in Period</h3>
            <div className="overflow-x-auto mb-6 custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Wt (Kg)</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SubTotal</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    {entityType === 'kisan' ? (
                      <>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net to Kisan</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Paid</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net from Vyapari</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Collected</th>
                      </>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map(txn => (
                    <tr key={txn.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(txn.transactionDate as Date)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {txn.items.map((item, idx) => (
                          <div key={idx}>
                            {item.productName} ({item.quantity.toFixed(2)} Kg) @ ₹{(item.unitPrice || 0).toFixed(2)}/Kg = ₹{(item.totalPrice || 0).toFixed(2)}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{txn.totalWeightInKg.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">₹{txn.subTotal.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">₹{txn.totalCommission.toFixed(2)}</td>
                      {entityType === 'kisan' ? (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">₹{txn.netAmountKisan.toFixed(2)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">₹{txn.amountPaidKisan.toFixed(2)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">₹{txn.netAmountVyapari.toFixed(2)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">₹{txn.amountPaidVyapari.toFixed(2)}</td>
                        </>
                      )}
                      <td className="px-4 py-2 text-sm text-gray-900">{txn.notes || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Payments are not part of BillStatement for individual bills as per new design */}
        {/* If payments were to be shown in individual bills, they would need to be fetched separately here or passed in billData */}
        {/* For now, assuming payments are factored into the bakaya and not explicitly listed in this modal */}

        {transactions.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No transactions found for this period.</p>
        )}

        <div className="flex justify-end gap-4 mt-6 print-hidden"> {/* Added print-hidden class */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Print Bill
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

export default BillModal;
