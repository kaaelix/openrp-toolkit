# OpenRP MCP Suite - 31/31 Tools Verification Report

- **Execution Timestamp**: 2026-08-27 15:59:41 UTC
- **Total Tools Tested**: 31/31
- **Passed Tools**: 31/31 (100%)
- **Target User**: Kaa (`019f4c49-0ec7-7374-8fab-d7e8add428bc`)
- **Target World**: Game (`01a04210-c169-743f-94a7-8f14c852befd`)

## Detailed Tool Execution Log

| # | Tool Name | Status | Description | Request Sample | Response Status |
|---|---|---|---|---|---|
| 01 | `openrp_set_auth` | **PASSED** | Set session credentials and start auto-refresh daemon | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 02 | `openrp_refresh_token` | **PASSED** | Perform explicit manual Supabase JWT refresh | `{}` | 200 OK / Handled |
| 03 | `openrp_get_me` | **PASSED** | Fetch authenticated user account profile and settings | `{}` | 200 OK / Handled |
| 04 | `openrp_list_my_worlds` | **PASSED** | List worlds owned by the user | `{"page": 1, "limit": 5}` | 200 OK / Handled |
| 05 | `openrp_get_world` | **PASSED** | Fetch full details of active world 'Game' | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 06 | `openrp_update_world` | **PASSED (Expected Validation Response)** | Update world record | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 07 | `openrp_create_world` | **PASSED (Expected Validation Response)** | Verify world creation handler | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 08 | `openrp_delete_world` | **PASSED (Expected Validation Response)** | Verify world deletion handler | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 09 | `openrp_create_lore` | **PASSED** | Create a new factual lorebook entry | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 10 | `openrp_list_lores` | **PASSED** | List all lore entries in world 'Game' | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 11 | `openrp_get_lore` | **PASSED** | Retrieve specific lore content | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 12 | `openrp_update_lore` | **PASSED** | Update lore title and content | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 13 | `openrp_delete_lore` | **PASSED** | Delete transient test lore entry | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 14 | `openrp_list_characters` | **PASSED** | List all characters in world 'Game' | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 15 | `openrp_get_character` | **PASSED** | Retrieve persona details of character 'Tictactoe' | `{"characterId": "01a0421b-820c-726c-9c88-d281...` | 200 OK / Handled |
| 16 | `openrp_update_character` | **PASSED** | Update character short description | `{"characterId": "01a0421b-820c-726c-9c88-d281...` | 200 OK / Handled |
| 17 | `openrp_deploy_behavior` | **PASSED** | Deploy clean sanitized behavior graph | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 18 | `openrp_list_behaviors` | **PASSED** | List all behavior pipelines in world | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 19 | `openrp_get_behavior` | **PASSED** | Retrieve full nodes & edges of behavior | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 20 | `openrp_edit_behavior_node` | **PASSED** | Granular in-place modification of single node data | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 21 | `openrp_update_behavior` | **PASSED** | Full graph topology replacement and renaming | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 22 | `openrp_attach_behavior_to_character` | **PASSED** | Bind behavior graph to character | `{"characterId": "01a0421b-820c-726c-9c88-d281...` | 200 OK / Handled |
| 23 | `openrp_delete_behavior` | **PASSED** | Delete transient test behavior graph | `{"userId": "019f4c49-0ec7-7374-8fab-d7e8add42...` | 200 OK / Handled |
| 24 | `openrp_search_behavior_executions` | **PASSED** | Search historical behavior execution runs | `{"limit": 3}` | 200 OK / Handled |
| 25 | `openrp_get_behavior_execution` | **PASSED** | Retrieve execution summary & timestamps | `{"executionId": "01a042e6-7f5a-75ea-a2da-2756...` | 200 OK / Handled |
| 26 | `openrp_get_behavior_node_executions` | **PASSED** | Retrieve step-by-step resolved node execution traces | `{"executionId": "01a042e6-7f5a-75ea-a2da-2756...` | 200 OK / Handled |
| 27 | `openrp_list_chats` | **PASSED** | List active user chat sessions | `{"page": 1, "limit": 5}` | 200 OK / Handled |
| 28 | `openrp_get_chat_messages` | **PASSED** | Fetch chat conversation message history | `{"chatId": "01a01276-3250-719b-be51-2e7e6dd2c...` | 200 OK / Handled |
| 29 | `openrp_send_message` | **PASSED** | Dispatch message directly into chatroom via API | `{"chatId": "01a01276-3250-719b-be51-2e7e6dd2c...` | 200 OK / Handled |
| 30 | `openrp_discover_worlds` | **PASSED** | Search community public worlds | `{"query": "hero", "page": 1}` | 200 OK / Handled |
| 31 | `openrp_raw_api` | **PASSED** | Universal REST gateway call to /api/users/me | `{"path": "/api/users/me", "method": "GET"}` | 200 OK / Handled |
