import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // ⚠️ ถ้าบรรทัดนี้ยังแดง ให้ลองแก้เป็น '../firebase' หรือ './config/firebase' ตามตำแหน่งจริงในโปรเจกต์คุณนะครับ
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Ticket {
  id: string;
  room_number: string;
  status: string;
  created_at?: string;
  extracted_data?: {
    intent?: string;
    items?: string;
    notes?: string;
    scenario?: string;
  }
}

export default function TaskBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // 1. ดึงข้อมูลตั๋วทั้งหมดจาก Firebase แบบ Realtime อัปเดตอัตโนมัติ
  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList: Ticket[] = [];
      snapshot.forEach((doc) => {
        ticketList.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(ticketList);
    });

    return () => unsubscribe();
  }, []);

  // แยกกลุ่มสถานะเพื่อจัดบอร์ด (Kanban สไตล์)
  const pendingTickets = tickets.filter(t => t.status === 'pending' || t.status === 'รอรับเรื่อง');
  const doingTickets = tickets.filter(t => t.status === 'doing' || t.status === 'กำลังดำเนินการ');
  const doneTickets = tickets.filter(t => t.status === 'done' || t.status === 'เสร็จสิ้น');

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Task Board / รายการคำสั่งงานทั้งหมด</h1>
        <p className="text-sm text-slate-500">มุมมองภาพรวมสถานะตั๋วในระบบ (สำหรับแอปพนักงานกดรับงานเท่านั้น)</p>
      </div>

      {/* โครงสร้างกระดาน 3 คอลัมน์ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* คอลัมน์ 1: รอรับเรื่อง */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <h2 className="font-semibold text-amber-800 mb-4 flex justify-between">
            <span>⏳ รอพนักงานกดรับ ({pendingTickets.length})</span>
          </h2>
          <div className="space-y-3">
            {pendingTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} borderColor="border-amber-300" />)}
          </div>
        </div>

        {/* คอลัมน์ 2: กำลังดำเนินการ */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h2 className="font-semibold text-blue-800 mb-4 flex justify-between">
            <span>🏃‍♂️ กำลังทำอยู่ ({doingTickets.length})</span>
          </h2>
          <div className="space-y-3">
            {doingTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} borderColor="border-blue-300" />)}
          </div>
        </div>

        {/* คอลัมน์ 3: เสร็จสิ้น */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <h2 className="font-semibold text-emerald-800 mb-4 flex justify-between">
            <span>✅ เสร็จเรียบร้อย ({doneTickets.length})</span>
          </h2>
          <div className="space-y-3">
            {doneTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} borderColor="border-emerald-300" />)}
          </div>
        </div>

      </div>
    </div>
  );
}

// ส่วนแสดงผลแผ่นการ์ดตั๋วงานย่อย (ไม่มีปุ่มกดรับงานตามเงื่อนไขข้อ 2)
function TicketCard({ ticket, borderColor }: { ticket: Ticket; borderColor: string }) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-slate-800 text-lg">ห้อง {ticket.room_number}</span>
        <span className="text-xs text-slate-400">
          {ticket.extracted_data?.scenario || 'ทั่วไป'}
        </span>
      </div>
      <div className="text-sm text-slate-600 space-y-1">
        <p><span className="font-medium text-slate-500">สิ่งที่ขอ:</span> {ticket.extracted_data?.items || '-'}</p>
        <p><span className="font-medium text-slate-500">จำนวน/โน้ต:</span> {ticket.extracted_data?.notes || '-'}</p>
      </div>
    </div>
  );
}