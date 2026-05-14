import React, { useState } from 'react';
import { submitEvaluationBatch } from '../lib/api';
import { cn } from '../lib/utils';
import { calculateAverage, getCategoryFromScore } from '../types';
import { Button } from './ui/Button';
import { Check, Plus, Trash2, Printer } from 'lucide-react';

interface ProviderEvaluation {
  id: string;
  supplierName: string;
  purchaseOrderNo: string;
  address: string;
  ratings: {
    quality: number;
    price: number;
    delivery: number;
    completeness: number;
    afterSales: number;
  };
  comments: string;
}

export function EvaluationForm({ user, shareId }: { user: any, shareId?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  const [evaluatorInfo, setEvaluatorInfo] = useState({
    batchName: '',
    dateOfEvaluation: new Date().toISOString().split('T')[0],
    designation: '',
    department: '',
  });

  const createNewEntry = (): ProviderEvaluation => ({
    id: Math.random().toString(36).substr(2, 9),
    supplierName: '',
    purchaseOrderNo: '',
    address: '',
    ratings: { quality: 0, price: 0, delivery: 0, completeness: 0, afterSales: 0 },
    comments: '',
  });

  const criteria = [
    { key: 'quality', label: 'Quality', desc: 'Quality of items delivered' },
    { key: 'price', label: 'Price', desc: 'Fairness of price' },
    { key: 'delivery', label: 'Delivery', desc: 'Delivery timeliness' },
    { key: 'completeness', label: 'Completeness', desc: 'Order completeness' },
    { key: 'afterSales', label: 'After-Sales', desc: 'After-sales support' },
  ] as const;

  const [evaluationList, setEvaluationList] = useState<ProviderEvaluation[]>([createNewEntry()]);

  const addEvaluationRow = () => setEvaluationList([...evaluationList, createNewEntry()]);

  const removeEvaluationRow = (id: string) => {
    if (evaluationList.length > 1) {
      setEvaluationList(evaluationList.filter(e => e.id !== id));
    }
  };

  const handleProviderChange = (id: string, field: keyof ProviderEvaluation, value: any) => {
    setEvaluationList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRatingChange = (id: string, criterion: keyof ProviderEvaluation['ratings'], value: number) => {
    setEvaluationList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ratings: { ...item.ratings, [criterion]: value } };
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const hasIncompleteRatings = evaluationList.some(entry => 
      Object.values(entry.ratings).some(v => v === 0) || !entry.supplierName || !entry.purchaseOrderNo
    );

    if (hasIncompleteRatings) {
      alert('Please complete all ratings and provider details.');
      return;
    }

    setLoading(true);

    try {
      const batchId = Math.random().toString(36).substr(2, 9);
      await submitEvaluationBatch({
        batchId,
        batchName: evaluatorInfo.batchName,
        dateOfEvaluation: evaluatorInfo.dateOfEvaluation,
        designation: evaluatorInfo.designation,
        department: evaluatorInfo.department,
        evaluatorId: user.id,
        evaluatorName: user.displayName,
        evaluations: evaluationList.map(entry => ({
          supplierName: entry.supplierName,
          purchaseOrderNo: entry.purchaseOrderNo,
          address: entry.address,
          ratings: entry.ratings,
          comments: entry.comments,
        })),
      });

      const receiptData = {
        batchName: evaluatorInfo.batchName,
        dateOfEvaluation: evaluatorInfo.dateOfEvaluation,
        evaluatorName: user.displayName,
        designation: evaluatorInfo.designation,
        department: evaluatorInfo.department,
        evaluations: evaluationList.map(entry => ({
          ...entry,
          averageScore: calculateAverage(entry.ratings),
          ratingCategory: getCategoryFromScore(calculateAverage(entry.ratings)),
        })),
        overallAverage: calculateAverage({
          quality: evaluationList.reduce((sum, e) => sum + e.ratings.quality, 0) / evaluationList.length,
          price: evaluationList.reduce((sum, e) => sum + e.ratings.price, 0) / evaluationList.length,
          delivery: evaluationList.reduce((sum, e) => sum + e.ratings.delivery, 0) / evaluationList.length,
          completeness: evaluationList.reduce((sum, e) => sum + e.ratings.completeness, 0) / evaluationList.length,
          afterSales: evaluationList.reduce((sum, e) => sum + e.ratings.afterSales, 0) / evaluationList.length,
        }),
        submittedAt: new Date().toLocaleString(),
      };

      setSubmittedData(receiptData);
      setSuccess(true);
      setEvaluationList([createNewEntry()]);
      setEvaluatorInfo({
        batchName: '',
        dateOfEvaluation: new Date().toISOString().split('T')[0],
        designation: '',
        department: '',
      });
    } catch (err: any) {
      alert(err.message || 'Unable to submit evaluation.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !submittedData) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ISU Evaluation Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #2d5a27; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
            .title { color: #2d5a27; font-weight: bold; font-size: 18px; margin: 0; }
            .subtitle { color: #666; font-size: 12px; margin: 5px 0; text-transform: uppercase; }
            .info { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; color: #2d5a27; }
            .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .overall { font-size: 16px; font-weight: bold; color: #2d5a27; text-align: center; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <img src="/isulogo.png" alt="ISU Logo" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
            <h1 class="title">ISABELA STATE UNIVERSITY</h1>
            <p class="subtitle">Cauayan Campus • Procurement Office</p>
            <h2 style="color: #2d5a27; margin: 10px 0;">EVALUATION RECEIPT</h2>
          </div>

          <div class="info">
            <div class="info-row">
              <span class="label">Batch Name:</span>
              <span class="value">${submittedData.batchName}</span>
            </div>
            <div class="info-row">
              <span class="label">Date of Evaluation:</span>
              <span class="value">${new Date(submittedData.dateOfEvaluation).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Evaluator:</span>
              <span class="value">${submittedData.evaluatorName}</span>
            </div>
            <div class="info-row">
              <span class="label">Designation:</span>
              <span class="value">${submittedData.designation}</span>
            </div>
            <div class="info-row">
              <span class="label">Department:</span>
              <span class="value">${submittedData.department}</span>
            </div>
            <div class="info-row">
              <span class="label">Submitted At:</span>
              <span class="value">${submittedData.submittedAt}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>P.O. Number</th>
                <th>Quality</th>
                <th>Price</th>
                <th>Delivery</th>
                <th>Completeness</th>
                <th>After-Sales</th>
                <th>Average</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              ${submittedData.evaluations.map((evaluation: any) => `
                <tr>
                  <td>${evaluation.supplierName}</td>
                  <td>${evaluation.purchaseOrderNo}</td>
                  <td>${evaluation.ratings.quality}</td>
                  <td>${evaluation.ratings.price}</td>
                  <td>${evaluation.ratings.delivery}</td>
                  <td>${evaluation.ratings.completeness}</td>
                  <td>${evaluation.ratings.afterSales}</td>
                  <td>${evaluation.averageScore.toFixed(2)}</td>
                  <td>${evaluation.ratingCategory}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="overall">
              Overall Batch Average: ${submittedData.overallAverage.toFixed(2)} - ${getCategoryFromScore(submittedData.overallAverage)}
            </div>
          </div>

          <div class="footer">
            <p>This receipt confirms that the evaluation batch has been successfully submitted to the ISU procurement system.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-isu-green tracking-tighter uppercase">Batch Evaluation Portal</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cauayan Campus • Procurement Unit</p>
        </div>
        <Button onClick={addEvaluationRow} variant="secondary" className="gap-2 h-10 px-6 rounded-lg text-xs font-bold uppercase tracking-wider bg-isu-green text-white hover:bg-isu-dark-green border-none">
          <Plus className="w-4 h-4" /> Add Another Provider
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow-2xl border-t-[6px] border-isu-green flex flex-col p-8 md:p-10 space-y-8">
          <header className="flex justify-between items-start border-b border-gray-200 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 border border-gray-100 ring-4 ring-isu-gold/10">
                 <img src="/isulogo.png" alt="ISU Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-isu-green font-bold text-xl uppercase leading-tight">Isabela State University</h2>
                <p className="text-xs font-semibold tracking-wider text-isu-gold">Cauayan Campus • Procurement Office</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase whitespace-pre-line">
                Performance{"\n"}Evaluation
              </h1>
              <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
                Authorized Personnel Entry
              </p>
            </div>
          </header>

          <div className="bg-isu-green/5 border-l-4 border-isu-gold p-4">
            <p className="text-[11px] leading-relaxed text-isu-dark-green font-medium italic">
              Instructions: This system allows for batch evaluation of multiple external providers. 
              Ensure all criteria are met before final submission.
            </p>
          </div>

          <div className="space-y-12">
            {evaluationList.map((entry, index) => (
              <div key={entry.id} className="relative border border-gray-200 rounded-xl p-6 bg-gray-50/30 group">
                {evaluationList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEvaluationRow(entry.id)}
                    className="absolute -top-3 -right-3 bg-white text-rose-500 border border-gray-200 shadow-sm p-2 rounded-full hover:bg-rose-50 transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="mb-6 flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-isu-green text-white flex items-center justify-center text-xs font-bold ring-4 ring-isu-green/10">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-black text-isu-green uppercase tracking-widest">Provider Set</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col border-b border-gray-200 pb-1">
                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Supplier Name</label>
                    <input
                      required
                      className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 outline-none w-full text-isu-green"
                      value={entry.supplierName}
                      onChange={e => handleProviderChange(entry.id, 'supplierName', e.target.value)}
                      placeholder="e.g. GSIP, Inc."
                    />
                  </div>
                  <div className="flex flex-col border-b border-gray-200 pb-1">
                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">P.O. Number</label>
                    <input
                      required
                      className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                      value={entry.purchaseOrderNo}
                      onChange={e => handleProviderChange(entry.id, 'purchaseOrderNo', e.target.value)}
                      placeholder="PO-20XX-..."
                    />
                  </div>
                  <div className="flex flex-col border-b border-gray-200 pb-1">
                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Address</label>
                    <input
                      className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                      value={entry.address}
                      onChange={e => handleProviderChange(entry.id, 'address', e.target.value)}
                      placeholder="Location"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead className="bg-isu-green/5 border-y border-isu-green/20">
                      <tr className="text-[9px] font-black uppercase text-isu-green">
                        <th className="text-left p-3">Criteria</th>
                        {[5, 4, 3, 2, 1].map(score => (
                          <th key={score} className="text-center p-3 w-16">{score}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {criteria.map((c, ci) => (
                        <tr key={c.key} className={cn("border-b border-gray-100", ci % 2 !== 0 && "bg-white")}>
                          <td className="p-3 font-semibold text-gray-700 capitalize">
                            {c.label} <span className="text-[9px] text-gray-400 block font-normal">{c.desc}</span>
                          </td>
                          {[5, 4, 3, 2, 1].map(score => (
                            <td key={score} className="p-2 text-center">
                              <div
                                onClick={() => handleRatingChange(entry.id, c.key, score)}
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 mx-auto cursor-pointer transition-all",
                                  entry.ratings[c.key] === score ? "bg-isu-gold border-isu-gold" : "border-gray-300"
                                )}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-gray-400 mb-2 block">Specific Feedback</label>
                  <textarea
                    rows={2}
                    className="w-full border border-gray-200 bg-white rounded p-3 text-xs italic text-gray-600 focus:ring-1 focus:ring-isu-green outline-none transition-all resize-none"
                    placeholder="Enter short comments..."
                    value={entry.comments}
                    onChange={e => handleProviderChange(entry.id, 'comments', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col border-b border-gray-200 pb-1">
                <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Evaluation Batch Reference Name</label>
                <input
                  required
                  className="text-sm font-black bg-transparent border-none p-0 focus:ring-0 outline-none w-full text-isu-green"
                  value={evaluatorInfo.batchName}
                  onChange={e => setEvaluatorInfo({ ...evaluatorInfo, batchName: e.target.value })}
                  placeholder="e.g. Performance Review Day 1"
                />
              </div>
              <div className="flex flex-col border-b border-gray-200 pb-1">
                <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Evaluation Date</label>
                <input
                  type="date"
                  required
                  className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                  value={evaluatorInfo.dateOfEvaluation}
                  onChange={e => setEvaluatorInfo({ ...evaluatorInfo, dateOfEvaluation: e.target.value })}
                />
              </div>
              <div className="flex flex-col border-b border-gray-200 pb-1">
                <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Designation</label>
                <input
                  required
                  className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                  value={evaluatorInfo.designation}
                  onChange={e => setEvaluatorInfo({ ...evaluatorInfo, designation: e.target.value })}
                  placeholder="e.g. Admin Officer IV"
                />
              </div>
              <div className="flex flex-col border-b border-gray-200 pb-1">
                <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Department</label>
                <input
                  required
                  className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                  value={evaluatorInfo.department}
                  onChange={e => setEvaluatorInfo({ ...evaluatorInfo, department: e.target.value })}
                  placeholder="e.g. ICT Services"
                />
              </div>
            </div>


          </div>

          <div className="pt-8 flex items-center justify-between border-t border-gray-100">
            <p className="text-[10px] text-gray-400 italic max-w-sm font-medium">
              Batch processing: Submitting {evaluationList.length} evaluation(s) to the secure ISU procurement repository.
            </p>
            <div className="flex gap-4">
              {submittedData && (
                <Button
                  onClick={() => setShowReceipt(true)}
                  variant="secondary"
                  className="h-12 px-6 uppercase tracking-widest text-xs font-black rounded-lg border-isu-green text-isu-green hover:bg-isu-green hover:text-white gap-2"
                >
                  <Printer className="w-4 h-4" />
                  View Receipt
                </Button>
              )}
              <Button
                id="submit-batch"
                type="submit"
                size="lg"
                className="md:w-auto min-w-[240px] h-12 uppercase tracking-widest text-xs font-black rounded-lg bg-isu-green hover:bg-isu-dark-green text-white"
                isLoading={loading}
              >
                Finalize Batch Submission
              </Button>
            </div>
          </div>
        </div>
      </form>

      {success && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-isu-green text-white px-8 py-3 rounded-lg shadow-2xl flex items-center gap-3 font-bold text-sm tracking-wide z-50 border-2 border-isu-gold/30">
          <Check className="w-4 h-4 text-isu-gold" />
          <span>BATCH SAVED SUCCESSFULLY</span>
          <button
            onClick={() => setSuccess(false)}
            className="ml-4 text-isu-gold hover:text-white text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && submittedData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 border border-gray-100 ring-4 ring-isu-gold/10">
                    <img src="/isulogo.png" alt="ISU Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-isu-green font-bold text-xl uppercase leading-tight">Evaluation Receipt</h2>
                    <p className="text-xs font-semibold tracking-wider text-isu-gold">Batch: {submittedData.batchName}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowReceipt(false)}
                  variant="secondary"
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p><span className="font-bold">Evaluator:</span> {submittedData.evaluatorName}</p>
                  <p><span className="font-bold">Designation:</span> {submittedData.designation}</p>
                  <p><span className="font-bold">Department:</span> {submittedData.department}</p>
                </div>
                <div>
                  <p><span className="font-bold">Date:</span> {new Date(submittedData.dateOfEvaluation).toLocaleDateString()}</p>
                  <p><span className="font-bold">Submitted:</span> {submittedData.submittedAt}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-isu-green text-white">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">Supplier</th>
                      <th className="border border-gray-300 p-3 text-left">P.O. Number</th>
                      <th className="border border-gray-300 p-3 text-center">Quality</th>
                      <th className="border border-gray-300 p-3 text-center">Price</th>
                      <th className="border border-gray-300 p-3 text-center">Delivery</th>
                      <th className="border border-gray-300 p-3 text-center">Complete</th>
                      <th className="border border-gray-300 p-3 text-center">After-Sales</th>
                      <th className="border border-gray-300 p-3 text-center">Average</th>
                      <th className="border border-gray-300 p-3 text-center">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedData.evaluations.map((evaluation: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 p-3 font-medium">{evaluation.supplierName}</td>
                        <td className="border border-gray-300 p-3">{evaluation.purchaseOrderNo}</td>
                        <td className="border border-gray-300 p-3 text-center">{evaluation.ratings.quality}</td>
                        <td className="border border-gray-300 p-3 text-center">{evaluation.ratings.price}</td>
                        <td className="border border-gray-300 p-3 text-center">{evaluation.ratings.delivery}</td>
                        <td className="border border-gray-300 p-3 text-center">{evaluation.ratings.completeness}</td>
                        <td className="border border-gray-300 p-3 text-center">{evaluation.ratings.afterSales}</td>
                        <td className="border border-gray-300 p-3 text-center font-bold">{evaluation.averageScore.toFixed(2)}</td>
                        <td className="border border-gray-300 p-3 text-center font-bold">{evaluation.ratingCategory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-isu-green/10 p-6 rounded-lg text-center">
                <h3 className="text-lg font-bold text-isu-green mb-2">Overall Batch Results</h3>
                <p className="text-2xl font-black text-isu-green">
                  Average Score: {submittedData.overallAverage.toFixed(2)}
                </p>
                <p className="text-lg font-bold text-isu-gold uppercase tracking-wider">
                  Rating Category: {getCategoryFromScore(submittedData.overallAverage)}
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setShowReceipt(false)}
                  variant="secondary"
                  className="px-6"
                >
                  Close
                </Button>
                <Button
                  onClick={printReceipt}
                  className="px-6 bg-isu-green hover:bg-isu-dark-green text-white gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
