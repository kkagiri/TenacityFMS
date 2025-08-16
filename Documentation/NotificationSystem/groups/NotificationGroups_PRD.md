# Notification Groups - PRD

## Summary

- Goal: Add flexible, site-aware Notification Groups for recipient targeting in policies and notifications.
- Scope: Backend (entities, resolver integration, API) + Frontend (pages under fms.frontend/pages/notifications) + Documentation.
- Owner: Notification team
- Status: Draft

## Objectives

- Allow admins to define groups of users and/or roles (optionally scoped to a site) and target them from policies.
- Keep delivery dynamic: role membership, site membership, and user preferences are respected at send time.
- Ensure de-duplication with explicit recipients/policies/subscriptions.

## KPIs

- Configure recipients 2x faster vs. per-user mapping
- Zero duplicate deliveries per user per method
- Clear audit for group membership and policy mapping

## Features

1. Group Management

- Create/Edit/Delete notification groups
- Add members (User or Role)
- Optional Site scope (group applies only within a site)
- Allowed delivery methods at group level (optional)

1. Policy → Group Mapping

- Map Policy/Category to one or more groups
- Allowed delivery methods per mapping (optional)

1. Resolver Integration

- Expand groups to users (users + users in roles) with site filtering
- Intersect with policy flags and user preferences
- De-duplicate with explicit recipients and subscriptions

1. Audit & Security

- Track who created/updated groups and mappings
- Role-based access (only admins/site admins can manage)

## Non-Goals

- External directory sync (future)
- Complex rule engines inside groups (keep simple membership)

## UX (Frontend under pages/notifications)

- /notifications/recipients (tab: Groups)
  - Groups List (search, sort, filter by site)
  - Group Form (name, description, site scope, members: users/roles)
  - Members picker (multiselect of users and roles)
- /notifications/policies/:id/edit
  - Recipients tab: add groups; preview effective recipients (site-aware)

## API (New endpoints)

- GET /api/notification/groups
- POST /api/notification/groups
- PUT /api/notification/groups/{id}
- DELETE /api/notification/groups/{id}
- GET /api/notification/groups/{id}/members
- POST /api/notification/groups/{id}/members
- DELETE /api/notification/groups/{id}/members/{memberId}
- POST /api/notification/policies/{policyId}/groups
- DELETE /api/notification/policies/{policyId}/groups/{groupId}

## Data Model (ERD)

```mermaid
erDiagram
  NotificationPolicy ||--o{ NotificationPolicyGroup : maps
  NotificationPolicyGroup }o--|| NotificationGroup : targets

  NotificationGroup ||--o{ NotificationGroupMember : has
  NotificationGroupMember }o--|| User : user
  NotificationGroupMember }o--|| Role : role

  NotificationGroup {
    int Id
    string Name
    string? Description
    int? SiteId
    string? AllowedDeliveryMethods
    bool IsActive
    datetime CreatedAt
    string CreatedBy
    datetime? UpdatedAt
    string? UpdatedBy
  }

  NotificationGroupMember {
    int Id
    int GroupId
    string MemberType  // User | Role
    string MemberId    // User.Id or Role.Id
  }

  NotificationPolicyGroup {
    int Id
    int PolicyId
    int GroupId
    string? AllowedDeliveryMethods
  }
```

## Acceptance Criteria

- Groups CRUD works (with validation and audit)
- Policy-to-Group mapping works
- Resolver expands groups correctly and respects site scope
- No duplicate recipients for a given notification/method
- Delivery methods are constrained by policy flags and user preferences

## Risks

- Large group expansions (mitigate with paging/caching in resolver)
- Conflicts between group allowed methods and policy flags (policy wins)

## Timeline

- Backend: 1.5 weeks
- Frontend: 1.5 weeks
- Review & QA: 1 week

## Related

- User Flows: ./NotificationGroups_UserFlows.md
