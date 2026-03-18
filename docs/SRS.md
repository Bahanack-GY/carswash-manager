# Software Requirements Specification (SRS) - Car Wash Management System

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to specify the software requirements for the Car Wash Management System. It provides a complete description of all the functions, specifications, and features of the system aimed at digitalizing and securing the processes of a modern car wash.

### 1.2 Scope
The Car Wash Management System is designed to manage multiple car wash stations, track customer journeys, handle reservations, process payments (including subscriptions and shop sales), manage inventory, and monitor employee performance. The ultimate goals are to improve customer service quality, ensure financial transparency, provide operational traceability, and optimize resource management.

---

## 2. Overall Description

### 2.1 Product Functions
The main functions of the system include:
- **Reservation & Reception:** Booking management, track vehicle conditions upon arrival.
- **Washing Operations:** Assigning washers, defining types of washes and extra services.
- **Financial & Cash Management:** Invoicing, multi-method payments, tracking daily cash flows.
- **CRM & Client Loyalty:** Managing client profiles, subscriptions, vehicles, and reviews.
- **Inventory Management:** Tracking cleaning products, shop items, and utensils.
- **Human Resources & Performance:** Managing staff authentication, tracking washer performance, and calculating bonuses.
- **Multi-Tenancy:** Centralized administration for multiple car wash stations.

### 2.2 User Characteristics
- **Client:** Can make reservations, pay for services, buy shop items, leave reviews, and subscribe to plans.
- **Controller (Contrôleur):** Greets clients, creates work orders (Fiche de Piste), assigns washers, and verifies wash quality.
- **Cashier (Caissière):** Edits coupons, processes payments (shop & wash), and manages initial CRM entries.
- **Washer (Agent Laveur):** Performs the wash according to the coupon. Has no contact with clients or cash.
- **Manager:** Controls cash registers, views statistics, oversees local inventory, and handles local staff assignments.
- **Owner / Super Admin:** Manages multiple stations, oversees global revenue, and handles cross-station employee transfers.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 Reservation and Incoming Flow
- **REQ-01:** The system shall allow clients (or cashiers on their behalf) to schedule a wash reservation.
- **REQ-02:** The system shall automatically send an SMS confirmation upon reservation.
- **REQ-03:** The Controller shall be able to create a "Fiche de Piste" (Work Order) recording the vehicle's initial state (e.g., existing scratches).
- **REQ-04:** The system shall support associating a Work Order with a primary Wash Type (`TypeLavage`) and optional Additional Services (`ServiceAdditionnel`).

#### 3.1.2 Washing Operations & Washer Assignment
- **REQ-05:** The system shall generate a "Coupon" based on the Work Order.
- **REQ-06:** The system shall allow assigning one or multiple Washers to a single Coupon.
- **REQ-07:** The system shall record the completion of a wash and trigger an SMS notification to the client ("Vehicle is ready").

#### 3.1.3 Cash Register & Billing
- **REQ-08:** The system shall process payments using various methods (Cash, Mobile Money, Credit Card, Subscription).
- **REQ-09:** The system shall generate a formal Invoice (`Facture`) combining washing services and shop purchases.
- **REQ-10:** The system shall record all cash inflows and outflows (e.g., petty cash expenses <= 15,000 FCFA with justification).

#### 3.1.4 CRM and Loyalty
- **REQ-11:** The system shall maintain client profiles including contact info, subscription status, and loyalty points.
- **REQ-12:** The system shall track multiple vehicles per client (license plate, model, color, type, brand).
- **REQ-13:** The system shall allow clients to submit a review/rating (1-5 stars) after a service.
- **REQ-14:** The system shall allow the creation and tracking of customer incidents/complaints.

#### 3.1.5 Inventory & Shop Management
- **REQ-15:** The system shall manage products across three categories: Cleaning (Entretien), Shop (Boutique), and Utensils (Ustensile).
- **REQ-16:** The system shall record detailed stock movements (Entry, Checkout, Expired, Finished, Broken).
- **REQ-17:** The system shall alert the manager when a product's stock falls below a predefined threshold.
- **REQ-18:** The system shall support purchasing flows (Purchase Orders) to external suppliers.

#### 3.1.6 Human Resources & Performance
- **REQ-19:** The system shall authenticate users (email, password) and authorize actions based on their role.
- **REQ-20:** The system shall track the number of vehicles washed by each Washer.
- **REQ-21:** The system shall automatically calculate bonuses for Washers based on their recorded performance.

### 3.2 Non-Functional Requirements
- **Security:** Strict separation of duties (Washers cannot access billing; Cashiers cannot alter wash quality validation). Passwords must be encrypted.
- **Reliability:** The system must accurately track cash flows to prevent fraud.
- **Multi-Tenancy:** Data must be partitioned or strictly linked to specific wash stations (`StationLavage`).

---

## 4. Feature Checklist

- [ ] **Authentication & Authorization**
  - [ ] Secure Login (Email/Password)
  - [ ] Role-Based Access Control (Admin, Manager, Cashier, Controller, Washer)
- [ ] **Multi-Station Management**
  - [ ] Create/Edit Car Wash Stations
  - [ ] Transfer employees between stations
- [ ] **CRM & Customer Portal**
  - [ ] Client Profile Management
  - [ ] Vehicle Fleet Management (per client)
  - [ ] Loyalty points and Vouchers
  - [ ] Subscriptions (Monthly, Annual)
  - [ ] Incident/Complaint ticketing
  - [ ] Review & Rating system
- [ ] **Reservation & Notifications**
  - [ ] Time-slot booking
  - [ ] SMS Gateway Integration (Confirmation, "Car Ready")
- [ ] **Washing Operations**
  - [ ] "Fiche de Piste" creation (Pre-wash inspection)
  - [ ] Service Catalog (Wash Types + Extra Services)
  - [ ] Coupon generation
  - [ ] Multi-washer assignment per vehicle
  - [ ] Quality Validation gate
- [ ] **Point of Sale (Cashier & Shop)**
  - [ ] Multi-payment processing (Cash, Mobile, Card, Sub)
  - [ ] Unified Invoicing (Wash + Shop items)
  - [ ] Petty cash expense tracking
  - [ ] Shift closure and cash reconciliation
- [ ] **Inventory & Procurement**
  - [ ] Stock tracking (Cleaning, Shop, Utensils)
  - [ ] Stock movement history (Finished, Broken, Expired)
  - [ ] Low-stock threshold alerts
  - [ ] Supplier purchase orders
- [ ] **HR & Performance**
  - [ ] Attendance/Shift tracking
  - [ ] Washer vehicle count tracking
  - [ ] Automated bonus calculation
- [ ] **Reporting & Analytics**
  - [ ] Revenue dashboards (Daily, Weekly, Monthly)
  - [ ] Performance metrics per employee
  - [ ] Inventory consumption reports
