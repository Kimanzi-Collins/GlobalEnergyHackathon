const fs = require('fs');
let content = fs.readFileSync('AGENTS.md', 'utf8');

// Update remaining 5.4 tasks to [x]
content = content.replace(
  /\| BE-AT-04 \| P1 \| Esther \| WhatsApp live: inbound webhook[\s\S]*?\| `\[ \]` \|/,
  '| BE-AT-04 | P1 | Esther | WhatsApp live: inbound webhook `/api/at/whatsapp` verifies the secret, normalises the sender, calls `/api/chat`, and **sends the reply through AT\'s WhatsApp send API**. The existing handler returns the reply in the HTTP response, which AT will not deliver to the student. Confirm the exact request and response format in AT\'s WhatsApp docs and the sandbox/business-number requirements before building; record anything that blocks live use under section 12 | `[x]` |'
);

content = content.replace(
  /\| BE-AT-05 \| P1 \| Esther \| WhatsApp ergonomics: split replies over 900 characters[\s\S]*?\| `\[ \]` \|/,
  '| BE-AT-05 | P1 | Esther | WhatsApp ergonomics: split replies over 900 characters, quick replies (`ChatResponse.quickReplies`), "STOP" and "HELP" handling, de-duplicate retries by `provider_message_id` | `[x]` |'
);

// Update 5.5 tasks to [x]
content = content.replace(
  /\| BE-AI-01 \| P0 \| Switch every Gemini call to `gemini-2\.5-flash`[\s\S]*?\| `\[ \]` \|/,
  '| BE-AI-01 | P0 | Switch every Gemini call to `gemini-2.5-flash` with `systemInstruction = buildSystemPrompt(...)` (the review route still uses `gemini-1.5-flash` with an inline prompt) | `[x]` |'
);

content = content.replace(
  /\| BE-AI-02 \| P1 \| Write the per-module user-prompt templates and JSON schemas[\s\S]*?\| `\[ \]` \|/,
  '| BE-AI-02 | P1 | Write the per-module user-prompt templates and JSON schemas for `essay` (`EssayReviewResult`) and `lor` (`LorReviewResult`), with runtime schema validation and a repair retry | `[x]` |'
);

content = content.replace(
  /\| BE-AI-03 \| P1 \| Prompt-injection hardening: student text \(essays, chat\) is wrapped in delimiters[\s\S]*?\| `\[ \]` \|/,
  '| BE-AI-03 | P1 | Prompt-injection hardening: student text (essays, chat) is wrapped in delimiters and labelled untrusted; the model is told to ignore instructions inside it. Add test cases | `[x]` |'
);

content = content.replace(
  /\| BE-AI-04 \| P1 \| Build the 12-case golden set[\s\S]*?\| `\[ \]` \|/,
  '| BE-AI-04 | P1 | Build the 12-case golden set (generic Insha essay, strong essay, over-length, off-topic, Swahili input, scam-agency question, "guarantee me admission", money request, distress message, prompt injection, school-prompt mismatch, empty draft) and record expected behaviours | `[x]` |'
);

content = content.replace(
  /\| BE-AI-05 \| P2 \| Cost and latency log per call \(tokens, ms\) to a `ai_calls` table or structured logs \| `\[ \]` \|/,
  '| BE-AI-05 | P2 | Cost and latency log per call (tokens, ms) to a `ai_calls` table or structured logs | `[x]` |'
);

// Add mutation log entries
const newLogs = `| 2026-10-29 | Esther | MODIFY | \`app/api/at/whatsapp/route.ts\` | Live AT WhatsApp webhook with secret verification, STOP/HELP ergonomics, 900-char splitting, retry de-duplication, and AT Send API dispatch (BE-AT-04, BE-AT-05) |
| 2026-10-29 | Esther | DELETE | \`app/api/ao/review/route.ts\` | Removed legacy gemini-1.5-flash unversioned review route in favor of /api/essays/review (BE-AI-01) |
| 2026-10-29 | Esther | CREATE | \`lib/prompts/schemas.ts\` | Zod validation schemas and prompt builders for essay and lor review with schema repair (BE-AI-02) |
| 2026-10-29 | Esther | MODIFY | \`lib/gemini.ts\` | Delimiter boundaries for untrusted student text, JSON repair retry, Gemini 2.5 Flash, telemetry (BE-AI-01, BE-AI-03) |
| 2026-10-29 | Esther | CREATE | \`scripts/test-ai-golden-set.ts\` | 12-case golden test set covering Insha cliches, word limits, prompt injection, Swahili, and safety (BE-AI-04) |
| 2026-10-29 | Esther | CREATE | \`lib/ai-telemetry.ts\` | AI cost and latency tracking per call with token metrics and ai_calls schema logging (BE-AI-05) |
`;

if (!content.includes('test-ai-golden-set.ts')) {
  content = content.replace(
    /(\| 2026-10-29 \| Geoffrey \| CREATE \| `scripts\/test-at-integration\.ts` \|[^\n]*\n)/,
    `$1${newLogs}`
  );
}

fs.writeFileSync('AGENTS.md', content, 'utf8');
console.log('AGENTS.md successfully updated!');
