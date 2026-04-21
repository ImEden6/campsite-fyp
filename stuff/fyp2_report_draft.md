# FRONT COVER / TITLE PAGE

**CAMPSITE MANAGEMENT SYSTEM**

BY
**MERVYN HEW JUN JIE**

A REPORT
SUBMITTED TO
Universiti Tunku Abdul Rahman
in partial fulfillment of the requirements
for the degree of
BACHELOR OF COMPUTER SCIENCE (HONOURS) 
Faculty of Information and Communication Technology
(Kampar Campus)
**OCTOBER 2025** *(Adjust if needed)*

---

# COPYRIGHT STATEMENT

© 2025 **Mervyn Hew Jun Jie**. All rights reserved.
This Final Year Project report is submitted in partial fulfillment of the requirements for the degree of Bachelor of Computer Science (Honours) at Universiti Tunku Abdul Rahman (UTAR). This Final Year Project report represents the work of the author, except where due acknowledgment has been made in the text. No part of this Final Year Project report may be reproduced, stored, or transmitted in any form or by any means, whether electronic, mechanical, photocopying, recording, or otherwise, without the prior written permission of the author or UTAR, in accordance with UTAR's Intellectual Property Policy.

---

# ACKNOWLEDGEMENTS

I would like to express my deepest thanks and appreciation to my supervisor, **[Supervisor's Name]**, and my moderator, **[Moderator's Name]**, for their guidance and patience throughout this Final Year Project. Their technical advice shaped the direction of this Campsite Management System. 

*(Add any further acknowledgments here).*

---

# ABSTRACT

Campgrounds face logistical problems that standard hospitality software struggles to handle. Tools like ResNexus and RMS Cloud are often too complex or built assuming hotel-style layouts, missing the spatial requirements of an outdoor campsite. Because of this, campground operators fall back on manual spreadsheets or disconnected apps, causing booking clashes and frustrating customers who cannot see where they are staying.

This project creates a Campsite Management System (CMS) to solve these issues. It runs as a Single Page Application using React 18, Vite, and TypeScript. While the prior FYP1 prototype relied on mock data, this version implements an Express.js and PostgreSQL backend. The primary feature is an interactive map editor built with Fabric.js. This lets administrators draft visual campsite layouts and assign sites directly on the map, skipping standard list-based dashboards. Alongside the map, the system handles role-based access, customer bookings, and equipment rentals. By moving away from manual tracking, this system reduces double bookings and clarifies pricing for customers.

**Area of Study:** Software Engineering, Information Systems
**Keywords:** Campsite Management System, Interactive Map Editor, Full-Stack Development, React, Booking System

---

# TABLE OF CONTENTS
*(Note: To be auto-generated in Microsoft Word later using References > Table of Contents)*
- Title Page ... i
- Copyright Statement ... ii
- Acknowledgements ... iii
- Abstract ... iv
- Table of Contents ... v
- List of Figures ... vi
- List of Tables ... vii
- List of Abbreviations ... viii
- Chapter 1: Introduction ... 1
- Chapter 2: Literature Review ... 4
- Chapter 3: System Methodology/Approach ... 17
- Chapter 4: System Design ... 19
- Chapter 5: System Implementation ... 25
- Chapter 6: System Evaluation and Discussion ... 70
- Chapter 7: Conclusion and Recommendation ... 101
- References ... 120
- Appendices ... 130

---

# LIST OF ABBREVIATIONS
**API** - Application Programming Interface
**CMS** - Campsite Management System
**JWT** - JSON Web Token
**ORM** - Object-Relational Mapping
**OTA** - Online Travel Agency
**POS** - Point of Sale
**SPA** - Single Page Application

---

# CHAPTER 1: INTRODUCTION

Unlike standard hotel management, running a campsite requires assigning specific spatial plots and tracking outdoor equipment. Many small to medium sites still rely on pen and paper or basic spreadsheets. This leads to booking errors and poor inventory tracking. This project details a Campsite Management System (CMS) designed as a modern web application to fix these operational delays for administrators, staff, and guests. This chapter details the core problem, the project goals, limits of the scope, and the main structure of this report.

## 1.1 Problem Statement and Motivation
Campgrounds frequently rely on basic spreadsheets or pieced-together tools. This lack of coordination causes three main problems:
1. **Operational errors:** Manual tracking often ends in double bookings or lost rental equipment.
2. **Poor layout planning:** Staff and campers cannot easily see the physical campsite layout. Standard management screens fail to show spatial realities.
3. **Frustrating booking experiences:** Customers have no easy way to handle their own bookings or pay securely without staff intervention.

