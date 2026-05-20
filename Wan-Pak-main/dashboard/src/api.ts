import axios from 'axios';

// Create an axios instance pointing to the FastAPI backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TriggerCallData {
  room_number: string;
  phone_number: string;
  scenario: string;
}

export interface Ticket {
  ticket_id: string;
  room_number: string;
  scenario: string;
  intent: string;
  extracted_data: {
    time?: string;
    items?: string;
    quantity?: string;
    unit?: string;
    notes?: string;
  };
  status: 'pending' | 'accepted' | 'completed';
  created_at: string;
  updated_at: string;
  audio_url?: string;
  escalated?: boolean;
}

export const triggerCall = async (data: TriggerCallData) => {
  const response = await api.post('/calls/trigger_call', data);
  return response.data;
};

export interface GuestRingQr {
  room: string;
  ring_url: string;
  qr_url: string;
}

export const getGuestRingQr = async (room: string): Promise<GuestRingQr> => {
  const response = await axios.get(`${api.defaults.baseURL?.replace('/api', '')}/guest/ring/qr`, {
    params: { room },
  });
  return response.data;
};

export interface InboundPayload {
  transcript: string;
  room_number?: string;
  scenario?: string;
}

export const simulateInbound = async (data: InboundPayload) => {
  const response = await api.post('/calls/inbound_webhook', data);
  return response.data;
};

export const getTickets = async (): Promise<Ticket[]> => {
  const response = await api.get('/tickets');
  return response.data.tickets;
};

export const updateTicketStatus = async (ticket_id: string, status: string) => {
  const response = await api.patch(`/tickets/${ticket_id}/status`, { status });
  return response.data;
};

export interface AppSettings {
  groq_api_key: string;
  botnoi_api_key: string;
}

export const getSettings = async (): Promise<AppSettings> => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data: Partial<AppSettings>) => {
  const response = await api.post('/settings', data);
  return response.data;
};

// Staff
export interface Staff {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: string;
}

export const getStaff = async (): Promise<Staff[]> => {
  const response = await api.get('/staff');
  return response.data.staff;
};

export const updateStaff = async (staffId: string, data: Partial<Staff>) => {
  const response = await api.patch(`/staff/${staffId}`, data);
  return response.data;
};

// Guests
export interface Guest {
  room_number: string;
  guest_name: string;
  phone_number?: string;
  preferred_scenario?: string;
  check_out_date: string;
  status: string;
}

export const getGuests = async (): Promise<Guest[]> => {
  const response = await api.get('/guests');
  return response.data.guests;
};

// Analytics
export interface AnalyticsSummary {
  total_calls: number;
  success_rate: string;
  escalation_rate: string;
  avg_talk_time: string;
  top_scenarios: Record<string, number>;
}

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  const response = await api.get('/analytics');
  return response.data;
};

export default api;
