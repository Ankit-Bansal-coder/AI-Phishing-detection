/**
 * Robustly parses a URL string into its components.
 * Mirrors the Python implementation in train.py.
 */
export function parseUrlRobust(urlStr) {
  let urlForParsing = urlStr;
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlForParsing = 'http://' + urlStr;
  }
  
  try {
    // Replace backslashes with forward slashes (standardizing)
    const normalized = urlForParsing.replace(/\\/g, '/');
    const url = new URL(normalized);
    let domain = url.hostname;
    let path = url.pathname;
    let port = url.port;
    let query = url.search;
    
    // Handle cases where host is not parsed correctly
    if (!domain) {
      const hostPart = normalized.replace(/^(https?:\/\/)?/, '').split('/')[0];
      if (hostPart.includes(':')) {
        const parts = hostPart.split(':');
        domain = parts[0];
        port = parts[1];
      } else {
        domain = hostPart;
      }
    }
    
    return { domain, path, port, query };
  } catch (e) {
    // Fallback split parsing
    let domain = '';
    let path = '';
    let port = '';
    let query = '';
    
    const cleaned = urlStr.replace(/^(https?:\/\/)?/, '');
    const firstSlash = cleaned.indexOf('/');
    let hostPart = firstSlash !== -1 ? cleaned.substring(0, firstSlash) : cleaned;
    path = firstSlash !== -1 ? cleaned.substring(firstSlash) : '';
    
    const firstQuestion = path.indexOf('?');
    if (firstQuestion !== -1) {
      query = path.substring(firstQuestion);
      path = path.substring(0, firstQuestion);
    }
    
    if (hostPart.includes(':')) {
      const parts = hostPart.split(':');
      domain = parts[0];
      port = parts[1];
    } else {
      domain = hostPart;
    }
    
    return { domain, path, port, query };
  }
}

/**
 * Extracts 12 features from a URL matching the python implementation.
 * @param {string} url - The URL to analyze.
 * @returns {number[]} - Feature vector containing 12 elements.
 */
export function extractFeatures(url) {
  const { domain, path, port, query } = parseUrlRobust(url);
  
  const urlLen = url.length;
  
  // 1. qty_at
  const qtyAt = (url.match(/@/g) || []).length;
  
  // 2. qty_double_slash (count of '//' after protocol)
  let urlNoProto = url;
  if (url.startsWith('http://')) {
    urlNoProto = url.substring(7);
  } else if (url.startsWith('https://')) {
    urlNoProto = url.substring(8);
  }
  const qtyDoubleSlash = (urlNoProto.match(/\/\//g) || []).length;
  
  // 3. qty_hyphen_domain
  const qtyHyphenDomain = (domain.match(/-/g) || []).length;
  
  // 4. qty_subdomains
  let domainClean = domain.toLowerCase();
  if (domainClean.startsWith('www.')) {
    domainClean = domainClean.substring(4);
  }
  const dotCount = (domainClean.match(/\./g) || []).length;
  const qtySubdomains = Math.max(0, dotCount - 1);
  
  // 5. qty_https_domain
  const qtyHttpsDomain = domain.toLowerCase().includes('https') ? 1 : 0;
  
  // 6. ip_presence
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipPresence = ipPattern.test(domain) ? 1 : 0;
  
  // 7. qty_shortening_service
  const shorteners = new Set(['bit.ly', 'tinyurl.com', 't.co', 'rebrand.ly', 'is.gd', 'buff.ly', 'adf.ly', 'ow.ly']);
  const qtyShorteningService = shorteners.has(domain.toLowerCase()) ? 1 : 0;
  
  // 8. qty_suspicious_keywords
  const keywords = ['login', 'signin', 'bank', 'secure', 'paypal', 'verify', 'update', 'account', 'bonus', 'free', 'wallet', 'admin', 'webscr', 'cmd', 'security'];
  let qtySuspiciousKeywords = 0;
  const urlLower = url.toLowerCase();
  keywords.forEach(kw => {
    // Count occurrences of kw in urlLower
    let pos = urlLower.indexOf(kw);
    while (pos !== -1) {
      qtySuspiciousKeywords++;
      pos = urlLower.indexOf(kw, pos + kw.length);
    }
  });
  
  // 9. qty_non_standard_port
  let qtyNonStandardPort = 0;
  if (port) {
    const pVal = parseInt(port, 10);
    if (!isNaN(pVal) && pVal !== 80 && pVal !== 443) {
      qtyNonStandardPort = 1;
    } else if (isNaN(pVal)) {
      qtyNonStandardPort = 1;
    }
  }
  
  // 10. tld_safety_index
  const suspiciousTlds = new Set(['.xyz', '.top', '.club', '.work', '.info', '.gq', '.cf', '.ml', '.tk', '.icu', '.loan', '.mobi', '.cc']);
  let tldSafetyIndex = 0;
  const domainLower = domain.toLowerCase();
  for (const tld of suspiciousTlds) {
    if (domainLower.endsWith(tld)) {
      tldSafetyIndex = 1;
      break;
    }
  }
  
  // 11. sensitive_char_ratio
  const specialChars = ['?', '=', '&', '-', '_', '.'];
  let specialCount = 0;
  for (let i = 0; i < url.length; i++) {
    if (specialChars.includes(url[i])) {
      specialCount++;
    }
  }
  const sensitiveCharRatio = urlLen > 0 ? specialCount / urlLen : 0;
  
  // Return the feature vector in exact order matching FEATURE_NAMES
  return [
    urlLen,                 // url_length
    qtyAt,                  // qty_at
    qtyDoubleSlash,         // qty_double_slash
    qtyHyphenDomain,        // qty_hyphen_domain
    qtySubdomains,          // qty_subdomains
    qtyHttpsDomain,         // qty_https_domain
    ipPresence,             // ip_presence
    qtyShorteningService,   // qty_shortening_service
    qtySuspiciousKeywords,  // qty_suspicious_keywords
    qtyNonStandardPort,     // qty_non_standard_port
    tldSafetyIndex,         // tld_safety_index
    sensitiveCharRatio      // sensitive_char_ratio
  ];
}

/**
 * Predicts phishing probability using the Logistic Regression coefficients and intercept.
 */
export function predictLogisticRegression(features, modelData, customWeights = null) {
  const coefficients = customWeights || modelData.logistic_regression.coefficients;
  const intercept = modelData.logistic_regression.intercept;
  
  let z = intercept;
  for (let i = 0; i < features.length; i++) {
    z += coefficients[i] * features[i];
  }
  
  // Sigmoid activation
  const prob = 1 / (1 + Math.exp(-z));
  return prob;
}

/**
 * Recursively predicts using the Decision Tree root node and returns the path taken.
 */
export function predictDecisionTree(features, node) {
  if (node.is_leaf) {
    return {
      probability: node.probability,
      prediction: node.prediction,
      path: []
    };
  }
  
  const val = features[node.feature_index];
  const threshold = node.threshold;
  const matchesCondition = val <= threshold;
  
  const step = {
    nodeSamples: node.samples,
    featureName: node.feature_name,
    featureIndex: node.feature_index,
    value: val,
    threshold: threshold,
    condition: `${node.feature_name} <= ${threshold.toFixed(4)}`,
    isTrue: matchesCondition
  };
  
  const childNode = matchesCondition ? node.left : node.right;
  const result = predictDecisionTree(features, childNode);
  
  return {
    probability: result.probability,
    prediction: result.prediction,
    path: [step, ...result.path]
  };
}
