# Design Document: Enterprise Student Separation

## Overview

This feature separates enterprise (institutional) students from regular (individual) students by introducing a new user role (`enterprise-student`), separate login portals, and institution-based access controls. The system will maintain backward compatibility while enabling institution-specific features, proper tracking, and different pricing models for enterprise vs individual students.

## Architecture

```mermaid
graph TD
    A[User Access] --> B{Login Portal}
    B -->|/login.html| C[Regular Students]
    B -->|/enterprise-login.html| D[Enterprise Users]
    
    C --> E[Role: student/pro]
    D --> F{Role Selection}
    
    F --> G[enterprise-student]
    F --> H[teacher]
    F --> I[enterprise admin]
    
    E --> J[Student Dashboard]
    G --> K[Enterprise Student Dashboard]
    H --> L[Teacher Dashboard]
    I --> M[Enterprise Admin Dashboard]
    
    G -.->|requires| N[Institution Code]
    H -.->|requires| N
    I -.->|requires| N
    
    J --> O[Individual Features]
    K --> P[Institution Features]
    
    style G fill:#60a5fa
    style N fill:#fbbf24


## Main Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant EP as Enterprise Portal
    participant Auth as Auth System
    participant FB as Firebase/Firestore
    participant Dash as Dashboard
    
    U->>EP: Access /enterprise-login.html
    EP->>U: Show role selector (student/teacher/admin)
    U->>EP: Select "enterprise-student" + enter credentials
    EP->>Auth: Validate credentials
    Auth->>FB: Check user exists
    FB-->>Auth: User data
    Auth->>Auth: Verify institutionId/schoolCode exists
    
    alt Institution code missing
        Auth-->>EP: Error: Institution code required
        EP-->>U: Show error message
    else Institution code valid
        Auth->>Auth: Set role = 'enterprise-student'
        Auth->>FB: Save user with enterprise-student role
        Auth-->>EP: Authentication successful
        EP->>Dash: Redirect to dashboard
        Dash->>Dash: Apply enterprise branding
        Dash-->>U: Show enterprise student dashboard
    end
