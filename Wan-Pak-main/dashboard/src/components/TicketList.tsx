import { useState, useEffect } from 'react';
import { getTickets, updateTicketStatus, type Ticket } from '../api';
import { Clock, CheckCircle, RefreshCw, AlertCircle, ListTodo } from 'lucide-react';

const TicketList = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getTickets();
      // Sort by created_at descending
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTickets(sorted);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (ticket_id: string, currentStatus: string) => {
    let nextStatus = 'pending';
    if (currentStatus === 'pending') nextStatus = 'accepted';
    else if (currentStatus === 'accepted') nextStatus = 'completed';
    else return;

    try {
      await updateTicketStatus(ticket_id, nextStatus);
      fetchTickets();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle size={14} />;
      case 'accepted': return <Clock size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอรับเรื่อง';
      case 'accepted': return 'กำลังดำเนินการ';
      case 'completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-title" style={{ border: 'none', margin: 0, padding: 0 }}>
          <ListTodo size={24} />
          รายการแจ้งเตือนล่าสุด
        </div>
        <button onClick={fetchTickets} className="btn btn-secondary" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          รีเฟรชข้อมูล
        </button>
      </div>
      
      <hr style={{ border: 'none', borderTop: '2px solid var(--primary-blue-light)', margin: '16px 0 24px 0' }} />

      <div>
        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '8px' }}>
            ยังไม่มีรายการแจ้งเตือนในขณะนี้
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
            {tickets.map(ticket => (
              <div key={ticket.ticket_id} className="ticket-item" style={{ margin: 0 }}>
              <div className="ticket-header">
                <div>
                  <span className={`badge badge-${ticket.status}`} style={{ marginBottom: '8px' }}>
                    {getStatusIcon(ticket.status)} {getStatusText(ticket.status)}
                  </span>
                  <div className="room-number">ห้อง {ticket.room_number}</div>
                </div>
                <div className="ticket-time">
                  เวลา {formatTime(ticket.created_at)} น.
                </div>
              </div>
              
              <div className="ticket-details">
                <div className="detail-row">
                  <span className="detail-label">บริบทที่โทร:</span> 
                  <span style={{ color: 'var(--text-secondary)' }}>{ticket.scenario}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">สิ่งที่แขกต้องการ (Intent):</span> 
                  {ticket.intent}
                </div>
                
                {ticket.extracted_data && (Object.keys(ticket.extracted_data).length > 0) && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '2px' }}>รายการ (Item)</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0f172a' }}>{ticket.extracted_data.items || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '2px' }}>จำนวน (Qty)</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0f172a' }}>{ticket.extracted_data.quantity || '-'} {ticket.extracted_data.unit || ''}</div>
                      </div>
                      {ticket.extracted_data.time && (
                        <div>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '2px' }}>เวลา (Time)</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0f172a' }}>{ticket.extracted_data.time}</div>
                        </div>
                      )}
                    </div>

                    {ticket.extracted_data.notes && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '2px' }}>หมายเหตุ (Notes)</div>
                        <div style={{ fontSize: '0.85rem', color: '#334155' }}>{ticket.extracted_data.notes}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Playback Demo */}
                <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Voice Record
                  </div>
                  <audio controls style={{ height: '28px', width: '100%' }}>
                    {/* Public sample audio for demonstration */}
                    <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
                    Browser does not support audio.
                  </audio>
                </div>
              </div>

              <div className="ticket-actions">
                {ticket.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        handleStatusUpdate(ticket.ticket_id, 'escalated');
                        alert('โอนสายไปยังระบบโทรศัพท์ของ Front Desk แล้ว!');
                      }}
                      className="btn"
                      style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                    >
                      📞 ดึงสายมารับเอง (Escalate)
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(ticket.ticket_id, ticket.status)}
                      className="btn btn-primary"
                    >
                      รับเรื่อง (Accept)
                    </button>
                  </>
                )}
                {ticket.status === 'accepted' && (
                  <button 
                    onClick={() => handleStatusUpdate(ticket.ticket_id, ticket.status)}
                    className="btn"
                    style={{ backgroundColor: 'var(--status-completed)', color: 'white' }}
                  >
                    ดำเนินการเสร็จสิ้น (Complete)
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
