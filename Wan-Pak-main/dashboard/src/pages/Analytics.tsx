import { useState, useEffect } from 'react';
import { BarChart, PieChart, Activity, PhoneCall, Clock, CheckCircle } from 'lucide-react';
import { getAnalytics, type AnalyticsSummary } from '../api';

const Analytics = () => {
  const [stats, setStats] = useState<AnalyticsSummary>({
    total_calls: 0,
    success_rate: '0%',
    escalation_rate: '0%',
    avg_talk_time: '0 วินาที',
    top_scenarios: {}
  });

  const loadStats = async () => {
    try {
      const data = await getAnalytics();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mock Data for charts
  const weeklyCalls = [
    { day: 'จันทร์', calls: 45, height: '40%' },
    { day: 'อังคาร', calls: 52, height: '50%' },
    { day: 'พุธ', calls: 38, height: '35%' },
    { day: 'พฤหัสฯ', calls: 65, height: '70%' },
    { day: 'ศุกร์', calls: 80, height: '85%' },
    { day: 'เสาร์', calls: 95, height: '100%' },
    { day: 'อาทิตย์', calls: 85, height: '90%' },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <h2 className="page-title">รายงานสถิติ (Analytics)</h2>
          <p className="page-subtitle">ประสิทธิภาพการทำงานของระบบ AI และพนักงาน</p>
        </div>
      </header>

      {/* KPI Summary */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="card stat-box" style={{ padding: '20px' }}>
          <div className="stat-icon navy"><PhoneCall size={24} /></div>
          <div>
            <div className="stat-label">สายทั้งหมด (Total)</div>
            <div className="stat-value">{stats.total_calls}</div>
          </div>
        </div>
        <div className="card stat-box" style={{ padding: '20px' }}>
          <div className="stat-icon yellow"><CheckCircle size={24} /></div>
          <div>
            <div className="stat-label">AI จัดการสำเร็จ</div>
            <div className="stat-value" style={{ color: 'var(--status-completed)' }}>{stats.success_rate}</div>
          </div>
        </div>
        <div className="card stat-box" style={{ padding: '20px' }}>
          <div className="stat-icon gray"><Activity size={24} /></div>
          <div>
            <div className="stat-label">โอนสาย (Escalated)</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{stats.escalation_rate}</div>
          </div>
        </div>
        <div className="card stat-box" style={{ padding: '20px' }}>
          <div className="stat-icon navy"><Clock size={24} /></div>
          <div>
            <div className="stat-label">เวลาเฉลี่ย (Avg Time)</div>
            <div className="stat-value">{stats.avg_talk_time.replace('วินาที', '')}<span style={{ fontSize: '1rem', marginLeft: '4px' }}>วินาที</span></div>
          </div>
        </div>
      </div>

      <div className="grid-main" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Bar Chart Card */}
        <div className="card">
          <div className="card-title">
            <BarChart size={24} />
            ปริมาณสายเรียกเข้าแยกตามวัน (สัปดาห์นี้)
          </div>
          
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0 0 0', borderBottom: '1px solid var(--border-color)' }}>
            {weeklyCalls.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', paddingBottom: '8px' }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: item.height, 
                      backgroundColor: 'var(--primary-navy)', 
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 1s ease-out'
                    }}
                    title={`${item.calls} สาย`}
                  ></div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{item.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Scenarios */}
        <div className="card">
          <div className="card-title">
            <PieChart size={24} />
            หัวข้อที่แขกเรียกใช้บ่อยสุด
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(stats.top_scenarios).length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>ไม่มีข้อมูล (No data)</div>
            ) : (
              Object.entries(stats.top_scenarios).map(([scenario, count], idx) => {
                const total = stats.total_calls;
                const percentage = Math.round((count / total) * 100);
                const colors = ['var(--primary-navy)', 'var(--accent-blue)', 'var(--accent-yellow)', '#94a3b8', '#10b981'];
                const bgColor = colors[idx % colors.length];
                return (
                  <div key={scenario}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, textTransform: 'capitalize' }}>
                      <span>{scenario.replace('_', ' ')}</span>
                      <span>{percentage}% ({count})</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: bgColor }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;
