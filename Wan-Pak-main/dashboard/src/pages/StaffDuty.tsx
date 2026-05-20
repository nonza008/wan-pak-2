import { useState, useEffect } from 'react';
import { Edit2, Save, X, Check } from 'lucide-react';
import { getStaff, updateStaff, type Staff } from '../api';

const StaffDuty = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Staff>>({});

  const loadStaff = async () => {
    try {
      const data = await getStaff();
      setStaffList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleEditClick = (staff: Staff) => {
    setEditingId(staff.id);
    setEditForm({ name: staff.name, shift: staff.shift });
  };

  const handleSave = async (id: string) => {
    try {
      await updateStaff(id, editForm);
      setStaffList(staffList.map(s => 
        s.id === id ? { ...s, name: editForm.name || s.name, shift: editForm.shift || s.shift } : s
      ));
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCheckIn = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (!staff) return;
    
    const newStatus = staff.status === 'checked-in' ? 'pending' : 'checked-in';
    try {
      await updateStaff(id, { status: newStatus });
      setStaffList(staffList.map(s => 
        s.id === id ? { ...s, status: newStatus } : s
      ));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2 className="page-title">ระบบจัดการบุคลากร (Staff Duty)</h2>
          <p className="page-subtitle">เช็คอินเข้างานและแก้ไขข้อมูลพนักงานในกะปัจจุบัน</p>
        </div>
      </header>

      <div className="grid-cards">
        {staffList.map((staff) => (
          <div key={staff.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="avatar" style={{ width: '50px', height: '50px', fontSize: '1.2rem', backgroundColor: staff.status === 'checked-in' ? 'var(--primary-navy)' : '#cbd5e1' }}>
                  {staff.name.replace('คุณ', '').charAt(0)}
                </div>
                <div>
                  {editingId === staff.id ? (
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '6px 10px', marginBottom: '8px', width: '100%' }}
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  ) : (
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-navy)', marginBottom: '4px' }}>{staff.name}</h3>
                  )}
                  
                  <button 
                    onClick={() => toggleCheckIn(staff.id)}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '4px',
                      color: staff.status === 'checked-in' ? 'var(--status-completed)' : 'var(--text-secondary)',
                      fontWeight: 600, fontSize: '0.85rem'
                    }}
                  >
                    {staff.status === 'checked-in' ? <Check size={16} /> : <div style={{width: 14, height: 14, border: '2px solid currentColor', borderRadius: '50%'}}></div>}
                    {staff.status === 'checked-in' ? 'เข้างานแล้ว (Checked In)' : 'ยังไม่เข้างาน (Not Checked In)'}
                  </button>
                </div>
              </div>
              
              {/* Edit Controls */}
              {editingId === staff.id ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleSave(staff.id)} className="btn btn-primary" style={{ padding: '6px', borderRadius: '6px' }} title="บันทึก">
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="ยกเลิก">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => handleEditClick(staff)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none' }} title="แก้ไขข้อมูล">
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ตำแหน่งงาน:</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>{staff.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>เวลากะ (Shift):</span>
                {editingId === staff.id ? (
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ padding: '4px 8px', width: '120px', textAlign: 'right' }}
                    value={editForm.shift} 
                    onChange={(e) => setEditForm({...editForm, shift: e.target.value})}
                  />
                ) : (
                  <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>{staff.shift}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default StaffDuty;
