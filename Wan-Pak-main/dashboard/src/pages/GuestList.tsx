import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getGuests, getGuestRingQr, type Guest } from '../api';

const GuestList = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [qrLoadingRoom, setQrLoadingRoom] = useState<string | null>(null);

  const loadGuests = async () => {
    try {
      const data = await getGuests();
      setGuests(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGuests();
  }, []);

  const handleShowQr = async (guest: Guest) => {
    setQrLoadingRoom(guest.room_number);
    try {
      const data = await getGuestRingQr(guest.room_number);
      window.open(data.qr_url, '_blank');
    } catch (error) {
      console.error(error);
      alert(`เปิด QR ไม่สำเร็จสำหรับห้อง ${guest.room_number}`);
    } finally {
      setQrLoadingRoom(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2 className="page-title">รายชื่อแขก (Guest List)</h2>
          <p className="page-subtitle">จัดการข้อมูลแขกที่เข้าพักและจองล่วงหน้า</p>
        </div>
      </header>

      <div className="card">
        <div className="card-title">
          <Users size={24} />
          รายชื่อแขกทั้งหมด
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '16px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px' }}>ห้องพัก</th>
              <th style={{ padding: '12px' }}>ชื่อ-นามสกุล</th>
              <th style={{ padding: '12px' }}>เบอร์โทร</th>
              <th style={{ padding: '12px' }}>บริการหลัก</th>
              <th style={{ padding: '12px' }}>สถานะ</th>
              <th style={{ padding: '12px' }}>วันที่เช็คเอาท์</th>
              <th style={{ padding: '12px' }}>QR ลูกค้า</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--primary-navy)' }}>{guest.room_number}</td>
                <td style={{ padding: '16px 12px' }}>{guest.guest_name}</td>
                <td style={{ padding: '16px 12px' }}>{guest.phone_number || '-'}</td>
                <td style={{ padding: '16px 12px' }}>{guest.preferred_scenario || '-'}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span className={`badge ${guest.status === 'checked-in' ? 'badge-accepted' : 'badge-pending'}`}>
                    {guest.status === 'checked-in' ? 'In-house' : guest.status}
                  </span>
                </td>
                <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>{guest.check_out_date}</td>
                <td style={{ padding: '16px 12px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                    onClick={() => handleShowQr(guest)}
                    disabled={qrLoadingRoom === guest.room_number}
                  >
                    {qrLoadingRoom === guest.room_number ? 'กำลังสร้าง...' : 'QR Ring'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GuestList;
