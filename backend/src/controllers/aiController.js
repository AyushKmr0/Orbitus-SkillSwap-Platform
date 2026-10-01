import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';
import Roadmap from '../models/Roadmap.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

let geminiClient = null;

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

const callMultiAiProvider = async ({ provider, apiKey, prompt }) => {
  const selectedProvider = (provider || 'gemini').toLowerCase();
  
  if (selectedProvider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  if (selectedProvider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert curriculum architect. Return ONLY valid JSON array with no extra markdown formatting or conversational commentary.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return data.choices[0]?.message?.content || '';
  }

  if (selectedProvider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert curriculum architect. Return ONLY valid JSON array with no extra markdown formatting or conversational commentary.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return data.choices[0]?.message?.content || '';
  }

  if (selectedProvider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 3000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic Claude API error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return data.content[0]?.text || '';
  }

  throw new Error(`Unsupported AI provider: ${selectedProvider}`);
};



// Comprehensive high-quality curricula covering diverse domains (tech, creative, soft skills, wellness, finance)
const FALLBACK_ROADMAPS = {
  dsa: [
    {
      week: 'Week 1',
      topic: 'Big-O Analysis, Arrays & Two Pointers',
      details: [
        'Master Big-O time and space complexity analysis with practical examples',
        'Solve array manipulation problems: Two Sum, Three Sum, and Container With Most Water',
        'Implement the Sliding Window pattern for substring and subarray problems',
        'Solve 12 curated LeetCode Easy & Medium problems'
      ],
      resources: [
        { title: 'NeetCode 150 - Arrays & Hashing Roadmap', url: 'https://neetcode.io/roadmap', type: 'Practice' },
        { title: 'Striver A2Z DSA Course: Arrays & Big-O', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', type: 'Course' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'HashMaps, Fast-Slow Pointers & Linked Lists',
      details: [
        'Hash table internal bucket collision resolution and amortized O(1) operations',
        'Implement singly and doubly linked list reversals and middle-node detection',
        'Fast & Slow pointer pattern: Linked List Cycle and Happy Number',
        'Solve LRU Cache design problem and Merge Two Sorted Lists'
      ],
      resources: [
        { title: 'LeetCode Explore: Linked List Mastery', url: 'https://leetcode.com/explore/learn/card/linked-list/', type: 'Tutorial' },
        { title: 'Abdul Bari: Linked List Operations Explained', url: 'https://www.youtube.com/results?search_query=abdul+bari+linked+list', type: 'Video' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Stacks, Queues & Monotonic Patterns',
      details: [
        'Implement stack with array and dynamic memory, valid parentheses checker',
        'Monotonic Stack technique: Next Greater Element and Daily Temperatures',
        'Queue implementations: Circular Queue and Breadth-First Queue mechanics',
        'Solve Min Stack and Evaluate Reverse Polish Notation'
      ],
      resources: [
        { title: 'NeetCode Stacks & Monotonic Queue Guide', url: 'https://neetcode.io/practice', type: 'Practice' },
        { title: 'GeeksforGeeks Stack Data Structure', url: 'https://www.geeksforgeeks.org/stack-data-structure/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Binary Search, Recursion & Backtracking',
      details: [
        'Modified binary search on rotated sorted arrays and search in 2D matrices',
        'Master the Recursion Tree mental model and call stack memory tracing',
        'Backtracking template: Subsets, Permutations, and Combination Sum',
        'Solve N-Queens or Word Search puzzle with prune conditions'
      ],
      resources: [
        { title: 'LeetCode Binary Search Study Plan', url: 'https://leetcode.com/studyplan/binary-search/', type: 'Study Plan' },
        { title: 'Backtracking Recursion Deep Dive', url: 'https://takeuforward.org/recursion/strivers-recursion-series-notes/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Binary Trees, BST & Graph Traversals',
      details: [
        'Binary tree DFS traversals (Inorder, Preorder, Postorder) and BFS Level-Order',
        'Lowest Common Ancestor and Maximum Depth of Binary Tree',
        'Graph representation with Adjacency List and BFS/DFS graph traversals',
        'Detect cycle in directed and undirected graphs (Kahn’s algorithm & topological sort)'
      ],
      resources: [
        { title: 'Striver Graph Series (BFS, DFS, Dijkstra)', url: 'https://takeuforward.org/graphs/graph-data-structure-all-traversals/', type: 'Course' },
        { title: 'NeetCode Trees & Binary Search Tree Patterns', url: 'https://neetcode.io/practice', type: 'Video' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Dynamic Programming & Mock Technical Rounds',
      details: [
        '1D Dynamic Programming: Climbing Stairs, House Robber, and Coin Change',
        '2D Dynamic Programming: Longest Common Subsequence & 0/1 Knapsack',
        'Identify overlapping subproblems and optimal substructure (Memoization vs Tabulation)',
        'Conduct a timed 45-minute technical peer interview on Orbitus'
      ],
      resources: [
        { title: 'Tech Interview Handbook - DSA Best Practices', url: 'https://www.techinterviewhandbook.org/coding-interview-study-plan/', type: 'Guide' },
        { title: 'NeetCode Dynamic Programming Masterclass', url: 'https://neetcode.io/roadmap', type: 'Practice' }
      ]
    }
  ],
  javascript: [
    {
      week: 'Week 1',
      topic: 'JS Engine, Scopes, Hoisting & Closures',
      details: [
        'How V8 executes code: Call Stack, Memory Heap, and Execution Contexts',
        'Variable declarations: var vs let/const, Temporal Dead Zone, and Block Scope',
        'Deep dive into Closures: data privacy, function factories, and memoization',
        'Understanding "this" binding: default, implicit, explicit (call/apply/bind), and arrow functions'
      ],
      resources: [
        { title: 'JavaScript.info: Code Quality & Closures', url: 'https://javascript.info/closure', type: 'Docs' },
        { title: 'MDN Web Docs: JavaScript Execution Context', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Asynchronous JS & The Event Loop',
      details: [
        'Event Loop anatomy: Microtask Queue vs Macrotask Callback Queue',
        'Promises from scratch: states, chaining, and error propagation',
        'Async/Await syntax, parallel execution with Promise.all vs Promise.allSettled',
        'Build a custom retry mechanism for unreliable API calls'
      ],
      resources: [
        { title: 'Philip Roberts: What the heck is the event loop?', url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ', type: 'Video' },
        { title: 'JavaScript.info: Promises & Async/Await', url: 'https://javascript.info/async', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Prototypal Inheritance, ES6+ & Collections',
      details: [
        'Prototypes and prototype chain (__proto__ vs prototype property)',
        'ES6 Classes, inheritance, super(), getters, setters, and static methods',
        'Destructuring, spread/rest, optional chaining (?.), and nullish coalescing (??)',
        'Map, Set, WeakMap, WeakSet use-cases and garbage collection implications'
      ],
      resources: [
        { title: 'MDN: Inheritance and the prototype chain', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain', type: 'Docs' },
        { title: 'Modern JavaScript Features Reference', url: 'https://javascript.info/classes', type: 'Guide' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'DOM Engine, Event Bubbling & Performance',
      details: [
        'DOM tree traversal, document fragments, and efficient bulk node insertions',
        'Event bubbling, capturing phase, and high-performance Event Delegation',
        'Implement Debounce and Throttle utilities from scratch for scroll and search inputs',
        'Intersection Observer API for lazy loading images and infinite scroll'
      ],
      resources: [
        { title: 'MDN: Introduction to the DOM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', type: 'Docs' },
        { title: 'Web Dev Simplified: Event Bubbling & Delegation', url: 'https://www.youtube.com/results?search_query=web+dev+simplified+event+bubbling', type: 'Video' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Network Requests, Storage & Clean Architecture',
      details: [
        'Fetch API with custom headers, AbortController for cancelable requests, and timeout handling',
        'LocalStorage, SessionStorage, and secure HTTP-only cookie patterns',
        'Modular architecture: ES Modules (import/export), dependency management, and separation of concerns',
        'Unit testing pure JavaScript utility functions with Vitest'
      ],
      resources: [
        { title: 'JavaScript.info: Network Requests & Fetch', url: 'https://javascript.info/network', type: 'Docs' },
        { title: 'Vitest Official Getting Started', url: 'https://vitest.dev/guide/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Full Vanilla JS Production Project',
      details: [
        'Architect and build an interactive Trello/Kanban Board using only native Vanilla JS',
        'Implement drag-and-drop using HTML5 Drag & Drop API',
        'Persist boards in LocalStorage with state re-hydration',
        'Deploy cleanly to Vercel/GitHub Pages with zero external UI libraries'
      ],
      resources: [
        { title: 'The Modern JavaScript Tutorial - Capstone Guide', url: 'https://javascript.info/', type: 'Guide' },
        { title: 'Vite Vanilla JS Setup Guide', url: 'https://vitejs.dev/guide/', type: 'Docs' }
      ]
    }
  ],
  react: [
    {
      week: 'Week 1',
      topic: 'React Mental Model, JSX & Tooling',
      details: [
        'Set up modern React 18+ with Vite and understand JSX transformation',
        'Deconstruct UI into small, composable, single-responsibility components',
        'Props passing, default values, children prop patterns, and strict typing',
        'Build a multi-card responsive product catalog'
      ],
      resources: [
        { title: 'React.dev Official Tutorial: Quick Start', url: 'https://react.dev/learn', type: 'Docs' },
        { title: 'Vite React Setup Guide', url: 'https://vitejs.dev/guide/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'State Management, Events & Re-renders',
      details: [
        'useState hook mechanics, state batching, and updater functions',
        'Handling forms, controlled vs uncontrolled inputs, and validation',
        'Lifting state up and understanding when and why components re-render',
        'Avoid common state mutation bugs and array/object immutability patterns'
      ],
      resources: [
        { title: 'React.dev: Managing State Like a Pro', url: 'https://react.dev/learn/managing-state', type: 'Docs' },
        { title: 'React Event Handling Best Practices', url: 'https://react.dev/learn/responding-to-events', type: 'Guide' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Side Effects, Data Fetching & Custom Hooks',
      details: [
        'useEffect dependency arrays, cleanup functions, and avoiding infinite loops',
        'Fetching API data with loading, error, and cached states',
        'Extract reusable logic into clean custom hooks (useFetch, useDebounce, useLocalStorage)',
        'React Hook Form setup for streamlined form handling'
      ],
      resources: [
        { title: 'React.dev: Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects', type: 'Docs' },
        { title: 'Custom React Hooks Guide', url: 'https://usehooks.com/', type: 'Code Examples' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Routing, Context & Global State',
      details: [
        'React Router v6: nested routes, dynamic URL parameters, and loaders',
        'Protected route wrappers for authenticated user dashboards',
        'React Context API for theme switching and user session state',
        'When to introduce Redux Toolkit or Zustand for complex app state'
      ],
      resources: [
        { title: 'React Router v6 Official Tutorial', url: 'https://reactrouter.com/en/main/start/tutorial', type: 'Tutorial' },
        { title: 'Zustand State Management Docs', url: 'https://docs.pmnd.rs/zustand/getting-started/introduction', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Performance, Memoization & Component Testing',
      details: [
        'Profile re-renders using React DevTools Profiler',
        'Strategic use of useMemo and useCallback to preserve referential equality',
        'Code splitting with React.lazy and Suspense for fast initial bundle loads',
        'Unit test components with React Testing Library and Vitest'
      ],
      resources: [
        { title: 'Optimizing React Performance - React.dev', url: 'https://react.dev/reference/react/useMemo', type: 'Docs' },
        { title: 'React Testing Library Quick Start', url: 'https://testing-library.com/docs/react-testing-library/intro/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Full-Scale Dashboard Project & Cloud Deployment',
      details: [
        'Build a production-grade Analytics Dashboard with charts and live filters',
        'Connect real REST endpoints with JWT cookie authentication',
        'Ensure 100% responsive design with Tailwind CSS and dark/light theme support',
        'Deploy production bundle on Vercel with environment variable configuration'
      ],
      resources: [
        { title: 'Deploying Modern React Apps to Vercel', url: 'https://vercel.com/docs/deployments', type: 'Guide' },
        { title: 'Tailwind CSS Component System', url: 'https://tailwindcss.com/docs', type: 'Docs' }
      ]
    }
  ],
  mern: [
    {
      week: 'Week 1',
      topic: 'HTML5, Modern CSS Layouts & Responsive UI',
      details: [
        'Master Flexbox alignment and CSS Grid two-dimensional layout systems',
        'Mobile-first responsive design breakpoints and fluid typography',
        'Semantic HTML5 markup and accessibility (a11y) standards',
        'Build a multi-page responsive landing page from a Figma design'
      ],
      resources: [
        { title: 'MDN Web Docs HTML/CSS Guides', url: 'https://developer.mozilla.org/en-US/docs/Learn', type: 'Docs' },
        { title: 'CSS-Tricks: Complete Guide to Flexbox & Grid', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Modern JavaScript & Frontend State with React',
      details: [
        'ES6+ syntax, Promises, async/await, and Fetch API',
        'React component tree, props, useState, and useEffect hooks',
        'React Router navigation and client-side page transitions',
        'Connecting frontend components to mock API services'
      ],
      resources: [
        { title: 'React Official Documentation', url: 'https://react.dev/', type: 'Docs' },
        { title: 'JavaScript.info Interactive Guide', url: 'https://javascript.info/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Node.js Runtime & Express REST API Architecture',
      details: [
        'Node.js architecture, non-blocking I/O, and npm package ecosystem',
        'Express server setup, RESTful route design, and controller structuring',
        'Request/Response lifecycle and custom middleware (logging, error handling)',
        'Input validation and sanitization using express-validator'
      ],
      resources: [
        { title: 'Express.js Official Guide', url: 'https://expressjs.com/en/starter/installing.html', type: 'Docs' },
        { title: 'Node.js Official Documentation', url: 'https://nodejs.org/en/docs/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'MongoDB, Mongoose Schemas & Aggregations',
      details: [
        'MongoDB Atlas setup, database connections, and connection pooling',
        'Mongoose Schema modeling, data types, validators, and virtual properties',
        'CRUD operations, referencing vs embedding documents, and populate()',
        'Write aggregation pipelines for search filtering, pagination, and sorting'
      ],
      resources: [
        { title: 'MongoDB University Free Developer Courses', url: 'https://learn.mongodb.com/', type: 'Course' },
        { title: 'Mongoose Official Documentation', url: 'https://mongoosejs.com/docs/guide.html', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Authentication, Security & File Uploads',
      details: [
        'Bcrypt password hashing and JSON Web Token (JWT) generation',
        'Protected API route middleware and role-based access control (Admin/User)',
        'HTTP-only secure cookies vs Authorization Bearer header tokens',
        'Image uploads using Multer and Cloudinary cloud storage integration'
      ],
      resources: [
        { title: 'JWT.io Guide to JSON Web Tokens', url: 'https://jwt.io/introduction', type: 'Docs' },
        { title: 'Cloudinary Node.js Upload Integration', url: 'https://cloudinary.com/documentation/node_integration', type: 'Docs' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Full-Stack Integration, Testing & Deployment',
      details: [
        'Connect React frontend with Express backend using Axios client with interceptors',
        'Global state management with Redux Toolkit or Context API',
        'Environment variable configuration for staging and production',
        'Deploy backend to Render/Railway and frontend to Vercel with custom domain'
      ],
      resources: [
        { title: 'Full Stack Open - University of Helsinki', url: 'https://fullstackopen.com/en/', type: 'Course' },
        { title: 'Render Deployment Documentation', url: 'https://render.com/docs', type: 'Docs' }
      ]
    }
  ],
  python: [
    {
      week: 'Week 1',
      topic: 'Python Core Syntax, Data Structures & Logic',
      details: [
        'Python variables, dynamic typing, type hints, and conditional logic',
        'Lists, tuples, dictionaries, and sets: methods, lookups, and memory characteristics',
        'List comprehensions and dictionary comprehensions for clean expressions',
        'Functions: args, kwargs, default arguments, and lambda functions'
      ],
      resources: [
        { title: 'Official Python Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'Docs' },
        { title: 'Real Python: Python Basics Guide', url: 'https://realpython.com/python-basics/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Object-Oriented Python & Functional Patterns',
      details: [
        'Classes, __init__ constructor, instance attributes, and class attributes',
        'Inheritance, method overriding, and super() calling',
        'Dunder/magic methods (__str__, __repr__, __len__, __getitem__)',
        'Custom decorators, generator functions, and the yield keyword'
      ],
      resources: [
        { title: 'Real Python: Object-Oriented Programming (OOP)', url: 'https://realpython.com/python3-object-oriented-programming/', type: 'Guide' },
        { title: 'Python Decorators Explained Step by Step', url: 'https://realpython.com/primer-on-python-decorators/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'File I/O, Error Handling & Virtual Environments',
      details: [
        'File handling with context managers (with open() as f) for JSON, CSV, and text',
        'Exception hierarchy, try/except/finally blocks, and custom exceptions',
        'Virtual environments management with venv, pip, and requirements.txt',
        'Web scraping using Requests and BeautifulSoup with rate-limiting'
      ],
      resources: [
        { title: 'Python Virtual Environments Primer', url: 'https://realpython.com/python-virtual-environments-a-primer/', type: 'Guide' },
        { title: 'BeautifulSoup Web Scraping Tutorial', url: 'https://realpython.com/beautiful-soup-web-scraper-python/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Data Analysis with Pandas & Visualization',
      details: [
        'NumPy array creation, broadcasting, and vectorized numerical operations',
        'Pandas DataFrames: data cleaning, filtering, sorting, and handling missing data (NaN)',
        'GroupBy aggregations, pivot tables, and merging multiple datasets',
        'Data visualization using Matplotlib and Seaborn for statistical insights'
      ],
      resources: [
        { title: 'Pandas Official Getting Started Tutorials', url: 'https://pandas.pydata.org/docs/getting_started/index.html', type: 'Docs' },
        { title: 'Kaggle: Pandas Micro-Course', url: 'https://www.kaggle.com/learn/pandas', type: 'Course' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Modern Web API Development with FastAPI',
      details: [
        'FastAPI framework introduction and asynchronous path operations (async def)',
        'Pydantic models for request validation and response schemas',
        'Database connections with SQLAlchemy and SQLite/PostgreSQL',
        'Interactive OpenAPI/Swagger documentation testing'
      ],
      resources: [
        { title: 'FastAPI Official Step-by-Step Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', type: 'Docs' },
        { title: 'SQLAlchemy 2.0 Unified Tutorial', url: 'https://docs.sqlalchemy.org/en/20/tutorial/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Automated Testing, Packaging & Deployment',
      details: [
        'Unit testing and test fixtures with PyTest',
        'Structuring modular Python packages with pyproject.toml',
        'Formatting and linting with Black, Flake8, and Ruff',
        'Deploying a containerized FastAPI application to Render or AWS'
      ],
      resources: [
        { title: 'PyTest Official Documentation', url: 'https://docs.pytest.org/', type: 'Docs' },
        { title: 'Packaging Python Projects Guide', url: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/', type: 'Guide' }
      ]
    }
  ],
  aiMl: [
    {
      week: 'Week 1',
      topic: 'Python Math Stack & Exploratory Data Analysis',
      details: [
        'NumPy vectorization, matrix dot products, and broadcasting mechanics',
        'Pandas DataFrame manipulation, imputation, and outlier detection',
        'Practical math foundations: linear algebra, multivariable calculus gradients, and probability',
        'Exploratory Data Analysis (EDA) report on a real Kaggle dataset'
      ],
      resources: [
        { title: '3Blue1Brown Linear Algebra Visual Series', url: 'https://www.3blue1brown.com/topics/linear-algebra', type: 'Video Series' },
        { title: 'Kaggle Python & Pandas Hands-on Courses', url: 'https://www.kaggle.com/learn/pandas', type: 'Course' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Feature Engineering & Classical Machine Learning',
      details: [
        'Data preprocessing: StandardScaler, OneHotEncoder, and train/test splits',
        'Supervised learning: Linear Regression, Logistic Regression, and Decision Trees',
        'Overfitting vs underfitting, bias-variance tradeoff, and L1/L2 Regularization',
        'Ensemble methods: Random Forest and XGBoost gradient boosting'
      ],
      resources: [
        { title: 'Scikit-Learn Official User Guide', url: 'https://scikit-learn.org/stable/user_guide.html', type: 'Docs' },
        { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'Course' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Model Evaluation, Cross-Validation & Pipelines',
      details: [
        'Classification metrics: Confusion Matrix, Precision, Recall, F1-Score, and ROC-AUC',
        'Regression metrics: Mean Absolute Error (MAE), RMSE, and R-squared',
        'K-Fold Cross-Validation and hyperparameter tuning with GridSearchCV',
        'Building reusable Scikit-Learn end-to-end data processing Pipelines'
      ],
      resources: [
        { title: 'Scikit-Learn Pipelines & Tuning Guide', url: 'https://scikit-learn.org/stable/modules/compose.html', type: 'Docs' },
        { title: 'Kaggle Intermediate Machine Learning', url: 'https://www.kaggle.com/learn/intermediate-machine-learning', type: 'Course' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Neural Networks & Deep Learning with PyTorch',
      details: [
        'Perceptrons, multi-layer artificial neural networks (ANN), and activation functions (ReLU, Sigmoid)',
        'Forward propagation, cross-entropy loss calculation, and backpropagation gradients',
        'PyTorch fundamentals: Tensors, autograd, nn.Module, and Dataset/DataLoader classes',
        'Train an image classification neural network on the Fashion-MNIST dataset'
      ],
      resources: [
        { title: 'PyTorch Official Beginner Tutorials', url: 'https://pytorch.org/tutorials/beginner/basics/intro.html', type: 'Docs' },
        { title: '3Blue1Brown Neural Networks Series', url: 'https://www.3blue1brown.com/topics/neural-networks', type: 'Video' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Natural Language Processing & Transformers',
      details: [
        'Text tokenization, word embeddings (Word2Vec), and sentiment classification',
        'Transformer architecture overview: self-attention mechanism and multi-head attention',
        'Using Hugging Face Transformers library for zero-shot text classification and summarization',
        'Building a semantic vector search system using sentence embeddings'
      ],
      resources: [
        { title: 'Hugging Face NLP Course', url: 'https://huggingface.co/learn/nlp-course', type: 'Course' },
        { title: 'Jay Alammar: The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Production ML Project & Streamlit Deployment',
      details: [
        'Select a real-world predictive modeling problem and define business metrics',
        'Train, fine-tune, and evaluate an ML/DL model with versioning',
        'Package the inference pipeline into an interactive Streamlit or Gradio web app',
        'Deploy the web application to Streamlit Community Cloud and document key findings'
      ],
      resources: [
        { title: 'Streamlit Official Quick Start Guide', url: 'https://docs.streamlit.io/get-started', type: 'Tutorial' },
        { title: 'Papers with Code Datasets & Benchmarks', url: 'https://paperswithcode.com/datasets', type: 'Datasets' }
      ]
    }
  ],
  design: [
    {
      week: 'Week 1',
      topic: 'Visual Design Foundations, Hierarchy & Typography',
      details: [
        'Understand typographic scale, line-height, kerning, and font pairing rules',
        'Visual hierarchy, 8pt spatial grid systems, and effective whitespace utilization',
        'Color psychology, 60-30-10 color distribution rule, and contrast accessibility (WCAG AA)',
        'Deconstruct 3 industry-leading application interfaces and analyze their layout decisions'
      ],
      resources: [
        { title: 'Refactoring UI - Visual Hierarchy Guide', url: 'https://www.refactoringui.com/', type: 'Book/Guide' },
        { title: 'Google Material Design 3 Foundations', url: 'https://m3.material.io/foundations', type: 'Docs' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Figma Mastery: Frames, Auto Layout & Vectors',
      details: [
        'Frames vs groups, vector pen tool editing, and precise curve manipulation',
        'Mastering Auto Layout: padding, gap, hugging, filling, and wrapping responsive containers',
        'Creating scalable reusable master components and component variants',
        'Designing a pixel-perfect, fully responsive mobile navigation bar and hero section'
      ],
      resources: [
        { title: 'Figma Official Auto Layout Deep Dive', url: 'https://help.figma.com/hc/en-us/articles/360040451373', type: 'Tutorial' },
        { title: 'Figma Component Properties Masterclass', url: 'https://help.figma.com/hc/en-us/articles/5579474826519', type: 'Docs' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'User Research, Information Architecture & Wireframing',
      details: [
        'Conducting lightweight user interviews and creating evidence-based User Personas',
        'Information architecture: sitemaps, user task flows, and journey mapping',
        'Low-fidelity wireframing to test UX logic before visual styling',
        'Applying Nielsen Norman’s 10 Usability Heuristics to evaluate usability friction'
      ],
      resources: [
        { title: 'Nielsen Norman Group: 10 Usability Heuristics', url: 'https://www.nngroup.com/articles/ten-usability-heuristics/', type: 'Article' },
        { title: 'UX Design Wireframing Best Practices', url: 'https://uxdesign.cc/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Design Systems & Component Libraries',
      details: [
        'Structuring atomic design tokens: Colors, Typography scales, Spacing, and Shadows',
        'Designing interactive component sets: buttons (Primary, Secondary, Ghost, Disabled), inputs, modals',
        'Creating adaptive components with Figma Variables (Dark Mode / Light Mode switching)',
        'Documenting component usage guidelines for smooth frontend developer handoff'
      ],
      resources: [
        { title: 'Design Systems Handbook by InVision', url: 'https://www.designbetter.co/design-systems-handbook', type: 'Book' },
        { title: 'Figma Variables & Modes Guide', url: 'https://help.figma.com/hc/en-us/articles/15339657135383', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'High-Fidelity Prototyping & Micro-Interactions',
      details: [
        'Connecting multi-screen interactive prototypes with triggers, delays, and conditions',
        'Smart Animate transitions for smooth sliding drawers, toggles, and state changes',
        'Conducting a moderated usability test with 3 real users on your prototype',
        'Synthesizing usability feedback into an iterative design revision matrix'
      ],
      resources: [
        { title: 'Figma Prototyping Best Practices', url: 'https://help.figma.com/hc/en-us/articles/360040314193', type: 'Docs' },
        { title: 'Micro-Interactions Design Principles', url: 'https://www.nngroup.com/articles/microinteractions/', type: 'Article' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Case Study Writing & Portfolio Presentation',
      details: [
        'Structure a comprehensive UX Case Study: Problem, Hypothesis, Research, Iterations, Outcome',
        'Prepare realistic 3D mockups and presentation slides using Figma plugins',
        'Publish the case study on Behance, Dribbble, or personal portfolio website',
        'Deliver a 10-minute design walkthrough to learning peers on Orbitus'
      ],
      resources: [
        { title: 'How to Write a Stellar UX Case Study', url: 'https://uxdesign.cc/how-to-write-a-ux-case-study-8da90326079e', type: 'Article' },
        { title: 'Behance Portfolio Inspiration', url: 'https://www.behance.net/', type: 'Portfolio' }
      ]
    }
  ],
  fitness: [
    {
      week: 'Week 1',
      topic: 'Biomechanics, Posture & Movement Patterns',
      details: [
        'Master the fundamental movement patterns: Squat, Hip Hinge, Push, Pull, Carry',
        'Core bracing mechanics, pelvic tilt alignment, and intra-abdominal breathing',
        'Baseline mobility assessment for ankles, hips, and thoracic spine',
        'Establish an initial 3-day full-body or Push/Pull/Legs training split'
      ],
      resources: [
        { title: 'Renaissance Periodization: Hypertrophy Basics', url: 'https://rpstrength.com/blogs/articles', type: 'Guide' },
        { title: 'Stronger by Science: Fundamental Movement Patterns', url: 'https://www.strongerbyscience.com/guides/', type: 'Article' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Progressive Overload & Volume Tracking',
      details: [
        'Understanding stimulus variables: Intensity, Sets, Reps, and Repetitions in Reserve (RIR)',
        'Methods of progressive overload: weight progression, volume increase, and tempo control',
        'Setting up a systematic digital workout log to track weekly progress',
        'Executing proper warm-up sets and dynamic mobility drills prior to heavy lifting'
      ],
      resources: [
        { title: 'Jeff Nippard: Science of Progressive Overload', url: 'https://www.youtube.com/results?search_query=jeff+nippard+progressive+overload', type: 'Video' },
        { title: 'Examine.com: Exercise Science Evidence', url: 'https://examine.com/', type: 'Research' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Nutrition Science & Macronutrient Balance',
      details: [
        'Calculating Total Daily Energy Expenditure (TDEE) and target caloric surplus/deficit',
        'Protein intake targets (1.6g to 2.2g per kg of bodyweight) for muscle synthesis',
        'Carbohydrate timing around workouts for glycogen replenishment and sustained energy',
        'Hydration, micronutrients, electrolytes, and healthy fatty acid distribution'
      ],
      resources: [
        { title: 'Precision Nutrition: Macro & Calorie Calculator', url: 'https://www.precisionnutrition.com/nutrition-calculator', type: 'Tool' },
        { title: 'Examine.com: Optimal Protein Intake Evidence', url: 'https://examine.com/nutrition/protein-intake-calculator/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Recovery Physiology & Sleep Optimization',
      details: [
        'Sleep architecture (Deep & REM stages) and its direct role in muscle repair and growth hormone',
        'Active recovery techniques: light walking, myofascial release, and contrast therapy',
        'Identifying early signs of central nervous system (CNS) overtraining and joint inflammation',
        'Scheduling structured Deload weeks every 5-7 weeks to consolidate adaptations'
      ],
      resources: [
        { title: 'Huberman Lab: Sleep Optimization Toolkit', url: 'https://www.hubermanlab.com/toolkit/toolkit-for-sleep', type: 'Podcast/Article' },
        { title: 'National Strength and Conditioning Association Recovery Guide', url: 'https://www.nsca.com/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Cardiorespiratory Conditioning & Mobility',
      details: [
        'Zone 2 aerobic base building for mitochondrial density and cardiac output',
        'High-Intensity Interval Training (HIIT) protocol design for anaerobic threshold',
        'Integrating cardio conditioning without blunting strength and hypertrophy adaptations',
        'Daily 15-minute hip flexor and hamstring mobility routine for injury prevention'
      ],
      resources: [
        { title: 'Peter Attia: The Power of Zone 2 Exercise', url: 'https://peterattiamd.com/category/exercise/aerobic-efficiency/', type: 'Article' },
        { title: 'ACSM Cardiorespiratory Guidelines', url: 'https://www.acsm.org/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Periodization, Long-Term Habits & Peer Swap',
      details: [
        'Designing linear vs undulating periodization blocks for continuous progression',
        'Strategies for staying consistent during travel or demanding work weeks',
        'Standardized progress measurements: strength benchmarks, body metrics, and photographs',
        'Host an accountability check-in session on Orbitus to share workout milestones'
      ],
      resources: [
        { title: 'Atomic Habits for Fitness by James Clear', url: 'https://jamesclear.com/atomic-habits', type: 'Book Summary' },
        { title: 'Renaissance Periodization Training Principles', url: 'https://rpstrength.com/', type: 'Guide' }
      ]
    }
  ],
  finance: [
    {
      week: 'Week 1',
      topic: 'Cash Flow Management & Emergency Reserves',
      details: [
        'Audit all monthly income vs fixed and discretionary expenses systematically',
        'Implement the 50/30/20 budget framework (Needs, Wants, Savings/Debt)',
        'Set up a High-Yield Savings Account (HYSA) separate from everyday checking',
        'Calculate and build a resilient 3-to-6 month living expense emergency fund'
      ],
      resources: [
        { title: 'Investopedia: The 50/30/20 Rule of Thumb', url: 'https://www.investopedia.com/ask/answers/022916/what-502030-budget-rule.asp', type: 'Guide' },
        { title: 'Consumer Financial Protection Bureau Budget Tool', url: 'https://www.consumerfinance.gov/', type: 'Tool' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'High-Interest Debt Elimination & Credit Optimization',
      details: [
        'Compare Debt Avalanche (highest interest rate first) vs Debt Snowball (lowest balance first)',
        'Credit score composition: payment history (35%), credit utilization (30%), and age of credit',
        'Strategies to keep credit utilization below 10% on reporting dates',
        'Negotiating interest rate reductions with creditors and disputing credit report inaccuracies'
      ],
      resources: [
        { title: 'NerdWallet: Debt Avalanche vs Snowball Calculator', url: 'https://www.nerdwallet.com/article/finance/debt-avalanche-calculator', type: 'Tool' },
        { title: 'Khan Academy Personal Finance Series', url: 'https://www.khanacademy.org/college-careers-more/personal-finance', type: 'Course' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Stock Market Foundations & Passive Index Investing',
      details: [
        'The mathematics of compound interest and the Rule of 72',
        'Broad-market index funds (S&P 500, Total Market) vs active stock picking',
        'Understanding Expense Ratios, tracking errors, and dividend reinvestment (DRIP)',
        'Dollar-cost averaging (DCA) strategy to navigate market volatility smoothly'
      ],
      resources: [
        { title: 'The Bogleheads Guide to Investing Philosophy', url: 'https://www.bogleheads.org/wiki/Bogleheads%C2%AE_investment_philosophy', type: 'Guide' },
        { title: 'Vanguard Index Funds Educational Resource', url: 'https://investor.vanguard.com/investment-products/index-funds', type: 'Docs' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Tax-Advantaged Accounts & Retirement Planning',
      details: [
        'Differences between pre-tax and post-tax investing accounts (401k vs Roth IRA / PPF vs NPS)',
        'Maximizing employer matching contributions to capture guaranteed 100% returns',
        'Asset allocation based on investment horizon and personal risk tolerance',
        'Calculating your Financial Independence Number using the 4% safe withdrawal rule'
      ],
      resources: [
        { title: 'Investopedia: Traditional vs Roth Retirement Accounts', url: 'https://www.investopedia.com/retirement/roth-vs-traditional-ira-which-is-better/', type: 'Article' },
        { title: 'FIRE Calc: Retirement Freedom Calculator', url: 'https://firecalc.com/', type: 'Tool' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Insurance, Risk Hedging & Inflation Protection',
      details: [
        'Pure term life insurance vs permanent life insurance traps',
        'Health insurance policy analysis: deductibles, out-of-pocket maximums, and critical illness riders',
        'Hedging against monetary inflation with TIPS, Real Estate, and Sovereign Gold',
        'Recognizing fraudulent get-rich-quick schemes, Ponzi structures, and excessive margin risks'
      ],
      resources: [
        { title: 'Khan Academy: Insurance Fundamentals', url: 'https://www.khanacademy.org/college-careers-more/personal-finance/pf-insurance', type: 'Course' },
        { title: 'Investopedia: Comprehensive Risk Management Guide', url: 'https://www.investopedia.com/terms/r/riskmanagement.asp', type: 'Article' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Automated Wealth Architecture & Long-Term Plan',
      details: [
        'Set up automated payroll split transfers to execute investments immediately upon payday',
        'Establish an annual rebalancing schedule to maintain designated asset allocation',
        'Estate planning essentials: beneficiary designations, power of attorney, and digital asset wills',
        'Draft your comprehensive 5-Year Financial Roadmap and share insights with Orbitus peers'
      ],
      resources: [
        { title: 'The Psychology of Money by Morgan Housel', url: 'https://www.morganhousel.com/', type: 'Book Summary' },
        { title: 'Bogleheads Investment Planning Checklist', url: 'https://www.bogleheads.org/wiki/Getting_started', type: 'Guide' }
      ]
    }
  ],
  spanish: [
    {
      week: 'Week 1',
      topic: 'Pronunciation, Phonetics & Everyday Greetings',
      details: [
        'Master Spanish vowel sounds (A, E, I, O, U) and tricky consonants (RR, LL, J, C/Z)',
        'Greetings, formal vs informal introductions (Tú vs Usted), and etiquette',
        'Subject pronouns and numbers 1 through 100 for everyday transactions',
        'Record 5 audio clips introducing yourself in Spanish'
      ],
      resources: [
        { title: 'Spanish Alphabet & Pronunciation Audio', url: 'https://www.spanishdict.com/guide/spanish-alphabet-pronunciation', type: 'Audio Guide' },
        { title: 'Coffee Break Spanish: Lesson 1 & 2', url: 'https://coffeebreaklanguages.com/coffeebreakspanish/', type: 'Podcast' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Core Verbs: Ser vs Estar & Present Regulars',
      details: [
        'The foundational distinction between Ser (identity/traits) and Estar (location/state)',
        'Conjugation patterns for regular present tense verbs (-AR, -ER, -IR)',
        'Asking fundamental questions: Quién, Qué, Dónde, Cuándo, Por qué, Cómo',
        'Build 20 descriptive sentences about your daily surroundings'
      ],
      resources: [
        { title: 'Ser vs Estar Comprehensive Breakdown', url: 'https://www.spanishdict.com/guide/ser-vs-estar', type: 'Grammar Guide' },
        { title: 'SpanishDict: Regular Verb Conjugation Drills', url: 'https://www.spanishdict.com/conjugation', type: 'Practice' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Daily Routine, Food & Restaurant Interactions',
      details: [
        'Food vocabulary, ordering coffee and meals with politeness markers (Por favor, quisiera)',
        'Reflexive verbs for daily habits (levantarse, ducharse, acostarse)',
        'Essential idioms with Tener (tener hambre, tener sed, tener que + infinitive)',
        'Role-play a complete dinner order scenario with a dialogue script'
      ],
      resources: [
        { title: 'Spanish Culinary & Restaurant Survival Guide', url: 'https://www.fluentu.com/blog/spanish/spanish-restaurant-phrases/', type: 'Guide' },
        { title: 'Notes in Spanish Audio Podcast', url: 'https://www.notesinspanish.com/', type: 'Audio' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Directions, Travel, Transport & Shopping',
      details: [
        'Navigating cities: asking for directions, reading metro signs, and purchasing tickets',
        'Demonstrative adjectives (este, ese, aquel) and clothing/color vocabulary',
        'Using Gustar and similar indirect object verbs (me gusta, me encanta, me parece)',
        'Practice describing a walking route through a major city map'
      ],
      resources: [
        { title: 'Travel Spanish Survival Phrases', url: 'https://www.fluentu.com/blog/spanish/travel-spanish-phrases/', type: 'Article' },
        { title: 'SpanishDict: Gustar & Indirect Pronouns', url: 'https://www.spanishdict.com/guide/verbs-like-gustar', type: 'Guide' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Past Tense: Pretérito & Expressing Memories',
      details: [
        'Pretérito Indefinido regular endings for completed past events',
        'Irregular past verbs: Ir/Ser (fui), Tener (tuve), Hacer (hice), Estar (estuve)',
        'Time markers for past narratives (ayer, la semana pasada, hace dos años)',
        'Write a 150-word story about what you did last weekend'
      ],
      resources: [
        { title: 'SpanishDict: Preterite Tense Forms & Irregulars', url: 'https://www.spanishdict.com/guide/spanish-preterite-tense-forms', type: 'Docs' },
        { title: 'Butterfly Spanish: Past Tense Mastery', url: 'https://www.youtube.com/results?search_query=butterfly+spanish+preterite', type: 'Video' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Conversational Fluency & Live Language Exchange',
      details: [
        'Transition words to link thoughts naturally (sin embargo, además, por lo tanto)',
        'Active listening techniques for conversational Latin American and Peninsular Spanish',
        'Consuming native Spanish media: podcast comprehension and music lyric breakdowns',
        'Complete a live 20-minute video speaking session with a peer learner on Orbitus'
      ],
      resources: [
        { title: 'Radio Ambulante Spanish Audio Stories', url: 'https://radioambulante.org/', type: 'Podcast' },
        { title: 'Spanish Language Exchange Practice Topics', url: 'https://www.spanishdict.com/', type: 'Practice' }
      ]
    }
  ],
  speaking: [
    {
      week: 'Week 1',
      topic: 'Vocal Mechanics, Physiology & Stage Confidence',
      details: [
        'Understand the autonomic nervous system response to public speaking anxiety',
        'Diaphragmatic breathing techniques to steady pulse and eliminate shaky voice',
        'Vocal warm-ups: pitch modulation, resonance, articulation, and pace control',
        'Record a 2-minute baseline speech and analyze filler word frequency'
      ],
      resources: [
        { title: 'TED: Julian Treasure - How to Speak so People Want to Listen', url: 'https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen', type: 'Video' },
        { title: 'Toastmasters International Vocal Variety Guide', url: 'https://www.toastmasters.org/resources', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Speech Architecture & The 3-Act Narrative Arc',
      details: [
        'Crafting magnetic opening hooks: Story, Provocative Question, or Startling Statistic',
        'Structuring core points using the Rule of Three for maximum retention',
        'Seamless transitions between supporting evidence and anecdotes',
        'Writing a decisive, inspiring Call-to-Action (CTA) closing statement'
      ],
      resources: [
        { title: 'Harvard Business Review: The Art of Storytelling', url: 'https://hbr.org/2014/10/the-art-of-storytelling', type: 'Article' },
        { title: 'Toastmasters Speech Structure Template', url: 'https://www.toastmasters.org/resources/speech-outline-worksheet', type: 'Tool' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Body Language, Eye Contact & Stage Presence',
      details: [
        'The lighthouse technique for natural, deliberate eye contact across an audience',
        'Open posture, purposeful hand gestures, and avoiding defensive body stances',
        'Strategic stage movement: stepping forward on key points and holding ground',
        'Eliminating unconscious nervous ticks and pacing habits'
      ],
      resources: [
        { title: 'Amy Cuddy: Your Body Language May Shape Who You Are', url: 'https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are', type: 'Video' },
        { title: 'HBR: How to Command a Room with Presence', url: 'https://hbr.org/2019/09/how-to-command-a-room', type: 'Article' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Slide Design & Presentation Zen Principles',
      details: [
        'The 10/20/30 rule of presentations by Guy Kawasaki',
        'Removing bullet-point clutter: replacing walls of text with bold visual anchors',
        'Data storytelling: guiding audience focus on complex graphs and charts',
        'Rehearsing with slides without ever turning your back to read the screen'
      ],
      resources: [
        { title: 'Presentation Zen Principles by Garr Reynolds', url: 'https://www.presentationzen.com/', type: 'Book/Guide' },
        { title: 'Guy Kawasaki 10/20/30 Rule of PowerPoint', url: 'https://guykawasaki.com/the_102030_rule/', type: 'Article' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Impromptu Speaking & Handling Tough Q&A',
      details: [
        'The PREP framework for impromptu responses: Point, Reason, Example, Point',
        'Active listening techniques and pausing deliberately before answering questions',
        'Handling hostile, skeptical, or off-topic audience questions with composure',
        'The art of bridging: pivoting back to core message themes smoothly'
      ],
      resources: [
        { title: 'Stanford GSB: Think Fast, Talk Smart - Impromptu Speaking', url: 'https://www.youtube.com/watch?v=HAnw168huqA', type: 'Video Workshop' },
        { title: 'Toastmasters Table Topics Guide', url: 'https://www.toastmasters.org/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Deliver Signature Keynote & Peer Evaluation',
      details: [
        'Rehearse a full 7-to-10 minute signature talk with complete timing constraints',
        'Self-critique video recording using structured Toastmasters evaluation rubrics',
        'Deliver your presentation live in an Orbitus video session to fellow members',
        'Incorporate constructive peer critique to finalize your signature talk deck'
      ],
      resources: [
        { title: 'Toastmasters Evaluation & Feedback Rubrics', url: 'https://www.toastmasters.org/resources', type: 'Tool' },
        { title: 'TED Masterclass Speaking Principles', url: 'https://masterclass.ted.com/', type: 'Guide' }
      ]
    }
  ],
  music: [
    {
      week: 'Week 1',
      topic: 'Instrument Anatomy, Posture & First Open Chords',
      details: [
        'Proper sitting posture, thumb positioning behind the neck, and fret hand alignment',
        'Standard tuning procedure using an electronic tuner or frequency app',
        'Master your first three open chords: Em, C major, and G major with clean tone',
        'Practice clean finger arching to eliminate string buzz'
      ],
      resources: [
        { title: 'JustinGuitar: First Guitar Chords & Posture', url: 'https://www.justinguitar.com/', type: 'Course' },
        { title: 'MusicTheory.net: Basics of Pitch & Notation', url: 'https://www.musictheory.net/lessons', type: 'Interactive' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Rhythm, Timing & Fluid Chord Transitions',
      details: [
        'Playing with a metronome at 60 BPM in standard 4/4 time signature',
        'The anchor-finger technique for smooth transitions between G, C, and D chords',
        'Mastering the foundational down-down-up-up-down strumming pattern',
        'One-minute chord change speed drills to build muscle memory'
      ],
      resources: [
        { title: 'JustinGuitar: The 1-Minute Chord Change Drill', url: 'https://www.justinguitar.com/', type: 'Practice' },
        { title: 'GuitarWorld: Mastering Strumming Mechanics', url: 'https://www.guitarworld.com/lessons', type: 'Guide' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Learn 3 Complete Iconic Songs',
      details: [
        'Deconstruct song structures: Intro, Verse, Chorus, Bridge, and Outro',
        'Learn song 1: "Horse With No Name" (2-chord simplicity: Em and D6/9)',
        'Learn song 2: "Stand By Me" (classic G - Em - C - D progression)',
        'Play along in real-time with the original track recording without stopping'
      ],
      resources: [
        { title: 'Ultimate Guitar Chords & Tabs Library', url: 'https://www.ultimate-guitar.com/', type: 'Sheet Music' },
        { title: 'Songsterr Interactive Guitar Tabs', url: 'https://www.songsterr.com/', type: 'Interactive' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Minor Pentatonic Scale & Dynamics Control',
      details: [
        'The Minor Pentatonic scale Pattern 1 (Root on the 6th string)',
        'Alternate picking mechanics (down-up strokes) for speed and synchronization',
        'Playing with musical dynamics: forte (loud), piano (soft), and crescendo',
        'Improvise your very first 8-bar guitar lead over an audio backing track'
      ],
      resources: [
        { title: 'GuitarWorld: Minor Pentatonic Scale Guide', url: 'https://www.guitarworld.com/lessons/pentatonic-scale-guide', type: 'Lesson' },
        { title: 'GuitarBackingTrack: Jam Tracks in A Minor', url: 'https://www.guitarbackingtrack.com/', type: 'Audio' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Songwriting & Essential Chord Progressions',
      details: [
        'The Nashville Number System and the ubiquitous I - V - vi - IV progression',
        'How to use a Capo to change vocal keys while retaining simple open chord shapes',
        'Writing simple vocal or melodic lines over repeating chord loops',
        'Record a clean voice memo draft of an original 4-line musical idea'
      ],
      resources: [
        { title: 'Berklee College of Music: Songwriting Basics', url: 'https://www.coursera.org/learn/songwriting', type: 'Course' },
        { title: 'Hooktheory: Popular Chord Progression Analysis', url: 'https://www.hooktheory.com/theorytab', type: 'Tool' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Performance Readiness & Live Peer Jam',
      details: [
        'Overcoming red-light recording syndrome and playing through mistakes',
        'EQ and microphone placement for recording acoustic instruments cleanly',
        'Record a high-quality video performance of your best song from start to finish',
        'Host an acoustic jam session on Orbitus to share musical progress with peers'
      ],
      resources: [
        { title: 'Sound On Sound: Acoustic Guitar Recording Techniques', url: 'https://www.soundonsound.com/', type: 'Article' },
        { title: 'JustinGuitar: Performance Tips for Beginners', url: 'https://www.justinguitar.com/', type: 'Guide' }
      ]
    }
  ],
  docker: [
    {
      week: 'Week 1',
      topic: 'Containers vs Virtual Machines & Docker Architecture',
      details: [
        'Understand Linux cgroups, namespaces, and union file systems powering containers',
        'Docker Engine architecture: Docker CLI, REST API, dockerd daemon, and containerd',
        'Core container lifecycle commands: run, exec, stop, ps, logs, and inspect',
        'Run your first Nginx and Node.js containers with host port forwarding'
      ],
      resources: [
        { title: 'Docker Official Documentation & Guides', url: 'https://docs.docker.com/get-started/', type: 'Docs' },
        { title: 'Docker Roadmap on roadmap.sh', url: 'https://roadmap.sh/docker', type: 'Guide' },
        { title: 'NetworkChuck: Docker Containers Explained in 10 Minutes', url: 'https://www.youtube.com/watch?v=pg19Z8LL06w', type: 'Video' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Writing Production Dockerfiles & Layer Caching',
      details: [
        'Dockerfile instructions: FROM, WORKDIR, COPY, RUN, CMD vs ENTRYPOINT',
        'Optimize build cache efficiency by ordering dependency installation before source copy',
        'Multi-stage Docker builds to reduce image size from 1GB to under 80MB',
        'Implement .dockerignore and configure unprivileged non-root security users'
      ],
      resources: [
        { title: 'Dockerfile Best Practices Guide', url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/', type: 'Docs' },
        { title: 'Multi-Stage Build Deep Dive', url: 'https://docs.docker.com/build/building/multi-stage/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Multi-Container Orchestration with Docker Compose',
      details: [
        'Compose file syntax (v3+): services, networks, volumes, and environment variables',
        'Orchestrate a 3-tier application: React frontend, Express API, and MongoDB/PostgreSQL',
        'Service dependencies with depends_on, healthchecks, and restart policies',
        'Manage multiple environments using docker-compose.override.yml'
      ],
      resources: [
        { title: 'Docker Compose Specification & Reference', url: 'https://docs.docker.com/compose/', type: 'Docs' },
        { title: 'Compose Multi-Container App Example', url: 'https://github.com/docker/awesome-compose', type: 'Repository' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Persistent Storage: Named Volumes & Host Bind Mounts',
      details: [
        'Differentiate between Anonymous volumes, Named volumes, and Bind mounts',
        'Persist database data across container removals with named volumes',
        'Set up live-reload hot development environments using bind mounts',
        'Backup and restore Docker volume data using tar utility containers'
      ],
      resources: [
        { title: 'Docker Storage & Volume Management', url: 'https://docs.docker.com/storage/volumes/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Docker Networking & Container Security Hardening',
      details: [
        'Network drivers: Bridge, Host, Overlay, and Macvlan communication models',
        'Inter-container DNS resolution and isolated user-defined bridge networks',
        'Container vulnerability scanning with Docker Scout and Trivy CLI',
        'Enforce CPU and Memory resource constraints (limits and reservations)'
      ],
      resources: [
        { title: 'Docker Networking Overview', url: 'https://docs.docker.com/network/', type: 'Docs' },
        { title: 'Aqua Security: Trivy Container Vulnerability Scanner', url: 'https://github.com/aquasecurity/trivy', type: 'Tool' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'CI/CD Container Pipelines & Cloud Registry Publishing',
      details: [
        'Build and tag multi-platform container images with Docker Buildx (ARM64/AMD64)',
        'Automate container builds and testing in GitHub Actions with Docker login',
        'Push tagged images securely to Docker Hub and GitHub Container Registry (ghcr.io)',
        'Deploy the containerized project to a cloud VPS or container runtime service'
      ],
      resources: [
        { title: 'GitHub Actions: Build and Push Docker Images', url: 'https://docs.github.com/en/actions/publishing-packages/publishing-docker-images', type: 'Guide' },
        { title: 'DevOps Roadmap on roadmap.sh', url: 'https://roadmap.sh/devops', type: 'Roadmap' }
      ]
    }
  ],
  redis: [
    {
      week: 'Week 1',
      topic: 'Redis In-Memory Architecture, CLI & Data Structures',
      details: [
        'Single-threaded event loop architecture (I/O multiplexing) and in-memory speed',
        'Core data structures: Strings, Lists, Hashes, Sets, and Sorted Sets (ZSET)',
        'Key expiration policies, TTL management, and eviction algorithms (LRU, LFU)',
        'Connect via redis-cli and run benchmark tests with redis-benchmark'
      ],
      resources: [
        { title: 'Redis University & Documentation', url: 'https://redis.io/docs/', type: 'Docs' },
        { title: 'Redis Data Types Tutorial', url: 'https://redis.io/docs/data-types/', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'High-Performance Caching Patterns & Stampede Prevention',
      details: [
        'Implement the Cache-Aside pattern in Node.js/Python with cache invalidation',
        'Evaluate Write-Through, Write-Back, and Refresh-Ahead caching trade-offs',
        'Prevent Cache Stampede / Thundering Herd using Mutex locks and probabilistic early expiration',
        'Handle Cache Penetration with Bloom Filters and Cache Avalanche with TTL jitter'
      ],
      resources: [
        { title: 'Redis Caching Architecture & Best Practices', url: 'https://redis.io/solutions/caching/', type: 'Guide' },
        { title: 'ByteByteGo: Distributed Caching Architecture', url: 'https://bytebytego.com', type: 'Article' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Redis Pub/Sub, Streams & Real-Time Message Queues',
      details: [
        'Publish/Subscribe mechanics for real-time chat broadcasts and event notifications',
        'Redis Streams vs Pub/Sub: persistent append-only logs with Consumer Groups',
        'Acknowledge processed messages (XACK) and handle pending message reclaims (XCLAIM)',
        'Build a real-time event pipeline decoupling web producers from background workers'
      ],
      resources: [
        { title: 'Redis Streams Deep Dive', url: 'https://redis.io/docs/data-types/streams/', type: 'Docs' },
        { title: 'Hussein Nasser: Redis Pub/Sub Explained', url: 'https://www.youtube.com/results?search_query=hussein+nasser+redis+pub+sub', type: 'Video' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Persistence Mechanisms: RDB Snapshots vs AOF Logs',
      details: [
        'RDB (Redis Database) point-in-time snapshotting and copy-on-write fork mechanics',
        'AOF (Append Only File) logging, fsync policies (always, everysec, no), and AOF rewrite',
        'Compare RDB vs AOF: recovery speed, data loss tolerance, and disk I/O impact',
        'Simulate crash recovery and verify data integrity on restart'
      ],
      resources: [
        { title: 'Redis Persistence Options & Trade-offs', url: 'https://redis.io/docs/management/persistence/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Distributed Locking (Redlock), Rate Limiting & Lua Scripts',
      details: [
        'Implement distributed mutual exclusion locks using SET NX PX and Redlock algorithm',
        'Build a Token Bucket and Sliding Window Rate Limiter to protect public APIs',
        'Write transactional atomic Lua scripts executed directly on the Redis server (EVAL)',
        'Pipelining batch requests to eliminate network round-trip latency'
      ],
      resources: [
        { title: 'Distributed Locks with Redis (Redlock)', url: 'https://redis.io/docs/manual/patterns/distributed-locks/', type: 'Guide' },
        { title: 'Redis Programmability with Lua Scripting', url: 'https://redis.io/docs/interact/programmability/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'High Availability: Redis Sentinel, Clustering & Production Scaling',
      details: [
        'Master-replica asynchronous replication and read-scaling topologies',
        'Configure Redis Sentinel for automated failover, quorum voting, and health monitoring',
        'Redis Cluster hash slot partitioning (16384 slots), multi-key limitations, and resharding',
        'Deploy a high-availability production Redis cluster with Docker Compose'
      ],
      resources: [
        { title: 'Redis Sentinel High Availability Setup', url: 'https://redis.io/docs/management/sentinel/', type: 'Docs' },
        { title: 'Redis Cluster Specification', url: 'https://redis.io/docs/management/scaling/', type: 'Docs' }
      ]
    }
  ],
  rag: [
    {
      week: 'Week 1',
      topic: 'Foundations of RAG, Vector Embeddings & Similarity Math',
      details: [
        'Conceptual mental model of Retrieval-Augmented Generation vs fine-tuning',
        'Vector embeddings: Dense representations, cosine similarity, dot product, and Euclidean distance',
        'Document parsing & text chunking strategies: character, recursive character, and semantic chunking',
        'Generate text embeddings using OpenAI text-embedding-3 or open-source HuggingFace models'
      ],
      resources: [
        { title: 'Pinecone Learning Center: What is Retrieval-Augmented Generation?', url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/', type: 'Guide' },
        { title: 'AI Roadmap & RAG on roadmap.sh', url: 'https://roadmap.sh/ai-data-scientist', type: 'Roadmap' },
        { title: 'Hugging Face MTEB Leaderboard', url: 'https://huggingface.co/spaces/mteb/leaderboard', type: 'Tool' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Vector Databases & Approximate Nearest Neighbors (ANN)',
      details: [
        'Vector indexing algorithms: HNSW (Hierarchical Navigable Small World) and IVF-Flat',
        'Set up and query vector databases: ChromaDB, Pinecone, or Qdrant',
        'Metadata filtering: combining scalar attribute filters with vector similarity search',
        'Optimize index recall vs query latency trade-offs in vector storage'
      ],
      resources: [
        { title: 'ChromaDB Getting Started Guide', url: 'https://docs.trychroma.com/', type: 'Docs' },
        { title: 'Qdrant Vector Database Documentation', url: 'https://qdrant.tech/documentation/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Orchestration Frameworks: LangChain & LlamaIndex',
      details: [
        'Document loaders for PDF, Markdown, HTML, and CSV structured knowledge bases',
        'Build an end-to-end question-answering pipeline using LangChain LCEL (LangChain Expression Language)',
        'LlamaIndex indices: VectorStoreIndex, SummaryIndex, and Knowledge Graph index',
        'Prompt templates for grounded context injection: instructions, citations, and fallback handling'
      ],
      resources: [
        { title: 'LangChain Official Documentation (RAG Tutorial)', url: 'https://python.langchain.com/docs/tutorials/rag/', type: 'Docs' },
        { title: 'LlamaIndex Documentation', url: 'https://docs.llamaindex.ai/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Advanced Retrieval: Hybrid Search, Re-Ranking & Query Transformation',
      details: [
        'Hybrid search: Combining sparse keyword search (BM25) with dense vector search (Reciprocal Rank Fusion)',
        'Contextual cross-encoder re-ranking using Cohere Rerank or BGE-Reranker',
        'Query transformation techniques: Multi-Query expansion, Hypothetical Document Embeddings (HyDE)',
        'Parent Document Retriever & Sentence Window Retrieval for preserving contextual integrity'
      ],
      resources: [
        { title: 'Cohere Rerank Documentation & Benchmarks', url: 'https://docs.cohere.com/docs/reranking-best-practices', type: 'Docs' },
        { title: 'Advanced RAG Techniques by LlamaIndex', url: 'https://docs.llamaindex.ai/en/stable/optimizing/advanced_retrieval/advanced_retrieval/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Evaluation Frameworks, Hallucination Detection & Guardrails',
      details: [
        'RAG Triad metrics: Context Relevance, Groundedness (Faithfulness), and Answer Relevance',
        'Automated quantitative evaluation with Ragas (Retrieval Augmented Generation Assessment)',
        'Implement guardrails to detect hallucinations, jailbreaks, and prompt injections',
        'Benchmarking retrieval accuracy using synthetic ground truth datasets'
      ],
      resources: [
        { title: 'Ragas: Automated RAG Evaluation Framework', url: 'https://docs.ragas.io/', type: 'Tool' },
        { title: 'NeMo Guardrails by NVIDIA', url: 'https://github.com/NVIDIA/NeMo-Guardrails', type: 'Repository' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Production Deployment: Streaming RAG Application with Citations',
      details: [
        'Build a high-performance FastAPI/Express backend with server-sent events (SSE) streaming',
        'Implement clickable source document citations and highlighted text references in the UI',
        'Add conversational memory with chat history compression and conversational retrieval chains',
        'Deploy the fullstack RAG assistant with Docker and host vector database'
      ],
      resources: [
        { title: 'Fullstack RAG Architecture Blueprint', url: 'https://github.com/langchain-ai/rag-from-scratch', type: 'Repository' },
        { title: 'FastAPI Streaming Responses with LLMs', url: 'https://fastapi.tiangolo.com/', type: 'Docs' }
      ]
    }
  ],
  kubernetes: [
    {
      week: 'Week 1',
      topic: 'Kubernetes Control Plane Architecture & Cluster Setup',
      details: [
        'Control plane components: kube-apiserver, etcd, kube-scheduler, and kube-controller-manager',
        'Worker node components: kubelet, kube-proxy, and container runtime interface (CRI)',
        'Spin up local clusters with Minikube, Kind, or K3s and configure kubectl context',
        'Declare and inspect simple Pod manifests using YAML'
      ],
      resources: [
        { title: 'Kubernetes Official Documentation', url: 'https://kubernetes.io/docs/home/', type: 'Docs' },
        { title: 'Kubernetes Roadmap on roadmap.sh', url: 'https://roadmap.sh/kubernetes', type: 'Guide' },
        { title: 'KubeAcademy by VMware', url: 'https://kube.academy/', type: 'Course' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Workloads: Deployments, ReplicaSets & Rolling Updates',
      details: [
        'Deployments for declarative pod updates and ReplicaSet reconciliation loops',
        'Zero-downtime rolling updates, maxSurge, maxUnavailable, and instant rollbacks',
        'Configure Liveness, Readiness, and Startup probes to safeguard traffic routing',
        'Define container resource requests and limits to prevent noisy-neighbor starvation'
      ],
      resources: [
        { title: 'Kubernetes Workload Resources Reference', url: 'https://kubernetes.io/docs/concepts/workloads/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Networking & Ingress: Exposing Services to Traffic',
      details: [
        'Service types: ClusterIP (internal), NodePort (host-level), and LoadBalancer (cloud)',
        'Kube-proxy iptables and IPVS routing mechanisms behind virtual IPs',
        'Ingress Controllers: Deploy NGINX Ingress Controller for path-based routing',
        'Automate TLS certificate issuance and renewal with cert-manager and Let’s Encrypt'
      ],
      resources: [
        { title: 'Kubernetes Ingress & Services Guide', url: 'https://kubernetes.io/docs/concepts/services-networking/', type: 'Docs' },
        { title: 'cert-manager for Kubernetes', url: 'https://cert-manager.io/docs/', type: 'Tool' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Configuration & Storage: ConfigMaps, Secrets & PersistentVolumes',
      details: [
        'Decouple environment configuration with ConfigMaps and mount as files or env variables',
        'Secure sensitive credentials with Secrets and integrate external secrets managers',
        'Storage architecture: PersistentVolumes (PV), PersistentVolumeClaims (PVC), and StorageClasses',
        'Deploy a stateful database (PostgreSQL or Redis) with dynamic volume provisioning'
      ],
      resources: [
        { title: 'Kubernetes Storage Concepts', url: 'https://kubernetes.io/docs/concepts/storage/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Helm Package Management & GitOps Workflows',
      details: [
        'Package applications with Helm charts: templates, values.yaml, and release versions',
        'Manage multi-environment deployments using Helm overrides',
        'Introduction to GitOps principles: declarative infrastructure stored in git repositories',
        'Set up continuous deployment with ArgoCD or Flux syncing cluster state automatically'
      ],
      resources: [
        { title: 'Helm Official Documentation', url: 'https://helm.sh/docs/', type: 'Docs' },
        { title: 'ArgoCD Declarative GitOps Guide', url: 'https://argo-cd.readthedocs.io/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Cluster Security, RBAC & Observability with Prometheus',
      details: [
        'Role-Based Access Control (RBAC): ServiceAccounts, Roles, ClusterRoles, and RoleBindings',
        'Deploy Prometheus and Grafana using kube-prometheus-stack for cluster metrics',
        'Configure Horizontal Pod Autoscaler (HPA) to scale pods based on CPU/memory pressure',
        'Perform cluster security audits with kube-bench and Kube-hunter'
      ],
      resources: [
        { title: 'Prometheus Operator on Kubernetes', url: 'https://prometheus-operator.dev/', type: 'Docs' },
        { title: 'Kubernetes Hardening Guidance (NSA/CISA)', url: 'https://kubernetes.io/docs/concepts/security/', type: 'Guide' }
      ]
    }
  ],
  nextjs: [
    {
      week: 'Week 1',
      topic: 'Next.js App Router Architecture & React Server Components',
      details: [
        'Server Components vs Client Components ("use client") mental model and boundary rules',
        'Folder-based routing conventions: layout.js, page.js, loading.js, error.js, and not-found.js',
        'Streaming HTML with React Suspense for instant page shell rendering',
        'Set up a production starter with Tailwind CSS, TypeScript, and shadcn/ui'
      ],
      resources: [
        { title: 'Next.js Official Documentation (App Router)', url: 'https://nextjs.org/docs', type: 'Docs' },
        { title: 'Next.js Roadmap on roadmap.sh', url: 'https://roadmap.sh/nextjs', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Data Fetching, Caching Architecture & Server Actions',
      details: [
        'Extended fetch API: cache options (force-cache, no-store) and revalidate tags',
        'Execute database mutations safely on the server using Server Actions',
        'Incremental Static Regeneration (ISR) and on-demand revalidation via revalidatePath',
        'Optimistic UI updates using React useOptimistic and useTransition hooks'
      ],
      resources: [
        { title: 'Data Fetching, Caching, and Revalidating in Next.js', url: 'https://nextjs.org/docs/app/building-your-application/data-fetching', type: 'Docs' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Advanced Routing: Dynamic Routes, Intercepting & Route Handlers',
      details: [
        'Dynamic segments [id] and catch-all routes [...slug] with generateStaticParams',
        'Parallel Routes (@slot) for multi-column dashboards and modal dialogs',
        'Intercepting Routes ((..)photo) for seamless Instagram-like image feed overlays',
        'Custom REST API endpoints using Route Handlers (route.ts)'
      ],
      resources: [
        { title: 'Next.js Routing Patterns Deep Dive', url: 'https://nextjs.org/docs/app/building-your-application/routing', type: 'Guide' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Authentication & Middleware Route Protection',
      details: [
        'NextAuth.js v5 (Auth.js) setup with OAuth providers (Google, GitHub) and Credentials',
        'Secure session management using encrypted JWT cookies in Edge Middleware',
        'Protect authenticated dashboard routes using proxy redirects in middleware.ts',
        'Role-Based Access Control (Admin vs Regular User) across Server Components'
      ],
      resources: [
        { title: 'Auth.js Official Guide for Next.js', url: 'https://authjs.dev/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Performance Optimization: Images, Fonts & SEO Metadata',
      details: [
        'Next/image component: automatic WebP/AVIF format conversion and layout shift prevention',
        'Next/font: zero-layout-shift Google and local font self-hosting at build time',
        'Dynamic OpenGraph (OG) image generation using @vercel/og and ImageResponse',
        'Generate dynamic sitemaps (sitemap.ts) and robots.txt for search engine indexing'
      ],
      resources: [
        { title: 'Next.js Optimizing & SEO Guide', url: 'https://nextjs.org/docs/app/building-your-application/optimizing', type: 'Docs' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Production Deployment: Edge Functions & Docker Hosting',
      details: [
        'Deploying seamlessly to Vercel with preview deployments and environment variables',
        'Containerize Next.js using standalone output mode in a minimal Alpine Docker container',
        'Set up continuous deployment with GitHub Actions to a self-hosted cloud server',
        'Audit Web Vitals (LCP, FID, CLS) using Google Lighthouse and achieve a 95+ score'
      ],
      resources: [
        { title: 'Deploying Next.js with Docker Standalone', url: 'https://github.com/vercel/next.js/tree/canary/examples/with-docker', type: 'Repository' }
      ]
    }
  ],
  system_design: [
    {
      week: 'Week 1',
      topic: 'Scalability Fundamentals, Latency vs Throughput & CAP Theorem',
      details: [
        'Vertical scaling (scale-up) vs Horizontal scaling (scale-out) trade-offs and limits',
        'Latency, Throughput, Availability (99.9% vs 99.999% SLA), and Back-of-the-envelope calculations',
        'CAP Theorem (Consistency, Availability, Partition Tolerance) and PACELC trade-offs',
        'Stateless vs Stateful application server tiers'
      ],
      resources: [
        { title: 'System Design Primer by Donne Martin', url: 'https://github.com/donnemartin/system-design-primer', type: 'Repository' },
        { title: 'System Design Roadmap on roadmap.sh', url: 'https://roadmap.sh/system-design', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Load Balancing, Reverse Proxies & CDN Caching',
      details: [
        'Load balancing algorithms: Round Robin, Weighted Least Connections, IP Hash, Consistent Hashing',
        'Layer 4 (Transport/TCP) vs Layer 7 (Application/HTTP) load balancers (HAProxy, Nginx, AWS ALB)',
        'Content Delivery Networks (CDNs): Edge caching, Origin Shield, and cache invalidation strategies',
        'DNS round-robin routing and GeoDNS for global user distribution'
      ],
      resources: [
        { title: 'Cloudflare Learning Center: What is a Load Balancer?', url: 'https://www.cloudflare.com/learning/performance/what-is-load-balancing/', type: 'Article' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Database Scaling: Replication, Sharding & NoSQL Selection',
      details: [
        'Relational (RDBMS) vs Non-Relational (NoSQL: Document, Key-Value, Columnar, Graph)',
        'Master-Slave (Leader-Follower) replication and read replicas for high-throughput reads',
        'Horizontal database sharding strategies: Range-based, Directory-based, and Hash-based sharding',
        'Managing distributed data integrity: 2-Phase Commit (2PC) vs Saga pattern'
      ],
      resources: [
        { title: 'Designing Data-Intensive Applications (Martin Kleppmann Notes)', url: 'https://dataintensive.net/', type: 'Book' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Message Queues & Asynchronous Event-Driven Architectures',
      details: [
        'Message Queues vs Event Streams: RabbitMQ (AMQP push) vs Apache Kafka (pull/partitioned log)',
        'Decoupling synchronous request paths using asynchronous worker queues (Celery, BullMQ)',
        'Delivery semantics: At-least-once, At-most-once, and Exactly-once processing with idempotency',
        'Dead letter queues (DLQ), retry backoff, and circuit breaker patterns'
      ],
      resources: [
        { title: 'Confluent Kafka Architecture Guide', url: 'https://www.confluent.io/what-is-apache-kafka/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Microservices Communication: REST, gRPC & API Gateways',
      details: [
        'Inter-service communication: synchronous REST/HTTP vs binary high-speed gRPC Protocol Buffers',
        'API Gateway pattern: authentication, rate limiting, SSL termination, and request aggregation',
        'Service discovery and Service Mesh (Envoy, Istio) for dynamic microservice routing',
        'Distributed tracing with OpenTelemetry and Jaeger to track request lifecycles across services'
      ],
      resources: [
        { title: 'Microservices.io Architecture Patterns', url: 'https://microservices.io/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Designing Real-World Systems: Twitter, TinyURL & YouTube',
      details: [
        'Design a Distributed URL Shortener (TinyURL): base62 encoding, KGS (Key Generation Service), caching',
        'Design a Social Newsfeed (Twitter/Instagram): Fanout-on-write vs Fanout-on-read for celebrity accounts',
        'Design a Video Streaming Platform (YouTube/Netflix): Chunking, transcoding workers, CDN distribution',
        'Conduct a 45-minute timed system design mock interview simulation'
      ],
      resources: [
        { title: 'ByteByteGo System Design YouTube Channel', url: 'https://www.youtube.com/@ByteByteGo', type: 'Video' },
        { title: 'Grokking the System Design Interview', url: 'https://github.com/madd86/awesome-system-design', type: 'Repository' }
      ]
    }
  ],
  sql: [
    {
      week: 'Week 1',
      topic: 'Relational Model, Normalization & DDL/DML Fundamentals',
      details: [
        'Relational model foundations: primary keys, foreign keys, unique constraints, and check constraints',
        'Database normalization: 1NF, 2NF, 3NF, and BCNF to eliminate data anomalies and redundancy',
        'Data Definition Language (CREATE, ALTER, DROP) and Data Manipulation Language (INSERT, UPDATE, DELETE)',
        'Designing a clean relational schema for an e-commerce platform'
      ],
      resources: [
        { title: 'PostgreSQL Official Documentation', url: 'https://www.postgresql.org/docs/', type: 'Docs' },
        { title: 'SQL Roadmap on roadmap.sh', url: 'https://roadmap.sh/sql', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Complex Joins, Grouping & Multi-Table Aggregations',
      details: [
        'Mastering join mechanics: INNER JOIN, LEFT OUTER JOIN, RIGHT JOIN, and FULL OUTER JOIN',
        'Aggregate functions: COUNT, SUM, AVG, MIN, MAX with GROUP BY and filtering with HAVING',
        'Handling NULL values correctly: COALESCE, NULLIF, and Three-Valued Logic in SQL',
        'Cross Joins, Self Joins, and hierarchical parent-child queries'
      ],
      resources: [
        { title: 'SQLBolt: Interactive Interactive SQL Lessons', url: 'https://sqlbolt.com/', type: 'Practice' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Subqueries, Common Table Expressions (CTEs) & Window Functions',
      details: [
        'Scalar subqueries, correlated subqueries, and EXISTS vs IN performance differences',
        'Common Table Expressions (WITH clause) and Recursive CTEs for hierarchical tree traversal',
        'Window functions: ROW_NUMBER(), RANK(), DENSE_RANK(), and NTILE() partitions',
        'Analytical offsets: LAG(), LEAD(), FIRST_VALUE(), and running rolling totals with OVER()'
      ],
      resources: [
        { title: 'Modern SQL Window Functions Masterclass', url: 'https://modern-sql.com/feature/over', type: 'Tutorial' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Indexing Internals & Query Execution Plan Optimization',
      details: [
        'Index data structures: B-Tree index traversal, Hash indexes, and GiST/GIN for full-text search',
        'Composite multi-column indexes and the Leftmost Prefix Rule',
        'Analyzing execution plans using EXPLAIN ANALYZE: Sequential Scan vs Index Scan vs Bitmap Heap Scan',
        'Preventing index suppression caused by functions on columns or implicit type casting'
      ],
      resources: [
        { title: 'Use The Index, Luke! Database Performance Guide', url: 'https://use-the-index-luke.com/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Transactions, ACID Guarantees & Concurrency Control',
      details: [
        'ACID properties: Atomicity, Consistency, Isolation, and Durability',
        'Transaction isolation levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable',
        'Concurrency anomalies: Dirty Reads, Non-Repeatable Reads, and Phantom Reads',
        'Pessimistic locking (SELECT FOR UPDATE) vs Optimistic concurrency control with version columns'
      ],
      resources: [
        { title: 'PostgreSQL Concurrency Control & MVCC', url: 'https://www.postgresql.org/docs/current/mvcc.html', type: 'Docs' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Table Partitioning, Stored Procedures & Production DBA Tasks',
      details: [
        'Horizontal table partitioning by Range, List, and Hash for tables with 10M+ rows',
        'Writing stored procedures, user-defined functions, and triggers in PL/pgSQL',
        'Database connection pooling (PgBouncer) and vacuuming dead tuples (VACUUM FULL)',
        'Designing zero-downtime database schema migration workflows using Flyway or Prisma'
      ],
      resources: [
        { title: 'PostgreSQL Table Partitioning Guide', url: 'https://www.postgresql.org/docs/current/ddl-partitioning.html', type: 'Docs' }
      ]
    }
  ],
  graphql: [
    {
      week: 'Week 1',
      topic: 'GraphQL Foundations vs REST & Schema Definition Language',
      details: [
        'Core problems solved: Eliminating over-fetching and under-fetching of data',
        'Schema Definition Language (SDL): Scalar types, Object types, Enums, and Inputs',
        'Write queries requesting precise nested fields and pass arguments',
        'Explore schemas interactively with Apollo Sandbox and GraphiQL'
      ],
      resources: [
        { title: 'GraphQL Official Introduction', url: 'https://graphql.org/learn/', type: 'Docs' },
        { title: 'GraphQL Roadmap on roadmap.sh', url: 'https://roadmap.sh/graphql', type: 'Guide' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Resolvers, Data Sources & Mutations',
      details: [
        'Resolver signature: parent, args, context, and info execution parameters',
        'Building mutation operations for creating, updating, and deleting records',
        'Structuring error responses and custom error extensions',
        'Connecting resolvers to relational databases and REST backend endpoints'
      ],
      resources: [
        { title: 'Apollo Server Documentation', url: 'https://www.apollographql.com/docs/apollo-server/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'Solving the N+1 Query Problem with DataLoader',
      details: [
        'Understanding how nested GraphQL queries trigger catastrophic N+1 database queries',
        'Implement DataLoader for batching individual database lookups into a single IN query',
        'Per-request memoization caching with DataLoader instances',
        'Query complexity analysis and depth limiting to prevent denial-of-service queries'
      ],
      resources: [
        { title: 'DataLoader GitHub Repository & Patterns', url: 'https://github.com/graphql/dataloader', type: 'Repository' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Real-Time Updates with GraphQL Subscriptions',
      details: [
        'WebSocket protocol transport for persistent real-time client-server communication',
        'Publishing and subscribing to live events with PubSub engine',
        'Filter subscription notifications per authenticated user or channel ID',
        'Build a real-time live notification and chat feature using subscriptions'
      ],
      resources: [
        { title: 'GraphQL Subscriptions with Apollo Server', url: 'https://www.apollographql.com/docs/apollo-server/data/subscriptions/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Authentication, Authorization & Schema Directives',
      details: [
        'Passing JWT tokens via HTTP headers into the GraphQL request context',
        'Field-level authorization checks vs schema-level authentication guards',
        'Custom schema directives (@auth, @deprecated) to enforce security rules declaratively',
        'Rate limiting public queries by calculating cost per request'
      ],
      resources: [
        { title: 'Apollo Security Best Practices', url: 'https://www.apollographql.com/docs/apollo-server/security/terminating-ssl/', type: 'Guide' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Client Integration with Apollo Client & Federation',
      details: [
        'Apollo Client setup in React: useQuery, useMutation, and useSubscription hooks',
        'Normalized client-side in-memory caching and cache update policies (cache-first vs network-only)',
        'Code generation for end-to-end TypeScript types using GraphQL Code Generator',
        'Introduction to Apollo Federation for composable microservice supergraphs'
      ],
      resources: [
        { title: 'Apollo Client React Tutorial', url: 'https://www.apollographql.com/docs/react/', type: 'Docs' },
        { title: 'GraphQL Code Generator Guide', url: 'https://the-guild.dev/graphql/codegen', type: 'Tool' }
      ]
    }
  ],
  cybersecurity: [
    {
      week: 'Week 1',
      topic: 'Information Security Fundamentals & Threat Modeling',
      details: [
        'Core security tenets: Confidentiality, Integrity, and Availability (CIA Triad)',
        'Threat modeling frameworks: STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege)',
        'Defense-in-depth principles: physical, network, host, application, and data security layers',
        'Setting up a secure virtualized practice lab with Kali Linux'
      ],
      resources: [
        { title: 'Cyber Security Roadmap on roadmap.sh', url: 'https://roadmap.sh/cyber-security', type: 'Guide' },
        { title: 'TryHackMe: Pre-Security Pathway', url: 'https://tryhackme.com/path/outline/presecurity', type: 'Practice' }
      ]
    },
    {
      week: 'Week 2',
      topic: 'Network Security & Packet Traffic Analysis',
      details: [
        'TCP/IP stack security, port scanning, and banner grabbing with Nmap',
        'Deep packet inspection and protocol analysis using Wireshark',
        'Understanding MITM (Man-in-the-Middle) attacks and ARP spoofing mechanics',
        'Configuring firewalls (iptables/UFW) and network segmentation rules'
      ],
      resources: [
        { title: 'Wireshark User Guide & Practice PCAPs', url: 'https://www.wireshark.org/docs/', type: 'Tool' },
        { title: 'Nmap Network Scanning by Gordon Lyon', url: 'https://nmap.org/book/', type: 'Docs' }
      ]
    },
    {
      week: 'Week 3',
      topic: 'OWASP Top 10 Web Application Vulnerabilities',
      details: [
        'SQL Injection (SQLi): In-band, blind, and time-based injection techniques & parameterized defenses',
        'Cross-Site Scripting (XSS): Stored, Reflected, and DOM-based XSS mitigation with CSP headers',
        'Cross-Site Request Forgery (CSRF) and Broken Object Level Authorization (BOLA/IDOR)',
        'Server-Side Request Forgery (SSRF) and insecure deserialization attacks'
      ],
      resources: [
        { title: 'OWASP Top 10 Web Application Security Risks', url: 'https://owasp.org/www-project-top-ten/', type: 'Docs' },
        { title: 'PortSwigger Web Security Academy (Free Labs)', url: 'https://portswigger.net/web-security', type: 'Practice' }
      ]
    },
    {
      week: 'Week 4',
      topic: 'Applied Cryptography & Identity Management',
      details: [
        'Symmetric encryption (AES-256-GCM) vs Asymmetric public-key encryption (RSA, ECC)',
        'Cryptographic hashing (SHA-256) vs Key Derivation Functions (bcrypt, Argon2, PBKDF2) for passwords',
        'Public Key Infrastructure (PKI), digital certificates, and TLS 1.3 handshake verification',
        'Authentication protocols: OAuth 2.0, OpenID Connect (OIDC), and JWT security flaws'
      ],
      resources: [
        { title: 'Crypto101 by Laurens Van Houtven', url: 'https://www.crypto101.io/', type: 'Book' }
      ]
    },
    {
      week: 'Week 5',
      topic: 'Penetration Testing & Web Vulnerability Assessment',
      details: [
        'Reconnaissance & OSINT gathering techniques for domain and asset enumeration',
        'Intercepting and modifying HTTP requests using Burp Suite Community Edition',
        'Automated vulnerability scanning with Nikto, OWASP ZAP, and Nuclei',
        'Documenting vulnerabilities with CVSS scoring and writing remediation reports'
      ],
      resources: [
        { title: 'Burp Suite Getting Started', url: 'https://portswigger.net/burp/documentation/desktop/getting-started', type: 'Docs' },
        { title: 'HackTheBox Starting Point', url: 'https://www.hackthebox.com/', type: 'Practice' }
      ]
    },
    {
      week: 'Week 6',
      topic: 'Incident Response, DevSecOps & Security Hardening',
      details: [
        'Incident handling steps: Preparation, Detection, Containment, Eradication, Recovery, and Lessons Learned',
        'Static Application Security Testing (SAST) and Dependency Scanning in CI/CD pipelines',
        'Linux server hardening: SSH key authentication, disabling root login, Fail2ban, and auditd logs',
        'Security Information and Event Management (SIEM) log correlation fundamentals'
      ],
      resources: [
        { title: 'NIST Computer Security Incident Handling Guide (SP 800-61)', url: 'https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final', type: 'Guide' },
        { title: 'SANS Institute Security Resources', url: 'https://www.sans.org/white-papers/', type: 'Guide' }
      ]
    }
  ]
};

const classifyRoadmapTopic = (topic) => {
  const normalized = topic.toLowerCase();

  if (/\b(dsa|data structure|algorithm|leetcode|competitive programming|striver|neetcode)\b/.test(normalized)) {
    return 'dsa';
  }
  if (/\b(docker|container|containerization|dockerfile|docker-compose)\b/.test(normalized)) {
    return 'docker';
  }
  if (/\b(redis|caching|cache|in-memory|redlock)\b/.test(normalized)) {
    return 'redis';
  }
  if (/\b(rag|retrieval augmented|vector db|vector database|embeddings|llamaindex|langchain)\b/.test(normalized)) {
    return 'rag';
  }
  if (/\b(kubernetes|k8s|minikube|helm|container orchestration)\b/.test(normalized)) {
    return 'kubernetes';
  }
  if (/\b(nextjs|next\.js|next js|fullstack react|app router)\b/.test(normalized)) {
    return 'nextjs';
  }
  if (/\b(system design|system_design|distributed system|microservices|scalability|high availability)\b/.test(normalized)) {
    return 'system_design';
  }
  if (/\b(sql|postgresql|mysql|database design|relational database|postgres|sqlite)\b/.test(normalized)) {
    return 'sql';
  }
  if (/\b(graphql|apollo|schema definition language|sdl|dataloader)\b/.test(normalized)) {
    return 'graphql';
  }
  if (/\b(cybersecurity|cyber security|infosec|ethical hacking|penetration testing|owasp|network security)\b/.test(normalized)) {
    return 'cybersecurity';
  }
  if (/\b(javascript|js|typescript|ts|ecmascript|vanilla js)\b/.test(normalized) && !/\b(react|mern|node|full[-\s]?stack)\b/.test(normalized)) {
    return 'javascript';
  }
  if (/\b(react|react\.js|reactjs)\b/.test(normalized) && !/\b(mern|full[-\s]?stack|node|express|mongodb)\b/.test(normalized)) {
    return 'react';
  }
  if (/\b(mern|full[-\s]?stack|node|nodejs|express|mongodb|backend|backend development)\b/.test(normalized)) {
    return 'mern';
  }
  if (/\b(fitness|gym|workout|bodybuilding|weight loss|muscle|calisthenics|exercise)\b/.test(normalized)) {
    return 'fitness';
  }
  if (/\b(finance|investing|stock market|money management|budgeting|crypto|trading|wealth)\b/.test(normalized)) {
    return 'finance';
  }
  if (/\b(design|ui|ux|figma|graphic|product design|typography|wireframe)\b/.test(normalized)) {
    return 'design';
  }
  if (/\b(spanish|french|german|japanese|mandarin|italian|language)\b/.test(normalized)) {
    return 'spanish';
  }
  if (/\b(public speaking|speaking|presentation|pitch|communication|storytelling|debate)\b/.test(normalized)) {
    return 'speaking';
  }
  if (/\b(music|guitar|piano|singing|songwriting|instruments|violin|drums)\b/.test(normalized)) {
    return 'music';
  }
  if (/\b(ai|a\.i\.|ml|machine learning|deep learning|artificial intelligence|llm|data science|nlp)\b/.test(normalized)) {
    return 'aiMl';
  }
  if (/\b(python|django|fastapi|flask)\b/.test(normalized)) {
    return 'python';
  }

  return 'custom';
};

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
  const isDatabase = /\b(sql|postgres|mysql|mongo|mongodb|redis|cassandra|database|prisma|drizzle|dynamodb|elasticsearch)\b/.test(lower);
  const isDevOps = /\b(docker|kubernetes|k8s|devops|aws|gcp|azure|ci\/cd|terraform|ansible|linux|bash|nginx|container)\b/.test(lower);
  const isAiMl = /\b(ai|ml|machine learning|deep learning|rag|llm|nlp|pytorch|tensorflow|pandas|data science|computer vision)\b/.test(lower);
  const isMobile = /\b(flutter|react native|swift|kotlin|android|ios|mobile)\b/.test(lower);
  const isLanguage = /\b(spanish|french|german|japanese|mandarin|italian|english|grammar|speaking|accent)\b/.test(lower);
  const isMusic = /\b(guitar|piano|singing|drums|violin|music|audio|composition|ableton|fl studio)\b/.test(lower);
  const isDesign = /\b(blender|figma|photoshop|after effects|illustration|animation|video editing|photography|3d)\b/.test(lower);
  const isFinance = /\b(finance|investing|stock|budgeting|crypto|trading|wealth|accounting)\b/.test(lower);

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

// @desc    Get AI-suggested matches
// @route   GET /api/ai/match
// @access  Private
export const getAiMatches = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).populate('skillsTeach.skill skillsLearn.skill');
  if (!currentUser) {
    throw new ApiError(404, 'User not found');
  }

  const teachSkillIds = currentUser.skillsTeach.map((s) => s.skill._id.toString());
  const learnSkillIds = currentUser.skillsLearn.map((s) => s.skill._id.toString());

  const mentors = await User.find({
    role: 'User',
    _id: { $ne: currentUser._id },
    'skillsTeach.skill': { $in: learnSkillIds }
  }).populate('skillsTeach.skill skillsLearn.skill').limit(8);

  const learners = await User.find({
    role: 'User',
    _id: { $ne: currentUser._id },
    'skillsLearn.skill': { $in: teachSkillIds }
  }).populate('skillsTeach.skill skillsLearn.skill').limit(8);

  const formatSuggestions = (list) => {
    return list.map((user) => {
      let matchScore = 55;
      const sharedInterests = (user.interests || []).filter((i) => (currentUser.interests || []).includes(i));
      matchScore += sharedInterests.length * 10;

      if (user.experienceLevel === 'Senior' || user.experienceLevel === 'Lead') {
        matchScore += 15;
      }

      matchScore = Math.min(98, matchScore);

      return {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          profileImage: user.profileImage,
          bio: user.bio,
          experienceLevel: user.experienceLevel,
          skillsTeach: user.skillsTeach,
          skillsLearn: user.skillsLearn,
          education: user.education,
          resumeFile: user.resumeFile,
          socialLinks: user.socialLinks,
          projects: user.projects,
          points: user.points,
          followersCount: user.followers?.length || 0,
          followingCount: user.following?.length || 0,
          isFollowing: (user.followers || []).some((id) => id.toString() === currentUser._id.toString())
        },
        matchScore,
        sharedInterests
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  };

  return res.status(200).json(
    new ApiResponse(200, {
      mentors: formatSuggestions(mentors),
      learners: formatSuggestions(learners)
    }, 'AI suggestions retrieved')
  );
});

// @desc    Get status of user's custom AI key & provider
// @route   GET /api/ai/custom-key
// @access  Private
export const getCustomAiKeyStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('customAiKey customAiProvider');
  const hasCustomKey = Boolean(user?.customAiKey && user.customAiKey.trim().length > 0);
  const maskedKey = hasCustomKey
    ? user.customAiKey.slice(0, 6) + '...' + user.customAiKey.slice(-4)
    : '';

  return res.status(200).json(
    new ApiResponse(200, {
      hasCustomKey,
      maskedKey,
      customAiProvider: user?.customAiProvider || 'gemini'
    }, 'Custom AI key status retrieved')
  );
});

export const saveCustomAiKey = asyncHandler(async (req, res) => {
  const { customAiKey, customAiProvider } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.customAiKey = (customAiKey || '').trim();
  user.customAiProvider = user.customAiKey ? (customAiProvider || 'gemini') : 'default';
  await user.save();

  const hasCustomKey = Boolean(user.customAiKey.length > 0);
  const maskedKey = hasCustomKey
    ? user.customAiKey.slice(0, 6) + '...' + user.customAiKey.slice(-4)
    : '';

  const providerNames = {
    gemini: 'Google Gemini',
    openai: 'OpenAI (ChatGPT)',
    groq: 'Groq (Llama 3.3)',
    claude: 'Anthropic Claude'
  };

  return res.status(200).json(
    new ApiResponse(200, {
      hasCustomKey,
      maskedKey,
      customAiProvider: user.customAiProvider
    }, hasCustomKey
      ? `Your personal ${providerNames[user.customAiProvider] || user.customAiProvider} AI engine has been connected!`
      : 'Custom AI key disconnected. Default platform AI and curated curriculums will be used.')
  );
});

// @desc    Generate AI learning roadmap
// @route   POST /api/ai/roadmap
// @access  Private
export const generateRoadmap = asyncHandler(async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    throw new ApiError(400, 'Please specify a learning topic');
  }

  let roadmapData = [];
  const topicType = classifyRoadmapTopic(topic);

  const dbUser = await User.findById(req.user._id).select('customAiKey customAiProvider');
  const userApiKey = (req.body.customAiKey || dbUser?.customAiKey || '').trim();
  const userProvider = req.body.customAiProvider || dbUser?.customAiProvider || 'gemini';

  let apiKeyToUse = userApiKey;
  let providerToUse = userProvider;

  if (!apiKeyToUse && process.env.GEMINI_API_KEY) {
    apiKeyToUse = process.env.GEMINI_API_KEY;
    providerToUse = 'gemini';
  } else if (!apiKeyToUse && process.env.OPENAI_API_KEY) {
    apiKeyToUse = process.env.OPENAI_API_KEY;
    providerToUse = 'openai';
  } else if (!apiKeyToUse && process.env.GROQ_API_KEY) {
    apiKeyToUse = process.env.GROQ_API_KEY;
    providerToUse = 'groq';
  }

  const prompt = `
    Generate an expert, high-quality, practical 6-week curriculum for mastering: "${topic}".
    CRITICAL INSTRUCTIONS:
    - STRICTLY AVOID generic filler phrases like "learn basics", "set up tools", "review principles", or "explore techniques".
    - Every week must have a concrete, insightful milestone title and 3-4 specific technical or practical subtopics (mention specific frameworks, syntax, algorithms, industry tools, or exercises).
    - Provide realistic, high-value study resources with descriptive titles and real canonical documentation URLs.
    - Structure your response strictly as a JSON array of objects without markdown formatting or surrounding text:
    [
      {
        "week": "Week 1",
        "topic": "Concrete Milestone Title",
        "details": ["Specific practical subtopic 1", "Specific practical subtopic 2", "Hands-on project task 3"],
        "resources": [
          { "title": "Authoritative Resource Name", "url": "https://example.com/guide", "type": "Docs" }
        ]
      }
    ]
  `;

  if (apiKeyToUse) {
    try {
      const responseText = await callMultiAiProvider({
        provider: providerToUse,
        apiKey: apiKeyToUse,
        prompt
      });
      const parsed = JSON.parse(extractJsonPayload(responseText));
      roadmapData = normalizeRoadmapData(parsed, topic);
    } catch (aiErr) {
      console.warn(`${providerToUse} generation failed, using curated curriculum:`, aiErr.message);
      roadmapData = FALLBACK_ROADMAPS[topicType] || buildCustomRoadmap(topic);
    }
  } else {
    roadmapData = FALLBACK_ROADMAPS[topicType] || buildCustomRoadmap(topic);
  }

  const roadmap = await Roadmap.create({
    user: req.user._id,
    topic,
    roadmapData,
    progress: 0
  });

  return res.status(201).json(
    new ApiResponse(201, { roadmap }, 'Roadmap generated successfully')
  );
});

export const updateRoadmap = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roadmapData, progress } = req.body;

  const roadmap = await Roadmap.findOne({ _id: id, user: req.user._id });
  if (!roadmap) {
    throw new ApiError(404, 'Roadmap not found');
  }

  if (Array.isArray(roadmapData)) {
    roadmap.roadmapData = roadmapData;
  }

  if (typeof progress === 'number') {
    roadmap.progress = Math.max(0, Math.min(100, progress));
  }

  await roadmap.save();

  return res.status(200).json(
    new ApiResponse(200, { roadmap }, 'Roadmap updated successfully')
  );
});

export const deleteRoadmap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const roadmap = await Roadmap.findOneAndDelete({ _id: id, user: req.user._id });
  if (!roadmap) {
    throw new ApiError(404, 'Roadmap not found');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Roadmap removed')
  );
});
