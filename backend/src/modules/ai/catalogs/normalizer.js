const normalizeResource = (res, topic) => {
  if (typeof res === 'object' && res !== null && res.title) {
    return {
      title: res.title,
      url: res.url || `https://www.google.com/search?q=${encodeURIComponent(topic + ' ' + res.title)}`,
      type: res.type || 'Resource'
    };
  }
  const title = String(res || 'Recommended Reading').trim();
  return {
    title,
    url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' ' + title)}`,
    type: 'Study Guide'
  };
};

const normalizeRoadmapData = (roadmapData, topic) => {
  if (!Array.isArray(roadmapData) || roadmapData.length === 0) {
    throw new Error('Roadmap response was not a valid array');
  }

  return roadmapData.slice(0, 8).map((week, index) => ({
    week: week.week || `Week ${index + 1}`,
    topic: week.topic || `${topic} - Milestone ${index + 1}`,
    details: Array.isArray(week.details) ? week.details.slice(0, 5) : [],
    resources: Array.isArray(week.resources)
      ? week.resources.slice(0, 4).map((r) => normalizeResource(r, topic))
      : [
          { title: `${topic} Official Guide`, url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' official documentation tutorial')}`, type: 'Docs' },
          { title: `${topic} Hands-on Practice`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' complete course for beginners')}`, type: 'Video' }
        ]
  }));
};

const buildCustomRoadmap = (topic) => {
  const cleanTopic = String(topic || 'Skills').trim();
  const lower = cleanTopic.toLowerCase();
  const slug = encodeURIComponent(cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  const isWebFrontend = /\b(react|vue|angular|svelte|tailwind|css|frontend|html|ui|threejs|webgl|ui\/ux)\b/.test(lower);
  const isBackend = /\b(node|express|fastapi|django|flask|spring|golang|go|rust|c#|dotnet|java|backend|api|graphql|grpc|ruby|rails)\b/.test(lower);
  const isDevOps = /\b(docker|kubernetes|k8s|devops|aws|gcp|azure|ci\/cd|terraform|ansible|linux|bash|nginx|container)\b/.test(lower);
  const isAiMl = /\b(ai|ml|machine learning|deep learning|rag|llm|nlp|pytorch|tensorflow|pandas|data science|computer vision)\b/.test(lower);

  if (isDevOps) {
    return [
      {
        week: 'Week 1',
        topic: `${cleanTopic}: Architecture, Core Mechanics & CLI Setup`,
        details: [
          `Master foundational runtime isolation, process management, and operational principles in ${cleanTopic}`,
          `Configure your local CLI workspace, daemon services, and developer tooling`,
          `Run initial verification containers, environments, and basic lifecycle commands`,
          `Analyze process architectures, namespaces, and runtime security isolation`
        ],
        resources: [
          { title: `${cleanTopic} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' official documentation getting started')}`, type: 'Docs' },
          { title: 'DevOps Roadmap on roadmap.sh', url: 'https://roadmap.sh/devops', type: 'Roadmap' }
        ]
      },
      {
        week: 'Week 2',
        topic: `${cleanTopic}: Configuration As Code & Declarative Manifests`,
        details: [
          `Author declarative manifests and configuration files following production best practices`,
          `Optimize layer caching, resource allocations, and dependency minimization`,
          `Implement non-root execution privileges and vulnerability scanning`,
          `Automate multi-stage builds and template parameterized configurations`
        ],
        resources: [
          { title: `${cleanTopic} Configuration Best Practices`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' configuration patterns production')}`, type: 'Guide' }
        ]
      },
      {
        week: 'Week 3',
        topic: `${cleanTopic}: Networking, Service Discovery & Storage Volumes`,
        details: [
          `Configure virtual networks, DNS service resolution, and port mappings`,
          `Manage persistent state using mounted volumes, storage classes, and backup hooks`,
          `Implement zero-downtime service updates and health check liveness probes`,
          `Troubleshoot network partitions and inter-service connectivity failures`
        ],
        resources: [
          { title: `Networking & Storage in ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' networking storage patterns')}`, type: 'Tutorial' }
        ]
      },
      {
        week: 'Week 4',
        topic: `${cleanTopic}: Multi-Service Orchestration & High Availability`,
        details: [
          `Orchestrate multi-tier application stacks with automated restart policies`,
          `Configure secrets management, environment decoupling, and configuration overlays`,
          `Implement horizontal autoscaling based on CPU and memory thresholds`,
          `Simulate failover scenarios and verify automated service self-healing`
        ],
        resources: [
          { title: `${cleanTopic} Orchestration Patterns`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' orchestration scaling')}`, type: 'Guide' }
        ]
      },
      {
        week: 'Week 5',
        topic: `${cleanTopic}: CI/CD Pipelines, Registry Publishing & GitOps`,
        details: [
          `Build automated GitHub Actions workflows with multi-architecture image compilation`,
          `Implement automated security linting, image signing, and artifact registry pushing`,
          `Set up automated continuous deployment with rollback safeguards`,
          `Conduct an architectural review of your pipeline with an Orbitus study peer`
        ],
        resources: [
          { title: 'CI/CD Pipeline Architecture', url: 'https://roadmap.sh/devops', type: 'Roadmap' }
        ]
      },
      {
        week: 'Week 6',
        topic: `${cleanTopic}: Production Observability, Monitoring & Capstone`,
        details: [
          `Integrate structured metrics endpoints, Prometheus scraping, and Grafana dashboards`,
          `Establish centralized logging, alerting thresholds, and incident playbooks`,
          `Deploy a fully automated, resilient multi-service production environment`,
          `Host a live demo session on Orbitus walking peers through your infrastructure setup`
        ],
        resources: [
          { title: `${cleanTopic} Production Guide`, url: 'https://roadmap.sh', type: 'Community' }
        ]
      }
    ];
  }

  if (isAiMl) {
    return [
      {
        week: 'Week 1',
        topic: `${cleanTopic}: Core Mathematical & Conceptual Foundations`,
        details: [
          `Understand the theoretical foundations, tensor operations, and architectural intuition in ${cleanTopic}`,
          `Set up your Python virtual environment with CUDA acceleration and essential libraries`,
          `Implement foundational vector embeddings and similarity distance calculations`,
          `Analyze key trade-offs between precision, latency, and computational footprint`
        ],
        resources: [
          { title: `${cleanTopic} Official Getting Started`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' tutorial getting started')}`, type: 'Docs' },
          { title: 'AI & Data Science Roadmap on roadmap.sh', url: 'https://roadmap.sh/ai-data-scientist', type: 'Roadmap' }
        ]
      },
      {
        week: 'Week 2',
        topic: `${cleanTopic}: Data Pipelines, Chunking & Preprocessing`,
        details: [
          `Construct automated extraction pipelines for unstructured data (PDFs, Markdown, Web)`,
          `Evaluate chunking algorithms: character, semantic, and recursive splitting`,
          `Build metadata enrichment filters to enable hybrid search queries`,
          `Benchmark tokenization costs and embedding latency across top models`
        ],
        resources: [
          { title: `Data Pipelines in ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' data preprocessing pipelines')}`, type: 'Guide' }
        ]
      },
      {
        week: 'Week 3',
        topic: `${cleanTopic}: Vector Indexing, Retrieval & Re-ranking`,
        details: [
          `Configure specialized vector indices (HNSW, IVF-Flat) for high-recall nearest neighbor search`,
          `Combine sparse keyword search (BM25) with dense vector representations using Reciprocal Rank Fusion`,
          `Implement cross-encoder re-ranking models to filter out low-relevance contexts`,
          `Test query expansion techniques: multi-query generation and hypothetical document embeddings`
        ],
        resources: [
          { title: `Advanced Retrieval with ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' retrieval reranking')}`, type: 'Article' }
        ]
      },
      {
        week: 'Week 4',
        topic: `${cleanTopic}: Context Engineering & Agentic Orchestration`,
        details: [
          `Author dynamic system prompts with structured output schemas and citation references`,
          `Implement conversational memory buffers with recursive token summarization`,
          `Build tool-calling agents capable of multi-step reasoning and dynamic data retrieval`,
          `Incorporate safety guardrails to detect hallucinations and prevent prompt injections`
        ],
        resources: [
          { title: `Orchestration Patterns in ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' agentic orchestration prompt engineering')}`, type: 'Guide' }
        ]
      },
      {
        week: 'Week 5',
        topic: `${cleanTopic}: Automated Evaluation & Quantitative Benchmarking`,
        details: [
          `Evaluate retrieval precision, groundedness, and context relevance using synthetic datasets`,
          `Track LLM-as-a-judge scoring metrics across diverse edge cases`,
          `Profile inference latency, token usage, and cache hit rates in staging`,
          `Review system performance and discuss tradeoffs with an Orbitus study peer`
        ],
        resources: [
          { title: `Evaluation Frameworks for ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' evaluation metrics ragas')}`, type: 'Tool' }
        ]
      },
      {
        week: 'Week 6',
        topic: `${cleanTopic}: Production Streaming Application & Portfolio Demo`,
        details: [
          `Deploy a low-latency streaming backend with server-sent events (SSE)`,
          `Build a modern chat interface with interactive citations and document preview highlights`,
          `Deploy the containerized service to cloud infrastructure with caching`,
          `Deliver a live showcase of your AI system to peers on Orbitus`
        ],
        resources: [
          { title: 'AI Developer Roadmap on roadmap.sh', url: 'https://roadmap.sh/ai-data-scientist', type: 'Roadmap' }
        ]
      }
    ];
  }

  if (isWebFrontend) {
    return [
      {
        week: 'Week 1',
        topic: `${cleanTopic}: Component Architecture & Declarative State`,
        details: [
          `Master the component lifecycle, virtual DOM rendering, and single-direction data flow in ${cleanTopic}`,
          `Build reusable, decoupled UI elements with atomic design principles and strict typing`,
          `Implement declarative state management and side-effect handling using idiomatic hooks or signals`,
          `Set up a modern developer build pipeline with lightning-fast HMR and linting rules`
        ],
        resources: [
          { title: `${cleanTopic} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' official documentation getting started')}`, type: 'Docs' },
          { title: 'Frontend Developer Roadmap', url: 'https://roadmap.sh/frontend', type: 'Roadmap' }
        ]
      },
      {
        week: 'Week 2',
        topic: `${cleanTopic}: Modern Styling, Design Systems & Responsive Layouts`,
        details: [
          `Construct responsive mobile-first layouts utilizing CSS Grid, Flexbox, and fluid typography`,
          `Implement tokenized theme switching (Dark/Light mode) with zero runtime layout shift`,
          `Build accessible UI components matching WAI-ARIA authoring practices and keyboard navigation`,
          `Integrate component animation primitives for micro-interactions and smooth page transitions`
        ],
        resources: [
          { title: `${cleanTopic} UI Patterns & Component Systems`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' component patterns design systems')}`, type: 'Guide' }
        ]
      },
      {
        week: 'Week 3',
        topic: `${cleanTopic}: Client-Server State, Routing & Dynamic Data Fetching`,
        details: [
          `Configure nested client routing, route guards, and dynamic parameter parsing`,
          `Implement stale-while-revalidate data fetching, optimistic UI mutations, and automatic retries`,
          `Handle complex multi-step forms with schema-based field validation and error boundaries`,
          `Manage persistent authentication state, JWT refresh token interceptors, and route protection`
        ],
        resources: [
          { title: `${cleanTopic} State Management & Routing Best Practices`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' async data fetching routing')}`, type: 'Article' }
        ]
      },
      {
        week: 'Week 4',
        topic: `${cleanTopic}: Performance Optimization & Core Web Vitals`,
        details: [
          `Audit and optimize Core Web Vitals: Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS)`,
          `Apply dynamic code splitting, route-based lazy loading, and intelligent prefetching`,
          `Implement list virtualization for high-frequency DOM updates and smooth 60fps scrolling`,
          `Eliminate memory leaks by cleaning event subscriptions and profiling render cycles with DevTools`
        ],
        resources: [
          { title: 'Web Vitals & Performance Engineering', url: 'https://web.dev/explore/fast', type: 'Course' }
        ]
      },
      {
        week: 'Week 5',
        topic: `${cleanTopic}: Automated Testing, Accessibility (A11y) & Edge Cases`,
        details: [
          `Write comprehensive unit and component tests with mock service worker (MSW) integration`,
          `Implement end-to-end user journey tests simulating real browser clickflows and network failures`,
          `Perform automated screen-reader and color-contrast audits to achieve WCAG 2.1 AA compliance`,
          `Conduct peer code reviews and architectural refactoring session with a study partner on Orbitus`
        ],
        resources: [
          { title: `Testing & Quality Assurance in ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' component testing vitest cypress')}`, type: 'Tutorial' }
        ]
      },
      {
        week: 'Week 6',
        topic: `${cleanTopic}: Production Deployment, CI/CD & Portfolio Showcase`,
        details: [
          `Configure continuous deployment pipelines with automated previews on Vercel or Netlify`,
          `Implement edge caching, CDN routing, and HTTP/2 asset compression`,
          `Deploy a polished production-grade web application featuring rich interactivity`,
          `Host a live peer walkthrough on Orbitus demonstrating your project architecture and lessons learned`
        ],
        resources: [
          { title: `Showcase Your ${cleanTopic} Project on Orbitus`, url: 'https://roadmap.sh', type: 'Community' }
        ]
      }
    ];
  }

  if (isBackend) {
    return [
      {
        week: 'Week 1',
        topic: `${cleanTopic}: Language Idioms, Runtime Mechanics & Project Structure`,
        details: [
          `Understand the core concurrency model, memory management, and runtime mechanics of ${cleanTopic}`,
          `Set up a modular, scalable project layout following idiomatic industry conventions`,
          `Implement strict type safety, input schema validations, and centralized configuration loading`,
          `Build a functional CLI or starter micro-service verifying your environment setup`
        ],
        resources: [
          { title: `${cleanTopic} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' official documentation getting started')}`, type: 'Docs' },
          { title: 'Backend Developer Roadmap', url: 'https://roadmap.sh/backend', type: 'Roadmap' }
        ]
      },
      {
        week: 'Week 2',
        topic: `${cleanTopic}: RESTful API Architecture, Middleware & Error Handlers`,
        details: [
          `Design clean, versioned RESTful endpoints adhering to HTTP semantics and status code standards`,
          `Construct composable middleware pipelines: structured JSON logging, rate limiting, and CORS headers`,
          `Implement centralized error handling that prevents unhandled rejections and standardizes API payloads`,
          `Generate interactive OpenAPI / Swagger specification documentation for client consumers`
        ],
        resources: [
          { title: `${cleanTopic} REST API Architecture Patterns`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' api architecture middleware patterns')}`, type: 'Guide' }
        ]
      },
      {
        week: 'Week 3',
        topic: `${cleanTopic}: Database Integration, Query Optimization & Transactions`,
        details: [
          `Integrate production database client with connection pooling and health check pings`,
          `Model complex entity relationships, foreign keys, and indexes for high query performance`,
          `Execute atomic ACID transactions to handle concurrent financial/inventory mutations safely`,
          `Implement automated database migration scripts with zero-downtime rollback capabilities`
        ],
        resources: [
          { title: `Database Patterns in ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' database transactions orm optimization')}`, type: 'Article' }
        ]
      },
      {
        week: 'Week 4',
        topic: `${cleanTopic}: Authentication, Authorization & Security Best Practices`,
        details: [
          `Implement stateless JWT / OAuth2 authentication flows with secure HTTP-only cookie storage`,
          `Enforce fine-grained Role-Based Access Control (RBAC) across protected route handlers`,
          `Mitigate OWASP Top 10 vulnerabilities: SQL injection, mass assignment, and DDoS replay attacks`,
          `Hash passwords using Argon2 or Bcrypt with cryptographic salt rounds`
        ],
        resources: [
          { title: 'OWASP Backend Security Guide', url: 'https://cheatsheetseries.owasp.org/', type: 'Security' }
        ]
      },
      {
        week: 'Week 5',
        topic: `${cleanTopic}: Caching, Background Queues & Asynchronous Jobs`,
        details: [
          `Integrate in-memory Redis caching to reduce database read latencies by 80%+`,
          `Implement asynchronous background worker queues for email dispatches, file processing, and webhook retries`,
          `Introduce real-time bi-directional streaming using WebSockets or Server-Sent Events (SSE)`,
          `Conduct load testing with k6 or autocannon to identify bottleneck thresholds`
        ],
        resources: [
          { title: `High Performance Caching with ${cleanTopic}`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' caching redis background jobs')}`, type: 'Guide' }
        ]
      },
      {
        week: 'Week 6',
        topic: `${cleanTopic}: Docker Containerization, Observability & Cloud Deploy`,
        details: [
          `Write production multi-stage Dockerfiles optimizing image size and removing build dependencies`,
          `Implement structured logging, Prometheus metrics endpoints, and distributed tracing`,
          `Deploy the containerized service to cloud infrastructure (Render, Railway, or AWS ECS)`,
          `Present your backend architecture to study peers in a live video call session on Orbitus`
        ],
        resources: [
          { title: 'System Architecture & Deployment Guide', url: 'https://roadmap.sh/devops', type: 'DevOps' }
        ]
      }
    ];
  }

  // Universal high-quality custom fallback for non-tech / general skills
  return [
    {
      week: 'Week 1',
      topic: `${cleanTopic}: Core Foundations, Mechanics & Setup`,
      details: [
        `Master the essential mental model, syntax, and foundational rules governing ${cleanTopic}`,
        `Set up your dedicated local practice environment, tools, and recommended CLI extensions`,
        `Build your first complete starter exercise validating all core mechanics`,
        `Document an authoritative personal glossary of the 10 most crucial terms in ${cleanTopic}`
      ],
      resources: [
        { title: `${cleanTopic} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' official documentation tutorial getting started')}`, type: 'Docs' },
        { title: `${cleanTopic} Comprehensive Video Masterclass`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTopic + ' complete course for beginners')}`, type: 'Video' }
      ]
    },
    {
      week: 'Week 2',
      topic: `${cleanTopic}: Core Patterns, Essential Workflows & Daily Idioms`,
      details: [
        `Learn the daily workflows, conventions, and standard practices adopted by senior experts in ${cleanTopic}`,
        `Deconstruct real-world case studies and identify high-value architectural patterns`,
        `Complete 3 progressively challenging hands-on exercises targeting fundamental problem areas`,
        `Write clean reference notes explaining how key concepts interact under the hood`
      ],
      resources: [
        { title: `${cleanTopic} Best Practices & Design Patterns`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' best practices patterns tutorial')}`, type: 'Guide' },
        { title: `Curated GitHub Awesome ${cleanTopic} Repository`, url: `https://github.com/topics/${slug}`, type: 'Repository' }
      ]
    },
    {
      week: 'Week 3',
      topic: `${cleanTopic}: Problem Solving, Edge Cases & Error Recovery`,
      details: [
        `Tackle non-trivial real-world challenges requiring synthesis of multiple ${cleanTopic} principles`,
        `Diagnose common failure modes, debug subtle issues, and study anti-patterns to avoid`,
        `Implement clean error handling, boundary validation, and modular decoupling`,
        `Exchange technical feedback and review implementations with a study peer on Orbitus`
      ],
      resources: [
        { title: `${cleanTopic} Troubleshooting & Error Handbook`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' common errors troubleshooting guide')}`, type: 'Guide' }
      ]
    },
    {
      week: 'Week 4',
      topic: `${cleanTopic}: Advanced Techniques, Optimization & Efficiency`,
      details: [
        `Explore advanced capabilities, higher-level abstractions, and optimization methods in ${cleanTopic}`,
        `Measure, benchmark, and profile performance bottlenecks to maximize speed and responsiveness`,
        `Refactor earlier solutions to adhere to industry-standard maintainability guidelines`,
        `Incorporate automated verification or benchmark test suites into your workflow`
      ],
      resources: [
        { title: `${cleanTopic} Advanced Optimization & Deep Dive`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' advanced deep dive optimization')}`, type: 'Article' }
      ]
    },
    {
      week: 'Week 5',
      topic: `${cleanTopic}: End-to-End Real-World Capstone Project`,
      details: [
        `Specify architectural requirements and milestones for an independent capstone project using ${cleanTopic}`,
        `Build the complete solution from scratch, integrating all techniques mastered in Weeks 1-4`,
        `Rigorously test edge conditions, unexpected inputs, and graceful fallback behaviors`,
        `Author clear documentation, architecture design diagrams, and tradeoffs in a project README`
      ],
      resources: [
        { title: `${cleanTopic} Real-World Project Examples & Portfolio Ideas`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' real world project ideas portfolio')}`, type: 'Project' }
      ]
    },
    {
      week: 'Week 6',
      topic: `${cleanTopic}: Production Polish, Portfolio Showcase & Jam Session`,
      details: [
        `Polish your capstone project with clean documentation, live demonstration links, and visual assets`,
        `Prepare a 5-minute technical walkthrough articulating why you selected specific patterns in ${cleanTopic}`,
        `Host a live video study session on Orbitus to demonstrate your build to peer learners`,
        `Chart your future continuous learning roadmap toward advanced specialization`
      ],
      resources: [
        { title: 'Interactive Learning Roadmaps', url: 'https://roadmap.sh', type: 'Roadmap' },
        { title: 'Orbitus Skill Community', url: 'https://roadmap.sh', type: 'Community' }
      ]
    }
  ];
};

const extractJsonPayload = (text) => {
  let cleanJsonString = text.trim();
  if (cleanJsonString.startsWith('```')) {
    cleanJsonString = cleanJsonString.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
  }
  return cleanJsonString;
};

export { normalizeResource, normalizeRoadmapData, buildCustomRoadmap, extractJsonPayload };
