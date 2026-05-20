from fastapi import FastAPI
# Added to trigger hot-reload for Firebase Credentials
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

from routers import calls, tickets, settings as settings_router, staff, guests, analytics, guest_portal

app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])
app.include_router(staff.router, prefix="/api/staff", tags=["Staff"])
app.include_router(guests.router, prefix="/api/guests", tags=["Guests"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(guest_portal.router, prefix="/guest", tags=["Guest Portal"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
