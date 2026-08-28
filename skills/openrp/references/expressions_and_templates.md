# Expressions, Template Strings & Built-in Objects Reference

This document provides the authoritative syntax, global variables, utility objects, and evaluation rules for OpenRP Behavior Engine expressions.

---

## 1. Expressions vs. Template Strings

Every dynamic input field in OpenRP can operate in one of two modes:

### A. Expression Mode (`{}`)
An **Expression** is evaluated as dynamic JEXL/JavaScript-like logic and returns any typed value (Number, Boolean, String, Array, Object):
- **Output of previous node**: `getChatMessage.content`
- **Nested object access**: `getChat.participants.data[0].id`
- **Arithmetic calculation**: `$variables.processedCount + 1`
- **Boolean condition**: `getChatMessage.content.toLowerCase().indexOf('reset') !== -1`
- **Ternary logic**: `getChat.participants.data.length > 2 ? 'group' : 'direct'`
- **Construct inline object**: `{ text: getChatMessage.content, chatId: chatMessage.chatId }`

### B. Template String Mode
A **Template String** embeds expressions inside text wrapped in `{{ }}`:
```text
User {{getChatMessage.participant.name}} said: {{getChatMessage.content}}
Current Time: {{Date.format("h:mm a")}}
```
- If the inner expression evaluates to `null` or `undefined`, it is replaced with an empty string `""`.
- If it evaluates to an Object or Array, it is automatically serialized into a JSON string.

---

## 2. Built-in Global Objects

The following objects are globally accessible in every expression and template string without requiring import nodes:

### A. `$variables`
Stores all temporary run-scoped variables set via `storage/set_variable`:
- Dot notation: `$variables.myCounter`
- Nested object properties: `$variables.gameState.board[0]`
- Bracket notation (for keys with spaces or symbols): `$variables["player score"]`

### B. `$requestMetadata`
Metadata about the authenticated user and context that triggered the behavior execution:

| Property | Type | Description | Example |
|---|---|---|---|
| `$requestMetadata.userId` | `string` | The UUID of the user who initiated the execution. | `"01a008e5-0f95-7aab-aaeb-a6d2b5c57f18"` |
| `$requestMetadata.timeZone` | `string` | User's IANA time zone identifier (used by `Date.format()`). | `"America/New_York"`, `"Asia/Jakarta"`, `"UTC"` |
| `$requestMetadata.locale` | `string` | User's regional language locale tag. | `"en-US"`, `"id-ID"`, `"ja-JP"` |

#### Example Usage:
```text
Triggered by {{$requestMetadata.userId}} in {{$requestMetadata.timeZone}} (Locale: {{$requestMetadata.locale}})
```

---

## 3. Global Math Object

Expressions support standard JavaScript `Math` static methods and mathematical constants:

| Method / Constant | Description | Example |
|---|---|---|
| `Math.random()` | Returns pseudo-random float between `0` and `1`. | `Math.random()` |
| `Math.floor(x)` | Rounds down to largest integer $\le x$. | `Math.floor(4.9)` $\to 4$ |
| `Math.ceil(x)` | Rounds up to smallest integer $\ge x$. | `Math.ceil(4.1)` $\to 5$ |
| `Math.round(x)` | Rounds to nearest integer. | `Math.round(4.5)` $\to 5$ |
| `Math.min(...v)` | Returns lowest value. | `Math.min(10, 20, 5)` $\to 5$ |
| `Math.max(...v)` | Returns highest value. | `Math.max(10, 20, 5)` $\to 20$ |
| `Math.abs(x)` | Returns absolute value. | `Math.abs(-42)` $\to 42$ |
| `Math.pow(x, y)` | Returns $x^y$. | `Math.pow(2, 3)` $\to 8$ |
| `Math.PI` | Archimedes constant ($\approx 3.14159$). | `Math.PI` |
| `Math.E` | Euler constant ($\approx 2.71828$). | `Math.E` |

#### Random Dice Roll Example:
```javascript
Math.floor(Math.random() * 6) + 1
```

---

## 4. Global Date Object & Timezone Formatting

OpenRP provides a timezone-aware `Date` utility namespace:

### A. `Date.now()`
Returns numeric timestamp in milliseconds since UTC epoch.
```javascript
Date.now() // e.g. 1786847847412
```

### B. `Date.parse(dateString)`
Parses ISO 8601 strings into Unix timestamp milliseconds.
```javascript
Date.parse(getChatMessage.createdAt) // e.g. 1786795200000
```

### C. `Date.format(formatString?, timestamp?)`
Formats timestamp into user's local timezone (`$requestMetadata.timeZone`) using standard date-fns format tokens:

| Token | Description | Output Example |
|---|---|---|
| `yyyy` | 4-digit year | `2026` |
| `MM` | 2-digit month | `08` |
| `MMMM` | Full month name | `August` |
| `dd` | 2-digit day | `28` |
| `HH` | 24-hour hour (`00`-`23`) | `14` |
| `h` | 12-hour hour (`1`-`12`) | `2` |
| `mm` | 2-digit minute (`00`-`59`) | `30` |
| `ss` | 2-digit second (`00`-`59`) | `00` |
| `a` | AM/PM marker | `PM` |
| `EEEE` | Full day of the week | `Friday` |

#### Date Formatting Examples:
```text
Current Time: {{Date.format("h:mm a")}}
Full Date: {{Date.format("EEEE, MMMM dd, yyyy")}}
Message Date: {{Date.format("yyyy-MM-dd HH:mm", Date.parse(getChatMessage.createdAt))}}
```

---

## 5. JEXL Operators & Syntax Constraints

### Supported Operators:
- **Arithmetic**: `+`, `-`, `*`, `/`, `%`
- **Comparison**: `==`, `===`, `!=`, `!==`, `>`, `<`, `>=`, `<=`
- **Logical**: `&&`, `||`, `!`
- **Ternary**: `condition ? valueIfTrue : valueIfFalse`
- **String Concatenation**: `"Hello, " + getChatMessage.participant.name`

### Critical Parser Constraint:
> [!CAUTION]
> **Regular expression literals (`/[1-9]/`) are NOT supported** and will throw a fatal syntax error. Always use standard string methods (`str.indexOf()`, `str.toLowerCase()`, `str.substring()`, `str.split()`, `str.replace()`).
