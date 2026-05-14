import React, { useState, useEffect } from 'react';
import { getUserStats, resetEvaluations } from '../lib/api';
import { EvaluationRecord } from '../types';
import { ClipboardList, LayoutDashboard, TrendingUp, Users, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

export function HomeView({ user, onStart, onDashboard }: { user: any, onStart: () => void, onDashboard: () => void }) {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    avg: 0
  });
  const [recent, setRecent] = useState<EvaluationRecord[]>([]);
  const [resetting, setResetting] = useState(false);

  const refreshStats = async () => {
    if (!user?.id) return;
    try {
      const response = await getUserStats(user.id);
      setStats({
        total: response.totalEvaluations,
        today: response.evaluationsToday,
        avg: response.averageScore,
      });
      setRecent(response.recentRecords);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const resetData = async () => {
    if (!user?.id) return;
    if (!window.confirm('Are you sure you want to PERMANENTLY delete all your evaluation records? This cannot be undone.')) return;
    setResetting(true);

    try {
      await resetEvaluations(user.id);
      await refreshStats();
    } catch (err) {
      console.error(err);
      alert('Error resetting data. Check the backend logs.');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, [user?.id]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-10">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-isu-green/10 text-isu-green rounded-full text-[10px] font-black uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" /> Evaltuation Portal
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
          Welcome back, <br/>
          <span className="text-isu-green">{user?.displayName?.split(' ')[0]}</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Evaluations" 
          value={stats.total.toString()} 
          icon={<Users className="text-isu-green w-5 h-5" />}
          trend="Lifetime Records"
        />
        <MetricCard 
          label="Submissions Today" 
          value={stats.today.toString()} 
          icon={<Clock className="text-isu-gold w-5 h-5" />}
          trend="Daily Activity"
        />
        <MetricCard 
          label="System Avg Score" 
          value={stats.avg.toString()} 
          icon={<TrendingUp className="text-isu-green w-5 h-5" />}
          trend="Overall Benchmark"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick Actions</h3>
            <button 
              onClick={resetData}
              disabled={resetting}
              className="text-[9px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Reset Database'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={onStart}
              className="group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-isu-green/20 transition-all text-left"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-isu-green text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">New Batch Evaluation</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Start assessing providers</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-isu-green group-hover:translate-x-1 transition-all" />
            </button>

            <button 
              onClick={onDashboard}
              className="group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-isu-gold/20 transition-all text-left"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-isu-gold text-isu-dark-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Analytics Dashboard</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">View trends and reports</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-isu-gold group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </section>

        {/* Recent Feed */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Recent Submissions</h3>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
            {recent.length > 0 ? recent.map((r, i) => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex gap-3 items-center">
                  <div className="text-[9px] font-black text-gray-300 w-4">0{i+1}</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{r.supplierName}</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase">{r.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-isu-green">{r.averageScore}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-isu-gold" />
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-gray-300 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-20" />
                <p className="text-[10px] uppercase font-bold tracking-widest">No recent submissions</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-isu-green/5 transition-colors">
          {icon}
        </div>
        <span className="text-[8px] font-black uppercase text-gray-300 tracking-tighter">{trend}</span>
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}
