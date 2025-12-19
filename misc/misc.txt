
# System Diagrams

## Use Case Diagram (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Guest" as guest
actor "Customer" as customer
actor "Staff" as staff
actor "Manager" as manager
actor "Admin" as admin

customer -|> guest
manager -|> staff
admin -|> manager

rectangle "Campsite Management System" {
  
  package "Public / Guest" {
    usecase "Browse Sites" as UC1
    usecase "Search Availability" as UC2
    usecase "Book Site (Guest Checkout)" as UC3
    usecase "Register / Create Account" as UC4
  }

  package "Customer Portal" {
    usecase "Login" as UC5
    usecase "View My Bookings" as UC6
    usecase "Pay Balance" as UC7
    usecase "Manage Profile" as UC8
  }

  package "Operations (Staff)" {
    usecase "View Dashboard" as UC9
    usecase "Check-In / Check-Out" as UC10
    usecase "Manage Bookings" as UC11
    usecase "Process On-site Payment" as UC12
    usecase "Manage Equipment Rentals" as UC13
  }

  package "Management (Manager)" {
    usecase "Manage Sites / Map" as UC14
    usecase "View Reports & Analytics" as UC15
    usecase "Manage Pricing Rules" as UC16
  }

  package "Administration (Admin)" {
    usecase "Manage Users" as UC17
    usecase "System Settings" as UC18
  }
}

guest --> UC1
guest --> UC2
guest --> UC3
guest --> UC4

customer --> UC5
customer --> UC6
customer --> UC7
customer --> UC8

staff --> UC9
staff --> UC10
staff --> UC11
staff --> UC12
staff --> UC13

manager --> UC14
manager --> UC15
manager --> UC16

admin --> UC17
admin --> UC18

@enduml
```

## Booking Flowchart (Mermaid)

```mermaid
flowchart TD
    Start([Start]) --> Search[Search Sites]
    Search -->|Filter by Dates/Guests| List[List Available Sites]
    List --> Select[Select Site]
    Select --> AuthCheck{Is User Logged In?}
    
    AuthCheck -->|No| GuestOption{Guest Checkout?}
    GuestOption -->|Yes| GuestForm[Enter Guest Details]
    GuestOption -->|No| Login[Login / Register]
    Login --> Review
    GuestForm --> Review
    AuthCheck -->|Yes| Review
    
    Review[Review Booking Details] --> Payment[Enter Payment Details]
    Payment --> ProcessPayment{Payment Success?}
    
    ProcessPayment -->|No| Retry[Retry Payment]
    Retry --> Payment
    
    ProcessPayment -->|Yes| Confirm[Confirm Booking]
    Confirm --> Email[Send Confirmation Email]
    Email --> Success([Show Success Page])
```

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o{ Booking : "makes"
    User ||--o{ Notification : "receives"
    Site ||--o{ Booking : "is_reserved_in"
    Site ||--o{ PricingRule : "affected_by"
    Booking ||--o{ Payment : "has"
    Booking ||--o{ EquipmentRental : "includes"
    Equipment ||--o{ EquipmentRental : "rented_in"
    Booking ||--o{ Communication : "associated_with"

    User {
        string id PK
        string email
        string firstName
        string lastName
        string role "ADMIN, MANAGER, STAFF, CUSTOMER"
        boolean isActive
    }

    Site {
        string id PK
        string name
        string type "TENT, RV, CABIN"
        string status
        float basePrice
        int capacity
        json location
    }

    Booking {
        string id PK
        string bookingNumber
        string userId FK
        string siteId FK
        datetime checkInDate
        datetime checkOutDate
        string status "PENDING, CONFIRMED, CANCELLED..."
        string paymentStatus "PAID, PARTIAL, PENDING..."
        float totalAmount
        float paidAmount
    }

    Payment {
        string id PK
        string bookingId FK
        float amount
        string method
        string status
        string stripePaymentId
    }

    Equipment {
        string id PK
        string name
        string category
        int quantity
        float dailyRate
    }

    EquipmentRental {
        string id PK
        string bookingId FK
        string equipmentId FK
        int quantity
        float totalAmount
    }
    
    PricingRule {
        string id PK
        string name
        datetime startDate
        datetime endDate
        float priceModifier
        string modifierType
    }
```

