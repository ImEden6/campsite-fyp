# Campsite Management System - Mermaid Diagrams

You can use the following Mermaid code blocks to generate figures for your FYP2 report. You can paste these into any Mermaid editor (like [Mermaid Live Editor](https://mermaid.live/)) to export them as PNG or SVG files.

---

## 1. System Architecture (Figure 3.1)
*(Note: This uses the new **Mermaid Architecture-Beta** syntax for a professional icon-based layout)*

```mermaid
architecture-beta
    group dev_env(cloud)[Docker Environment]
    
    service user(internet)[Customer Browser]
    service cloud_stripe(cloud)[Stripe API]

    service web_app(server)[React Frontend] in dev_env
    service api_server(server)[Express Backend] in dev_env
    service db_node(database)[PostgreSQL] in dev_env
    service storage(disk)[Media Storage] in dev_env

    user:B -- T:web_app
    web_app:B -- T:api_server
    api_server:R -- L:cloud_stripe
    api_server:B -- T:db_node
    api_server:L -- R:storage
```

---

## 2. System Context Diagram (Figure 3.3)
*(Note: This uses the **C4 Context** standard to show how the system interacts with external entities)*

```mermaid
C4Context
    title System Context Diagram for Campsite Management System

    Person(customer, "Customer", "A person looking to book a campsite plot.")
    Person(staff, "Campsite Staff", "Responsible for checking guests in/out and managing rentals.")
    
    System(cms, "Campsite Management System", "Allows users to browse maps, book sites, and manage inventory.")

    System_Ext(stripe, "Payment Gateway (Stripe)", "Handles credit card processing and transactions.")
    System_Ext(email, "Email Service", "Sends booking confirmations and receipts.")

    Rel(customer, cms, "Browses maps, books sites, and pays")
    Rel(staff, cms, "Manages site allocation and equipment")
    
    Rel(cms, stripe, "Sends payment requests to")
    Rel(cms, email, "Dispatches notifications through")
```

---

## 2. Entity-Relationship Diagram (Figure 4.1)
```mermaid
erDiagram
    USER ||--o{ BOOKING : places
    USER ||--o{ PAYMENT : makes
    USER ||--|| USER_PREFERENCES : has
    SITE ||--o{ BOOKING : reserved_in
    BOOKING ||--o{ GUEST : includes
    BOOKING ||--o{ VEHICLE : registers
    BOOKING ||--o{ PAYMENT : settles
    BOOKING ||--o{ EQUIPMENT_RESERVATION : requests
    EQUIPMENT ||--o{ EQUIPMENT_ITEM : contains
    EQUIPMENT ||--o{ EQUIPMENT_RESERVATION : allocated_for
    EQUIPMENT_RESERVATION ||--o{ EQUIPMENT_RENTAL : fulfills
    EQUIPMENT_ITEM ||--o{ EQUIPMENT_RENTAL : rented_out

    USER {
        string id PK
        string email
        string role
        string password
    }
    SITE {
        string id PK
        string name
        float basePrice
        float mapPositionX
        float mapPositionY
    }
    BOOKING {
        string id PK
        string bookingNumber
        datetime checkInDate
        datetime checkOutDate
        float totalAmount
        string status
    }
    PAYMENT {
        string id PK
        float amount
        string status
        string method
    }
    EQUIPMENT {
        string id PK
        string name
        int quantity
        float dailyRate
    }
```

---

## 3. System Use Case Diagram (Figure 3.2)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Customer" as C

rectangle "Campsite Management System" {
  usecase "Search Available Sites" as UC1
  usecase "Perform Booking & Payment" as UC2
  usecase "View Personal History" as UC3
  usecase "Check-in / Check-out" as UC4
  usecase "Manage Equipment Rentals" as UC5
  usecase "Edit Map Layout (Fabric.js)" as UC6
  usecase "Manage System Settings" as UC7
  usecase "View Financial Analytics" as UC8
}

actor "Staff" as S
actor "Admin" as A

C --> UC1
C --> UC2
C --> UC3

UC1 <-- S
UC4 <-- S
UC5 <-- S

UC4 <-- A
UC5 <-- A
UC6 <-- A
UC7 <-- A
UC8 <-- A

@enduml
```

---

## 4. Booking Logic Flowchart (Figure 4.2)
```mermaid
flowchart TD
    Start([Customer selects Dates/Site]) --> Valid{Dates Valid?}
    Valid -- No --> Error([Show Error])
    Valid -- Yes --> Query[Query Database for Overlaps]
    Query --> Conflict{Overlap Found?}
    Conflict -- Yes --> Unavailable([Mark Site Unavailable])
    Conflict -- No --> Calc[Calculate Dynamic Pricing]
    Calc --> Pay[Process Mock Stripe Payment]
    Pay --> Success{Payment Success?}
    Success -- No --> Fail([Show Payment Error])
    Success -- Yes --> Create[Create Booking Record]
    Create --> Done([Generate QR Code / Receipt])
```
