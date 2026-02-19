# Skynet Integration for Agent Monitoring

All future agent spawns will call Skynet health checks BEFORE execution.

## Pressure Gates (Before Spawn)
- If pressure > 0.7: HALT, compress memory
- If pressure 0.5-0.7: PROCEED with caution
- If pressure < 0.5: PROCEED normally

## Health Check Endpoints
- `/api/v1/pressure` — Memory + token burn risk
- `/api/v1/verbosity` — Output efficiency
- `/api/v1/half-life` — Session stability decay

## Auto-Checks (Per Agent Spawn)
1. Call pressure endpoint
2. Log result
3. If safe: spawn agent
4. If at-risk: compress memory first OR spawn in new session

## Metrics Agent Phase 2
- Hourly Instagram scraper (24h post-launch)
- Performance analysis (posting time optimization)
- Catalyst feedback loop
