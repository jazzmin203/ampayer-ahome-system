# Advanced Features & Strategy

This document details the critical support systems and business logic.

## 🔒 Security & Access Control

### Authentication
-   **Method**: JWT (JSON Web Tokens) with short-lived Access Tokens (5m) and long-lived Refresh Tokens (7d).
-   **MFA**: Optional 2FA for SuperUsers and League Presidents.

### Role-Based Access Control (RBAC) Matrix

| Feature | SuperUser | Admin | President | Ampayer | Scorer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Leagues** | ✅ | ✅ | Own Only | ❌ | ❌ |
| **Assign Games** | ✅ | ✅ | Own Only | ❌ | ❌ |
| **View Assignments** | All | All | Own League | Own Only | Own Only |
| **Edit Scores** | ✅ | ✅ | ✅ | ❌ | ✅ (Live) |
| **Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Data Protection
-   **Encryption**: At rest (DB) and in transit (TLS 1.3).
-   **Audit Logging**: Middleware captures all `POST/PUT/DELETE` actions on `Game` and `Assignment` tables.

---

## 🔔 Notification System

**Infrastructure**: Celery (Queue) + Redis (Broker).

### Channels
1.  **Push (Firebase Cloud Messaging)**: Immediate alerts for Mobile App users (Ampayers/Scorers).
2.  **Email (SendGrid)**: Summaries, invoices, and password resets.
3.  **WhatsApp (Twilio)**: *Premium Tier* urgent alerts (e.g., "Game Canceled < 2h").

### Event Triggers
-   **T-24h**: Reminder of upcoming game.
-   **Assignment Created**: "New Game Request".
-   **Score Finalized**: "Game Over - Result Ready".
-   **Rain Delay**: "Game status changed to Suspended".

---

## 💰 Monetization Strategy

The platform operates on a **Freemium SaaS** model with Transaction Fees.

### 1. Subscription Tiers

**🥉 Rookie (Free)**
-   1 League, Max 6 Teams.
-   Manual Scheduling.
-   Public Profile.

**🥈 Pro ($20/mo or $200/yr)**
-   Unlimited Teams.
-   **AI Auto-Scheduling** (10 runs/month).
-   Digital Scoring & Stats Portal.
-   Email Notifications.

**🥇 Legend ($50/mo or $500/yr)**
-   Multiple Leagues/Tournaments.
-   **Unlimited AI Optimization**.
-   WhatsApp Alerts.
-   White-label (Custom Domain/Logo).
-   Export to Excel/PDF.

### 2. Transaction Fees
-   **Player Registration**: Charge 3% + $N on payments processed through the app.
-   **Ampayer Payments**: Automated payout system taking a flat fee per game processed.

## 🚀 Roadmap Summary
-   **Q1**: Core Platform + Web Portal.
-   **Q2**: Mobile App (Ampayer/Scorer).
-   **Q3**: AI Engine & Pro Features.
-   **Q4**: Enterprise White-label & Federation deals.
