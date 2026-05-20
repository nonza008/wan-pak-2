import html
from urllib.parse import quote
from fastapi import APIRouter, Query, Request
from fastapi.responses import HTMLResponse

router = APIRouter()

@router.get("/ring", response_class=HTMLResponse)
def guest_ring_page(request: Request, room: str = Query(..., min_length=1)):
    ring_endpoint = str(request.base_url).rstrip("/") + "/api/calls/ring"
    room_clean = room.strip()
    safe_room = html.escape(room_clean)
    return f"""
<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wan-Pak Guest Assistant</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      font-family: Arial, sans-serif;
      background: linear-gradient(150deg, #0a142a, #12284c);
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0a142a;
      padding: 16px;
    }}
    .wrap {{
      width: 100%;
      max-width: 460px;
      background: #fff;
      border-radius: 22px;
      padding: 24px;
      box-shadow: 0 16px 40px rgba(0,0,0,.24);
    }}
    .brand {{
      color: #8f6c3f;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: .5px;
    }}
    h2 {{
      margin: 0;
      font-size: 28px;
      line-height: 1.2;
    }}
    .sub {{
      margin: 6px 0 18px;
      color: #475569;
      font-size: 14px;
    }}
    .room {{
      font-size: 30px;
      font-weight: 700;
      margin: 8px 0 12px;
      color: #0a142a;
    }}
    .hint {{
      color: #64748b;
      margin-bottom: 18px;
      padding: 12px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }}
    button {{
      width: 100%;
      border: 0;
      border-radius: 14px;
      padding: 16px;
      font-size: 18px;
      font-weight: 700;
      background: #c8a97e;
      color: #fff;
      cursor: pointer;
    }}
    button:disabled {{ opacity: 0.6; cursor: not-allowed; }}
    #status {{
      margin-top: 14px;
      font-size: 14px;
      min-height: 24px;
      color: #334155;
    }}
    .en {{
      color: #94a3b8;
      font-size: 12px;
      margin-top: 8px;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">WAN-PAK HOTEL</div>
    <h2>กดกริ่งเรียกผู้ช่วย</h2>
    <div class="sub">Concierge Assistant</div>
    <div class="room">ห้อง {safe_room}</div>
    <div class="hint">ระบบจะโทรกลับอัตโนมัติภายในไม่กี่วินาที เพื่อรับคำขอของท่าน</div>
    <button id="ringBtn">กดกริ่ง</button>
    <div id="status"></div>
    <div class="en">Press the bell button and our AI concierge will call you shortly.</div>
  </div>
  <script>
    const btn = document.getElementById('ringBtn');
    const statusEl = document.getElementById('status');
    const originalButtonText = btn.textContent;
    btn.addEventListener('click', async () => {{
      btn.disabled = true;
      btn.textContent = 'กำลังส่งคำขอ...';
      statusEl.textContent = 'กำลังส่งคำขอ กรุณารอสักครู่...';
      try {{
        const res = await fetch('{ring_endpoint}', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ room_number: '{room_clean}' }})
        }});
        const data = await res.json();
        if (!res.ok) {{
          if (res.status === 429) {{
            statusEl.textContent = 'ขณะนี้มีผู้ใช้งานจำนวนมาก กรุณาลองใหม่ในอีกครู่';
          }} else {{
            statusEl.textContent = data.detail || 'ไม่สามารถกดกริ่งได้ในขณะนี้';
          }}
        }} else {{
          statusEl.textContent = 'เรียบร้อยแล้ว AI กำลังโทรไปยังห้องของท่าน';
        }}
      }} catch (e) {{
        statusEl.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      }}
      setTimeout(() => {{
        btn.disabled = false;
        btn.textContent = originalButtonText;
      }}, 3000);
    }});
  </script>
</body>
</html>
"""

@router.get("/ring/qr")
def guest_ring_qr(request: Request, room: str = Query(..., min_length=1)):
    base_url = str(request.base_url).rstrip("/")
    room_clean = room.strip()
    target = f"{base_url}/guest/ring?room={quote(room_clean)}"
    qr_url = f"https://quickchart.io/qr?size=300&text={quote(target, safe='')}"
    return {"room": room, "ring_url": target, "qr_url": qr_url}