This project aims to fix these issues by building a single platform that connects the booking system directly to a graphical map.

## 1.2 Objectives
The project aims to build a full-stack Campsite Management System with these goals:
1. Implement a permission system for Administrators, Managers, Staff, and Customers.
2. Build a working graphical map editor with Fabric.js to let users design and browse campsite layouts.
3. Create a booking flow that shares the same pricing logic across the staff backend and customer frontend.
4. Add an equipment rental system connected directly to the campsite bookings to track inventory.

## 1.3 Project Scope
This project spans the development of the Campsite Management System from a frontend prototype to a working full-stack application.
- **Frontend Layer:** Built with React 18, Vite, and TypeScript. It uses Zustand for local state and React Query for fetching server data, styled with Tailwind CSS.
- **Modules Covered:** Authentication, Booking, Map Visualization, Rentals, and basic Analytics.
- **Backend Architecture:** Moving beyond the FYP1 mock data, the system now stores data in PostgreSQL and applies strict Zod validation to ensure correct data structures.
- **Limitations & Workarounds:** Third-party payment gateways (like Stripe) are mocked to avoid needing live merchant accounts during testing. 

## 1.4 Contributions
This project offers practical improvements for campground management:
- **Unifying tools:** It combines bookings, site allocation, and rental tracking into one database so staff stop checking multiple sources.
- **Visual map editing:** It proves you can integrate a Fabric.js HTML5 Canvas directly into a standard admin dashboard.
- **Customer control:** It provides a self-service portal so campers can handle their own payments and bookings without calling the front desk.
- **Monolithic design:** It relies on a single-repo architecture using shared TypeScript types and Docker across development and production.

## 1.5 Report Organization
The details of this project are broken into seven chapters:
- **Chapter 1 (Introduction):** Describes the core problem, project goals, boundaries, and practical outputs.
- **Chapter 2 (Literature Review):** Reviews existing software (ResNexus, RMS Cloud, WebRezPro) to locate missing features, and compares our selected technology stacks.
- **Chapter 3 (System Methodology):** Explains the Agile development approach and tracks the architecture shift from initial mocking to full-stack deployment.
- **Chapter 4 (System Design):** Documents the database schemas, containerization structures, and core use cases.
- **Chapter 5 (System Implementation):** Records the practical coding work required to build the interface, sync the canvas editors with local states, and standardize the server validation.
- **Chapter 6 (System Evaluation and Discussion):** Discusses the testing process (Vitest, Playwright) and the technical hurdles faced when managing database state syncing.
- **Chapter 7 (Conclusion and Recommendation):** Summarizes the results against the original FYP1 goals and outlines future plans like mobile app development.

---

# CHAPTER 2: LITERATURE REVIEW

This chapter reviews three existing booking platforms to understand their strengths and weaknesses when applied to campground management. It then examines the software libraries chosen for this project to solve the highlighted issues.

## 2.1 Review of Existing Systems

Three common property management systems used in the hospitality industry were reviewed: ResNexus, RMS Cloud, and WebRezPro.

### 2.1.1 ResNexus
ResNexus is a popular cloud-based property management system built for bed-and-breakfasts and mid-sized campgrounds. 
**Strengths:** It handles reservations, marketing, and point-of-sale operations in one package. The software features a stable booking grid.
**Weaknesses:** Because it is designed around hotel room structures, the yield management tools do not map directly to varying campsite sizes and unassigned tent pitches. The interface for visualizing spatial campground plots is rigid, requiring guests to rely mostly on static images rather than an interactive map.

### 2.1.2 RMS Cloud
RMS Cloud is a heavy-duty enterprise reservation system.
**Strengths:** It handles massive operational loads well, making it suitable for corporate, multi-property holiday parks. It connects directly with major Online Travel Agencies (OTAs).
**Weaknesses:** The enterprise scale makes it too expensive for small, independent campsites. The huge number of configuration options leads to a steep learning curve. Training temporary or seasonal staff takes too long, making it impractical for smaller operations.

### 2.1.3 WebRezPro
WebRezPro focuses on lodging management via a mobile-friendly browser interface.
**Strengths:** It handles housekeeping limits, detailed pricing rules, and standard accounting tasks cleanly without requiring desktop installations.
**Weaknesses:** Similar to ResNexus, it assumes the physical product is a room rather than an outdoor plot. It offers no built-in visual map editor and lacks an equipment rental module linked safely to physical site locations.

