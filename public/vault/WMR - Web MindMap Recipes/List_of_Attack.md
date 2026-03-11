### Vulnérabilités Web – Mindmap Complète 2025

#### 1. Injection Flaws 

- [x] SQL Injection (Classic, Blind, Time-based, Out-of-band)
- [x] NoSQL Injection (MongoDB, Redis, etc.)
- [ ] LDAP Injection
- [x] Command Injection (OS Command, Blind, RCE)
- [x] Server-Side Template Injection (SSTI – Twig, Jinja, Freemarker, Velocity, etc.)
- [ ] Server-Side Includes (SSI) Injection
- [x] XML External Entity (XXE)
- [ ] XPath Injection
- [ ] Expression Language Injection (SpEL, OGNL, MVEL, etc.)
- [ ] Log Injection / Log Forging
- [ ] Email Header Injection (SMTP/IMAP)

#### 2. Path & File Handling

- [x] Local File Inclusion (LFI → RCE via /proc/self/environ, log poisoning, etc.)
- [ ] Remote File Inclusion (RFI – rare mais encore présent)
- [ ] Path Traversal / Directory Traversal (../..)
- [x] File Upload Vulnerabilities (unrestricted, bypass magic bytes, double ext, %00, etc.)

#### 3. Authentication & Session Management

- [ ] Broken Authentication (logic bypass, weak recovery, etc.)
- [ ] Brute Force / Credential Stuffing / Password Spraying
- [ ] Default / Weak / Hardcoded Credentials
- [ ] Session Fixation
- [ ] Session Prediction / Weak Session ID
- [ ] Cookie Theft (XSS, MITM, physical)
- [x] JWT Weaknesses (alg=none, weak secret, kid header, jku, etc.)
- [x] OAuth 2.0 Misconfigurations (redirect_uri bypass, state missing, etc.)
- [ ] Password Reset Poisoning (Host header, X-Forwarded-Host)
- [ ] Username Enumeration (timing, error messages)

#### 4. Authorization & Access Control

- [ ] Broken Access Control (Vertical & Horizontal)
- [ ] Insecure Direct Object Reference (IDOR)
- [ ] Broken Object Level Authorization (BOLA – API)
- [ ] Broken Object Property Level Authorization (Mass Assignment)
- [ ] Missing Function Level Access Control
- [ ] Forceful Browsing

#### 5. Client-Side Attacks

- [ ] Cross-Site Scripting (Reflected, Stored, DOM-based)
- [ ] Clickjacking / UI Redress
- [ ] Cross-Site Request Forgery (CSRF/XSRF)
- [ ] Cross-Origin Resource Sharing (CORS) misconfig (wildcard, null origin, credentials, etc.)
- [ ] HTML Injection / Text Injection
- [ ] Open Redirect & SSRF chaining
- [ ] DOM Clobbering
- [ ] XS-Leaks (cache, timing, error events, XS-Search, etc.)
- [ ] Dangling Markup Injection
- [ ] PostMessage vulnerabilities (wildcard origin, no validation)

#### 6. Server-Side Logic & Protocol Attacks

- [ ] Server-Side Request Forgery (SSRF → cloud metadata, internal pivot)
- [ ] HTTP Request Smuggling (CL.TE, TE.CL, H2.C, H2.TE, HTTP/3)
- [ ] Host Header Attacks (password reset, cache poisoning, routing bypass)
- [ ] Web Cache Poisoning & Deception
- [ ] HTTP Parameter Pollution (HPP)
- [ ] HTTP/2 & HTTP/3 Desync / DoS
- [ ] Race Conditions / TOCTOU
- [ ] Parameter Tampering

#### 7. Deserialization & Advanced Code Issues

- [ ] Insecure Deserialization (Java, PHP, Python pickle, .NET, Node.js vm, etc.)
- [ ] Prototype Pollution (JavaScript)
- [ ] Server-Side JavaScript Injection (eval, new Function, require bypass, etc.)

#### 8. Cryptographic Failures & Information Disclosure

- [ ] Sensitive Data Exposure (PII, tokens, keys in source, logs, etc.)
- [ ] Information Leakage (stack traces, debug mode, directory listing, error messages)
- [ ] Exposed Config / Backup Files (.git, .env, .swp, .bak, config.php~)
- [ ] Weak Cryptography (MD5/SHA1 passwords, weak RSA, deprecated algos)
- [ ] Padding Oracle, BREACH/CRIME/TIME)
- [ ] Insecure Randomness

#### 9. Business Logic & Abuse

- [ ] Business Logic Flaws (price manipulation, step skipping, status abuse)
- [ ] Rate Limit Bypass (header abuse, IP rotation, race conditions)
- [ ] Payment Manipulation
- [ ] Unlimited Resource Consumption (file upload, email/SMS bombing, etc.)
- [ ] Account Takeover via logic flaws

#### 10. API-Specific (REST, GraphQL, gRPC)

- [ ] OWASP API Top 10 full coverage
- [ ] Excessive Data Exposure
- [ ] Lack of Rate Limiting / Resources
- [ ] Mass Assignment
- [ ] GraphQL Introspection enabled + Batching + Depth bypass
- [ ] gRPC exposed without auth

#### 11. Cloud & Infrastructure (souvent dans le scope 2025)

- [ ] Cloud Metadata Endpoint SSRF (169.254.169.254, etc.)
- [ ] S3 / GCS / Azure Blob public or takeover
- [ ] Serverless / Lambda public + excessive IAM
- [ ] Exposed Kubernetes / Docker API
- [ ] Subdomain Takeover (dangling CNAME)

#### 12. Emerging & Modern Attacks (2024–2025)

- [ ] Prompt Injection (Web LLM chatbots)
- [ ] WebSocket Auth Bypass / Origin missing / Flooding
- [ ] Third-party JS Supply Chain (polyfill.io style)
- [ ] DNS Rebinding
- [ ] WebRTC IP/STUN leaks
- [ ] HSTS missing or bypassable
- [ ] Mixed Content on HTTPS sites

#### 13. Bonus – Souvent oubliés mais très impactants

- [ ] Robots.txt / sitemap.xml interesting endpoints
- [ ] Swagger / OpenAPI / Redoc exposed without auth
- [ ] Cache-Control / Pragma misconfig → sensitive page cached
- [ ] Clickjacking + iframe sandbox bypass tricks
- [ ] Client-Side Path Traversal (JS source maps, etc.)