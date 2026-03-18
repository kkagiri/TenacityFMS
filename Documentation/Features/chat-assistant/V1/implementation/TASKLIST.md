<!--
File: TASKLIST.md
Purpose: Task breakdown for AI Chat Assistant implementation (V1).
Dependencies: PRD.md, AGENTS.md, System.instructions.md
Last Modified: 2026-03-13
-->

# Task List: AI Chat Assistant (V1)

> Status: All items unchecked — implementation has not started.

---

## 1. Discovery & Setup

- [ ] Confirm OpenAI API key provisioning and environment variable name (`OPENAI_API_KEY`)
- [ ] Confirm OpenAI model to use (GPT-4o recommended)
- [ ] Confirm rate-limit defaults (10 msgs/user/min, 20 turns/session)
- [ ] Confirm where the floating chat button should appear (all pages vs selected pages)
- [ ] Confirm navigation item setup (dedicated `/chat-assistant` page in sidebar)
- [ ] Get user approval for `Features/ChatAssistant/` domain folder creation

---

## 2. Backend — Domain & Permissions

### 2.1 Permissions (Database)
- [ ] Write SQL migration: insert `ChatAssistant` parent permission under System Module
- [ ] Write SQL migration: insert `_Read_ChatAssistant` permission
- [ ] Assign `_Read_ChatAssistant` to all roles that have `_Read_Vehicle` (same pattern as VehicleTrips)
- [ ] Add `_Read_ChatAssistant` to `PermissionConstants.cs`

### 2.2 System Configuration (Database)
- [ ] Write SQL migration: insert `ChatAssistant.Enabled` system configuration row
- [ ] Write SQL migration: insert `ChatAssistant.RateLimitPerUserPerMinute` configuration row

---

## 3. Backend — Feature Folder Setup

- [ ] Create `FMS.Application/Features/ChatAssistant/` domain folder
- [ ] Create `Commands/` subfolder
- [ ] Create `Queries/` subfolder
- [ ] Create `DTOs/` subfolder
- [ ] Create `Services/` subfolder
- [ ] Create `Tools/` subfolder
- [ ] Create `Configuration/` subfolder

---

## 4. Backend — Configuration

- [ ] Create `ChatAssistantOptions.cs` (POCO for `appsettings.json` section)
- [ ] Add `ChatAssistant` section to `appsettings.json` (Provider, Model, MaxTokens, Temperature, etc.)
- [ ] Add `ChatAssistant` section to `appsettings.Development.json` with dev-safe defaults
- [ ] Register `ChatAssistantOptions` in DI (`services.Configure<ChatAssistantOptions>()`)

---

## 5. Backend — DTOs

- [ ] Create `ChatMessageDto.cs` (role, content, timestamp, toolCalls)
- [ ] Create `ChatRequestDto.cs` (message, conversationId, conversationHistory)
- [ ] Create `ChatResponseDto.cs` (message, toolsUsed, tokenUsage, isComplete)
- [ ] Create `ChatSuggestionDto.cs` (label, promptText, icon)
- [ ] Create `ChatUserContext.cs` (userId, permissions, siteIds, currentPage)
- [ ] Create `ChatToolDefinition.cs` (name, description, parameters JSON schema)
- [ ] Create `ChatToolResult.cs` (toolName, success, data, error)
- [ ] Create `ChatStreamToken.cs` (conversationId, token, isComplete, toolName)

---

## 6. Backend — LLM Provider Abstraction

- [ ] Create `IChatProviderService.cs` interface (SendAsync, StreamAsync)
- [ ] Create `OpenAIChatProviderService.cs` implementation
- [ ] Install OpenAI .NET SDK NuGet package (`Azure.AI.OpenAI` or `OpenAI`)
- [ ] Implement `SendAsync` — send messages + tools, return response or tool_call
- [ ] Implement `StreamAsync` — return `IAsyncEnumerable<ChatStreamToken>`
- [ ] Add retry logic for transient OpenAI failures (Polly or manual)
- [ ] Add timeout handling (configurable, default 30s)
- [ ] Add token usage tracking (log prompt + completion tokens)
- [ ] Register in DI as `Scoped` service

---

## 7. Backend — Tool Framework

### 7.1 Base Framework
- [ ] Create `BaseChatTool.cs` abstract class (RequiredPermission, ExecuteAsync, tool definition)
- [ ] Create `IChatToolRegistry.cs` interface (GetAllTools, GetToolByName)
- [ ] Create `ChatToolRegistry.cs` implementation (auto-discover all tools via DI)
- [ ] Create `IChatToolExecutor.cs` interface (ExecuteToolAsync with user context)
- [ ] Create `ChatToolExecutor.cs` implementation (permission check → execute → return JSON)
- [ ] Register tool framework in DI

