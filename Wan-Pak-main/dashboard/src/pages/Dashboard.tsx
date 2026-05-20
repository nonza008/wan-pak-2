import Overview from '../components/Overview';
import TicketList from '../components/TicketList';

const Dashboard = () => {
  return (
    <>
      {/* ส่วนหัวข้อศูนย์ควบคุม (สะอาด ไม่มีปุ่มและฟอร์มส่วนเกิน) */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">ศูนย์ควบคุม (Command Center)</h2>
          <p className="page-subtitle">จัดการคำขอของแขกแบบเรียลไทม์จากระบบ AI</p>
        </div>
      </header>

      {/* ส่วนแสดงผลภาพรวม (Overview บล็อกการ์ดสถิติต่างๆ) */}
      <Overview />

      {/* ส่วนตารางรายการคำขอหลักที่ดึงข้อมูลจาก Database */}
      <div className="grid-main">
        <div style={{ gridColumn: '1 / -1' }}>
          <TicketList />
        </div>
      </div>
    </>
  );
};

export default Dashboard;