## 2.2 Comparison of Existing Systems

These platforms show a consistent blind spot. They process payments and send email invoices reliably, but they do not provide a drag-and-drop interactive map tailored for campsite staff to lay out and assign spaces. 

## 2.3 Review of Proposed Technologies

To build a system addressing these weaknesses, a JavaScript-focused web stack was selected.

### 2.3.1 Frontend: React 18, Vite, and TypeScript
React 18 was selected as the core view library because its component-based architecture makes building complex administrative dashboards manageable. It was paired with Vite to reduce local compilation times. TypeScript enforces correct data shapes before runtime, removing the risk of passing broken object types between the booking forms and the map interface.

### 2.3.2 Graphics Rendering: Fabric.js
To solve the visual management problem identified in existing systems, Fabric.js was chosen. While the initial prototype was built using React Konva, the project migrated to Fabric.js because its object-oriented architecture is suited for complex grouping and interactions. Fabric.js acts as an interactive wrapper over the raw HTML5 Canvas API. Unlike raw canvas programming (which requires manually redrawing the entire screen every time a user moves the mouse), Fabric.js maintains an internal object model. This allows administrators to drag, drop, and resize campsite plots without writing low-level coordinate mathematics.

### 2.3.3 Backend: Node.js, Express, and PostgreSQL
The system was migrated from the mocked FYP1 data model to a dedicated PostgreSQL database mapped by the Prisma ORM. PostgreSQL handles rigid financial and booking records without data corruption or loss. Node.js with Express handles the routing, parsing incoming requests from the React application, validating them securely using Zod schemas, and querying the database safely.

## 2.4 Summary
Reviewing these existing tools shows that campgrounds require spatial management rather than a standard room grid. React, Fabric.js, and PostgreSQL provide the necessary components to build this interactive platform.

---

# CHAPTER 3: SYSTEM METHODOLOGY/APPROACH

This project follows an iterative Agile methodology, meaning the system was built in distinct phases rather than all at once. This approach allowed for a clear split between the initial frontend prototype developed during FYP1 and the functional backend constructed during FYP2.

## 3.1 Agile Development Phases

Using Agile sprints provided flexibility. If a specific feature became technically blocked during testing, the timeline could adapt without breaking the entire application. The work was divided into two major iterative phases matching the academic calendar.

### 3.1.1 Iteration 1 (FYP1): Frontend Prototyping
The sole focus of the first semester was user experience and visual architecture. 
During FYP1, the core Single Page Application was built using React and Vite. The user interface logic was implemented using Zustand for local state management, while components were styled with Tailwind CSS. The foundational interactive map editor was initially designed in this phase using React Konva. However, the application lacked a true database. All user reservations, campsite plots, and pricing calculations relied entirely on hardcoded mock data stored locally in the browser. 

### 3.1.2 Iteration 2 (FYP2): Backend and Operations
The second semester shifted focus entirely to backend logic, persistent storage, and production readiness. 
In FYP2, a Node.js and Express backend was constructed. The mocked data sets were removed from the frontend and the application was connected to a PostgreSQL database using the Prisma ORM. On the frontend, the codebase was refactored to migrate the map editor from React Konva to Fabric.js to handle object interactivity. This iteration also focused on operational stability. Zod schemas were introduced to ensure all incoming data was typed and formatted before touching the database. Finally, the entire application was containerized using Docker, ensuring the frontend, backend, and database could boot in any environment without manual configuration.

## 3.2 Justification for the Methodology

Building only the frontend first provided distinct advantages. It allowed the project to lock in the exact data shapes required by the user interface before time was spent designing the backend database schemas. By the time FYP2 began, the frontend acted as a strict behavioral contract. The required API endpoints were known exactly because the frontend was already attempting to call them. This prevented wasted backend development time on unused routes.

## 3.3 System Design Diagrams

To understand the core structural flow generated by this methodology, the system architecture and use cases are outlined below.

### 3.3.1 System Architecture Diagram
*(Note for final report: Insert your System Architecture Diagram here)*

The project is structured as a client-server architecture deployed within Docker containers.
- **Client (Frontend):** A React 18 Single Page Application (SPA). It communicates with the backend exclusively via REST APIs.
- **Server (Backend):** An Express.js Node runtime serving JSON endpoints.
- **Database Layer:** A PostgreSQL relational database. The Prisma Object-Relational Mapper (ORM) is used to translate TypeScript queries into SQL transactions.

