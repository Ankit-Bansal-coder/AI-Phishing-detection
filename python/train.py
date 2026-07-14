import os
import re
import json
import random
from urllib.parse import urlparse
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_curve

# Create target directories if they don't exist
os.makedirs("../src/assets", exist_ok=True)

# 1. Robust URL parser matching JS implementation
def parse_url_robust(url_str):
    if not (url_str.startswith('http://') or url_str.startswith('https://')):
        url_for_parsing = 'http://' + url_str
    else:
        url_for_parsing = url_str
    
    try:
        parsed = urlparse(url_for_parsing)
        netloc = parsed.netloc
        path = parsed.path
        
        if not netloc:
            parts = parsed.path.split('/', 1)
            netloc = parts[0]
            path = parts[1] if len(parts) > 1 else ''
            
        if ':' in netloc:
            domain, port = netloc.split(':', 1)
        else:
            domain = netloc
            port = ''
            
        return domain, path, port, parsed.query
    except Exception:
        return '', '', '', ''

# 2. Feature extraction matching JS implementation exactly
FEATURE_NAMES = [
    "url_length",
    "qty_at",
    "qty_double_slash",
    "qty_hyphen_domain",
    "qty_subdomains",
    "qty_https_domain",
    "ip_presence",
    "qty_shortening_service",
    "qty_suspicious_keywords",
    "qty_non_standard_port",
    "tld_safety_index",
    "sensitive_char_ratio"
]

def extract_features(url):
    domain, path, port, query = parse_url_robust(url)
    
    url_len = len(url)
    qty_at = url.count('@')
    
    # qty_double_slash: count of '//' after protocol
    url_no_proto = url
    if url.startswith('http://'):
        url_no_proto = url[7:]
    elif url.startswith('https://'):
        url_no_proto = url[8:]
    qty_double_slash = url_no_proto.count('//')
    
    qty_hyphen_domain = domain.count('-')
    
    # qty_subdomains
    domain_clean = domain.lower()
    if domain_clean.startswith('www.'):
        domain_clean = domain_clean[4:]
    dot_count = domain_clean.count('.')
    qty_subdomains = max(0, dot_count - 1)
    
    qty_https_domain = 1 if 'https' in domain.lower() else 0
    
    # ip_presence
    ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    ip_presence = 1 if re.match(ip_pattern, domain) else 0
    
    # shortening
    shorteners = {'bit.ly', 'tinyurl.com', 't.co', 'rebrand.ly', 'is.gd', 'buff.ly', 'adf.ly', 'ow.ly'}
    qty_shortening_service = 1 if domain.lower() in shorteners else 0
    
    # keywords
    keywords = ['login', 'signin', 'bank', 'secure', 'paypal', 'verify', 'update', 'account', 'bonus', 'free', 'wallet', 'admin', 'webscr', 'cmd', 'security']
    qty_suspicious_keywords = sum(url.lower().count(kw) for kw in keywords)
    
    # non standard port
    qty_non_standard_port = 0
    if port:
        try:
            p_val = int(port)
            if p_val not in (80, 443):
                qty_non_standard_port = 1
        except ValueError:
            qty_non_standard_port = 1
            
    # tld safety index (1 = suspicious, 0 = safe/standard)
    suspicious_tlds = {'.xyz', '.top', '.club', '.work', '.info', '.gq', '.cf', '.ml', '.tk', '.icu', '.loan', '.mobi', '.cc'}
    tld_safety_index = 0
    for tld in suspicious_tlds:
        if domain.lower().endswith(tld):
            tld_safety_index = 1
            break
            
    # sensitive char ratio
    special_chars = ['?', '=', '&', '-', '_', '.']
    special_count = sum(url.count(c) for c in special_chars)
    sensitive_char_ratio = special_count / url_len if url_len > 0 else 0
    
    return [
        url_len,
        qty_at,
        qty_double_slash,
        qty_hyphen_domain,
        qty_subdomains,
        qty_https_domain,
        ip_presence,
        qty_shortening_service,
        qty_suspicious_keywords,
        qty_non_standard_port,
        tld_safety_index,
        sensitive_char_ratio
    ]

