<!--
File: PRD.md
Purpose: Product Requirements Document for the FMS AI Chat Assistant feature.
Dependencies: AGENTS.md, System.instructions.md, appsettings.json
Last Modified: 2026-03-13
-->

# Product Requirements Document: AI Chat Assistant

| Field       | Value                                    |
|-------------|------------------------------------------|
| Version     | 1.0                                      |
| Date        | 2026-03-13                               |
| Status      | Draft                                    |
| Author      | FMS Engineering                          |
| Module      | ChatAssistant                            |

---

## 1. Executive Summary

The AI Chat Assistant embeds a conversational AI interface inside the FMS application that lets users ask natural-language questions about fleet data. The assistant translates user questions into scoped database queries, calls internal FMS APIs, and returns human-readable answers — all within the user's permission boundary.

Key capabilities:

1. **Data Inquiry** — "How many vehicles are currently at Juja site?", "What is the fuel level of Tank 3?"
2. **Status Summaries** — "Give me today's trip summary for vehicle KBZ 123A"
3. **Analytical Insights** — "Which vehicles consumed the most fuel this week?"
4. **System Navigation** — "Take me to the fuel audit page" (deep-link generation)
5. **Streaming Responses** — Token-by-token delivery via SignalR for a real-time typing effect

The feature uses OpenAI's GPT-4o model (configurable) with a **function-calling / tool-use** pattern. The LLM never accesses the database directly — it selects from pre-defined "tools" that execute safe, parameterised, read-only queries through existing CQRS query handlers and EF Core.

---

## 2. Problem Statement

FMS users currently must navigate between multiple modules (vehicles, tanks, trips, fuel, reports, dashboards) to find answers to simple questions. Common pain points:

- **Context switching** — checking vehicle status requires opening the vehicle page, then the tracking page, then the fuel page
- **Report fatigue** — users generate full reports when they only need a single metric
- **Training overhead** — new operators struggle to locate data across 27+ page modules
- **No conversational interface** — users cannot ask ad-hoc questions without building a report or navigating to the correct page
- **Support burden** — fleet managers frequently ask the same data questions that could be self-served

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Provide a natural-language interface to query FMS data |
| G2 | Enforce role-based access — users only see data their permissions allow |
| G3 | Support all major FMS domains: vehicles, fuel, tanks, trips, sites, issues, notifications |
| G4 | Stream responses in real-time for a responsive conversation experience |
| G5 | Use a tool/function-calling architecture so the LLM never touches the database directly |
| G6 | Keep conversation state in-memory (session-only, no database persistence in V1) |
| G7 | Provide both a floating chat widget (accessible from any page) and a dedicated chat page |
| G8 | Make the AI provider pluggable (OpenAI today, Azure OpenAI or local LLM later) |

---

## 4. Scope

### In Scope (V1)

