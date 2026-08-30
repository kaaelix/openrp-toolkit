---
name: openrp-behavior-invariants
description: Enforces strict OpenRP behavior graph schema validation, pre-flight linting, and mandatory execution polling until COMPLETED.
trigger: always_on
---

# OpenRP Behavior Engineering Invariants

Whenever designing, modifying, validating, or debugging OpenRP Behavior Graphs:

## 1. Pre-Flight Validation Rule
* Always run `node bin/validator.js` or static schema checks before making PUT/POST requests to the behavior API.
* Ensure all ReactFlow edge IDs strictly follow `xy-edge__<sourceNode><sourceHandle>-<targetNode><targetHandle>`.

## 2. Node Schema Invariants
* `utilities/map`: Input MUST be `itemTemplate: { "$template": "..." }` or `{ "$expression": "..." }`. Never use `itemExpression`.
* `utilities/join`: Output property is `text`. Never reference `.string`.
* `storage/insert_chat_message`: Participant parameter MUST be `chatParticipantId`. Never use `participantId`.
* `storage/update_typing_status`: Participant parameter MUST be `chatParticipantId`. Never use `participantId`.

## 3. Behavior Attachment & Isolation
* When testing or deploying a custom behavior DAG, always detach/disable default `openrp/behaviors/chat` from the character or character group to prevent concurrent dual execution and race conditions.

## 4. Verification-to-Completion Protocol
* **Never assert success without runtime evidence.**
* After sending a test message via `POST /api/chats/{chatId}/messages`, immediately poll `POST /api/v1/behavior-executions/search`.
* If status is `BEHAVIOR_EXECUTION_STATUS_FAILED`, call `GET /api/v1/behavior-executions/{executionId}/node-executions`, read the failing node's `output.error`, apply the fix, redeploy, and repeat until status is confirmed as `BEHAVIOR_EXECUTION_STATUS_COMPLETED`.

## 5. Defensive Architecture & Safety (Senior Mindset)
* **Zero-Trust External Calls**: All `ai/llm` and `utilities/http_request` nodes MUST be enclosed inside `control_flow/try` to trap HTTP 500s or timeouts.
* **Race Condition Mitigation**: When orchestrating multi-character group chats, safely isolate memory writes. Rely on scoped variables and `control_flow/sync` when fanning out.

## 6. Senior Autonomous Diagnostic Protocol
* DO NOT stop or ask the user for help at the first sign of a failure or HTTP 400/500 error.
* Proactively use available tools (`openrp_raw_api`, `openrp_execute_behavior_debug`, `validator.js`) to extract stack traces, analyze node inputs vs expected Zod schemas, and deploy a hotfix autonomously.
* Only request user intervention after 3 failed attempts, presenting a concise root-cause analysis and options.