# 3. Generating synthetic dataset for training
def generate_synthetic_data(n_samples=5000):
    legit_domains = [
        "google.com", "wikipedia.org", "github.com", "microsoft.com", "apple.com", 
        "amazon.com", "netflix.com", "stackoverflow.com", "linkedin.com", "youtube.com",
        "nytimes.com", "cnn.com", "bbc.co.uk", "yahoo.com", "zoom.us", "dropbox.com",
        "medium.com", "reddit.com", "spotify.com", "salesforce.com"
    ]
    
    legit_paths = [
        "", "about", "contact", "docs", "pricing", "search?q=ai+safety", "settings/profile",
        "index.html", "feed", "blog/posts/2026/07/article-title", "watch?v=dQw4w9WgXcQ",
        "dashboard/home", "help/faq", "terms-and-conditions", "categories/electronics"
    ]
    
    phish_brands = ["paypal", "wellsfargo", "chase", "bankofamerica", "netflix", "microsoft", "google", "facebook", "metamask", "binance", "apple-id", "amazon-security"]
    phish_keywords = ["login", "secure", "verify", "update", "account", "signin", "recovery", "support", "billing", "free-gift", "reward", "resolution-center"]
    phish_tlds = [".xyz", ".top", ".club", ".info", ".cf", ".gq", ".ml", ".tk", ".cc", ".icu"]
    
    data = []
    
    # Generate Legitimate URLs
    for _ in range(n_samples):
        domain = random.choice(legit_domains)
        path = random.choice(legit_paths)
        # Randomly prefix with www or subdomain
        if random.random() < 0.3:
            domain = "www." + domain
        elif random.random() < 0.1:
            domain = f"support.{domain}"
            
        proto = "https://" if random.random() < 0.95 else "http://"
        url = f"{proto}{domain}/{path}"
        if url.endswith('/'):
            url = url[:-1]
        data.append((url, 0)) # 0 = Legit
        
    # Generate Phishing URLs
    for _ in range(n_samples):
        proto = "http://" if random.random() < 0.7 else "https://"
        pattern_type = random.randint(1, 6)
        
        if pattern_type == 1:
            # Typosquatting / Hyphen domain: e.g., paypal-security-update.com
            brand = random.choice(phish_brands)
            kw = random.choice(phish_keywords)
            tld = random.choice([".com", ".net", ".org", ".info"])
            domain = f"{brand}-{kw}{tld}"
            path = random.choice(["", "login.php", "index.html", f"webscr?cmd={random.choice(phish_keywords)}"])
            url = f"{proto}{domain}/{path}"
            
        elif pattern_type == 2:
            # Deep subdomain phishing: e.g., www.paypal.com.login.secure-verification.xyz
            brand = random.choice(phish_brands)
            kw1 = random.choice(phish_keywords)
            kw2 = random.choice(phish_keywords)
            tld = random.choice(phish_tlds)
            domain = f"www.{brand}.com.{kw1}.{kw2}{tld}"
            path = "secure-login"
            url = f"{proto}{domain}/{path}"
            
        elif pattern_type == 3:
            # Shortened URL: e.g., bit.ly/3kHs8a (simulating phishing link redirection)
            shortener = random.choice(["bit.ly", "tinyurl.com", "rebrand.ly"])
            slug = "".join(random.choices("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=6))
            url = f"{proto}{shortener}/{slug}"
            
        elif pattern_type == 4:
            # IP Address as Domain
            ip = f"{random.randint(100, 220)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
            path = f"login/{random.choice(phish_brands)}.html"
            url = f"{proto}{ip}/{path}"
            
        elif pattern_type == 5:
            # Sensitive words in path + suspicious TLD: e.g., verify-identity.club/paypal/signin
            brand = random.choice(phish_brands)
            tld = random.choice(phish_tlds)
            domain = f"account-verification{tld}"
            path = f"{brand}/login.php?email=user@test.com"
            url = f"{proto}{domain}/{path}"
            
        elif pattern_type == 6:
            # Non-standard port or @ symbol usage
            brand = random.choice(phish_brands)
            domain = f"secure-{brand}.net"
            if random.random() < 0.5:
                # @ symbol usage
                url = f"{proto}user@{domain}/login"
            else:
                # non-standard port
                port = random.choice(["8080", "8888", "2121"])
                url = f"{proto}{domain}:{port}/signin"
                
        data.append((url, 1)) # 1 = Phishing
        
    random.shuffle(data)
    return data

# 4. Serialize decision tree
def serialize_tree(tree_model, feature_names):
    tree = tree_model.tree_
    
    def recurse(node_id):
        left_child = tree.children_left[node_id]
        right_child = tree.children_right[node_id]
        
        if left_child == -1 and right_child == -1:
            val = tree.value[node_id][0]
            total = sum(val)
            prob_phishing = val[1] / total if total > 0 else 0.0
            prediction = 1 if prob_phishing >= 0.5 else 0
            return {
                "is_leaf": True,
                "prediction": prediction,
                "probability": float(prob_phishing),
                "samples": int(tree.n_node_samples[node_id])
            }
        else:
            feature_idx = tree.feature[node_id]
            feature_name = feature_names[feature_idx]
            threshold = float(tree.threshold[node_id])
            
            return {
                "is_leaf": False,
                "feature_name": feature_name,
                "feature_index": int(feature_idx),
                "threshold": threshold,
                "left": recurse(left_child),
                "right": recurse(right_child),
                "samples": int(tree.n_node_samples[node_id])
            }
            
    return recurse(0)

# Main script execution
if __name__ == "__main__":
    print("Generating synthetic URL phishing dataset...")
    raw_data = generate_synthetic_data(5000)
    
    urls = [d[0] for d in raw_data]
    labels = [d[1] for d in raw_data]
    
    print("Extracting features...")
    X = []
    for u in urls:
        X.append(extract_features(u))
    X = np.array(X)
    y = np.array(labels)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Logistic Regression model...")
    lr = LogisticRegression(max_iter=1000)
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    lr_prob = lr.predict_proba(X_test)[:, 1]
    
    print("Training Decision Tree model...")
    dt = DecisionTreeClassifier(max_depth=4, random_state=42)
    dt.fit(X_train, y_train)
    dt_pred = dt.predict(X_test)
    dt_prob = dt.predict_proba(X_test)[:, 1]
    
    # Metrics calculation (for Logistic Regression as primary)
    acc = accuracy_score(y_test, lr_pred)
    prec = precision_score(y_test, lr_pred)
    rec = recall_score(y_test, lr_pred)
    f1 = f1_score(y_test, lr_pred)
    cm = confusion_matrix(y_test, lr_pred).tolist() # [[TN, FP], [FN, TP]]
    
    fpr, tpr, _ = roc_curve(y_test, lr_prob)
    # Downsample ROC curve points to keep JSON small
    roc_points = []
    step = max(1, len(fpr) // 50)
    for i in range(0, len(fpr), step):
        roc_points.append({"fpr": float(fpr[i]), "tpr": float(tpr[i])})
    # Ensure final point is 1.0, 1.0
    if roc_points[-1] != {"fpr": 1.0, "tpr": 1.0}:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})
        
    print(f"Metrics (Logistic Regression):")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    
    # Serialize model and save
    model_export = {
        "features": FEATURE_NAMES,
        "logistic_regression": {
            "coefficients": lr.coef_[0].tolist(),
            "intercept": float(lr.intercept_[0]),
            "metrics": {
                "accuracy": float(acc),
                "precision": float(prec),
                "recall": float(rec),
                "f1_score": float(f1),
                "confusion_matrix": cm,
                "roc_curve": roc_points
            }
        },
        "decision_tree": {
            "root": serialize_tree(dt, FEATURE_NAMES),
            "metrics": {
                "accuracy": float(accuracy_score(y_test, dt_pred)),
                "precision": float(precision_score(y_test, dt_pred)),
                "recall": float(recall_score(y_test, dt_pred)),
                "f1_score": float(f1_score(y_test, dt_pred))
            }
        }
    }
    
    output_path = "../src/assets/phishing_model.json"
    with open(output_path, "w") as f:
        json.dump(model_export, f, indent=2)
        
    print(f"Successfully saved trained models and performance data to: {output_path}")