## Booking Sequence Diagram (Mermaid)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    participant S as Stripe

    U->>F: Select Site, Dates & Guests
    F->>B: POST /bookings (Draft/Pending)
    B->>D: Create Booking (Status: PENDING)
    D-->>B: Booking ID
    B-->>F: Return Booking Details & Payment Intent
    
    U->>F: Enter Payment Information
    F->>S: Confirm Card Payment
    S-->>F: Payment Successful (PaymentIntent ID)
    
    F->>B: POST /payments/confirm (BookingID)
    B->>S: Verify Payment Status
    S-->>B: Status: Succeeded
    
    B->>D: Update Payment (Status: PAID)
    B->>D: Update Booking (Status: CONFIRMED)
    B->>D: Allocate Equipment (if any)
    
    B-->>F: Booking Confirmed
    F->>U: Display Confirmation Page
```

## Booking State Diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer starts booking
    Pending --> Confirmed : Payment successful
    Pending --> Cancelled : Timeout / User cancel
    
    Confirmed --> CheckedIn : Staff checks in guest
    Confirmed --> Cancelled : Customer/Admin cancels
    Confirmed --> NoShow : Guest fails to arrive
    
    CheckedIn --> CheckedOut : Guest leaves
    
    CheckedOut --> [*]
    Cancelled --> [*]
    NoShow --> [*]

    state Confirmed {
        [*] --> Paid
        Paid --> PartialRefund : Modification
    }

```

## System Architecture Diagram (Mermaid)

```mermaid
graph TB
    subgraph Clients ["Clients (Presentation Layer)"]
        Guest[Guest User]
        Customer[Customer Portal]
        Staff[Staff / Admin Dashboard]
    end

    subgraph FE ["Frontend Application (React + Vite)"]
        Router[React Router]
        Pages[Page Components]
        State[Zustand State Store]
        API_Client[Axios / React Query]
    end

    subgraph BE ["Backend Services (Values Planned)"]
        Gateway[API Gateway / Router]
        AuthSvc[Authentication Service]
        BookingSvc[Booking Management Service]
        SiteSvc[Site / Map Service]
        PaySvc[Payment Service]
    end

    subgraph DB ["Data Persistence Layer (Planned)"]
        Postgres[(PostgreSQL Database)]
        Cache[(Redis Cache)]
    end

    subgraph External ["External Services (Planned)"]
        Stripe[Stripe Payment Gateway]
        Email[Email / SMS Provider]
    end

    %% Client to Frontend
    Guest & Customer & Staff -->|HTTPS / WSS| Router

    %% Frontend Internal
    Router --> Pages
    Pages --> State
    Pages --> API_Client

    %% Frontend to Backend
    API_Client -->|REST API / JSON| Gateway

    %% Backend Routing
    Gateway --> AuthSvc
    Gateway --> BookingSvc
    Gateway --> SiteSvc
    Gateway --> PaySvc

    %% Service Integrations
    AuthSvc --> Postgres
    SiteSvc --> Postgres
    
    BookingSvc --> Postgres
    BookingSvc --> Cache
    
    PaySvc --> Stripe
    PaySvc --> Postgres
    
    %% Notifications
    BookingSvc -.->|Trigger| Email
    AuthSvc -.->|Trigger| Email

    %% Styling
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef service fill:#bbf,stroke:#333,stroke-width:2px;
    classDef db fill:#bfb,stroke:#333,stroke-width:2px;
    classDef ext fill:#fbb,stroke:#333,stroke-width:2px;

    class Guest,Customer,Staff client;
    class AuthSvc,BookingSvc,SiteSvc,PaySvc,Gateway service;
    class Postgres,Cache db;
    class Stripe,Email ext;
```

