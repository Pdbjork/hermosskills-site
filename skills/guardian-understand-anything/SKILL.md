# Guardian Understand Anything

Use this skill when the user asks to understand, map, onboard into, visualize, or explain a codebase, knowledge base, docs folder, or business repo.

Installed from https://github.com/Egonex-AI/Understand-Anything.

Plugin root: `/root/.pi/understand-anything/understand-anything-plugin`

Available skills: `understand`, `understand-dashboard`, `understand-chat`, `understand-diff`, `understand-domain`, `understand-explain`, `understand-knowledge`, `understand-onboard`.

Guardian rules:
- Prefer local/private analysis for proprietary code and personal docs.
- Do not upload secrets or private data to third-party services unless the user explicitly approves.
- For large repos, warn about token cost before a full LLM graph rebuild.
- Use deterministic scan first when a lightweight inventory is enough.
- Store outputs in repo-local `.understand-anything/`, not public docs, unless the user asks.
- If outputs are committed, check for secrets, customer data, private emails, local-only notes, and sensitive paths first.

Lightweight scan:

```bash
/root/.hermes/scripts/ua-scan-lite.sh /path/to/repo
```