### 7.2 Vehicle Tools
- [ ] Implement `GetVehiclesTool` — list vehicles with site/type/status filters
- [ ] Implement `GetVehicleDetailTool` — single vehicle full detail
- [ ] Implement `GetVehicleLocationTool` — last known GPS position
- [ ] Implement `GetVehiclesAtSiteTool` — vehicles currently within a site geofence
- [ ] Add site-scoping filter (user's assigned sites only)
- [ ] Add `_Read_Vehicle` permission check

### 7.3 Trip Tools
- [ ] Implement `GetVehicleTripsTool` — trip history with vehicle/site/date filters
- [ ] Implement `GetInProgressTripsTool` — currently active trips
- [ ] Implement `GetTripSummaryTool` — aggregated trip counts, distance, duration
- [ ] Add `_Read_VehicleTrips` permission check

### 7.4 Fuel Tools
- [ ] Implement `GetTankStockTool` — current tank stock levels with site filter
- [ ] Implement `GetFuelRefillsTool` — recent refill transactions
- [ ] Implement `GetFuelConsumptionTool` — vehicle fuel consumption summary
- [ ] Implement `GetFuelAuditSummaryTool` — fuel audit variance summary
- [ ] Add `_Read_Tank` / `_Read_FuelRefill` / `_Read_FuelAudit` permission checks

### 7.5 Site Tools
- [ ] Implement `GetSitesTool` — list user's accessible sites
- [ ] Implement `GetSiteSummaryTool` — overview (vehicle count, tank count, active alerts)

### 7.6 Issue Tools
- [ ] Implement `GetOpenIssuesTool` — open issues with priority/category filters
- [ ] Implement `GetIssueSummaryTool` — issue counts by priority and status
- [ ] Add `_Read_Issues` permission check

### 7.7 Notification & Maintenance Tools
- [ ] Implement `GetRecentAlertsTool` — recent notifications/alerts
- [ ] Implement `GetUpcomingMaintenanceTool` — vehicles with expiring documents / scheduled maintenance
- [ ] Add `_Read_Notification` / `_Read_VehicleDocuments` permission checks

### 7.8 Navigation Tool
- [ ] Implement `GetPageLinkTool` — map page name to FMS route URL
- [ ] Define static route map (page name → React route)

---

## 8. Backend — Chat Orchestration Service

- [ ] Create `IChatAssistantService.cs` interface
- [ ] Create `ChatAssistantService.cs` implementation
- [ ] Implement conversation context management (system prompt + history + new message)
- [ ] Implement tool-call loop (LLM → tool_call → execute → feed result → LLM final answer)
- [ ] Implement max tool-call depth guard (prevent infinite tool loops)
- [ ] Implement rate limiting (per-user, per-minute, from ChatAssistantOptions)
- [ ] Implement system prompt builder (inject FMS domain context + user permissions summary)
- [ ] Implement site-scoping context injection (user's assigned site names in system prompt)
- [ ] Implement streaming orchestration (yield tokens, interleave tool call notifications)
- [ ] Register in DI

---

## 9. Backend — CQRS Commands & Queries

### 9.1 SendChatMessageCommand
- [ ] Create `SendChatMessageCommand.cs` (command record)
- [ ] Create `SendChatMessageCommandHandler.cs` (handler)
- [ ] Handler: validate input (non-empty message, message length)
- [ ] Handler: build `ChatUserContext` from JWT claims
- [ ] Handler: check `ChatAssistant.Enabled` system configuration
- [ ] Handler: delegate to `IChatAssistantService`
- [ ] Handler: return `FMSResponse<ChatResponseDto>`

### 9.2 GetChatSuggestionsQuery
- [ ] Create `GetChatSuggestionsQuery.cs` (query record with optional currentPage)
- [ ] Create `GetChatSuggestionsQueryHandler.cs` (handler)
- [ ] Return context-aware suggestions based on current page and user permissions
- [ ] Return `FMSResponse<List<ChatSuggestionDto>>`

---

## 10. Backend — Controller

- [ ] Create `ChatAssistantController.cs` in `FMS.WebClient/Controllers/ChatAssistant/`
- [ ] Add `[Authorize]` attribute
- [ ] Implement `POST /api/v1/chat/send` endpoint (dispatches `SendChatMessageCommand`)
- [ ] Implement `GET /api/v1/chat/suggestions` endpoint (dispatches `GetChatSuggestionsQuery`)
- [ ] All endpoints return `FMSResponse<T>`
- [ ] Add `[ApiVersion("1")]` attribute

---

## 11. Backend — SignalR Streaming

- [ ] Add `ChatTokenReceived` event to `FrontendHub` (or create `ChatHub`)
- [ ] Add `ChatToolCallStarted` event
- [ ] Add `ChatToolCallCompleted` event
- [ ] Add `ChatError` event
- [ ] Inject `IHubContext<FrontendHub>` into `ChatAssistantService`
- [ ] Stream tokens to user's SignalR connection (scoped by userId)
- [ ] Add SignalR group management for chat (user joins on panel open, leaves on close)

---

## 12. Backend — DI Registration

- [ ] Register `IChatProviderService` → `OpenAIChatProviderService`
- [ ] Register `IChatToolRegistry` → `ChatToolRegistry`
- [ ] Register `IChatToolExecutor` → `ChatToolExecutor`
- [ ] Register `IChatAssistantService` → `ChatAssistantService`
- [ ] Register all tools (`BaseChatTool` implementations) via assembly scanning or manual registration
- [ ] Register `ChatAssistantOptions` configuration binding
- [ ] Add registration method in `FmsServiceCollectionExtensions` (e.g., `AddChatAssistant()`)

---

## 13. Frontend — Redux

- [ ] Create `chatAssistantSlice.js` in `redux/slices/`
- [ ] Define state: `messages`, `isLoading`, `isStreaming`, `streamBuffer`, `suggestions`, `isPanelOpen`, `error`, `conversationId`
- [ ] Add actions: `sendMessage`, `receiveToken`, `completeMessage`, `togglePanel`, `clearConversation`, `setError`, `setSuggestions`
- [ ] Add async thunk: `sendChatMessage` (POST to backend, handle response)
- [ ] Add async thunk: `fetchChatSuggestions` (GET suggestions)
- [ ] Register slice in store

---

## 14. Frontend — API Service

- [ ] Create `chatAssistantApi.js` in `api/`
- [ ] Implement `sendMessage(message, conversationId, conversationHistory)`
- [ ] Implement `getSuggestions(currentPage)`
- [ ] Use existing `axiosInstance` with auth headers

---

## 15. Frontend — SignalR Integration

- [ ] Subscribe to `ChatTokenReceived` event in SignalR service
- [ ] Subscribe to `ChatToolCallStarted` event
- [ ] Subscribe to `ChatToolCallCompleted` event
- [ ] Subscribe to `ChatError` event
- [ ] Dispatch Redux actions on each SignalR event
- [ ] Handle connection lifecycle (subscribe on panel open, unsubscribe on close)

---

## 16. Frontend — Components

### 16.1 Chat Toggle Button (FAB)
- [ ] Create `ChatToggleButton.js` — floating action button (bottom-right corner)
- [ ] Use `fa-light fa-message-bot` icon
- [ ] Permission gate: hide if user lacks `_Read_ChatAssistant`
- [ ] Show unread indicator when panel is closed and new response arrived
- [ ] Render in App shell layout (visible on all pages)

### 16.2 Chat Panel (Slide-Out)
- [ ] Create `ChatAssistantPanel.js` — slide-out panel from bottom-right
- [ ] Panel header with title ("Chat Assistant") and close button
- [ ] Animated open/close transition
- [ ] Fixed position, responsive width (350px desktop, full-width mobile)
- [ ] Max height: 70vh

### 16.3 Chat Message List
- [ ] Create `ChatMessageList.js` — scrollable message container
- [ ] Auto-scroll to bottom on new messages
- [ ] Show welcome message on empty state
- [ ] Show typing indicator during streaming

### 16.4 Chat Message Bubble
- [ ] Create `ChatMessageBubble.js` — individual message renderer
- [ ] User messages: right-aligned, blue background
- [ ] Assistant messages: left-aligned, light gray background
- [ ] Install and use `react-markdown` for rendering tables, lists, bold, code
- [ ] Render clickable links for navigation suggestions
- [ ] Show timestamp on hover

### 16.5 Chat Input
- [ ] Create `ChatInput.js` — text input + send button
- [ ] Enter key sends message (Shift+Enter for newline)
- [ ] Disable input while waiting for response
- [ ] Max character limit (2,000) with counter
- [ ] Send button icon: `fa-light fa-paper-plane-top`

### 16.6 Suggestion Chips
- [ ] Create `ChatSuggestionChips.js` — horizontal scrollable chip list
- [ ] Show on conversation start and after each response
- [ ] Click fills input and auto-sends
- [ ] Chips are context-aware (fetched from backend)

### 16.7 Tool Call Indicator
- [ ] Create `ChatToolIndicator.js` — animated indicator during tool execution
- [ ] Show tool name: "Searching vehicles...", "Checking fuel levels..."
- [ ] Animate with a subtle loading spinner

### 16.8 Full Page
- [ ] Create `ChatAssistantPage.js` — full-page chat route
- [ ] Wider layout, same components as panel but expanded
- [ ] Permission gate wrapper

---

## 17. Frontend — Routing & Navigation

- [ ] Add route in `Content.js`: `<Route path="/chat-assistant" element={<ChatAssistantPage />} />`
- [ ] Add wildcard route: `<Route path="/chat-assistant/*" element={<ChatAssistantPage />} />`
- [ ] Add mapping in `app-routes.js`
- [ ] Add `ChatToggleButton` to the main App shell layout (always rendered)
- [ ] Add navigation item SQL: insert into `navigationitems` table

---

## 18. Frontend — Styling

- [ ] Create `chatAssistant.scss`
- [ ] All Tailwind classes use `tw-` prefix
- [ ] Panel animation: slide-up from bottom-right
- [ ] Message bubbles: rounded corners, appropriate spacing
- [ ] Markdown table styling within bubbles
- [ ] Responsive: panel becomes full-screen on mobile
- [ ] FAB button: consistent with FMS design system
- [ ] Dark mode: not required (light mode only per FMS convention)

---

## 19. Frontend — Custom Hook

- [ ] Create `useChatAssistant.js` hook
- [ ] Manage local conversation state
- [ ] Handle SignalR event subscriptions
- [ ] Expose: `sendMessage`, `clearConversation`, `suggestions`, `messages`, `isLoading`, `isStreaming

---

## 20. Testing

### Backend
- [ ] Unit test: `ChatToolExecutor` — permission denied returns error
- [ ] Unit test: `ChatToolExecutor` — valid tool call returns data
- [ ] Unit test: `ChatAssistantService` — rate limiting blocks excessive requests
- [ ] Unit test: `SendChatMessageCommandHandler` — disabled feature returns error
- [ ] Unit test: `GetChatSuggestionsQueryHandler` — returns suggestions based on page
- [ ] Unit test: Each tool — returns expected data shape
- [ ] Integration test: Full flow (message → tool call → response)

### Frontend
- [ ] Component test: `ChatToggleButton` hidden without permission
- [ ] Component test: `ChatInput` sends message on Enter
- [ ] Component test: `ChatMessageBubble` renders markdown correctly
- [ ] Component test: `ChatSuggestionChips` triggers send on click

---

## 21. Database Migration Script

- [ ] Create `add_chatassistant_permissions_and_settings.sql`
- [ ] Insert `ChatAssistant` parent permission
- [ ] Insert `_Read_ChatAssistant` permission
- [ ] Auto-assign to existing roles (mirror `_Read_Vehicle` assignments)
- [ ] Insert `ChatAssistant.Enabled` system configuration
- [ ] Insert `ChatAssistant.RateLimitPerUserPerMinute` system configuration
- [ ] Test migration on MySQL 5.5/5.6 compatibility
- [ ] Place in `scripts/database/`

---

## 22. Documentation & NuGet

- [ ] Add `OpenAI` NuGet package to `FMS.Application.csproj`
- [ ] Add `react-markdown` npm package to `fms.frontend/package.json`
- [ ] Verify the solution builds after package additions
- [ ] Add `OPENAI_API_KEY` to `appsettings.example.json` as placeholder

---

## 23. Verification & QA

- [ ] Verify floating chat button appears on all pages for authorized users
- [ ] Verify floating chat button is hidden for unauthorized users
- [ ] Verify `/chat-assistant` page loads and is functional
- [ ] Verify a simple question returns an accurate, streamed response
- [ ] Verify permission-scoped tools only return data the user can access
- [ ] Verify site-scoped filtering works (user at Site A cannot see Site B data)
- [ ] Verify rate limiting triggers after configured threshold
- [ ] Verify conversation clears on page refresh
- [ ] Verify error handling when OpenAI API is unreachable
- [ ] Verify markdown rendering (tables, bold, lists, links)
- [ ] Verify suggestion chips work and trigger appropriate queries
- [ ] Verify tool call indicator shows/hides correctly during processing
- [ ] Verify no API key exposure in frontend bundle or browser dev tools
- [ ] Verify all API responses use `FMSResponse<T>` pattern
- [ ] Performance: verify response latency is acceptable (< 5s for simple queries)
- [ ] Performance: verify streaming tokens appear within 1-2s of sending
