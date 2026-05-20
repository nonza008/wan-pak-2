import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import { 
  LayoutDashboard, Users, UserCheck, Settings as SettingsIcon, LogOut, 
  Bell, BarChart2, CheckSquare, Clock, AlertCircle, X, PhoneCall, CheckCircle2 
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import GuestList from './pages/GuestList';
import StaffDuty from './pages/StaffDuty';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

// โครงสร้างออบเจกต์ข้อมูลตั๋วตามฟิลด์หลังบ้านและหน้าบ้านของคุณ
interface Ticket {
  id: string;
  room_number: string;
  intent: string;
  items?: string;
  notes?: string;
  status?: string;
  scenario?: string;
  created_at?: string;
}

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pendingTickets, setPendingTickets] = useState<Ticket[]>([]);
  const [isOpenNotification, setIsOpenNotification] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. ฟังก์ชันดึงคิวงานจาก Database ผ่าน API หลังบ้าน
  const fetchTicketsData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/tickets/');
      if (response.data.status === 'success') {
        const allTickets = response.data.tickets || [];
        setTickets(allTickets);
        
        // กรองหาเฉพาะรายการที่สถานะเป็น 'รอรับเรื่อง', 'pending' หรือยังไม่มีสถานะ เพื่อส่งขึ้นกระดิ่ง
        const pending = allTickets.filter(
          (t: Ticket) => t.status === 'รอรับเรื่อง' || t.status === 'pending' || !t.status
        );
        setPendingTickets(pending);

        // อัปเดตข้อมูลการ์ดที่กำลังเปิดดูอยู่แบบเรียลไทม์ด้วย (เผื่อมีสถานะเปลี่ยนจากฝั่งอื่น)
        if (selectedTicket) {
          const currentTicket = allTickets.find((t: Ticket) => t.id === selectedTicket.id);
          if (currentTicket) setSelectedTicket(currentTicket);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets data:", error);
    }
  };

  // 2. ตั้งเวลาดึงข้อมูลใหม่แบบอัตโนมัติทุกๆ 5 วินาที (Real-time Polling)
  useEffect(() => {
    fetchTicketsData();
    const interval = setInterval(fetchTicketsData, 5000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  // 3. ปิดกล่องแจ้งเตือนดรอปดาวน์เมื่อเมาส์คลิกพื้นที่ข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenNotification(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. ฟังก์ชันสำหรับอัปเดตสถานะของตั๋ว (เมื่อกดปุ่ม รับเรื่อง หรือ ดึงสายมารับเอง)
  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      // ยิง API อัปเดตไปยังหลังบ้านของคุณ
      const response = await axios.put(`http://127.0.0.1:8000/api/tickets/${ticketId}`, {
        status: newStatus
      });
      
      if (response.data.status === 'success') {
        alert(`อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`);
        setSelectedTicket(null); // ปิดหน้าต่างการ์ดรายละเอียด
        fetchTicketsData(); // รีเฟรชข้อมูลคิวงานใหม่ทันที
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      // Fallback สำหรับทดสอบหน้าบ้านกรณียังไม่ได้เปิดเซิร์ฟเวอร์หลังบ้าน
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      setPendingTickets(prev => prev.filter(t => t.id !== ticketId));
      setSelectedTicket(null);
    }
  };

  return (
    <Router>
      <div className="dashboard-container">
        {/* === แถบเมนูด้านซ้าย (Sidebar) จัดเรียงตามบรีฟเอกสาร === */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">W</div>
            <div>
              <h1 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>วันพัก (Wan-Pak)</h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.75rem', margin: 0 }}>Aura AI Voice Concierge</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>1. Dashboard (หน้าหลัก)</span>
            </NavLink>
            <NavLink to="/guests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CheckSquare size={20} />
              <span>2. Task Board / Tickets</span>
            </NavLink>
            <NavLink to="/staff" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <UserCheck size={20} />
              <span>3. Staff Management</span>
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BarChart2 size={20} />
              <span>4. Reports & Analytics</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <SettingsIcon size={20} />
              <span>5. Settings (ตั้งค่า)</span>
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto' }}>
            <button className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <LogOut size={20} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </aside>

        {/* === พื้นที่เนื้อหาหลัก (Main Content) === */}
        <main className="main-content">
          <header className="page-header" style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ visibility: 'hidden' }}>Spacer</div>
            <div className="user-profile">
              
              {/* 🔔 ส่วนปุ่มกระดิ่งแจ้งเตือน */}
              <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsOpenNotification(!isOpenNotification)}
                  className="btn btn-secondary" 
                  style={{ padding: '8px', borderRadius: '50%', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Bell size={20} />
                  {pendingTickets.length > 0 && (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      backgroundColor: '#EF4444', color: 'white', borderRadius: '50%',
                      width: '18px', height: '18px', fontSize: '11px', fontWeight: 'bold',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 6px rgba(239,68,68,0.6)'
                    }}>
                      {pendingTickets.length}
                    </span>
                  )}
                </button>

                {/* 📂 กล่องรายการแจ้งเตือนย้อยลงมา (Dropdown Menu) */}
                {isOpenNotification && (
                  <div style={{
                    position: 'absolute', top: '45px', right: 0,
                    width: '340px', backgroundColor: '#1e293b', border: '1px solid #475569',
                    borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                    zIndex: 9999, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '14px', borderBottom: '1px solid #475569', fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#0f172a' }}>
                      <span style={{ color: '#e2e8f0' }}>งานเข้ามาใหม่ด่วน</span>
                      <span className="animate-pulse" style={{ color: '#f43f5e', fontSize: '12px', backgroundColor: '#881337', padding: '2px 8px', borderRadius: '12px' }}>
                        ค้าง {pendingTickets.length} สาย
                      </span>
                    </div>
                    
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {pendingTickets.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                          ยังไม่มีสายแจ้งเรื่องใหม่เข้ามาในคิว
                        </div>
                      ) : (
                        pendingTickets.map((t) => (
                          <div 
                            key={t.id} 
                            onClick={() => {
                              setSelectedTicket(t); // คลิกเพื่อเลือกตั๋วและเปิดหน้าต่างดูข้อมูล
                              setIsOpenNotification(false); // หุบกล่องกระดิ่งเก็บไป
                            }}
                            style={{ 
                              padding: '14px', borderBottom: '1px solid #334155', fontSize: '13px', 
                              display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#1e293b',
                              cursor: 'pointer', transition: 'background-color 0.2s'
                            }}
                            className="hover-notification-item"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#273549')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                          >
                            <AlertCircle size={18} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ width: '100%' }}>
                              <div style={{ fontWeight: 'bold', color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                                <span>ห้อง {t.room_number}</span>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>เมื่อสักครู่</span>
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>
                                เรื่อง: <span style={{ color: '#38bdf8', fontWeight: 'medium' }}>{t.intent || 'ทั่วไป'}</span> {t.items && `[${t.items}]`}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', fontStyle: 'italic' }}>
                                คลิกเพื่อเปิดดูรายละเอียดและรับเรื่อง...
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ borderLeft: '1px solid var(--border-color)', height: '40px', margin: '0 8px' }}></div>
              <div className="user-info">
                <div className="user-name">คุณสมชาย สุขใจ</div>
                <div className="user-role">พนักงานต้อนรับ</div>
              </div>
              <div className="avatar">ส</div>
            </div>
          </header>

          {/* === 🗂️ หน้าต่างโมดอลป๊อปอัปแสดงการ์ดตั๋ว (เมื่อพนักงานกดคลิกเลือกจากกระดิ่ง) === */}
          {selectedTicket && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 10000, padding: '20px'
            }}>
              {/* ตัวกล่องการ์ดรายละเอียดตั๋ว (ถอดสไตล์ดีไซน์ตามรูปแบบของทีมเป๊ะๆ) */}
              <div style={{ 
                width: '100%', maxWidth: '460px', backgroundColor: '#ffffff', 
                borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                color: '#1e293b', border: '1px solid #e2e8f0', position: 'relative'
              }}>
                
                {/* ปุ่มกากบาทปิดโมดอล */}
                <button 
                  onClick={() => setSelectedTicket(null)}
                  style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} color="#94a3b8" />
                </button>

                <div style={{ padding: '24px' }}>
                  {/* แถบสถานะด้านบน */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ 
                      backgroundColor: '#FEF3C7', color: '#D97706', padding: '6px 14px', 
                      borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' 
                    }}>
                      <span style={{ width: '6px', height: '6px', backgroundColor: '#D97706', borderRadius: '50%' }}></span>
                      {selectedTicket.status || 'รอรับเรื่อง'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>เวลา 07:33 น.</span>
                  </div>

                  {/* เลขห้องพัก */}
                  <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 20px 0', color: '#0f172a' }}>
                    ห้อง {selectedTicket.room_number}
                  </h2>

                  {/* รายละเอียดเนื้อหาข้อมูล */}
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>บริบทที่โทร:</span> &nbsp;
                      <span style={{ fontWeight: '600', color: '#334155' }}>{selectedTicket.scenario || 'unknown'}</span>
                    </div>
                    
                    <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>สิ่งที่แขกต้องการ (Intent):</span> &nbsp;
                      <span style={{ fontWeight: '700', color: '#e11d48' }}>{selectedTicket.intent || 'error'}</span>
                    </div>

                    {/* ตารางย่อยแจกแจงรายการ */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>รายการ (ITEM)</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{selectedTicket.items || '-'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>จำนวน (QTY)</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{selectedTicket.notes || '1 ชิ้น'}</div>
                      </div>
                    </div>
                  </div>

                  {/* แถบจำลองเครื่องเล่นเสียงบันทึก (Voice Record Player) */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Voice Record</div>
                    <div style={{ backgroundColor: '#f1f5f9', borderRadius: '30px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <audio controls style={{ width: '100%', height: '32px' }}>
                        <source src="#" type="audio/mpeg" />
                        เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
                      </audio>
                    </div>
                  </div>

                  {/* 🔘 ปุ่มกดแอ็กชันใช้งานจริง 2 ปุ่มหลักด้านล่าง */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'กำลังดำเนินการ')}
                      style={{ 
                        flex: 1, backgroundColor: '#FFE000', color: '#000000', border: 'none', 
                        padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', 
                        cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(254,240,138,0.5)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E6C800')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFE000')}
                    >
                      รับเรื่อง (Accept)
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'ส่งต่อพนักงาน')}
                      style={{ 
                        flex: 1, backgroundColor: '#FFF1F2', color: '#E11D48', border: '1px solid #FFE4E6', 
                        padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', 
                        cursor: 'pointer', transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFE4E6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFF1F2')}
                    >
                      📞 ดึงสายมารับเอง (Escalate)
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* จัดสวิตช์หน้าต่างเว็บไซต์ */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/guests" element={<GuestList />} />
            <Route path="/staff" element={<StaffDuty />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;