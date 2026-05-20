import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { getSettings, updateSettings, type AppSettings } from '../api';

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    groq_api_key: '',
    botnoi_api_key: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings({
          groq_api_key: data.groq_api_key || '',
          botnoi_api_key: data.botnoi_api_key || '',
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
        setMessage({ text: 'ไม่สามารถโหลดการตั้งค่าได้', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(settings);
      setMessage({ text: 'บันทึกการเชื่อมต่อเรียบร้อยแล้ว!', type: 'success' });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ text: 'บันทึกไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อ', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color="var(--primary-navy)" /></div>;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h2 className="page-title">การตั้งค่าระบบ (Settings)</h2>
          <p className="page-subtitle">จัดการการเชื่อมต่อ API และกำหนดค่าระบบตอบรับอัตโนมัติ</p>
        </div>
      </header>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' && <CheckCircle2 size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-title">
            <SettingsIcon size={24} />
            การเชื่อมต่อ API (API Keys)
          </div>
          
          <div className="input-group">
            <label>Botnoi Voice API Key</label>
            <input 
              type="text" 
              name="botnoi_api_key"
              value={settings.botnoi_api_key} 
              onChange={handleChange}
              className="input-field" 
              placeholder="ใส่ API Key ของ Botnoi ที่นี่..."
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>ใช้สำหรับระบบสั่งโทรออกและเสียงสังเคราะห์ (TTS)</p>
          </div>
          
          <div className="input-group">
            <label>Groq API Key (Llama 3.1)</label>
            <input 
              type="text" 
              name="groq_api_key"
              value={settings.groq_api_key} 
              onChange={handleChange}
              className="input-field" 
              placeholder="ใส่ API Key ของ Groq ที่นี่..."
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>ใช้สำหรับประมวลผลข้อความและหาความต้องการแขก (Intent Classification)</p>
          </div>

          <div className="input-group">
            <label>Firebase Service Account Path</label>
            <input type="text" value="serviceAccountKey.json" className="input-field" readOnly disabled style={{ backgroundColor: '#f1f5f9' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--status-completed)', marginTop: '4px', fontWeight: 500 }}>เชื่อมต่อ Firebase สำเร็จแล้ว ✓</p>
          </div>
          
          <button 
            onClick={handleSave} 
            className="btn btn-primary" 
            style={{ marginTop: '16px', width: '100%' }}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึก API Keys'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">
            <SettingsIcon size={24} />
            ตั้งค่าระบบตอบรับ (System Configuration)
          </div>
          
          <div className="input-group">
            <label>เสียงตอบรับหลัก (Voice Model)</label>
            <select className="input-field">
              <option>ผู้หญิง 1 (สุภาพ/นุ่มนวล) - แนะนำ</option>
              <option>ผู้ชาย 1 (เป็นทางการ)</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>เวลาหน่วงก่อนสั่งโทรออก (Delay before call)</label>
            <select className="input-field">
              <option>ทันที (0 วินาที)</option>
              <option>5 วินาที</option>
              <option>10 วินาที</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
            <input type="checkbox" id="auto_accept" style={{ width: '18px', height: '18px' }} defaultChecked />
            <label htmlFor="auto_accept" style={{ fontSize: '0.9rem', fontWeight: 500 }}>รับงานเข้าระบบอัตโนมัติเมื่อแขกตอบตกลง</label>
          </div>
          
          <button className="btn btn-secondary" style={{ marginTop: '24px', width: '100%' }}>บันทึกการตั้งค่าระบบ</button>
        </div>
      </div>
    </>
  );
};

export default Settings;
