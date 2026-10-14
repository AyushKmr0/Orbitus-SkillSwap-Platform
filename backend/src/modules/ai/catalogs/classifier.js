/**
 * Heuristic topic classifier mapping user-provided topic strings
 * to high-quality curated curriculum templates.
 */
export const classifyRoadmapTopic = (topic) => {
  const normalized = (topic || '').toLowerCase();

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

export default classifyRoadmapTopic;