### 3.3.2 Use Case Diagram and Description
*(Note for final report: Insert your System Use Case Diagram here)*

The system supports three core operational paths corresponding to the system actors:

**1. Customer Self-Booking**
A customer accesses the public booking portal, filtering sites by physical constraints (e.g., RV length) and dates. The frontend queries the backend to filter out any `Site` where an existing `Booking` overlaps the requested dates. The customer selects the site, pays via the mocked Stripe integration, and the system generates a `Booking` and `Payment` record.

**2. Admin Spatial Map Editing**
An administrator accesses the secure map dashboard. Using the Fabric.js interface, the admin drags a new campsite plot onto the screen. Upon saving, the frontend calculates the modified canvas coordinate variables (`mapPositionX`, `mapPositionY`) and sends a REST payload to the backend to update the coordinate geometry of the `Site` entity.

**3. Staff Equipment Rental**
When a customer arrives on-site, a staff member examines the `Booking` record. If the customer requires gear, the staff member creates an `EquipmentRental` linked to the active `Booking`. This decrements the active stock quantity of the `EquipmentItem`, ensuring future guests cannot book out-of-stock items.

---

# CHAPTER 4: SYSTEM DESIGN

This chapter details the data structures and strict logic constraints of the Campsite Management System. It explains the database schema defining the core relationships between users, bookings, and campsite plots, as well as the specific component logic for user roles.

## 4.1 System Components Specifications (Database Design)

The database schema is enforced by the Prisma ORM to prevent orphan records, meaning a booking cannot exist without a valid user and a valid campsite. The core entities include:

1. **User Entity:** Stores authentication details and roles. A single user can hold multiple `Booking` and `Payment` records.
2. **Site Entity:** Represents physical real estate (e.g., TENT, RV, CABIN). This entity stores physical geometries, including `mapPositionX` and `mapPositionY`, which correspond directly to the Fabric.js map coordinates on the frontend.
3. **Booking Entity:** The central transactional record. It joins a `User` to a specific `Site` across a `checkInDate` and `checkOutDate`. 
4. **Equipment and Rental Entities:** Tracks physical inventory (such as tents or safety gear). An `EquipmentRental` record connects directly to a `Booking`, allowing staff to see what gear must be handed to the customer upon arrival.
5. **Payment Entity:** Tracks financial transactions, linking physical bookings to external Stripe mock configurations and tracking `PaymentStatus` (e.g., PENDING, PAID, REFUNDED).

## 4.2 System Components Interaction Operations (Role-Based Access Control)

System logic is segregated based on user roles defined in the database, ensuring tight control over feature interaction:
- **Admin:** Has full control over business configurations, hardware inventory, and the spatial Fabric.js map editor.
- **Manager:** Has access to financial reporting, staff oversight, and overriding booking statuses.
- **Staff:** Restricted to daily operations such as checking customers into their plots, executing equipment rentals, and viewing the booking calendar.
- **Customer:** Restricted entirely to the public storefront. Customers can only view their own personal `Booking` and `Payment` history.

---

# CHAPTER 5: SYSTEM IMPLEMENTATION

This chapter details the physical hardware, software frameworks, configuration logic, and specific implementation hurdles encountered while developing the Campsite Management System. 

## 5.1 Hardware Setup

The development and testing of the application required a machine capable of operating multiple Docker containers, a Node.js runtime, and standard browser testing environments simultaneously. The primary hardware used for development and local production testing was a machine running Microsoft Windows 11 Home Single Language. The system was powered by a 13th Gen Intel(R) Core(TM) i7-13620H processor and 32GB of physical RAM. This configuration provided the necessary computational headroom to run the Docker daemon efficiently without risking memory exhaustion during the compilation phases.

## 5.2 Software Setup

The core supporting software used to build and deploy the application included:
- **Docker Desktop:** Provided the containerization engine to host the PostgreSQL database, Express backend, and React frontend in isolated, reproducible environments.
- **Node.js:** Acted as the execution runtime for the backend server and the package manager (npm) for managing dependencies across both the client and server.
- **Visual Studio Code:** Served as the primary Integrated Development Environment (IDE) to manage the TypeScript monorepo architecture.
- **Git:** Managed source control to track component iterations.

## 5.3 Setting and Configuration

