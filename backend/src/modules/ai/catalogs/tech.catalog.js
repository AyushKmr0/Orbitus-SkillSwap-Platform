export const TECH_ROADMAPS = {
  "dsa": [
    {
      "week": "Week 1",
      "topic": "Big-O Analysis, Arrays & Two Pointers",
      "details": [
        "Master Big-O time and space complexity analysis with practical examples",
        "Solve array manipulation problems: Two Sum, Three Sum, and Container With Most Water",
        "Implement the Sliding Window pattern for substring and subarray problems",
        "Solve 12 curated LeetCode Easy & Medium problems"
      ],
      "resources": [
        {
          "title": "NeetCode 150 - Arrays & Hashing Roadmap",
          "url": "https://neetcode.io/roadmap",
          "type": "Practice"
        },
        {
          "title": "Striver A2Z DSA Course: Arrays & Big-O",
          "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
          "type": "Course"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "HashMaps, Fast-Slow Pointers & Linked Lists",
      "details": [
        "Hash table internal bucket collision resolution and amortized O(1) operations",
        "Implement singly and doubly linked list reversals and middle-node detection",
        "Fast & Slow pointer pattern: Linked List Cycle and Happy Number",
        "Solve LRU Cache design problem and Merge Two Sorted Lists"
      ],
      "resources": [
        {
          "title": "LeetCode Explore: Linked List Mastery",
          "url": "https://leetcode.com/explore/learn/card/linked-list/",
          "type": "Tutorial"
        },
        {
          "title": "Abdul Bari: Linked List Operations Explained",
          "url": "https://www.youtube.com/results?search_query=abdul+bari+linked+list",
          "type": "Video"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Stacks, Queues & Monotonic Patterns",
      "details": [
        "Implement stack with array and dynamic memory, valid parentheses checker",
        "Monotonic Stack technique: Next Greater Element and Daily Temperatures",
        "Queue implementations: Circular Queue and Breadth-First Queue mechanics",
        "Solve Min Stack and Evaluate Reverse Polish Notation"
      ],
      "resources": [
        {
          "title": "NeetCode Stacks & Monotonic Queue Guide",
          "url": "https://neetcode.io/practice",
          "type": "Practice"
        },
        {
          "title": "GeeksforGeeks Stack Data Structure",
          "url": "https://www.geeksforgeeks.org/stack-data-structure/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Binary Search, Recursion & Backtracking",
      "details": [
        "Modified binary search on rotated sorted arrays and search in 2D matrices",
        "Master the Recursion Tree mental model and call stack memory tracing",
        "Backtracking template: Subsets, Permutations, and Combination Sum",
        "Solve N-Queens or Word Search puzzle with prune conditions"
      ],
      "resources": [
        {
          "title": "LeetCode Binary Search Study Plan",
          "url": "https://leetcode.com/studyplan/binary-search/",
          "type": "Study Plan"
        },
        {
          "title": "Backtracking Recursion Deep Dive",
          "url": "https://takeuforward.org/recursion/strivers-recursion-series-notes/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Binary Trees, BST & Graph Traversals",
      "details": [
        "Binary tree DFS traversals (Inorder, Preorder, Postorder) and BFS Level-Order",
        "Lowest Common Ancestor and Maximum Depth of Binary Tree",
        "Graph representation with Adjacency List and BFS/DFS graph traversals",
        "Detect cycle in directed and undirected graphs (Kahn’s algorithm & topological sort)"
      ],
      "resources": [
        {
          "title": "Striver Graph Series (BFS, DFS, Dijkstra)",
          "url": "https://takeuforward.org/graphs/graph-data-structure-all-traversals/",
          "type": "Course"
        },
        {
          "title": "NeetCode Trees & Binary Search Tree Patterns",
          "url": "https://neetcode.io/practice",
          "type": "Video"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Dynamic Programming & Mock Technical Rounds",
      "details": [
        "1D Dynamic Programming: Climbing Stairs, House Robber, and Coin Change",
        "2D Dynamic Programming: Longest Common Subsequence & 0/1 Knapsack",
        "Identify overlapping subproblems and optimal substructure (Memoization vs Tabulation)",
        "Conduct a timed 45-minute technical peer interview on Orbitus"
      ],
      "resources": [
        {
          "title": "Tech Interview Handbook - DSA Best Practices",
          "url": "https://www.techinterviewhandbook.org/coding-interview-study-plan/",
          "type": "Guide"
        },
        {
          "title": "NeetCode Dynamic Programming Masterclass",
          "url": "https://neetcode.io/roadmap",
          "type": "Practice"
        }
      ]
    }
  ],
  "docker": [
    {
      "week": "Week 1",
      "topic": "Containers vs Virtual Machines & Docker Architecture",
      "details": [
        "Understand Linux cgroups, namespaces, and union file systems powering containers",
        "Docker Engine architecture: Docker CLI, REST API, dockerd daemon, and containerd",
        "Core container lifecycle commands: run, exec, stop, ps, logs, and inspect",
        "Run your first Nginx and Node.js containers with host port forwarding"
      ],
      "resources": [
        {
          "title": "Docker Official Documentation & Guides",
          "url": "https://docs.docker.com/get-started/",
          "type": "Docs"
        },
        {
          "title": "Docker Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/docker",
          "type": "Guide"
        },
        {
          "title": "NetworkChuck: Docker Containers Explained in 10 Minutes",
          "url": "https://www.youtube.com/watch?v=pg19Z8LL06w",
          "type": "Video"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Writing Production Dockerfiles & Layer Caching",
      "details": [
        "Dockerfile instructions: FROM, WORKDIR, COPY, RUN, CMD vs ENTRYPOINT",
        "Optimize build cache efficiency by ordering dependency installation before source copy",
        "Multi-stage Docker builds to reduce image size from 1GB to under 80MB",
        "Implement .dockerignore and configure unprivileged non-root security users"
      ],
      "resources": [
        {
          "title": "Dockerfile Best Practices Guide",
          "url": "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/",
          "type": "Docs"
        },
        {
          "title": "Multi-Stage Build Deep Dive",
          "url": "https://docs.docker.com/build/building/multi-stage/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Multi-Container Orchestration with Docker Compose",
      "details": [
        "Compose file syntax (v3+): services, networks, volumes, and environment variables",
        "Orchestrate a 3-tier application: React frontend, Express API, and MongoDB/PostgreSQL",
        "Service dependencies with depends_on, healthchecks, and restart policies",
        "Manage multiple environments using docker-compose.override.yml"
      ],
      "resources": [
        {
          "title": "Docker Compose Specification & Reference",
          "url": "https://docs.docker.com/compose/",
          "type": "Docs"
        },
        {
          "title": "Compose Multi-Container App Example",
          "url": "https://github.com/docker/awesome-compose",
          "type": "Repository"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Persistent Storage: Named Volumes & Host Bind Mounts",
      "details": [
        "Differentiate between Anonymous volumes, Named volumes, and Bind mounts",
        "Persist database data across container removals with named volumes",
        "Set up live-reload hot development environments using bind mounts",
        "Backup and restore Docker volume data using tar utility containers"
      ],
      "resources": [
        {
          "title": "Docker Storage & Volume Management",
          "url": "https://docs.docker.com/storage/volumes/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Docker Networking & Container Security Hardening",
      "details": [
        "Network drivers: Bridge, Host, Overlay, and Macvlan communication models",
        "Inter-container DNS resolution and isolated user-defined bridge networks",
        "Container vulnerability scanning with Docker Scout and Trivy CLI",
        "Enforce CPU and Memory resource constraints (limits and reservations)"
      ],
      "resources": [
        {
          "title": "Docker Networking Overview",
          "url": "https://docs.docker.com/network/",
          "type": "Docs"
        },
        {
          "title": "Aqua Security: Trivy Container Vulnerability Scanner",
          "url": "https://github.com/aquasecurity/trivy",
          "type": "Tool"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "CI/CD Container Pipelines & Cloud Registry Publishing",
      "details": [
        "Build and tag multi-platform container images with Docker Buildx (ARM64/AMD64)",
        "Automate container builds and testing in GitHub Actions with Docker login",
        "Push tagged images securely to Docker Hub and GitHub Container Registry (ghcr.io)",
        "Deploy the containerized project to a cloud VPS or container runtime service"
      ],
      "resources": [
        {
          "title": "GitHub Actions: Build and Push Docker Images",
          "url": "https://docs.github.com/en/actions/publishing-packages/publishing-docker-images",
          "type": "Guide"
        },
        {
          "title": "DevOps Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/devops",
          "type": "Roadmap"
        }
      ]
    }
  ],
  "redis": [
    {
      "week": "Week 1",
      "topic": "Redis In-Memory Architecture, CLI & Data Structures",
      "details": [
        "Single-threaded event loop architecture (I/O multiplexing) and in-memory speed",
        "Core data structures: Strings, Lists, Hashes, Sets, and Sorted Sets (ZSET)",
        "Key expiration policies, TTL management, and eviction algorithms (LRU, LFU)",
        "Connect via redis-cli and run benchmark tests with redis-benchmark"
      ],
      "resources": [
        {
          "title": "Redis University & Documentation",
          "url": "https://redis.io/docs/",
          "type": "Docs"
        },
        {
          "title": "Redis Data Types Tutorial",
          "url": "https://redis.io/docs/data-types/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "High-Performance Caching Patterns & Stampede Prevention",
      "details": [
        "Implement the Cache-Aside pattern in Node.js/Python with cache invalidation",
        "Evaluate Write-Through, Write-Back, and Refresh-Ahead caching trade-offs",
        "Prevent Cache Stampede / Thundering Herd using Mutex locks and probabilistic early expiration",
        "Handle Cache Penetration with Bloom Filters and Cache Avalanche with TTL jitter"
      ],
      "resources": [
        {
          "title": "Redis Caching Architecture & Best Practices",
          "url": "https://redis.io/solutions/caching/",
          "type": "Guide"
        },
        {
          "title": "ByteByteGo: Distributed Caching Architecture",
          "url": "https://bytebytego.com",
          "type": "Article"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Redis Pub/Sub, Streams & Real-Time Message Queues",
      "details": [
        "Publish/Subscribe mechanics for real-time chat broadcasts and event notifications",
        "Redis Streams vs Pub/Sub: persistent append-only logs with Consumer Groups",
        "Acknowledge processed messages (XACK) and handle pending message reclaims (XCLAIM)",
        "Build a real-time event pipeline decoupling web producers from background workers"
      ],
      "resources": [
        {
          "title": "Redis Streams Deep Dive",
          "url": "https://redis.io/docs/data-types/streams/",
          "type": "Docs"
        },
        {
          "title": "Hussein Nasser: Redis Pub/Sub Explained",
          "url": "https://www.youtube.com/results?search_query=hussein+nasser+redis+pub+sub",
          "type": "Video"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Persistence Mechanisms: RDB Snapshots vs AOF Logs",
      "details": [
        "RDB (Redis Database) point-in-time snapshotting and copy-on-write fork mechanics",
        "AOF (Append Only File) logging, fsync policies (always, everysec, no), and AOF rewrite",
        "Compare RDB vs AOF: recovery speed, data loss tolerance, and disk I/O impact",
        "Simulate crash recovery and verify data integrity on restart"
      ],
      "resources": [
        {
          "title": "Redis Persistence Options & Trade-offs",
          "url": "https://redis.io/docs/management/persistence/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Distributed Locking (Redlock), Rate Limiting & Lua Scripts",
      "details": [
        "Implement distributed mutual exclusion locks using SET NX PX and Redlock algorithm",
        "Build a Token Bucket and Sliding Window Rate Limiter to protect public APIs",
        "Write transactional atomic Lua scripts executed directly on the Redis server (EVAL)",
        "Pipelining batch requests to eliminate network round-trip latency"
      ],
      "resources": [
        {
          "title": "Distributed Locks with Redis (Redlock)",
          "url": "https://redis.io/docs/manual/patterns/distributed-locks/",
          "type": "Guide"
        },
        {
          "title": "Redis Programmability with Lua Scripting",
          "url": "https://redis.io/docs/interact/programmability/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "High Availability: Redis Sentinel, Clustering & Production Scaling",
      "details": [
        "Master-replica asynchronous replication and read-scaling topologies",
        "Configure Redis Sentinel for automated failover, quorum voting, and health monitoring",
        "Redis Cluster hash slot partitioning (16384 slots), multi-key limitations, and resharding",
        "Deploy a high-availability production Redis cluster with Docker Compose"
      ],
      "resources": [
        {
          "title": "Redis Sentinel High Availability Setup",
          "url": "https://redis.io/docs/management/sentinel/",
          "type": "Docs"
        },
        {
          "title": "Redis Cluster Specification",
          "url": "https://redis.io/docs/management/scaling/",
          "type": "Docs"
        }
      ]
    }
  ],
  "rag": [
    {
      "week": "Week 1",
      "topic": "Foundations of RAG, Vector Embeddings & Similarity Math",
      "details": [
        "Conceptual mental model of Retrieval-Augmented Generation vs fine-tuning",
        "Vector embeddings: Dense representations, cosine similarity, dot product, and Euclidean distance",
        "Document parsing & text chunking strategies: character, recursive character, and semantic chunking",
        "Generate text embeddings using OpenAI text-embedding-3 or open-source HuggingFace models"
      ],
      "resources": [
        {
          "title": "Pinecone Learning Center: What is Retrieval-Augmented Generation?",
          "url": "https://www.pinecone.io/learn/retrieval-augmented-generation/",
          "type": "Guide"
        },
        {
          "title": "AI Roadmap & RAG on roadmap.sh",
          "url": "https://roadmap.sh/ai-data-scientist",
          "type": "Roadmap"
        },
        {
          "title": "Hugging Face MTEB Leaderboard",
          "url": "https://huggingface.co/spaces/mteb/leaderboard",
          "type": "Tool"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Vector Databases & Approximate Nearest Neighbors (ANN)",
      "details": [
        "Vector indexing algorithms: HNSW (Hierarchical Navigable Small World) and IVF-Flat",
        "Set up and query vector databases: ChromaDB, Pinecone, or Qdrant",
        "Metadata filtering: combining scalar attribute filters with vector similarity search",
        "Optimize index recall vs query latency trade-offs in vector storage"
      ],
      "resources": [
        {
          "title": "ChromaDB Getting Started Guide",
          "url": "https://docs.trychroma.com/",
          "type": "Docs"
        },
        {
          "title": "Qdrant Vector Database Documentation",
          "url": "https://qdrant.tech/documentation/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Orchestration Frameworks: LangChain & LlamaIndex",
      "details": [
        "Document loaders for PDF, Markdown, HTML, and CSV structured knowledge bases",
        "Build an end-to-end question-answering pipeline using LangChain LCEL (LangChain Expression Language)",
        "LlamaIndex indices: VectorStoreIndex, SummaryIndex, and Knowledge Graph index",
        "Prompt templates for grounded context injection: instructions, citations, and fallback handling"
      ],
      "resources": [
        {
          "title": "LangChain Official Documentation (RAG Tutorial)",
          "url": "https://python.langchain.com/docs/tutorials/rag/",
          "type": "Docs"
        },
        {
          "title": "LlamaIndex Documentation",
          "url": "https://docs.llamaindex.ai/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Advanced Retrieval: Hybrid Search, Re-Ranking & Query Transformation",
      "details": [
        "Hybrid search: Combining sparse keyword search (BM25) with dense vector search (Reciprocal Rank Fusion)",
        "Contextual cross-encoder re-ranking using Cohere Rerank or BGE-Reranker",
        "Query transformation techniques: Multi-Query expansion, Hypothetical Document Embeddings (HyDE)",
        "Parent Document Retriever & Sentence Window Retrieval for preserving contextual integrity"
      ],
      "resources": [
        {
          "title": "Cohere Rerank Documentation & Benchmarks",
          "url": "https://docs.cohere.com/docs/reranking-best-practices",
          "type": "Docs"
        },
        {
          "title": "Advanced RAG Techniques by LlamaIndex",
          "url": "https://docs.llamaindex.ai/en/stable/optimizing/advanced_retrieval/advanced_retrieval/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Evaluation Frameworks, Hallucination Detection & Guardrails",
      "details": [
        "RAG Triad metrics: Context Relevance, Groundedness (Faithfulness), and Answer Relevance",
        "Automated quantitative evaluation with Ragas (Retrieval Augmented Generation Assessment)",
        "Implement guardrails to detect hallucinations, jailbreaks, and prompt injections",
        "Benchmarking retrieval accuracy using synthetic ground truth datasets"
      ],
      "resources": [
        {
          "title": "Ragas: Automated RAG Evaluation Framework",
          "url": "https://docs.ragas.io/",
          "type": "Tool"
        },
        {
          "title": "NeMo Guardrails by NVIDIA",
          "url": "https://github.com/NVIDIA/NeMo-Guardrails",
          "type": "Repository"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Production Deployment: Streaming RAG Application with Citations",
      "details": [
        "Build a high-performance FastAPI/Express backend with server-sent events (SSE) streaming",
        "Implement clickable source document citations and highlighted text references in the UI",
        "Add conversational memory with chat history compression and conversational retrieval chains",
        "Deploy the fullstack RAG assistant with Docker and host vector database"
      ],
      "resources": [
        {
          "title": "Fullstack RAG Architecture Blueprint",
          "url": "https://github.com/langchain-ai/rag-from-scratch",
          "type": "Repository"
        },
        {
          "title": "FastAPI Streaming Responses with LLMs",
          "url": "https://fastapi.tiangolo.com/",
          "type": "Docs"
        }
      ]
    }
  ],
  "kubernetes": [
    {
      "week": "Week 1",
      "topic": "Kubernetes Control Plane Architecture & Cluster Setup",
      "details": [
        "Control plane components: kube-apiserver, etcd, kube-scheduler, and kube-controller-manager",
        "Worker node components: kubelet, kube-proxy, and container runtime interface (CRI)",
        "Spin up local clusters with Minikube, Kind, or K3s and configure kubectl context",
        "Declare and inspect simple Pod manifests using YAML"
      ],
      "resources": [
        {
          "title": "Kubernetes Official Documentation",
          "url": "https://kubernetes.io/docs/home/",
          "type": "Docs"
        },
        {
          "title": "Kubernetes Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/kubernetes",
          "type": "Guide"
        },
        {
          "title": "KubeAcademy by VMware",
          "url": "https://kube.academy/",
          "type": "Course"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Workloads: Deployments, ReplicaSets & Rolling Updates",
      "details": [
        "Deployments for declarative pod updates and ReplicaSet reconciliation loops",
        "Zero-downtime rolling updates, maxSurge, maxUnavailable, and instant rollbacks",
        "Configure Liveness, Readiness, and Startup probes to safeguard traffic routing",
        "Define container resource requests and limits to prevent noisy-neighbor starvation"
      ],
      "resources": [
        {
          "title": "Kubernetes Workload Resources Reference",
          "url": "https://kubernetes.io/docs/concepts/workloads/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Networking & Ingress: Exposing Services to Traffic",
      "details": [
        "Service types: ClusterIP (internal), NodePort (host-level), and LoadBalancer (cloud)",
        "Kube-proxy iptables and IPVS routing mechanisms behind virtual IPs",
        "Ingress Controllers: Deploy NGINX Ingress Controller for path-based routing",
        "Automate TLS certificate issuance and renewal with cert-manager and Let’s Encrypt"
      ],
      "resources": [
        {
          "title": "Kubernetes Ingress & Services Guide",
          "url": "https://kubernetes.io/docs/concepts/services-networking/",
          "type": "Docs"
        },
        {
          "title": "cert-manager for Kubernetes",
          "url": "https://cert-manager.io/docs/",
          "type": "Tool"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Configuration & Storage: ConfigMaps, Secrets & PersistentVolumes",
      "details": [
        "Decouple environment configuration with ConfigMaps and mount as files or env variables",
        "Secure sensitive credentials with Secrets and integrate external secrets managers",
        "Storage architecture: PersistentVolumes (PV), PersistentVolumeClaims (PVC), and StorageClasses",
        "Deploy a stateful database (PostgreSQL or Redis) with dynamic volume provisioning"
      ],
      "resources": [
        {
          "title": "Kubernetes Storage Concepts",
          "url": "https://kubernetes.io/docs/concepts/storage/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Helm Package Management & GitOps Workflows",
      "details": [
        "Package applications with Helm charts: templates, values.yaml, and release versions",
        "Manage multi-environment deployments using Helm overrides",
        "Introduction to GitOps principles: declarative infrastructure stored in git repositories",
        "Set up continuous deployment with ArgoCD or Flux syncing cluster state automatically"
      ],
      "resources": [
        {
          "title": "Helm Official Documentation",
          "url": "https://helm.sh/docs/",
          "type": "Docs"
        },
        {
          "title": "ArgoCD Declarative GitOps Guide",
          "url": "https://argo-cd.readthedocs.io/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Cluster Security, RBAC & Observability with Prometheus",
      "details": [
        "Role-Based Access Control (RBAC): ServiceAccounts, Roles, ClusterRoles, and RoleBindings",
        "Deploy Prometheus and Grafana using kube-prometheus-stack for cluster metrics",
        "Configure Horizontal Pod Autoscaler (HPA) to scale pods based on CPU/memory pressure",
        "Perform cluster security audits with kube-bench and Kube-hunter"
      ],
      "resources": [
        {
          "title": "Prometheus Operator on Kubernetes",
          "url": "https://prometheus-operator.dev/",
          "type": "Docs"
        },
        {
          "title": "Kubernetes Hardening Guidance (NSA/CISA)",
          "url": "https://kubernetes.io/docs/concepts/security/",
          "type": "Guide"
        }
      ]
    }
  ],
  "nextjs": [
    {
      "week": "Week 1",
      "topic": "Next.js App Router Architecture & React Server Components",
      "details": [
        "Server Components vs Client Components (\"use client\") mental model and boundary rules",
        "Folder-based routing conventions: layout.js, page.js, loading.js, error.js, and not-found.js",
        "Streaming HTML with React Suspense for instant page shell rendering",
        "Set up a production starter with Tailwind CSS, TypeScript, and shadcn/ui"
      ],
      "resources": [
        {
          "title": "Next.js Official Documentation (App Router)",
          "url": "https://nextjs.org/docs",
          "type": "Docs"
        },
        {
          "title": "Next.js Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/nextjs",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Data Fetching, Caching Architecture & Server Actions",
      "details": [
        "Extended fetch API: cache options (force-cache, no-store) and revalidate tags",
        "Execute database mutations safely on the server using Server Actions",
        "Incremental Static Regeneration (ISR) and on-demand revalidation via revalidatePath",
        "Optimistic UI updates using React useOptimistic and useTransition hooks"
      ],
      "resources": [
        {
          "title": "Data Fetching, Caching, and Revalidating in Next.js",
          "url": "https://nextjs.org/docs/app/building-your-application/data-fetching",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Advanced Routing: Dynamic Routes, Intercepting & Route Handlers",
      "details": [
        "Dynamic segments [id] and catch-all routes [...slug] with generateStaticParams",
        "Parallel Routes (@slot) for multi-column dashboards and modal dialogs",
        "Intercepting Routes ((..)photo) for seamless Instagram-like image feed overlays",
        "Custom REST API endpoints using Route Handlers (route.ts)"
      ],
      "resources": [
        {
          "title": "Next.js Routing Patterns Deep Dive",
          "url": "https://nextjs.org/docs/app/building-your-application/routing",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Authentication & Middleware Route Protection",
      "details": [
        "NextAuth.js v5 (Auth.js) setup with OAuth providers (Google, GitHub) and Credentials",
        "Secure session management using encrypted JWT cookies in Edge Middleware",
        "Protect authenticated dashboard routes using proxy redirects in middleware.ts",
        "Role-Based Access Control (Admin vs Regular User) across Server Components"
      ],
      "resources": [
        {
          "title": "Auth.js Official Guide for Next.js",
          "url": "https://authjs.dev/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Performance Optimization: Images, Fonts & SEO Metadata",
      "details": [
        "Next/image component: automatic WebP/AVIF format conversion and layout shift prevention",
        "Next/font: zero-layout-shift Google and local font self-hosting at build time",
        "Dynamic OpenGraph (OG) image generation using @vercel/og and ImageResponse",
        "Generate dynamic sitemaps (sitemap.ts) and robots.txt for search engine indexing"
      ],
      "resources": [
        {
          "title": "Next.js Optimizing & SEO Guide",
          "url": "https://nextjs.org/docs/app/building-your-application/optimizing",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Production Deployment: Edge Functions & Docker Hosting",
      "details": [
        "Deploying seamlessly to Vercel with preview deployments and environment variables",
        "Containerize Next.js using standalone output mode in a minimal Alpine Docker container",
        "Set up continuous deployment with GitHub Actions to a self-hosted cloud server",
        "Audit Web Vitals (LCP, FID, CLS) using Google Lighthouse and achieve a 95+ score"
      ],
      "resources": [
        {
          "title": "Deploying Next.js with Docker Standalone",
          "url": "https://github.com/vercel/next.js/tree/canary/examples/with-docker",
          "type": "Repository"
        }
      ]
    }
  ],
  "system_design": [
    {
      "week": "Week 1",
      "topic": "Scalability Fundamentals, Latency vs Throughput & CAP Theorem",
      "details": [
        "Vertical scaling (scale-up) vs Horizontal scaling (scale-out) trade-offs and limits",
        "Latency, Throughput, Availability (99.9% vs 99.999% SLA), and Back-of-the-envelope calculations",
        "CAP Theorem (Consistency, Availability, Partition Tolerance) and PACELC trade-offs",
        "Stateless vs Stateful application server tiers"
      ],
      "resources": [
        {
          "title": "System Design Primer by Donne Martin",
          "url": "https://github.com/donnemartin/system-design-primer",
          "type": "Repository"
        },
        {
          "title": "System Design Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/system-design",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Load Balancing, Reverse Proxies & CDN Caching",
      "details": [
        "Load balancing algorithms: Round Robin, Weighted Least Connections, IP Hash, Consistent Hashing",
        "Layer 4 (Transport/TCP) vs Layer 7 (Application/HTTP) load balancers (HAProxy, Nginx, AWS ALB)",
        "Content Delivery Networks (CDNs): Edge caching, Origin Shield, and cache invalidation strategies",
        "DNS round-robin routing and GeoDNS for global user distribution"
      ],
      "resources": [
        {
          "title": "Cloudflare Learning Center: What is a Load Balancer?",
          "url": "https://www.cloudflare.com/learning/performance/what-is-load-balancing/",
          "type": "Article"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Database Scaling: Replication, Sharding & NoSQL Selection",
      "details": [
        "Relational (RDBMS) vs Non-Relational (NoSQL: Document, Key-Value, Columnar, Graph)",
        "Master-Slave (Leader-Follower) replication and read replicas for high-throughput reads",
        "Horizontal database sharding strategies: Range-based, Directory-based, and Hash-based sharding",
        "Managing distributed data integrity: 2-Phase Commit (2PC) vs Saga pattern"
      ],
      "resources": [
        {
          "title": "Designing Data-Intensive Applications (Martin Kleppmann Notes)",
          "url": "https://dataintensive.net/",
          "type": "Book"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Message Queues & Asynchronous Event-Driven Architectures",
      "details": [
        "Message Queues vs Event Streams: RabbitMQ (AMQP push) vs Apache Kafka (pull/partitioned log)",
        "Decoupling synchronous request paths using asynchronous worker queues (Celery, BullMQ)",
        "Delivery semantics: At-least-once, At-most-once, and Exactly-once processing with idempotency",
        "Dead letter queues (DLQ), retry backoff, and circuit breaker patterns"
      ],
      "resources": [
        {
          "title": "Confluent Kafka Architecture Guide",
          "url": "https://www.confluent.io/what-is-apache-kafka/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Microservices Communication: REST, gRPC & API Gateways",
      "details": [
        "Inter-service communication: synchronous REST/HTTP vs binary high-speed gRPC Protocol Buffers",
        "API Gateway pattern: authentication, rate limiting, SSL termination, and request aggregation",
        "Service discovery and Service Mesh (Envoy, Istio) for dynamic microservice routing",
        "Distributed tracing with OpenTelemetry and Jaeger to track request lifecycles across services"
      ],
      "resources": [
        {
          "title": "Microservices.io Architecture Patterns",
          "url": "https://microservices.io/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Designing Real-World Systems: Twitter, TinyURL & YouTube",
      "details": [
        "Design a Distributed URL Shortener (TinyURL): base62 encoding, KGS (Key Generation Service), caching",
        "Design a Social Newsfeed (Twitter/Instagram): Fanout-on-write vs Fanout-on-read for celebrity accounts",
        "Design a Video Streaming Platform (YouTube/Netflix): Chunking, transcoding workers, CDN distribution",
        "Conduct a 45-minute timed system design mock interview simulation"
      ],
      "resources": [
        {
          "title": "ByteByteGo System Design YouTube Channel",
          "url": "https://www.youtube.com/@ByteByteGo",
          "type": "Video"
        },
        {
          "title": "Grokking the System Design Interview",
          "url": "https://github.com/madd86/awesome-system-design",
          "type": "Repository"
        }
      ]
    }
  ],
  "sql": [
    {
      "week": "Week 1",
      "topic": "Relational Model, Normalization & DDL/DML Fundamentals",
      "details": [
        "Relational model foundations: primary keys, foreign keys, unique constraints, and check constraints",
        "Database normalization: 1NF, 2NF, 3NF, and BCNF to eliminate data anomalies and redundancy",
        "Data Definition Language (CREATE, ALTER, DROP) and Data Manipulation Language (INSERT, UPDATE, DELETE)",
        "Designing a clean relational schema for an e-commerce platform"
      ],
      "resources": [
        {
          "title": "PostgreSQL Official Documentation",
          "url": "https://www.postgresql.org/docs/",
          "type": "Docs"
        },
        {
          "title": "SQL Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/sql",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Complex Joins, Grouping & Multi-Table Aggregations",
      "details": [
        "Mastering join mechanics: INNER JOIN, LEFT OUTER JOIN, RIGHT JOIN, and FULL OUTER JOIN",
        "Aggregate functions: COUNT, SUM, AVG, MIN, MAX with GROUP BY and filtering with HAVING",
        "Handling NULL values correctly: COALESCE, NULLIF, and Three-Valued Logic in SQL",
        "Cross Joins, Self Joins, and hierarchical parent-child queries"
      ],
      "resources": [
        {
          "title": "SQLBolt: Interactive Interactive SQL Lessons",
          "url": "https://sqlbolt.com/",
          "type": "Practice"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Subqueries, Common Table Expressions (CTEs) & Window Functions",
      "details": [
        "Scalar subqueries, correlated subqueries, and EXISTS vs IN performance differences",
        "Common Table Expressions (WITH clause) and Recursive CTEs for hierarchical tree traversal",
        "Window functions: ROW_NUMBER(), RANK(), DENSE_RANK(), and NTILE() partitions",
        "Analytical offsets: LAG(), LEAD(), FIRST_VALUE(), and running rolling totals with OVER()"
      ],
      "resources": [
        {
          "title": "Modern SQL Window Functions Masterclass",
          "url": "https://modern-sql.com/feature/over",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Indexing Internals & Query Execution Plan Optimization",
      "details": [
        "Index data structures: B-Tree index traversal, Hash indexes, and GiST/GIN for full-text search",
        "Composite multi-column indexes and the Leftmost Prefix Rule",
        "Analyzing execution plans using EXPLAIN ANALYZE: Sequential Scan vs Index Scan vs Bitmap Heap Scan",
        "Preventing index suppression caused by functions on columns or implicit type casting"
      ],
      "resources": [
        {
          "title": "Use The Index, Luke! Database Performance Guide",
          "url": "https://use-the-index-luke.com/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Transactions, ACID Guarantees & Concurrency Control",
      "details": [
        "ACID properties: Atomicity, Consistency, Isolation, and Durability",
        "Transaction isolation levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable",
        "Concurrency anomalies: Dirty Reads, Non-Repeatable Reads, and Phantom Reads",
        "Pessimistic locking (SELECT FOR UPDATE) vs Optimistic concurrency control with version columns"
      ],
      "resources": [
        {
          "title": "PostgreSQL Concurrency Control & MVCC",
          "url": "https://www.postgresql.org/docs/current/mvcc.html",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Table Partitioning, Stored Procedures & Production DBA Tasks",
      "details": [
        "Horizontal table partitioning by Range, List, and Hash for tables with 10M+ rows",
        "Writing stored procedures, user-defined functions, and triggers in PL/pgSQL",
        "Database connection pooling (PgBouncer) and vacuuming dead tuples (VACUUM FULL)",
        "Designing zero-downtime database schema migration workflows using Flyway or Prisma"
      ],
      "resources": [
        {
          "title": "PostgreSQL Table Partitioning Guide",
          "url": "https://www.postgresql.org/docs/current/ddl-partitioning.html",
          "type": "Docs"
        }
      ]
    }
  ],
  "graphql": [
    {
      "week": "Week 1",
      "topic": "GraphQL Foundations vs REST & Schema Definition Language",
      "details": [
        "Core problems solved: Eliminating over-fetching and under-fetching of data",
        "Schema Definition Language (SDL): Scalar types, Object types, Enums, and Inputs",
        "Write queries requesting precise nested fields and pass arguments",
        "Explore schemas interactively with Apollo Sandbox and GraphiQL"
      ],
      "resources": [
        {
          "title": "GraphQL Official Introduction",
          "url": "https://graphql.org/learn/",
          "type": "Docs"
        },
        {
          "title": "GraphQL Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/graphql",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Resolvers, Data Sources & Mutations",
      "details": [
        "Resolver signature: parent, args, context, and info execution parameters",
        "Building mutation operations for creating, updating, and deleting records",
        "Structuring error responses and custom error extensions",
        "Connecting resolvers to relational databases and REST backend endpoints"
      ],
      "resources": [
        {
          "title": "Apollo Server Documentation",
          "url": "https://www.apollographql.com/docs/apollo-server/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Solving the N+1 Query Problem with DataLoader",
      "details": [
        "Understanding how nested GraphQL queries trigger catastrophic N+1 database queries",
        "Implement DataLoader for batching individual database lookups into a single IN query",
        "Per-request memoization caching with DataLoader instances",
        "Query complexity analysis and depth limiting to prevent denial-of-service queries"
      ],
      "resources": [
        {
          "title": "DataLoader GitHub Repository & Patterns",
          "url": "https://github.com/graphql/dataloader",
          "type": "Repository"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Real-Time Updates with GraphQL Subscriptions",
      "details": [
        "WebSocket protocol transport for persistent real-time client-server communication",
        "Publishing and subscribing to live events with PubSub engine",
        "Filter subscription notifications per authenticated user or channel ID",
        "Build a real-time live notification and chat feature using subscriptions"
      ],
      "resources": [
        {
          "title": "GraphQL Subscriptions with Apollo Server",
          "url": "https://www.apollographql.com/docs/apollo-server/data/subscriptions/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Authentication, Authorization & Schema Directives",
      "details": [
        "Passing JWT tokens via HTTP headers into the GraphQL request context",
        "Field-level authorization checks vs schema-level authentication guards",
        "Custom schema directives (@auth, @deprecated) to enforce security rules declaratively",
        "Rate limiting public queries by calculating cost per request"
      ],
      "resources": [
        {
          "title": "Apollo Security Best Practices",
          "url": "https://www.apollographql.com/docs/apollo-server/security/terminating-ssl/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Client Integration with Apollo Client & Federation",
      "details": [
        "Apollo Client setup in React: useQuery, useMutation, and useSubscription hooks",
        "Normalized client-side in-memory caching and cache update policies (cache-first vs network-only)",
        "Code generation for end-to-end TypeScript types using GraphQL Code Generator",
        "Introduction to Apollo Federation for composable microservice supergraphs"
      ],
      "resources": [
        {
          "title": "Apollo Client React Tutorial",
          "url": "https://www.apollographql.com/docs/react/",
          "type": "Docs"
        },
        {
          "title": "GraphQL Code Generator Guide",
          "url": "https://the-guild.dev/graphql/codegen",
          "type": "Tool"
        }
      ]
    }
  ],
  "cybersecurity": [
    {
      "week": "Week 1",
      "topic": "Information Security Fundamentals & Threat Modeling",
      "details": [
        "Core security tenets: Confidentiality, Integrity, and Availability (CIA Triad)",
        "Threat modeling frameworks: STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege)",
        "Defense-in-depth principles: physical, network, host, application, and data security layers",
        "Setting up a secure virtualized practice lab with Kali Linux"
      ],
      "resources": [
        {
          "title": "Cyber Security Roadmap on roadmap.sh",
          "url": "https://roadmap.sh/cyber-security",
          "type": "Guide"
        },
        {
          "title": "TryHackMe: Pre-Security Pathway",
          "url": "https://tryhackme.com/path/outline/presecurity",
          "type": "Practice"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Network Security & Packet Traffic Analysis",
      "details": [
        "TCP/IP stack security, port scanning, and banner grabbing with Nmap",
        "Deep packet inspection and protocol analysis using Wireshark",
        "Understanding MITM (Man-in-the-Middle) attacks and ARP spoofing mechanics",
        "Configuring firewalls (iptables/UFW) and network segmentation rules"
      ],
      "resources": [
        {
          "title": "Wireshark User Guide & Practice PCAPs",
          "url": "https://www.wireshark.org/docs/",
          "type": "Tool"
        },
        {
          "title": "Nmap Network Scanning by Gordon Lyon",
          "url": "https://nmap.org/book/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "OWASP Top 10 Web Application Vulnerabilities",
      "details": [
        "SQL Injection (SQLi): In-band, blind, and time-based injection techniques & parameterized defenses",
        "Cross-Site Scripting (XSS): Stored, Reflected, and DOM-based XSS mitigation with CSP headers",
        "Cross-Site Request Forgery (CSRF) and Broken Object Level Authorization (BOLA/IDOR)",
        "Server-Side Request Forgery (SSRF) and insecure deserialization attacks"
      ],
      "resources": [
        {
          "title": "OWASP Top 10 Web Application Security Risks",
          "url": "https://owasp.org/www-project-top-ten/",
          "type": "Docs"
        },
        {
          "title": "PortSwigger Web Security Academy (Free Labs)",
          "url": "https://portswigger.net/web-security",
          "type": "Practice"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Applied Cryptography & Identity Management",
      "details": [
        "Symmetric encryption (AES-256-GCM) vs Asymmetric public-key encryption (RSA, ECC)",
        "Cryptographic hashing (SHA-256) vs Key Derivation Functions (bcrypt, Argon2, PBKDF2) for passwords",
        "Public Key Infrastructure (PKI), digital certificates, and TLS 1.3 handshake verification",
        "Authentication protocols: OAuth 2.0, OpenID Connect (OIDC), and JWT security flaws"
      ],
      "resources": [
        {
          "title": "Crypto101 by Laurens Van Houtven",
          "url": "https://www.crypto101.io/",
          "type": "Book"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Penetration Testing & Web Vulnerability Assessment",
      "details": [
        "Reconnaissance & OSINT gathering techniques for domain and asset enumeration",
        "Intercepting and modifying HTTP requests using Burp Suite Community Edition",
        "Automated vulnerability scanning with Nikto, OWASP ZAP, and Nuclei",
        "Documenting vulnerabilities with CVSS scoring and writing remediation reports"
      ],
      "resources": [
        {
          "title": "Burp Suite Getting Started",
          "url": "https://portswigger.net/burp/documentation/desktop/getting-started",
          "type": "Docs"
        },
        {
          "title": "HackTheBox Starting Point",
          "url": "https://www.hackthebox.com/",
          "type": "Practice"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Incident Response, DevSecOps & Security Hardening",
      "details": [
        "Incident handling steps: Preparation, Detection, Containment, Eradication, Recovery, and Lessons Learned",
        "Static Application Security Testing (SAST) and Dependency Scanning in CI/CD pipelines",
        "Linux server hardening: SSH key authentication, disabling root login, Fail2ban, and auditd logs",
        "Security Information and Event Management (SIEM) log correlation fundamentals"
      ],
      "resources": [
        {
          "title": "NIST Computer Security Incident Handling Guide (SP 800-61)",
          "url": "https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final",
          "type": "Guide"
        },
        {
          "title": "SANS Institute Security Resources",
          "url": "https://www.sans.org/white-papers/",
          "type": "Guide"
        }
      ]
    }
  ],
  "javascript": [
    {
      "week": "Week 1",
      "topic": "JS Engine, Scopes, Hoisting & Closures",
      "details": [
        "How V8 executes code: Call Stack, Memory Heap, and Execution Contexts",
        "Variable declarations: var vs let/const, Temporal Dead Zone, and Block Scope",
        "Deep dive into Closures: data privacy, function factories, and memoization",
        "Understanding \"this\" binding: default, implicit, explicit (call/apply/bind), and arrow functions"
      ],
      "resources": [
        {
          "title": "JavaScript.info: Code Quality & Closures",
          "url": "https://javascript.info/closure",
          "type": "Docs"
        },
        {
          "title": "MDN Web Docs: JavaScript Execution Context",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Asynchronous JS & The Event Loop",
      "details": [
        "Event Loop anatomy: Microtask Queue vs Macrotask Callback Queue",
        "Promises from scratch: states, chaining, and error propagation",
        "Async/Await syntax, parallel execution with Promise.all vs Promise.allSettled",
        "Build a custom retry mechanism for unreliable API calls"
      ],
      "resources": [
        {
          "title": "Philip Roberts: What the heck is the event loop?",
          "url": "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
          "type": "Video"
        },
        {
          "title": "JavaScript.info: Promises & Async/Await",
          "url": "https://javascript.info/async",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Prototypal Inheritance, ES6+ & Collections",
      "details": [
        "Prototypes and prototype chain (__proto__ vs prototype property)",
        "ES6 Classes, inheritance, super(), getters, setters, and static methods",
        "Destructuring, spread/rest, optional chaining (?.), and nullish coalescing (??)",
        "Map, Set, WeakMap, WeakSet use-cases and garbage collection implications"
      ],
      "resources": [
        {
          "title": "MDN: Inheritance and the prototype chain",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",
          "type": "Docs"
        },
        {
          "title": "Modern JavaScript Features Reference",
          "url": "https://javascript.info/classes",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "DOM Engine, Event Bubbling & Performance",
      "details": [
        "DOM tree traversal, document fragments, and efficient bulk node insertions",
        "Event bubbling, capturing phase, and high-performance Event Delegation",
        "Implement Debounce and Throttle utilities from scratch for scroll and search inputs",
        "Intersection Observer API for lazy loading images and infinite scroll"
      ],
      "resources": [
        {
          "title": "MDN: Introduction to the DOM",
          "url": "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction",
          "type": "Docs"
        },
        {
          "title": "Web Dev Simplified: Event Bubbling & Delegation",
          "url": "https://www.youtube.com/results?search_query=web+dev+simplified+event+bubbling",
          "type": "Video"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Network Requests, Storage & Clean Architecture",
      "details": [
        "Fetch API with custom headers, AbortController for cancelable requests, and timeout handling",
        "LocalStorage, SessionStorage, and secure HTTP-only cookie patterns",
        "Modular architecture: ES Modules (import/export), dependency management, and separation of concerns",
        "Unit testing pure JavaScript utility functions with Vitest"
      ],
      "resources": [
        {
          "title": "JavaScript.info: Network Requests & Fetch",
          "url": "https://javascript.info/network",
          "type": "Docs"
        },
        {
          "title": "Vitest Official Getting Started",
          "url": "https://vitest.dev/guide/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Full Vanilla JS Production Project",
      "details": [
        "Architect and build an interactive Trello/Kanban Board using only native Vanilla JS",
        "Implement drag-and-drop using HTML5 Drag & Drop API",
        "Persist boards in LocalStorage with state re-hydration",
        "Deploy cleanly to Vercel/GitHub Pages with zero external UI libraries"
      ],
      "resources": [
        {
          "title": "The Modern JavaScript Tutorial - Capstone Guide",
          "url": "https://javascript.info/",
          "type": "Guide"
        },
        {
          "title": "Vite Vanilla JS Setup Guide",
          "url": "https://vitejs.dev/guide/",
          "type": "Docs"
        }
      ]
    }
  ],
  "react": [
    {
      "week": "Week 1",
      "topic": "React Mental Model, JSX & Tooling",
      "details": [
        "Set up modern React 18+ with Vite and understand JSX transformation",
        "Deconstruct UI into small, composable, single-responsibility components",
        "Props passing, default values, children prop patterns, and strict typing",
        "Build a multi-card responsive product catalog"
      ],
      "resources": [
        {
          "title": "React.dev Official Tutorial: Quick Start",
          "url": "https://react.dev/learn",
          "type": "Docs"
        },
        {
          "title": "Vite React Setup Guide",
          "url": "https://vitejs.dev/guide/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "State Management, Events & Re-renders",
      "details": [
        "useState hook mechanics, state batching, and updater functions",
        "Handling forms, controlled vs uncontrolled inputs, and validation",
        "Lifting state up and understanding when and why components re-render",
        "Avoid common state mutation bugs and array/object immutability patterns"
      ],
      "resources": [
        {
          "title": "React.dev: Managing State Like a Pro",
          "url": "https://react.dev/learn/managing-state",
          "type": "Docs"
        },
        {
          "title": "React Event Handling Best Practices",
          "url": "https://react.dev/learn/responding-to-events",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Side Effects, Data Fetching & Custom Hooks",
      "details": [
        "useEffect dependency arrays, cleanup functions, and avoiding infinite loops",
        "Fetching API data with loading, error, and cached states",
        "Extract reusable logic into clean custom hooks (useFetch, useDebounce, useLocalStorage)",
        "React Hook Form setup for streamlined form handling"
      ],
      "resources": [
        {
          "title": "React.dev: Synchronizing with Effects",
          "url": "https://react.dev/learn/synchronizing-with-effects",
          "type": "Docs"
        },
        {
          "title": "Custom React Hooks Guide",
          "url": "https://usehooks.com/",
          "type": "Code Examples"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Routing, Context & Global State",
      "details": [
        "React Router v6: nested routes, dynamic URL parameters, and loaders",
        "Protected route wrappers for authenticated user dashboards",
        "React Context API for theme switching and user session state",
        "When to introduce Redux Toolkit or Zustand for complex app state"
      ],
      "resources": [
        {
          "title": "React Router v6 Official Tutorial",
          "url": "https://reactrouter.com/en/main/start/tutorial",
          "type": "Tutorial"
        },
        {
          "title": "Zustand State Management Docs",
          "url": "https://docs.pmnd.rs/zustand/getting-started/introduction",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Performance, Memoization & Component Testing",
      "details": [
        "Profile re-renders using React DevTools Profiler",
        "Strategic use of useMemo and useCallback to preserve referential equality",
        "Code splitting with React.lazy and Suspense for fast initial bundle loads",
        "Unit test components with React Testing Library and Vitest"
      ],
      "resources": [
        {
          "title": "Optimizing React Performance - React.dev",
          "url": "https://react.dev/reference/react/useMemo",
          "type": "Docs"
        },
        {
          "title": "React Testing Library Quick Start",
          "url": "https://testing-library.com/docs/react-testing-library/intro/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Full-Scale Dashboard Project & Cloud Deployment",
      "details": [
        "Build a production-grade Analytics Dashboard with charts and live filters",
        "Connect real REST endpoints with JWT cookie authentication",
        "Ensure 100% responsive design with Tailwind CSS and dark/light theme support",
        "Deploy production bundle on Vercel with environment variable configuration"
      ],
      "resources": [
        {
          "title": "Deploying Modern React Apps to Vercel",
          "url": "https://vercel.com/docs/deployments",
          "type": "Guide"
        },
        {
          "title": "Tailwind CSS Component System",
          "url": "https://tailwindcss.com/docs",
          "type": "Docs"
        }
      ]
    }
  ],
  "mern": [
    {
      "week": "Week 1",
      "topic": "HTML5, Modern CSS Layouts & Responsive UI",
      "details": [
        "Master Flexbox alignment and CSS Grid two-dimensional layout systems",
        "Mobile-first responsive design breakpoints and fluid typography",
        "Semantic HTML5 markup and accessibility (a11y) standards",
        "Build a multi-page responsive landing page from a Figma design"
      ],
      "resources": [
        {
          "title": "MDN Web Docs HTML/CSS Guides",
          "url": "https://developer.mozilla.org/en-US/docs/Learn",
          "type": "Docs"
        },
        {
          "title": "CSS-Tricks: Complete Guide to Flexbox & Grid",
          "url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Modern JavaScript & Frontend State with React",
      "details": [
        "ES6+ syntax, Promises, async/await, and Fetch API",
        "React component tree, props, useState, and useEffect hooks",
        "React Router navigation and client-side page transitions",
        "Connecting frontend components to mock API services"
      ],
      "resources": [
        {
          "title": "React Official Documentation",
          "url": "https://react.dev/",
          "type": "Docs"
        },
        {
          "title": "JavaScript.info Interactive Guide",
          "url": "https://javascript.info/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Node.js Runtime & Express REST API Architecture",
      "details": [
        "Node.js architecture, non-blocking I/O, and npm package ecosystem",
        "Express server setup, RESTful route design, and controller structuring",
        "Request/Response lifecycle and custom middleware (logging, error handling)",
        "Input validation and sanitization using express-validator"
      ],
      "resources": [
        {
          "title": "Express.js Official Guide",
          "url": "https://expressjs.com/en/starter/installing.html",
          "type": "Docs"
        },
        {
          "title": "Node.js Official Documentation",
          "url": "https://nodejs.org/en/docs/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "MongoDB, Mongoose Schemas & Aggregations",
      "details": [
        "MongoDB Atlas setup, database connections, and connection pooling",
        "Mongoose Schema modeling, data types, validators, and virtual properties",
        "CRUD operations, referencing vs embedding documents, and populate()",
        "Write aggregation pipelines for search filtering, pagination, and sorting"
      ],
      "resources": [
        {
          "title": "MongoDB University Free Developer Courses",
          "url": "https://learn.mongodb.com/",
          "type": "Course"
        },
        {
          "title": "Mongoose Official Documentation",
          "url": "https://mongoosejs.com/docs/guide.html",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Authentication, Security & File Uploads",
      "details": [
        "Bcrypt password hashing and JSON Web Token (JWT) generation",
        "Protected API route middleware and role-based access control (Admin/User)",
        "HTTP-only secure cookies vs Authorization Bearer header tokens",
        "Image uploads using Multer and Cloudinary cloud storage integration"
      ],
      "resources": [
        {
          "title": "JWT.io Guide to JSON Web Tokens",
          "url": "https://jwt.io/introduction",
          "type": "Docs"
        },
        {
          "title": "Cloudinary Node.js Upload Integration",
          "url": "https://cloudinary.com/documentation/node_integration",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Full-Stack Integration, Testing & Deployment",
      "details": [
        "Connect React frontend with Express backend using Axios client with interceptors",
        "Global state management with Redux Toolkit or Context API",
        "Environment variable configuration for staging and production",
        "Deploy backend to Render/Railway and frontend to Vercel with custom domain"
      ],
      "resources": [
        {
          "title": "Full Stack Open - University of Helsinki",
          "url": "https://fullstackopen.com/en/",
          "type": "Course"
        },
        {
          "title": "Render Deployment Documentation",
          "url": "https://render.com/docs",
          "type": "Docs"
        }
      ]
    }
  ],
  "aiMl": [
    {
      "week": "Week 1",
      "topic": "Python Math Stack & Exploratory Data Analysis",
      "details": [
        "NumPy vectorization, matrix dot products, and broadcasting mechanics",
        "Pandas DataFrame manipulation, imputation, and outlier detection",
        "Practical math foundations: linear algebra, multivariable calculus gradients, and probability",
        "Exploratory Data Analysis (EDA) report on a real Kaggle dataset"
      ],
      "resources": [
        {
          "title": "3Blue1Brown Linear Algebra Visual Series",
          "url": "https://www.3blue1brown.com/topics/linear-algebra",
          "type": "Video Series"
        },
        {
          "title": "Kaggle Python & Pandas Hands-on Courses",
          "url": "https://www.kaggle.com/learn/pandas",
          "type": "Course"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Feature Engineering & Classical Machine Learning",
      "details": [
        "Data preprocessing: StandardScaler, OneHotEncoder, and train/test splits",
        "Supervised learning: Linear Regression, Logistic Regression, and Decision Trees",
        "Overfitting vs underfitting, bias-variance tradeoff, and L1/L2 Regularization",
        "Ensemble methods: Random Forest and XGBoost gradient boosting"
      ],
      "resources": [
        {
          "title": "Scikit-Learn Official User Guide",
          "url": "https://scikit-learn.org/stable/user_guide.html",
          "type": "Docs"
        },
        {
          "title": "Google Machine Learning Crash Course",
          "url": "https://developers.google.com/machine-learning/crash-course",
          "type": "Course"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "Model Evaluation, Cross-Validation & Pipelines",
      "details": [
        "Classification metrics: Confusion Matrix, Precision, Recall, F1-Score, and ROC-AUC",
        "Regression metrics: Mean Absolute Error (MAE), RMSE, and R-squared",
        "K-Fold Cross-Validation and hyperparameter tuning with GridSearchCV",
        "Building reusable Scikit-Learn end-to-end data processing Pipelines"
      ],
      "resources": [
        {
          "title": "Scikit-Learn Pipelines & Tuning Guide",
          "url": "https://scikit-learn.org/stable/modules/compose.html",
          "type": "Docs"
        },
        {
          "title": "Kaggle Intermediate Machine Learning",
          "url": "https://www.kaggle.com/learn/intermediate-machine-learning",
          "type": "Course"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Neural Networks & Deep Learning with PyTorch",
      "details": [
        "Perceptrons, multi-layer artificial neural networks (ANN), and activation functions (ReLU, Sigmoid)",
        "Forward propagation, cross-entropy loss calculation, and backpropagation gradients",
        "PyTorch fundamentals: Tensors, autograd, nn.Module, and Dataset/DataLoader classes",
        "Train an image classification neural network on the Fashion-MNIST dataset"
      ],
      "resources": [
        {
          "title": "PyTorch Official Beginner Tutorials",
          "url": "https://pytorch.org/tutorials/beginner/basics/intro.html",
          "type": "Docs"
        },
        {
          "title": "3Blue1Brown Neural Networks Series",
          "url": "https://www.3blue1brown.com/topics/neural-networks",
          "type": "Video"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Natural Language Processing & Transformers",
      "details": [
        "Text tokenization, word embeddings (Word2Vec), and sentiment classification",
        "Transformer architecture overview: self-attention mechanism and multi-head attention",
        "Using Hugging Face Transformers library for zero-shot text classification and summarization",
        "Building a semantic vector search system using sentence embeddings"
      ],
      "resources": [
        {
          "title": "Hugging Face NLP Course",
          "url": "https://huggingface.co/learn/nlp-course",
          "type": "Course"
        },
        {
          "title": "Jay Alammar: The Illustrated Transformer",
          "url": "https://jalammar.github.io/illustrated-transformer/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Production ML Project & Streamlit Deployment",
      "details": [
        "Select a real-world predictive modeling problem and define business metrics",
        "Train, fine-tune, and evaluate an ML/DL model with versioning",
        "Package the inference pipeline into an interactive Streamlit or Gradio web app",
        "Deploy the web application to Streamlit Community Cloud and document key findings"
      ],
      "resources": [
        {
          "title": "Streamlit Official Quick Start Guide",
          "url": "https://docs.streamlit.io/get-started",
          "type": "Tutorial"
        },
        {
          "title": "Papers with Code Datasets & Benchmarks",
          "url": "https://paperswithcode.com/datasets",
          "type": "Datasets"
        }
      ]
    }
  ],
  "python": [
    {
      "week": "Week 1",
      "topic": "Python Core Syntax, Data Structures & Logic",
      "details": [
        "Python variables, dynamic typing, type hints, and conditional logic",
        "Lists, tuples, dictionaries, and sets: methods, lookups, and memory characteristics",
        "List comprehensions and dictionary comprehensions for clean expressions",
        "Functions: args, kwargs, default arguments, and lambda functions"
      ],
      "resources": [
        {
          "title": "Official Python Tutorial",
          "url": "https://docs.python.org/3/tutorial/",
          "type": "Docs"
        },
        {
          "title": "Real Python: Python Basics Guide",
          "url": "https://realpython.com/python-basics/",
          "type": "Guide"
        }
      ]
    },
    {
      "week": "Week 2",
      "topic": "Object-Oriented Python & Functional Patterns",
      "details": [
        "Classes, __init__ constructor, instance attributes, and class attributes",
        "Inheritance, method overriding, and super() calling",
        "Dunder/magic methods (__str__, __repr__, __len__, __getitem__)",
        "Custom decorators, generator functions, and the yield keyword"
      ],
      "resources": [
        {
          "title": "Real Python: Object-Oriented Programming (OOP)",
          "url": "https://realpython.com/python3-object-oriented-programming/",
          "type": "Guide"
        },
        {
          "title": "Python Decorators Explained Step by Step",
          "url": "https://realpython.com/primer-on-python-decorators/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 3",
      "topic": "File I/O, Error Handling & Virtual Environments",
      "details": [
        "File handling with context managers (with open() as f) for JSON, CSV, and text",
        "Exception hierarchy, try/except/finally blocks, and custom exceptions",
        "Virtual environments management with venv, pip, and requirements.txt",
        "Web scraping using Requests and BeautifulSoup with rate-limiting"
      ],
      "resources": [
        {
          "title": "Python Virtual Environments Primer",
          "url": "https://realpython.com/python-virtual-environments-a-primer/",
          "type": "Guide"
        },
        {
          "title": "BeautifulSoup Web Scraping Tutorial",
          "url": "https://realpython.com/beautiful-soup-web-scraper-python/",
          "type": "Tutorial"
        }
      ]
    },
    {
      "week": "Week 4",
      "topic": "Data Analysis with Pandas & Visualization",
      "details": [
        "NumPy array creation, broadcasting, and vectorized numerical operations",
        "Pandas DataFrames: data cleaning, filtering, sorting, and handling missing data (NaN)",
        "GroupBy aggregations, pivot tables, and merging multiple datasets",
        "Data visualization using Matplotlib and Seaborn for statistical insights"
      ],
      "resources": [
        {
          "title": "Pandas Official Getting Started Tutorials",
          "url": "https://pandas.pydata.org/docs/getting_started/index.html",
          "type": "Docs"
        },
        {
          "title": "Kaggle: Pandas Micro-Course",
          "url": "https://www.kaggle.com/learn/pandas",
          "type": "Course"
        }
      ]
    },
    {
      "week": "Week 5",
      "topic": "Modern Web API Development with FastAPI",
      "details": [
        "FastAPI framework introduction and asynchronous path operations (async def)",
        "Pydantic models for request validation and response schemas",
        "Database connections with SQLAlchemy and SQLite/PostgreSQL",
        "Interactive OpenAPI/Swagger documentation testing"
      ],
      "resources": [
        {
          "title": "FastAPI Official Step-by-Step Tutorial",
          "url": "https://fastapi.tiangolo.com/tutorial/",
          "type": "Docs"
        },
        {
          "title": "SQLAlchemy 2.0 Unified Tutorial",
          "url": "https://docs.sqlalchemy.org/en/20/tutorial/",
          "type": "Docs"
        }
      ]
    },
    {
      "week": "Week 6",
      "topic": "Automated Testing, Packaging & Deployment",
      "details": [
        "Unit testing and test fixtures with PyTest",
        "Structuring modular Python packages with pyproject.toml",
        "Formatting and linting with Black, Flake8, and Ruff",
        "Deploying a containerized FastAPI application to Render or AWS"
      ],
      "resources": [
        {
          "title": "PyTest Official Documentation",
          "url": "https://docs.pytest.org/",
          "type": "Docs"
        },
        {
          "title": "Packaging Python Projects Guide",
          "url": "https://packaging.python.org/en/latest/tutorials/packaging-projects/",
          "type": "Guide"
        }
      ]
    }
  ]
};
export default TECH_ROADMAPS;
