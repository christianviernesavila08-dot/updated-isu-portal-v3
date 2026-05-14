import React, { useState, useEffect } from 'react';
import { getAllEvaluations } from '../lib/api';
import { EvaluationRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Users, Award, AlertTriangle, Filter } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

export function Dashboard({ user }: { user: any }) {
  const [allRecords, setAllRecords] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.id) return;
      try {
        const records = await getAllEvaluations(user.id);
        setAllRecords(records);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user?.id]);

  // Filter records based on selected batch
  const filteredRecords = selectedBatchId === 'all' 
    ? allRecords 
    : allRecords.filter(r => r.batchId === selectedBatchId);

  // Group batches for selection
  const batches = Array.from(new Set(allRecords.map(r => r.batchId || 'legacy')))
    .map(batchId => {
      const batchRecord = allRecords.find(r => (r.batchId || 'legacy') === batchId);
      return {
        id: batchId,
        name: batchRecord?.batchName || 'Previous Legacy Records',
        date: batchRecord?.dateOfEvaluation || 'N/A'
      };
    }).sort((a, b) => b.id.localeCompare(a.id));

  const avgCampusScore = filteredRecords.length > 0
    ? (filteredRecords.reduce((acc, curr) => acc + curr.averageScore, 0) / filteredRecords.length).toFixed(2)
    : '0.00';

  const highPerformers = filteredRecords.filter(r => r.averageScore >= 4.5);
  const needsImprovement = filteredRecords.filter(r => r.averageScore < 3.5);

  const chartData = filteredRecords.map(r => ({
    name: r.supplierName.substring(0, 10) + '...',
    score: r.averageScore,
    full: r.supplierName
  })).reverse();

  // Calculate stats for Quarterly highlights
  const calcAvg = (key: keyof EvaluationRecord['ratings']) => {
    if (filteredRecords.length === 0) return '0.00';
    const sum = filteredRecords.reduce((acc, curr) => acc + curr.ratings[key], 0);
    return (sum / filteredRecords.length).toFixed(2);
  };

  const getAdjectival = (score: string) => {
    const s = parseFloat(score);
    if (s >= 4.5) return 'Excellent';
    if (s >= 3.5) return 'Very Satisfactory';
    if (s >= 2.5) return 'Satisfactory';
    if (s >= 1.5) return 'Fair';
    return 'Poor';
  };

  const highlightMetrics = [
    { label: "Conformity to Technical Specifications / Service Requirements", score: calcAvg('quality') },
    { label: "Delivery Timeliness / Service Responsiveness", score: calcAvg('delivery') },
    { label: "Quality of Goods Delivered / Quality of Service Rendered", score: calcAvg('quality') },
    { label: "Completeness of Delivery (Quantity and Specifications, where applicable)", score: calcAvg('completeness') },
    { label: "Compliance with Contractual and Office Requirements", score: calcAvg('price') },
    { label: "After-Sales Support / Responsiveness to Concerns (as applicable)", score: calcAvg('afterSales') },
  ];

  const highestRatingCount = filteredRecords.filter(r => r.averageScore === 5).length;
  const minRecord = filteredRecords.length > 0 
    ? [...filteredRecords].sort((a, b) => a.averageScore - b.averageScore)[0]
    : null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-gray-200 pb-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Management</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Analytics & Procurement Insights</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <span className="text-[9px] font-black uppercase text-gray-400">Select View:</span>
            <select 
              className="bg-gray-100 border-none rounded-lg text-[11px] font-bold uppercase tracking-wider px-4 py-2 cursor-pointer focus:ring-2 focus:ring-isu-green appearance-none min-w-[200px]"
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
              }}
            >
              <option value="all">Institutional View (All Batches)</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.date})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => window.print()}
            className="gap-2 rounded-lg text-xs font-bold uppercase tracking-wider h-10 px-6 border-2 border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="text-isu-green w-5 h-5" />}
          label={selectedBatchId === 'all' ? "Institutional Avg" : "Batch Avg"}
          value={avgCampusScore}
          subValue={selectedBatchId === 'all' ? "Total Benchmarking" : "Current Session Performance"}
        />
        <StatCard
          icon={<Users className="text-gray-600 w-5 h-5" />}
          label="Providers"
          value={new Set(filteredRecords.map(r => r.supplierName)).size.toString()}
          subValue="Evaluation Sample Size"
        />
        <StatCard
          icon={<Award className="text-isu-gold w-5 h-5" />}
          label="High Rank"
          value={highPerformers.length.toString()}
          subValue="Scored Excellent"
        />
        <StatCard
          icon={<AlertTriangle className="text-rose-500 w-5 h-5" />}
          label="Risk Flag"
          value={needsImprovement.length.toString()}
          subValue="Below Campus Standard"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Performance Distribution ({selectedBatchId === 'all' ? 'All Records' : 'Selected Batch'})</h3>
          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                    labelFormatter={() => ''}
                    formatter={(value) => [value.toFixed(2), 'Score']}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.score >= 4.5 ? '#006838' : entry.score >= 3.5 ? '#fdb913' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] w-full flex items-center justify-center bg-gray-50 rounded border border-gray-200">
              <p className="text-gray-400 text-sm">No data available</p>
            </div>
          )}
        </div>

        <div className="bg-white text-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 flex flex-col">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-isu-green">Quarterly Performance Highlights</h3>
            <p className="text-[10px] font-bold text-isu-gold uppercase tracking-widest mt-1">(Goods and Services)</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            <p className="text-[11px] leading-relaxed text-gray-600 italic">
              Quarterly performance reviews covered a wide range of suppliers providing goods and services. 
              Outsourced service providers demonstrated consistent performance across evaluation periods.
            </p>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-isu-green/5 border-b border-gray-200">
                  <tr className="text-[10px] font-bold text-isu-green uppercase">
                    <th className="p-3 w-3/5 border-r border-gray-200">Performance Criteria</th>
                    <th className="p-3 text-center border-r border-gray-200">Avg Rating</th>
                    <th className="p-3 text-center">Equivalent</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {highlightMetrics.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="p-3 border-r border-gray-100 text-gray-700">{m.label}</td>
                      <td className="p-3 text-center border-r border-gray-100 font-bold">{m.score}</td>
                      <td className="p-3 text-center text-gray-500 font-medium italic">{getAdjectival(m.score)}</td>
                    </tr>
                  ))}
                  <tr className="bg-isu-green/5 font-black text-isu-green border-t-2 border-gray-200">
                    <td className="p-3 border-r border-gray-200 uppercase">Overall Average Rating</td>
                    <td className="p-3 text-center border-r border-gray-200">{avgCampusScore}</td>
                    <td className="p-3 text-center uppercase tracking-tighter text-isu-gold">{getAdjectival(avgCampusScore)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-[10px] leading-relaxed text-gray-700">
                The highest rating for the period which is 5 or Excellent, were received by <span className="font-bold text-isu-green">{highestRatingCount}</span> suppliers. 
                {minRecord && (
                  <> The lowest rating is <span className="font-bold text-rose-600">{minRecord.averageScore}</span> or <span className="font-bold">{minRecord.ratingCategory}</span>, received by <span className="font-black italic text-gray-900 underline decoration-isu-gold/30 decoration-4 underline-offset-2">{minRecord.supplierName}</span> for the projects evaluation. Appropriate actions were taken regarding the said supplier's performance.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{selectedBatchId === 'all' ? 'Institutional Log' : 'Batch Specific Log'}</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-isu-green animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">{filteredRecords.length} Records in View</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-white">
                <th className="px-8 py-5">Supplier</th>
                <th className="px-8 py-5 text-center">Metric</th>
                <th className="px-8 py-5">Verified Date</th>
                <th className="px-8 py-5">Classification</th>
                <th className="px-8 py-5">Batch Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-8 py-4 font-bold text-gray-900 group-hover:text-isu-green transition-colors text-sm">{r.supplierName}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs font-black text-gray-900 w-8">{r.averageScore}</span>
                      <div className="w-16 bg-gray-100 h-1 rounded-full overflow-hidden shrink-0">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000", r.averageScore >= 4.5 ? "bg-isu-green" : "bg-gray-400")}
                          style={{ width: `${(r.averageScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-[11px] font-bold text-gray-400">{r.dateOfEvaluation}</td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter",
                      r.ratingCategory === 'Excellent' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      r.ratingCategory === 'Very Satisfactory' ? "bg-isu-gold/20 text-isu-dark-green border border-isu-gold/30" :
                      "bg-rose-50 text-rose-700 border border-rose-100"
                    )}>
                      {r.ratingCategory}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-isu-green uppercase truncate max-w-[250px]">{r.batchName}</span>
                      <span className="text-[8px] text-gray-400 font-bold uppercase">{r.department}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
      <div className="space-y-1">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        <p className="text-[9px] text-gray-400 font-bold uppercase">{subValue}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-isu-green/5 transition-colors">
        {icon}
      </div>
    </div>
  );
}