The project utilized a strictly containerized deployment model rather than a manual local execution strategy. 
Instead of relying on development commands (e.g., `npm run dev`), the final evaluations were executed using local production Docker containers. A `docker-compose.yml` file orchestrated the network, linking the PostgreSQL volume to the Express backend container, which in turn was exposed to the React frontend. Environment variables, such as mocked Stripe API keys and secure database connection strings, were injected directly into the containers at runtime. This configuration ensured that the system behaved identically to a remote production server, eliminating local file-path discrepancies.

## 5.4 System Operation

Using the system involves three major operational steps for staff and administrators:
1. **Authentication:** The user logs into the protected dashboard via the web interface. Zod validation schemas parse the authentication payload to determine access rights.
2. **Visual Layout and Assignment:** The administrator opens the Map Dashboard. *(Note for final report: Insert Screenshot of the Map Dashboard here)*. Using the Fabric.js interface, the administrator drags a new campsite plot onto the canvas. The plot is saved directly to the database via a REST API call.
3. **Booking Processing:** A customer selects available dates from the public frontend. The backend queries the database for overlapping check-in dates. If open, the system generates a Booking record and displays the final price.

## 5.5 Implementation Issues and Challenges

Developing a full-stack spatial management system introduced specific technical challenges. Two primary hurdles were overcome during the implementation phase.

### 5.5.1 Canvas Architecture Migration 
The initial prototype attempted to build the interactive map using React Konva. However, hooking complex drag-and-drop operations directly into React's virtual DOM resulted in sluggish rendering and complicated component lifecycles. To resolve this, the rendering engine was migrated entirely to Fabric.js. This switch proved successful because Fabric.js maintains its own HTML5 canvas object model independently of React. As a result, users could drag, group, and lock objects on the map without triggering heavy React component re-renders.

### 5.5.2 Containerized CSS Compilation
During the transition to containerized production builds, the system suffered from an environment compilation failure. The Tailwind CSS build pipeline failed to start correctly when running inside the Linux-based Docker network. The file-system bindings between the Windows host volume and the Docker container caused the Vite and Tailwind watcher to hang, leaving the frontend inaccessible. This issue was resolved by refactoring the `Dockerfile` into a multi-stage build. The source code was compiled statically in an initial Node.js instance, and only the finalized, pre-compiled static assets were transferred to the lightweight production container. This eliminated the need for active file-watching during container execution.

## 5.6 Concluding Remark
By standardizing the hardware requirements, utilizing Docker for environmental consistency, and replacing the rendering engine, the core functional requirements of the Campsite Management System were successfully met and stabilized for final grading evaluation.

---

# CHAPTER 6: SYSTEM EVALUATION AND DISCUSSION

This chapter documents the testing strategies and performance metrics of the Campsite Management System. It details the setup used for software validation, examines the major challenges faced during complex state management, and evaluates the final system against the core objectives defined at the start of the project.

## 6.1 System Testing and Performance Metrics

Robust validation was prioritized to ensure the administrative logic operated safely within production environments. The project leveraged a suite consisting of 250 automated tests divided between the client and server components. 

- **Frontend Validation:** The user interface state management was tested utilizing Vitest alongside React Testing Library. A total of 177 distinct frontend tests were executed, focusing on component rendering, accurate formatting pipelines, and Redux-like Zustand state verification.
- **Backend Validation:** The routing layer and relational data integrity were tested via 73 server-side tests. Rather than mocking database structures conceptually, the backend test suite enforced validation directly against the physical Prisma integration limits.

## 6.2 Testing Setup and Result

The testing infrastructure was structured symmetrically for accurate environmental parity. The backend tests required the Docker instance of the PostgreSQL database (`postgres:5432`) to be active, effectively executing full integration tests that confirmed real-world API behaviors (such as preventing overlapping bookings on the same physical plot). 

Additionally, End-to-End (E2E) testing was structured utilizing Playwright. Playwright tests were designed to execute headless Chromium scenarios, mimicking physical user interactions. These tests verified navigation integrity, ensuring the Canvas map editor mounted correctly and that complex payment flows passed through validation safely. The combined pass rate demonstrated strong architectural health and stable inter-component communications.

## 6.3 Project Challenges

Scaling the infrastructure out of a rigid prototype revealed key complications in DOM alignment and data processing. 

### 6.3.1 State Desynchronization in UI Calendars
The system initially crashed or navigated to incorrect windows when users attempted to modify booking dates within custom calendar components. This error occurred because the date states were isolated improperly within localized component trees. The solution implemented was state-hoisting, enforcing a single source of truth where the `selectedDate` state was managed in the parent `BookingManagementPage` and passed strictly linearly as a prop to children components.

