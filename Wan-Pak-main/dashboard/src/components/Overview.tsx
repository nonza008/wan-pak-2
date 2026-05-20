import { useState, useEffect } from 'react';
import { getTickets } from '../api';
import { PhoneCall, CheckCircle, Clock } from 'lucide-react';

const Overview = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tickets = await getTickets();
        setStats({
          total: tickets.length,
          pending: tickets.filter(t => t.status === 'pending').length,
          completed: tickets.filter(t => t.status === 'completed').length
        });
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid-cards">
      <div className="card stat-box">
        <div className="stat-icon navy">
          <PhoneCall size={24} />
        </div>
        <div>
          <div className="stat-label">จำนวนสายโทรออกวันนี้</div>
          <div className="stat-value">{stats.total}</div>
        </div>
      </div>

      <div className="card stat-box">
        <div className="stat-icon yellow">
          <Clock size={24} />
        </div>
        <div>
          <div className="stat-label">งานที่รอรับเรื่อง</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
      </div>

      <div className="card stat-box">
        <div className="stat-icon gray">
          <CheckCircle size={24} />
        </div>
        <div>
          <div className="stat-label">งานที่เสร็จสิ้น</div>
          <div className="stat-value">{stats.completed}</div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