- Floating chat panel (slide-out from bottom-right corner on every page)
- Dedicated full-page chat route (`/chat-assistant`)
- OpenAI GPT-4o integration via backend proxy (API key never exposed to client)
- Function-calling / tool-use pattern with pre-defined read-only tools
- Permission-aware data queries (filter by user's site access + RBAC permissions)
- Token-by-token streaming via SignalR
- Context-aware suggestion chips (quick questions based on current page context)
- Markdown rendering in chat bubbles (tables, lists, bold, code)
- Session-only conversation history (cleared on page refresh / logout)
- System prompt with FMS domain knowledge
- Rate limiting (per-user, configurable)
- Error handling for LLM provider failures

### Out of Scope (V1)

- Persistent chat history (database storage)
- Write operations via chat (no creating/updating/deleting records through the chatbot)
- Voice input/output
- Multi-language support (English only in V1)
- Image / chart generation in responses
- Mobile app integration
- Custom fine-tuned models
- Embedding-based RAG over FMS documentation

---

## 5. Users

| Persona | How They Use the Assistant |
|---------|---------------------------|
| **Fleet Manager** | "How many trips did vehicle KBZ 456B complete today?", "Show me vehicles with expired documents" |
| **Fuel Auditor** | "What's the fuel variance for Site Alpha this week?", "Which vehicles have negative fuel consumption?" |
| **Site Manager** | "How many vehicles are on-site right now?", "What's the current tank stock?" |
| **Dispatcher** | "Which vehicles are currently in transit?", "Show me the last known location of KCB 789C" |
| **Operations Manager** | "Give me a daily summary of fleet activity", "What are the open high-priority issues?" |
| **New User** | "Where can I see fuel refill history?", "How do I create a maintenance record?" (navigation help) |

---

## 6. Architecture Overview

### 6.1 High-Level Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         React Frontend                               │
│                                                                      │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │ ChatPanel    │───▶│ Redux Slice  │───▶│ chatAssistantApi.js     │ │
│  │ (floating /  │    │ (messages,   │    │ (POST /send, SSE or     │ │
│  │  full-page)  │◀───│  loading)    │◀───│  SignalR streaming)     │ │
│  └─────────────┘    └──────────────┘    └────────────┬────────────┘ │
└──────────────────────────────────────────────────────┼──────────────┘
                                                       │ HTTPS + WSS
┌──────────────────────────────────────────────────────┼──────────────┐
│                         FMS Web API                  │              │
│                                                      ▼              │
│  ┌─────────────────────┐    ┌────────────────────────────────────┐  │
│  │ ChatAssistantController  │    │ SendChatMessageCommand          │  │
│  │ POST /api/v1/chat/send  │───▶│ (MediatR handler)              │  │
│  └─────────────────────┘    └───────────────┬────────────────────┘  │
│                                             │                       │
│                                             ▼                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   ChatAssistantService                       │   │
│  │  1. Build system prompt (FMS context + user permissions)     │   │
│  │  2. Send to LLM with tool definitions                       │   │
│  │  3. LLM returns: direct answer OR tool_call request          │   │
│  │  4. If tool_call → ChatToolExecutor runs scoped query        │   │
│  │  5. Feed tool result back to LLM for final answer            │   │
│  │  6. Stream tokens to client via SignalR                      │   │
│  └──────────────┬────────────────────────┬──────────────────────┘   │
│                 │                        │                          │
│                 ▼                        ▼                          │
│  ┌──────────────────────┐  ┌──────────────────────────────┐        │
│  │  OpenAI API (GPT-4o) │  │  ChatToolExecutor            │        │
│  │  (external HTTPS)    │  │  → GpsdataContext (read-only) │        │
│  └──────────────────────┘  │  → Permission-scoped queries  │        │
│                            └──────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 Tool / Function-Calling Pattern

The LLM never accesses the database. Instead, it selects from a registry of **tools** — each tool is a typed function that:
1. Accepts structured parameters (e.g., `vehicleId`, `dateFrom`, `dateTo`)
2. Executes a scoped, read-only query against `GpsdataContext`
3. Filters results by the calling user's site access and RBAC permissions
4. Returns a JSON result that the LLM incorporates into its answer

```
User: "What's the fuel level for Tank 3 at Juja?"
  → LLM selects tool: get_tank_stock { siteName: "Juja", tankIdentifier: "3" }
  → ChatToolExecutor: query Tankstocks WHERE site matches + tank matches
  → Returns: { tankName: "Diesel Tank 3", currentVolume: 12500, capacity: 25000, ... }
  → LLM formats: "Tank 3 (Diesel) at Juja currently has 12,500L — that's 50% of capacity."
```

### 6.3 Tool Categories

| Category | Tool Name | Description | Data Source |
|----------|-----------|-------------|-------------|
| **Vehicle** | `get_vehicles` | List vehicles with filters (site, type, status) | `Vehicles` |
| **Vehicle** | `get_vehicle_detail` | Single vehicle full detail | `Vehicles` + relations |
| **Vehicle** | `get_vehicle_location` | Last known GPS location | `VehicleLastKnownLocations` |
| **Vehicle** | `get_vehicles_at_site` | Vehicles currently at a given site | `VehicleLastKnownLocations` + `GpsGeofences` |
| **Trip** | `get_vehicle_trips` | Trip history with filters (vehicle, site, date range) | `VehicleTrips` |
| **Trip** | `get_in_progress_trips` | Currently active trips | `VehicleTrips` (InProgress) |
| **Trip** | `get_trip_summary` | Aggregated trip counts, distance, duration | `VehicleTrips` + `VehicleTripGroups` |
| **Fuel** | `get_tank_stock` | Current tank stock levels | `Tankstocks` + `Tanks` |
| **Fuel** | `get_fuel_refills` | Recent fuel refill transactions | `FuelRefills` |
| **Fuel** | `get_fuel_consumption` | Vehicle fuel consumption summary | `Vehicleconsumptions` |
| **Fuel** | `get_fuel_audit_summary` | Fuel audit variance summary | `FuelAudits` + `FuelAuditVariances` |
| **Site** | `get_sites` | List all sites user has access to | `Sites` |
| **Site** | `get_site_summary` | Site overview (vehicle count, tank count, alerts) | `Sites` + aggregations |
| **Issue** | `get_open_issues` | Open issues with filters | `Issuetrackers` |
| **Issue** | `get_issue_summary` | Issue counts by priority/status | `Issuetrackers` aggregated |
| **Notification** | `get_recent_alerts` | Recent notifications/alerts | `Notifications` |
| **Maintenance** | `get_upcoming_maintenance` | Vehicles due for maintenance | `VehicleDocuments` (expiring) |
| **Navigation** | `get_page_link` | Generate deep link to an FMS page | Static route map |
| **System** | `get_system_status` | System health overview | `SystemConfigurations` + services |

### 6.4 Security Model

```
┌──────────────────────────────────────────────────────────────────┐
│                        Security Layers                           │
│                                                                  │
│  1. JWT Authentication  → User must be logged in                 │
│  2. Permission Gate     → _Read_ChatAssistant permission         │
│  3. Tool-Level Scoping  → Each tool checks user's permissions:   │
│     • Vehicle tools check _Read_Vehicle                          │
│     • Fuel tools check _Read_FuelRefill / _Read_FuelAudit        │
│     • Trip tools check _Read_VehicleTrips                        │
│     • Issue tools check _Read_Issues                             │
│  4. Site-Level Filtering → Queries scoped to user's assigned     │
│     sites (UserSites table)                                      │
│  5. Data Sanitization   → Tool results are JSON — no raw SQL     │
│  6. API Key Protection  → OpenAI key stored server-side only     │
│  7. Rate Limiting       → Per-user message limit per minute      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Backend Design

### 7.1 Feature Folder Structure

```
FMS.Application/Features/ChatAssistant/
├── Commands/
│   └── SendChatMessageCommand.cs           # Command + Handler (user prompt → AI response)
├── Queries/
│   └── GetChatSuggestionsQuery.cs          # Query + Handler (context-aware suggestions)
├── DTOs/
│   ├── ChatMessageDto.cs                   # Single message (role, content, timestamp)
│   ├── ChatRequestDto.cs                   # Inbound request (message, conversationId)
│   ├── ChatResponseDto.cs                  # Full response (message, toolsUsed, tokens)
│   └── ChatSuggestionDto.cs                # Suggestion chip (label, prompt)
├── Services/
│   ├── IChatAssistantService.cs            # Orchestration interface
│   ├── ChatAssistantService.cs             # LLM orchestration implementation
│   ├── IChatToolRegistry.cs                # Tool definition registry interface
│   ├── ChatToolRegistry.cs                 # Registers all available tools
│   ├── IChatToolExecutor.cs                # Executes individual tool calls
│   ├── ChatToolExecutor.cs                 # Routes tool calls to handlers
│   ├── IChatProviderService.cs             # LLM provider abstraction
│   └── OpenAIChatProviderService.cs        # OpenAI GPT-4o implementation
├── Tools/
│   ├── BaseChatTool.cs                     # Abstract base with permission checks
│   ├── VehicleChatTools.cs                 # get_vehicles, get_vehicle_detail, get_vehicle_location
│   ├── TripChatTools.cs                    # get_vehicle_trips, get_in_progress_trips, get_trip_summary
│   ├── FuelChatTools.cs                    # get_tank_stock, get_fuel_refills, get_fuel_consumption
│   ├── SiteChatTools.cs                    # get_sites, get_site_summary
│   ├── IssueChatTools.cs                   # get_open_issues, get_issue_summary
│   ├── NotificationChatTools.cs            # get_recent_alerts
│   ├── MaintenanceChatTools.cs             # get_upcoming_maintenance
│   └── NavigationChatTools.cs              # get_page_link
└── Configuration/
    └── ChatAssistantOptions.cs             # Configuration POCO (provider, model, keys, limits)
```

### 7.2 Controller

```
FMS.WebClient/Controllers/ChatAssistant/
└── ChatAssistantController.cs              # POST send, GET suggestions, SignalR streaming
```

**Endpoints:**

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/chat/send` | Send a user message, receive AI response |
| `GET` | `/api/v1/chat/suggestions` | Get context-aware suggestion chips |

### 7.3 SignalR Integration

Streaming uses the existing `FrontendHub` to push partial tokens:

| Event | Direction | Payload |
|-------|-----------|---------|
| `ChatTokenReceived` | Server → Client | `{ conversationId, token, isComplete }` |
| `ChatToolCallStarted` | Server → Client | `{ conversationId, toolName }` |
| `ChatToolCallCompleted` | Server → Client | `{ conversationId, toolName }` |
| `ChatError` | Server → Client | `{ conversationId, error }` |

### 7.4 Configuration (`appsettings.json`)

```json
{
  "ChatAssistant": {
    "Provider": "OpenAI",
    "ApiKey": "",
    "Model": "gpt-4o",
    "MaxTokens": 4096,
    "Temperature": 0.3,
    "MaxConversationTurns": 20,
    "MaxToolCallsPerTurn": 5,
    "RateLimitPerUserPerMinute": 10,
    "SystemPromptTemplate": "You are an intelligent assistant for the Hyoung Fleet Management System (FMS). You help fleet managers, fuel auditors, and operations staff query live fleet data. Always be concise, accurate, and cite numbers. Only answer questions about FMS fleet data — politely decline unrelated requests.",
    "Enabled": true
  }
}
```

The `ApiKey` value MUST be loaded from environment variables in production — never committed to source control.

### 7.5 LLM Provider Abstraction

```csharp
public interface IChatProviderService
{
    /// Sends messages + tool definitions to the LLM.
    /// Returns either a direct text response or a tool_call request.
    Task<ChatProviderResponse> SendAsync(
        List<ChatMessageDto> messages,
        List<ChatToolDefinition> tools,
        CancellationToken cancellationToken);

    /// Streaming variant — yields tokens as they arrive.
    IAsyncEnumerable<ChatStreamToken> StreamAsync(
        List<ChatMessageDto> messages,
        List<ChatToolDefinition> tools,
        CancellationToken cancellationToken);
}
```

This abstraction allows swapping OpenAI for Azure OpenAI, Ollama, or any other provider by implementing `IChatProviderService`.

### 7.6 Tool Definition Schema

Each tool is defined using a strongly-typed schema that maps to OpenAI's function-calling format:

```csharp
public class ChatToolDefinition
{
    public string Name { get; set; }          // "get_tank_stock"
    public string Description { get; set; }   // "Get current tank stock levels..."
    public JsonElement Parameters { get; set; } // JSON Schema for parameters
}

public abstract class BaseChatTool
{
    /// Permission required to execute this tool.
    public abstract string RequiredPermission { get; }

    /// Execute the tool with validated, typed parameters.
    public abstract Task<JsonElement> ExecuteAsync(
        JsonElement parameters,
        ChatUserContext userContext,
        CancellationToken cancellationToken);
}
```

### 7.7 User Context

Every tool execution receives a `ChatUserContext` containing:

```csharp
public class ChatUserContext
{
    public int UserId { get; set; }
    public string UserName { get; set; }
    public List<string> Permissions { get; set; }
    public List<int> SiteIds { get; set; }       // User's assigned sites
    public string CurrentPage { get; set; }       // For context-aware suggestions
}
```

---

## 8. Frontend Design

### 8.1 Component Structure

```
fms.frontend/src/pages/chatAssistant/
├── ChatAssistantPanel.js           # Slide-out panel (floating widget)
├── ChatAssistantPage.js            # Full-page dedicated route
├── components/
│   ├── ChatMessageList.js          # Scrollable message container
│   ├── ChatMessageBubble.js        # Individual message (markdown render)
│   ├── ChatInput.js                # Text input + send button
│   ├── ChatSuggestionChips.js      # Quick-action suggestion buttons
│   ├── ChatToolIndicator.js        # "Searching vehicles..." loading indicator
│   └── ChatToggleButton.js         # Floating FAB to open/close panel
├── hooks/
│   └── useChatAssistant.js         # Manages conversation state, SignalR subscription
└── chatAssistant.scss              # All styles (tw- prefix + SCSS)
```

### 8.2 Redux Slice

```javascript
// redux/slices/chatAssistantSlice.js
{
  messages: [],              // Array of { id, role, content, timestamp, toolCalls }
  isLoading: false,          // True while waiting for AI response
  isStreaming: false,         // True during token-by-token delivery
  streamBuffer: "",          // Partial response being assembled
  suggestions: [],           // Context-aware suggestion chips
  isPanelOpen: false,        // Floating panel open/closed state
  error: null,               // Last error message
  conversationId: null,      // Session identifier (UUID, client-generated)
}
```

### 8.3 UI Layout

#### Floating Panel (Bottom-Right)

```
┌──────────────────────────────────────────────────────────────────┐
│                    FMS Application (any page)                    │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                            ┌───────────────────┐ │
│                                            │ Chat Assistant    │ │
│                                            │─────────────────  │ │
│                                            │ 💬 User: How     │ │
│                                            │ many vehicles...  │ │
│                                            │                   │ │
│                                            │ 🤖 Assistant:    │ │
│                                            │ There are 24     │ │
│                                            │ vehicles at Juja  │ │
│                                            │                   │ │
│                                            │ ┌──────────────┐  │ │
│                                            │ │ Suggestions: │  │ │
│                                            │ │ [Fuel Level]  │  │ │
│                                            │ │ [Tank Stock]  │  │ │
│                                            │ └──────────────┘  │ │
│                                            │ ┌──────────────┐  │ │
│                                            │ │ Ask me...    │  │ │
│                                            │ └──────┬───────┘  │ │
│                                            └────────┼──────────┘ │
│                                                 [💬 FAB]        │
└──────────────────────────────────────────────────────────────────┘
```

#### Full Page (`/chat-assistant`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Sidebar  │              Chat Assistant                          │
│           │─────────────────────────────────────────────────     │
│  ...      │                                                      │
│  ...      │  Welcome! I'm your FMS assistant. Ask me anything.   │
│  Chat ◀── │                                                      │
│  ...      │  Suggestions:                                        │
│           │  [ Vehicle count ] [ Tank stock ] [ Open issues ]    │
│           │                                                      │
│           │  💬 User: Show me fuel consumption for this week     │
│           │                                                      │
│           │  🤖 Searching fuel data...                           │
│           │  🤖 Here's the fuel consumption summary for          │
│           │     March 7–13, 2026:                                │
│           │                                                      │
│           │     | Vehicle   | Fuel (L) | Distance (km) |         │
│           │     |-----------|----------|---------------|         │
│           │     | KBZ 123A  | 342      | 1,205         |         │
│           │     | KCB 456B  | 287      | 980           |         │
│           │     | ...       | ...      | ...           |         │
│           │                                                      │
│           │  ┌────────────────────────────────────────────────┐  │
│           │  │ Type your question...                     [➤] │  │
│           │  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.4 Routing

```javascript
// Content.js
<Route path="/chat-assistant" element={<ChatAssistantPage />} />

// ChatToggleButton rendered in the App shell layout (always visible)
```

### 8.5 Permission Gate

- Component access gated by `_Read_ChatAssistant` permission
- If user lacks permission, the floating FAB is hidden and the route returns "Access denied"
- Tool-level permissions checked server-side (user can ask about vehicles only if they have `_Read_Vehicle`)

---

## 9. Conversation Flow

### 9.1 Standard Data Query

```
1. User types: "How many vehicles are at Juja site?"
2. Frontend POST /api/v1/chat/send { message, conversationId }
3. Backend builds full conversation context (system prompt + history + new message)
4. ChatAssistantService sends to LLM with tool definitions
5. LLM returns: tool_call { name: "get_vehicles_at_site", args: { siteName: "Juja" } }
6. SignalR → ChatToolCallStarted { toolName: "get_vehicles_at_site" }
7. ChatToolExecutor:
   a. Checks user has _Read_Vehicle permission → ✅
   b. Filters sites by user's assigned sites → Juja found
   c. Queries VehicleLastKnownLocations within Juja geofence
   d. Returns: { count: 24, vehicles: [...] }
8. Tool result appended to conversation, sent back to LLM
9. LLM generates final answer: "There are currently 24 vehicles at Juja site."
10. Tokens streamed via SignalR → ChatTokenReceived
11. SignalR → ChatTokenReceived { isComplete: true }
12. Frontend renders complete message in ChatMessageBubble
```

### 9.2 Permission Denied

```
1. User (with no fuel permissions) asks: "What's the fuel variance?"
2. LLM selects tool: get_fuel_audit_summary
3. ChatToolExecutor checks _Read_FuelAudit → ❌ Permission denied
4. Tool returns: { error: "permission_denied", message: "Fuel audit access required" }
5. LLM responds: "I'm sorry, you don't have access to fuel audit data.
   Please contact your administrator if you believe this is an error."
```

### 9.3 Multi-Tool Query

```
1. User asks: "Compare Juja and Thika site — vehicles, fuel, and trips today"
2. LLM calls tools sequentially:
   a. get_site_summary { siteName: "Juja" }
   b. get_site_summary { siteName: "Thika" }
3. Results combined, LLM generates comparison table
```

### 9.4 Navigation Help

```
1. User asks: "Where can I see maintenance records?"
2. LLM selects: get_page_link { pageName: "vehicle-maintenance" }
3. Tool returns: { url: "/vehicles/maintenance", label: "Vehicle Maintenance" }
4. LLM responds: "You can find maintenance records at **Vehicle Maintenance**.
   [Click here to go there](/vehicles/maintenance)"
5. Frontend renders a clickable link
```

---

## 10. Rate Limiting & Guardrails

| Guardrail | Default | Configurable |
|-----------|---------|--------------|
| Messages per user per minute | 10 | Yes (`appsettings.json`) |
| Max conversation turns per session | 20 | Yes |
| Max tool calls per single turn | 5 | Yes |
| Max tokens per response | 4,096 | Yes |
| Max input message length | 2,000 chars | Yes |
| LLM request timeout | 30 seconds | Yes |

When a rate limit is hit, the assistant responds with a friendly message: *"You're sending messages quite fast! Please wait a moment before your next question."*

---

## 11. Error Handling

| Scenario | User-Facing Behavior |
|----------|---------------------|
| OpenAI API down / timeout | "I'm having trouble connecting right now. Please try again in a moment." |
| Invalid tool call from LLM | Log error, respond: "I encountered an issue processing your request. Please try rephrasing." |
| Permission denied on all tools | "I can't access the data you're asking about with your current permissions." |
| Rate limit exceeded | "Please wait a moment before sending another message." |
| Chat feature disabled | FAB hidden, route shows "Chat Assistant is currently disabled." |
| Conversation too long | Auto-summarize or reset: "Our conversation is getting long. Let me start fresh." |

---

## 12. Database Changes

### V1 — No new tables required

Conversation state is session-only (in-memory on the client). No chat history tables.

### Permissions (new rows in `permissions` table)

```sql
-- Parent permission under system module
INSERT INTO permissions (Name, ParentId) VALUES ('ChatAssistant', @systemModuleId);

-- Read permission (required to use the chatbot)
INSERT INTO permissions (Name, ParentId) VALUES ('_Read_ChatAssistant', @chatAssistantId);
```

### System Configuration (new row)

```sql
INSERT INTO systemconfigurations (ConfigurationKey, ConfigurationValue, Description, Category, DataType, IsActive, IsEditable)
VALUES ('ChatAssistant.Enabled', 'true', 'Enable or disable the AI Chat Assistant feature', 'ChatAssistant', 'Boolean', 1, 1);
```

---

## 13. Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| **OpenAI .NET SDK** | Latest stable | Official OpenAI API client |
| **System.Text.Json** | Built-in (.NET 8) | JSON serialization for tool schemas |
| **react-markdown** | ^9.x | Markdown rendering in chat bubbles |
| **@microsoft/signalr** | Existing | Token streaming (already in project) |

### External Service Dependency

The feature depends on the **OpenAI API** (external HTTPS service). The backend must handle:
- API key rotation
- Network failures / timeouts
- Rate limiting from OpenAI's side
- Model deprecation (configurable model name)

---

## 14. Monitoring & Observability

| Metric | How |
|--------|-----|
| Messages sent per user/day | Application log (Serilog structured) |
| LLM latency (time to first token) | Serilog timing |
| Tool calls per message | Logged in handler |
| Errors (LLM failures, permission denials) | Error log + structured event |
| Token usage (prompt + completion) | Logged per request for cost tracking |

---

## 15. Future Considerations (V2+)

| Feature | Description |
|---------|-------------|
| Persistent chat history | Store conversations in database for audit and continuity |
| Write operations | Allow chatbot to create issues, schedule maintenance, trigger recompute |
| RAG over documentation | Embed FMS user guides for help-desk queries |
| Multi-language | Support additional languages via LLM translation |
| Voice input | Speech-to-text for hands-free fleet queries |
| Dashboard widget | Embed chat as a dashboard widget card |
| Mobile app | React Native chat integration |
| Custom fine-tuned model | Train on FMS-specific data for higher accuracy |
| Chart generation | Return visual charts (fuel trends, trip graphs) in responses |

---

## 16. Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC1 | User can open the chat panel from any page via the floating button |
| AC2 | User can navigate to `/chat-assistant` for the full-page experience |
| AC3 | User can type a question and receive an AI-generated answer |
| AC4 | Responses stream token-by-token (no waiting for full response) |
| AC5 | Chat respects user permissions — cannot access unauthorized data |
| AC6 | Markdown is properly rendered in responses (tables, bold, lists) |
| AC7 | Suggestion chips appear and trigger pre-built prompts when clicked |
| AC8 | Rate limiting works — user sees a friendly message when limit is hit |
| AC9 | When OpenAI is unreachable, user sees a user-friendly error message |
| AC10 | Chat button is hidden for users without `_Read_ChatAssistant` permission |
| AC11 | Conversation state is cleared on page refresh or logout |
| AC12 | Each tool respects site-level scoping (multi-tenancy) |
| AC13 | API key is never exposed to the client (backend-only) |
| AC14 | All chat endpoints return `FMSResponse<T>` |