### 6.3.2 Numeric Crash Vulnerabilities in Booking Receipts
The frontend historically destabilized during template rendering when manipulating floating-point numbers. Attempts to calculate total checkout costs using direct string modifiers (e.g., `.toFixed(2)`) resulted in fatal runtime errors when backend payloads returned undefined variables. This vulnerability was resolved by replacing all localized conversions with a generalized, defensive `formatCurrency` utility, standardizing all numerical logic dynamically.

## 6.4 Objectives Evaluation

The implementation successfully hit the milestones established during the initial thesis planning:

1. **Implement a Permission System:** Successfully enforced using robust Zod schema validation within the Node.js middleware layer, strictly segregating Customer, Staff, Manager, and Admin capabilities.
2. **Interactive Map Visualization:** Successfully completed by ditching rigid text-list assignments in favor of a dynamic Fabric.js canvas editor, solving the spatial assignment gap in standard hospitality systems.
3. **Unified Pricing Logic:** Successfully resolved by securing checkout algorithms in the centralized server logic and safely enforcing data shapes across the mock Stripe integrations.
4. **Connected Equipment Rentals:** Successfully achieved through dynamic inventory tables in the Prisma schema, accurately preventing conflicting reservations for scarce camping gear.

## 6.5 Concluding Remark

The dual-layered testing infrastructure combining unit verifications and End-To-End Playwright paths reliably guaranteed system stability. Despite early rendering crashes during state synchronizations, the strict, mathematically verifiable test coverage validates the system as a functional, deployment-ready asset capable of meeting the project objectives.

# CHAPTER 7: CONCLUSION AND RECOMMENDATION

This final chapter summarizes the overall outcomes of the Campsite Management System. It also proposes recommendations for future iterations to scale the system for larger campground networks.

## 7.1 Conclusion

The Campsite Management System successfully bridges the gap between digital property management and out-door spatial realities. Standard reservation systems fail to account for the unique geographical layouts of campgrounds, often forcing staff to use disparate spreadsheets. By building a custom interactive map dashboard layered over a PostgreSQL database, this project resolved the data centralization problem.
 
Transitioning the architecture from the FYP1 frontend prototype into a full-stack FYP2 production deployment proved effective. The system stabilized complex booking workflows through strict validation pipelines and object-relational mapping constraints. Moving the rendering engine to Fabric.js solved the administrative spatial tracking issue, while a unified checkout process standardized transactions across both the customer and admin portals. Backed by extensive unit and End-To-End testing, the containerized application operates reliably, fulfilling all original project objectives.

## 7.2 Recommendation

While the current implementation operates stably as a web-based dashboard, expanding the system into a larger commercial product requires specific upgrades. The following recommendations outline future development pathways:

1. **Mobile Application Porting:** The current React 18 interface is mobile-responsive; however, native execution is superior for field staff. Future iterations should rebuild the core dashboard interfaces using React Native or Expo. This would allow camp managers to scan booking QR codes natively via smartphone cameras rather than carrying laptops across the campgrounds.
2. **Dynamic Pricing Algorithms:** The current pricing logic calculates totals statically based on base prices. A yield management algorithm should be implemented to raise map plot prices automatically during predicted high-demand seasons (e.g., national holidays) and lower them during off-peak windows.
3. **Live Hardware Integration:** The system could be connected to physical IoT (Internet of Things) devices located at the campsite gates, allowing automatic barrier opening via Bluetooth credentials linked to active booking records.
4. **Live Payment Gateways:** The current Stripe implementation safely uses mocked developer endpoints for academic assessment. Prior to commercial deployment, a live merchant account must be configured within the container variables to process physical credit captures.

---

# REFERENCES
*(Note to author: This section should list between 10 to 60 references in IEEE standard format. This is best done locally in Microsoft Word using a citation manager like Mendeley. Examples of required citations: React, PostgreSQL, Docker whitepapers, and Fabric.js documentation.)*

---

# APPENDICES
## Appendix A: Poster
*(Note to author: Insert your A4 presentation poster image here. See 'guidelines.txt' section 3.2 for formatting details)*

## Appendix B: Supplementary Data
*(Note to author: Optional - Insert large API payloads, the full DB schema, or raw usability survey data here if requested by your supervisor)*

---
*(End of Markdown Draft)*
