import { useState } from 'react';
import { simulateInbound, type InboundPayload } from '../api';
import { PhoneIncoming, Loader2, MessageSquare } from 'lucide-react';

const scenarios = [
  { value: 'room_service', label: 'รูมเซอร์วิส (Room Service)' },
  { value: 'housekeeping', label: 'แม่บ้าน (Housekeeping)' },
  { value: 'maintenance', label: 'แจ้งซ่อม (Maintenance)' },
  { value: 'info', label: 'สอบถามข้อมูล (Info)' },
];

const TriggerCallForm = () => {
  const [formData, setFormData] = useState<InboundPayload>({
    room_number: '',
    transcript: '',
    scenario: scenarios[0].value,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await simulateInbound(formData);
      setMessage({ text: 'จำลองสายเข้าเรียบร้อย ระบบกำลังประมวลผล...', type: 'success' });
      setFormData({ ...formData, room_number: '', transcript: '' });
    } catch (error) {
      console.error(error);
      setMessage({ text: 'เกิดข้อผิดพลาด โปรดตรวจสอบการเชื่อมต่อ', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="card">
        <div className="card-title">
          <PhoneIncoming size={24} color="#10b981" />
          จำลองระบบรับสายแขก (Inbound Test)
        </div>
        
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="room_number">หมายเลขห้องพัก (Room Number)</label>
            <input
              type="text"
              id="room_number"
              name="room_number"
              className="input-field"
              placeholder="เช่น 402, 501"
              value={formData.room_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="scenario">หมวดหมู่บริการ</label>
            <select
              id="scenario"
              name="scenario"
              className="input-field"
              value={formData.scenario}
              onChange={handleChange}
            >
              {scenarios.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="transcript">ข้อความที่แขกพูด (Transcript)</label>
            <textarea
              id="transcript"
              name="transcript"
              className="input-field"
              placeholder="พิมพ์สิ่งที่แขกน่าจะพูด... เช่น ขอน้ำเปล่า 2 ขวดครับ"
              value={formData.transcript}
              onChange={handleChange}
              required
              rows={4}
              style={{ resize: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', backgroundColor: '#10b981' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <MessageSquare size={20} />}
            {loading ? 'กำลังส่งข้อมูลให้ AI...' : 'จำลองให้ AI รับสาย'}
          </button>
        </form>
      </div>
  );
};

export default TriggerCallForm;
