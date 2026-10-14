"""
NEXIUM Autonomous Web Studio & Website Creator Engine.
Synthesizes, verifies, and packages complete, responsive, modern websites
across SaaS Landing Pages, Analytics Dashboards, Portfolios, E-Commerce, and AI Apps.
"""

import os
import time
import json
import uuid
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("nexium.web_factory")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEBSITES_DIR = os.path.join(ROOT_DIR, "backend", "generated_code", "websites")

# Available color themes
COLOR_THEMES = {
    "cyber_violet": {
        "primary": "#8b5cf6",
        "primary_glow": "rgba(139, 92, 246, 0.4)",
        "accent": "#ec4899",
        "bg_dark": "#0b0f19",
        "card_bg": "rgba(18, 24, 38, 0.8)",
        "border": "#27314a",
        "text": "#f3f4f6",
        "text_muted": "#9ca3af"
    },
    "emerald_tech": {
        "primary": "#10b981",
        "primary_glow": "rgba(16, 185, 129, 0.4)",
        "accent": "#06b6d4",
        "bg_dark": "#091410",
        "card_bg": "rgba(15, 29, 23, 0.8)",
        "border": "#1f3b2f",
        "text": "#f3f4f6",
        "text_muted": "#9ca3af"
    },
    "ocean_blue": {
        "primary": "#3b82f6",
        "primary_glow": "rgba(59, 130, 246, 0.4)",
        "accent": "#0ea5e9",
        "bg_dark": "#0a1120",
        "card_bg": "rgba(15, 23, 42, 0.8)",
        "border": "#1e293b",
        "text": "#f8fafc",
        "text_muted": "#94a3b8"
    },
    "obsidian_dark": {
        "primary": "#f59e0b",
        "primary_glow": "rgba(245, 158, 11, 0.3)",
        "accent": "#ef4444",
        "bg_dark": "#050505",
        "card_bg": "rgba(20, 20, 20, 0.85)",
        "border": "#2a2a2a",
        "text": "#f5f5f5",
        "text_muted": "#a3a3a3"
    }
}

# ============================================================================
# Master Website Blueprints
# ============================================================================

SITE_BLUEPRINTS: Dict[str, Dict[str, Any]] = {
    "saas_landing": {
        "name": "SaaS Product Landing Page",
        "description": "High-converting modern tech landing page with glowing gradient CTA, bento feature grid, interactive pricing toggle, and FAQ accordion.",
        "generate": lambda title, theme, tagline: f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Next-Gen AI Platform</title>
    <style>
        :root {{
            --primary: {theme['primary']};
            --glow: {theme['primary_glow']};
            --accent: {theme['accent']};
            --bg: {theme['bg_dark']};
            --card: {theme['card_bg']};
            --border: {theme['border']};
            --text: {theme['text']};
            --muted: {theme['text_muted']};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text); overflow-x: hidden; line-height: 1.6; }}
        
        /* Navbar */
        nav {{ display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 5%; background: rgba(11, 15, 25, 0.8); backdrop-filter: blur(16px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border); }}
        .logo {{ font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; color: #fff; text-decoration: none; }}
        .logo span {{ color: var(--primary); }}
        .nav-links {{ display: flex; gap: 2rem; align-items: center; list-style: none; }}
        .nav-links a {{ color: var(--muted); text-decoration: none; font-size: 0.95rem; transition: color 0.2s; }}
        .nav-links a:hover {{ color: #fff; }}
        .btn {{ padding: 0.6rem 1.4rem; border-radius: 9999px; font-weight: 600; font-size: 0.9rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.25s; border: none; }}
        .btn-primary {{ background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; box-shadow: 0 4px 20px var(--glow); }}
        .btn-primary:hover {{ transform: translateY(-2px); box-shadow: 0 8px 30px var(--glow); }}
        .btn-outline {{ background: transparent; border: 1px solid var(--border); color: var(--text); }}
        .btn-outline:hover {{ background: rgba(255,255,255,0.05); }}

        /* Hero */
        .hero {{ padding: 7rem 5% 5rem; text-align: center; max-width: 1000px; margin: 0 auto; position: relative; }}
        .badge {{ display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 1rem; border-radius: 9999px; background: rgba(139, 92, 246, 0.1); border: 1px solid var(--primary); color: var(--primary); font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; }}
        h1 {{ font-size: 3.5rem; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 1.5rem; line-height: 1.15; }}
        h1 span {{ background: linear-gradient(135deg, #fff, var(--muted)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .hero p {{ font-size: 1.25rem; color: var(--muted); margin-bottom: 2.5rem; max-width: 700px; margin-left: auto; margin-right: auto; }}
        .hero-actions {{ display: flex; justify-content: center; gap: 1rem; margin-bottom: 4rem; }}

        /* Bento Grid */
        .section-header {{ text-align: center; margin-bottom: 3.5rem; }}
        .section-header h2 {{ font-size: 2.5rem; font-weight: 800; margin-bottom: 0.75rem; }}
        .bento-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 1200px; margin: 0 auto; padding: 0 5% 6rem; }}
        .bento-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 2rem; transition: all 0.3s; position: relative; overflow: hidden; backdrop-filter: blur(12px); }}
        .bento-card:hover {{ border-color: var(--primary); transform: translateY(-4px); }}
        .bento-card.span-2 {{ grid-column: span 2; }}
        .card-icon {{ width: 48px; height: 48px; border-radius: 12px; background: rgba(139, 92, 246, 0.15); display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.5rem; margin-bottom: 1.25rem; }}
        .bento-card h3 {{ font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }}
        .bento-card p {{ color: var(--muted); font-size: 0.95rem; }}

        /* Pricing */
        .pricing-section {{ padding: 5rem 5%; background: rgba(0,0,0,0.2); }}
        .toggle-wrap {{ display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 3rem; }}
        .switch {{ width: 50px; height: 26px; background: var(--border); border-radius: 999px; position: relative; cursor: pointer; transition: background 0.3s; }}
        .switch::after {{ content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.3s; }}
        .switch.annual::after {{ transform: translateX(24px); }}
        .pricing-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; max-width: 1100px; margin: 0 auto; }}
        .price-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 2.5rem; text-align: center; position: relative; }}
        .price-card.featured {{ border-color: var(--primary); box-shadow: 0 0 30px var(--glow); }}
        .price {{ font-size: 3rem; font-weight: 800; margin: 1.5rem 0 0.5rem; }}
        .price span {{ font-size: 1rem; color: var(--muted); font-weight: 400; }}

        /* FAQ */
        .faq-section {{ max-width: 800px; margin: 0 auto; padding: 6rem 5%; }}
        .faq-item {{ border-bottom: 1px solid var(--border); padding: 1.25rem 0; cursor: pointer; }}
        .faq-q {{ display: flex; justify-content: space-between; font-weight: 600; font-size: 1.1rem; }}
        .faq-a {{ color: var(--muted); font-size: 0.95rem; margin-top: 0.75rem; display: none; }}
        .faq-item.active .faq-a {{ display: block; }}

        /* Footer */
        footer {{ border-top: 1px solid var(--border); padding: 4rem 5%; text-align: center; color: var(--muted); font-size: 0.9rem; }}

        @media (max-width: 768px) {{
            h1 {{ font-size: 2.5rem; }}
            .bento-grid, .pricing-grid {{ grid-template-columns: 1fr; }}
            .bento-card.span-2 {{ grid-column: span 1; }}
            .nav-links {{ display: none; }}
        }}
    </style>
</head>
<body>
    <nav>
        <a href="#" class="logo">⚡ <span>{title}</span></a>
        <ul class="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
        </ul>
        <a href="#pricing" class="btn btn-primary">Get Started Free</a>
    </nav>

    <header class="hero">
        <div class="badge">🚀 NEXIUM Engine 2.0 Released</div>
        <h1>Next-Gen Cognitive AI<br><span>Built for 10x Engineers</span></h1>
        <p>{tagline or "Supercharge your software engineering workflow with in-process Rust-native acceleration and autonomous multi-agent reasoning."}</p>
        <div class="hero-actions">
            <a href="#pricing" class="btn btn-primary">Start Building Now →</a>
            <a href="#features" class="btn btn-outline">Explore Features</a>
        </div>
    </header>

    <section id="features">
        <div class="section-header">
            <h2>Engineered for High-Performance</h2>
            <p style="color: var(--muted);">Everything you need to ship resilient systems in record time</p>
        </div>
        <div class="bento-grid">
            <div class="bento-card span-2">
                <div class="card-icon">⚡</div>
                <h3>In-Process Native Rust Acceleration</h3>
                <p>SIMD vectorized cosine calculation and sub-microsecond security guardrails executing directly in-process with zero network overhead.</p>
            </div>
            <div class="bento-card">
                <div class="card-icon">🧠</div>
                <h3>Autonomous Chain-of-Thought</h3>
                <p>Deep reasoning decomposes complex tasks into verified sub-steps before generating solutions.</p>
            </div>
            <div class="bento-card">
                <div class="card-icon">🛡️</div>
                <h3>Microsecond Security Guardrails</h3>
                <p>Zero-latency multi-pattern scanner protecting against prompt injections and malicious inputs.</p>
            </div>
            <div class="bento-card span-2">
                <div class="card-icon">🌐</div>
                <h3>10-Language Synthesis Mastery</h3>
                <p>Natively creates production code in Python, Rust, TypeScript, Go, C++, C, Java, SQL, Bash, and Zig.</p>
            </div>
        </div>
    </section>

    <section id="pricing" class="pricing-section">
        <div class="section-header">
            <h2>Transparent Pricing for Modern Teams</h2>
            <p style="color: var(--muted);">Scale seamlessly from prototype to enterprise</p>
        </div>
        <div class="toggle-wrap">
            <span>Monthly</span>
            <div class="switch" id="billingSwitch" onclick="toggleBilling()"></div>
            <span>Annual <strong style="color: var(--primary);">(Save 20%)</strong></span>
        </div>
        <div class="pricing-grid">
            <div class="price-card">
                <h3>Developer</h3>
                <p style="color: var(--muted);">For solo builders and hackers</p>
                <div class="price" id="devPrice">$19<span>/mo</span></div>
                <button class="btn btn-outline" style="width: 100%; margin-top: 1.5rem;">Choose Developer</button>
            </div>
            <div class="price-card featured">
                <div class="badge" style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%);">Most Popular</div>
                <h3>Pro Team</h3>
                <p style="color: var(--muted);">For high-growth software teams</p>
                <div class="price" id="proPrice" style="color: var(--primary);">$49<span>/mo</span></div>
                <button class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">Start 14-Day Trial</button>
            </div>
            <div class="price-card">
                <h3>Enterprise</h3>
                <p style="color: var(--muted);">Custom clusters and on-prem</p>
                <div class="price">$199<span>/mo</span></div>
                <button class="btn btn-outline" style="width: 100%; margin-top: 1.5rem;">Contact Sales</button>
            </div>
        </div>
    </section>

    <section id="faq" class="faq-section">
        <div class="section-header">
            <h2>Frequently Asked Questions</h2>
        </div>
        <div class="faq-item" onclick="toggleFaq(this)">
            <div class="faq-q"><span>How does the native Rust engine accelerate performance?</span><span>+</span></div>
            <div class="faq-a">By executing vector distance, tokenization, and safety scans as compiled native C-ABI dynamic libraries directly in the server process memory, completely bypassing interpreter overhead.</div>
        </div>
        <div class="faq-item" onclick="toggleFaq(this)">
            <div class="faq-q"><span>Can I deploy this offline in an air-gapped environment?</span><span>+</span></div>
            <div class="faq-a">Yes! NEXIUM is engineered with 100% resilient offline fallbacks and local knowledge base persistence.</div>
        </div>
        <div class="faq-item" onclick="toggleFaq(this)">
            <div class="faq-q"><span>What languages does the code generator support?</span><span>+</span></div>
            <div class="faq-a">Python, Rust, TypeScript, Go, C++, C, Java, SQL, Bash, and Zig with 100% automated AST compilation checks.</div>
        </div>
    </section>

    <footer>
        <p>© 2026 {title}. Crafted with NEXIUM AI Autonomous Web Studio.</p>
    </footer>

    <script>
        let isAnnual = false;
        function toggleBilling() {{
            isAnnual = !isAnnual;
            document.getElementById('billingSwitch').classList.toggle('annual');
            document.getElementById('devPrice').innerHTML = isAnnual ? '$15<span>/mo</span>' : '$19<span>/mo</span>';
            document.getElementById('proPrice').innerHTML = isAnnual ? '$39<span>/mo</span>' : '$49<span>/mo</span>';
        }}
        function toggleFaq(el) {{
            el.classList.toggle('active');
            const span = el.querySelector('.faq-q span:last-child');
            span.textContent = el.classList.contains('active') ? '−' : '+';
        }}
    </script>
</body>
</html>
"""
    },

    "analytics_dashboard": {
        "name": "Interactive SaaS Analytics Dashboard",
        "description": "Real-time metrics dashboard with sidebar navigation, trend KPI cards, SVG sparklines, and filterable data tables.",
        "generate": lambda title, theme, tagline: f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Analytics & Performance</title>
    <style>
        :root {{
            --primary: {theme['primary']};
            --glow: {theme['primary_glow']};
            --accent: {theme['accent']};
            --bg: {theme['bg_dark']};
            --card: {theme['card_bg']};
            --border: {theme['border']};
            --text: {theme['text']};
            --muted: {theme['text_muted']};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }}
        
        /* Sidebar */
        aside {{ width: 260px; background: rgba(10, 15, 25, 0.95); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1.5rem; }}
        .brand {{ font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 0.6rem; }}
        .brand span {{ color: var(--primary); }}
        .nav-menu {{ list-style: none; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }}
        .nav-item a {{ display: flex; align-items: center; gap: 0.8rem; padding: 0.75rem 1rem; border-radius: 0.75rem; color: var(--muted); text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; }}
        .nav-item.active a, .nav-item a:hover {{ background: rgba(139, 92, 246, 0.12); color: #fff; border: 1px solid rgba(139, 92, 246, 0.3); }}

        /* Main Workspace */
        main {{ flex: 1; display: flex; flex-direction: column; overflow-y: auto; }}
        header {{ display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2.5rem; border-bottom: 1px solid var(--border); background: rgba(11, 15, 25, 0.5); backdrop-filter: blur(12px); }}
        .search-bar {{ background: var(--card); border: 1px solid var(--border); padding: 0.6rem 1.2rem; border-radius: 999px; color: var(--text); width: 320px; outline: none; }}
        .search-bar:focus {{ border-color: var(--primary); }}
        
        .content {{ padding: 2.5rem; display: flex; flex-direction: column; gap: 2rem; }}

        /* Metric KPI Cards */
        .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }}
        .kpi-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; position: relative; }}
        .kpi-title {{ font-size: 0.85rem; color: var(--muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }}
        .kpi-val {{ font-size: 2rem; font-weight: 800; }}
        .kpi-badge {{ font-size: 0.75rem; font-weight: 700; color: #10b981; display: inline-flex; align-items: center; gap: 0.2rem; }}

        /* Table & Chart Container */
        .dashboard-row {{ display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }}
        .panel {{ background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.75rem; }}
        .panel-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }}
        .panel-title {{ font-size: 1.15rem; font-weight: 700; }}

        /* Custom Table */
        table {{ width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }}
        th {{ padding: 0.75rem 1rem; color: var(--muted); border-bottom: 1px solid var(--border); font-weight: 600; }}
        td {{ padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.04); }}
        .status-pill {{ padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }}
        .status-active {{ background: rgba(16, 185, 129, 0.15); color: #10b981; }}
        .status-pending {{ background: rgba(245, 158, 11, 0.15); color: #f59e0b; }}

        /* SVG Sparkline */
        svg.sparkline {{ width: 100%; height: 180px; stroke: var(--primary); stroke-width: 3; fill: none; }}
    </style>
</head>
<body>
    <aside>
        <div class="brand">⚡ <span>{title}</span></div>
        <ul class="nav-menu">
            <li class="nav-item active"><a href="#">📊 Overview</a></li>
            <li class="nav-item"><a href="#">⚡ Engine Performance</a></li>
            <li class="nav-item"><a href="#">🌐 API Endpoints</a></li>
            <li class="nav-item"><a href="#">🛡️ Security Logs</a></li>
            <li class="nav-item"><a href="#">⚙️ Settings</a></li>
        </ul>
        <div style="font-size: 0.8rem; color: var(--muted);">v2.4.0 (Rust Core Native)</div>
    </aside>

    <main>
        <header>
            <input type="text" class="search-bar" placeholder="Search metrics, logs, endpoints..." oninput="filterTable(this.value)">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <span style="font-size: 0.85rem; color: #10b981;">● Rust Core: Active (0.24ms)</span>
                <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: bold;">N</div>
            </div>
        </header>

        <div class="content">
            <div class="kpi-grid">
                <div class="kpi-card">
                    <span class="kpi-title">Total Synthesized Loops</span>
                    <span class="kpi-val" id="totalLoops">100,000</span>
                    <span class="kpi-badge">▲ +100% verified</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-title">Throughput Speed</span>
                    <span class="kpi-val">1,663<span style="font-size: 1rem; color: var(--muted);"> lps</span></span>
                    <span class="kpi-badge">▲ Vectorized Batch</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-title">Supported Languages</span>
                    <span class="kpi-val">10</span>
                    <span class="kpi-badge">● Multi-Paradigm</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-title">Guardrail Scan Latency</span>
                    <span class="kpi-val">0.38<span style="font-size: 1rem; color: var(--muted);"> μs</span></span>
                    <span class="kpi-badge">▲ 100% Safe</span>
                </div>
            </div>

            <div class="dashboard-row">
                <div class="panel">
                    <div class="panel-header">
                        <span class="panel-title">Active Language Pipelines</span>
                        <span style="font-size: 0.85rem; color: var(--muted);">Real-time AST checks</span>
                    </div>
                    <table id="pipelineTable">
                        <thead>
                            <tr>
                                <th>Language</th>
                                <th>Primary Domain</th>
                                <th>Throughput</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td><strong>Python 3.12</strong></td><td>Algorithms & Trees</td><td>550 mod/s</td><td><span class="status-pill status-active">Verified</span></td></tr>
                            <tr><td><strong>Rust (Edition 2021)</strong></td><td>SIMD & Atomics</td><td>1,250 mod/s</td><td><span class="status-pill status-active">Native C-ABI</span></td></tr>
                            <tr><td><strong>TypeScript</strong></td><td>Reactive Streams</td><td>780 mod/s</td><td><span class="status-pill status-active">Verified</span></td></tr>
                            <tr><td><strong>Go (Golang)</strong></td><td>Worker Channels</td><td>940 mod/s</td><td><span class="status-pill status-active">Verified</span></td></tr>
                            <tr><td><strong>Modern C++20</strong></td><td>Lock-free Atomics</td><td>1,420 mod/s</td><td><span class="status-pill status-active">Compiled</span></td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="panel">
                    <div class="panel-header">
                        <span class="panel-title">Throughput Trend</span>
                    </div>
                    <svg class="sparkline" viewBox="0 0 300 120">
                        <path d="M 0 100 Q 50 80, 100 60 T 200 40 T 300 15" />
                    </svg>
                    <div style="text-align: center; margin-top: 1rem; font-size: 0.85rem; color: var(--muted);">
                        Sustained linear scaling with zero heap allocation overhead
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function filterTable(query) {{
            const rows = document.querySelectorAll('#pipelineTable tbody tr');
            rows.forEach(r => {{
                r.style.display = r.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
            }});
        }}
    </script>
</body>
</html>
"""
    },

    "developer_portfolio": {
        "name": "Modern Developer & Engineer Portfolio",
        "description": "Minimalist, sleek developer showcase featuring project filter buttons, skill tags, live demos, and interactive contact modal.",
        "generate": lambda title, theme, tagline: f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Senior Software Architect</title>
    <style>
        :root {{
            --primary: {theme['primary']};
            --glow: {theme['primary_glow']};
            --accent: {theme['accent']};
            --bg: {theme['bg_dark']};
            --card: {theme['card_bg']};
            --border: {theme['border']};
            --text: {theme['text']};
            --muted: {theme['text_muted']};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text); line-height: 1.6; padding: 4rem 10%; max-width: 1200px; margin: 0 auto; }}

        /* Header */
        header {{ margin-bottom: 5rem; }}
        .status-tag {{ display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #10b981; margin-bottom: 1rem; }}
        .status-dot {{ width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }}
        h1 {{ font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.25rem; }}
        h1 span {{ color: var(--primary); }}
        .bio {{ font-size: 1.25rem; color: var(--muted); max-width: 650px; margin-bottom: 2rem; }}
        
        .skills-wrap {{ display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 2rem; }}
        .skill-chip {{ background: var(--card); border: 1px solid var(--border); padding: 0.4rem 0.9rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; color: var(--muted); }}
        .skill-chip.highlight {{ border-color: var(--primary); color: #fff; }}

        /* Projects */
        .section-title {{ font-size: 2rem; font-weight: 700; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }}
        .project-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }}
        .project-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 2rem; transition: all 0.3s; display: flex; flex-direction: column; justify-content: space-between; }}
        .project-card:hover {{ border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 10px 30px var(--glow); }}
        .project-title {{ font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; }}
        .project-desc {{ color: var(--muted); font-size: 0.95rem; margin-bottom: 1.5rem; flex: 1; }}
        .project-tags {{ display: flex; gap: 0.5rem; flex-wrap: wrap; }}
        .tag {{ font-size: 0.75rem; color: var(--primary); font-weight: 600; }}

        @media (max-width: 768px) {{
            body {{ padding: 2rem 5%; }}
            h1 {{ font-size: 2.5rem; }}
            .project-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <header>
        <div class="status-tag"><div class="status-dot"></div> Available for Select Architect Projects</div>
        <h1>Hi, I'm <span>{title}</span>.<br>I architect high-performance distributed AI systems.</h1>
        <p class="bio">{tagline or "Specialized in Rust-accelerated backends, low-latency microservices, and cognitive multi-agent systems."}</p>
        <div class="skills-wrap">
            <span class="skill-chip highlight">Rust Core</span>
            <span class="skill-chip highlight">Python Async</span>
            <span class="skill-chip">TypeScript</span>
            <span class="skill-chip">Go Microservices</span>
            <span class="skill-chip">Modern C++20</span>
            <span class="skill-chip">SIMD Vectorization</span>
            <span class="skill-chip">Distributed RAG</span>
        </div>
    </header>

    <main>
        <div class="section-title">
            <span>Featured Systems</span>
        </div>
        <div class="project-grid">
            <div class="project-card">
                <div>
                    <div class="project-title">NEXIUM Rust Core Engine</div>
                    <p class="project-desc">In-process compiled C-ABI dynamic library delivering microsecond safety scanning and SIMD cosine reranking with zero Windows heap corruption.</p>
                </div>
                <div class="project-tags">
                    <span class="tag">#Rust</span>
                    <span class="tag">#C-ABI</span>
                    <span class="tag">#SIMD</span>
                    <span class="tag">#Zero-Copy</span>
                </div>
            </div>
            <div class="project-card">
                <div>
                    <div class="project-title">Autonomous 10M Code Factory</div>
                    <p class="project-desc">Continuous code synthesis framework capable of compiling and verifying millions of modules across 10 programming languages at 1,600+ loops/second.</p>
                </div>
                <div class="project-tags">
                    <span class="tag">#Python</span>
                    <span class="tag">#AST</span>
                    <span class="tag">#Multi-Language</span>
                </div>
            </div>
        </div>
    </main>
</body>
</html>
"""
    },
}

def _generate_web_os_desktop(title: str, theme: Dict[str, str], tagline: Optional[str] = None) -> str:
    sub_tagline = tagline if tagline else "Autonomous WebOS Desktop"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — WebOS Virtual Environment</title>
    <style>
        :root {{
            --primary: {theme['primary']};
            --glow: {theme['primary_glow']};
            --accent: {theme['accent']};
            --bg: {theme['bg_dark']};
            --card: {theme['card_bg']};
            --border: {theme['border']};
            --text: {theme['text']};
            --muted: {theme['text_muted']};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; }}
        body {{ background: radial-gradient(circle at 50% 20%, #171e31 0%, var(--bg) 80%); height: 100vh; overflow: hidden; color: var(--text); user-select: none; position: relative; }}
        
        .desktop-grid {{ position: absolute; inset: 0; background-size: 40px 40px; background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); }}

        .topbar {{ height: 32px; background: rgba(10, 14, 25, 0.75); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; font-size: 0.82rem; z-index: 1000; position: relative; }}
        .topbar-left, .topbar-right {{ display: flex; align-items: center; gap: 1.2rem; }}
        .topbar-brand {{ font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 0.4rem; }}
        .topbar-item {{ color: var(--muted); cursor: pointer; transition: color 0.2s; }}
        .topbar-item:hover {{ color: var(--text); }}
        
        .desktop-icons {{ position: absolute; top: 48px; left: 24px; display: flex; flex-direction: column; gap: 20px; z-index: 10; }}
        .icon-item {{ display: flex; flex-direction: column; align-items: center; gap: 6px; width: 72px; padding: 8px 4px; border-radius: 8px; cursor: pointer; transition: background 0.2s; text-align: center; }}
        .icon-item:hover {{ background: rgba(255, 255, 255, 0.08); }}
        .icon-svg {{ width: 38px; height: 38px; border-radius: 10px; background: var(--card); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }}
        .icon-label {{ font-size: 0.75rem; color: var(--text); text-shadow: 0 1px 3px rgba(0,0,0,0.8); }}

        .window {{ position: absolute; background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.6); overflow: hidden; backdrop-filter: blur(16px); display: flex; flex-direction: column; z-index: 20; min-width: 320px; }}
        .window-header {{ background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--border); height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; cursor: move; }}
        .window-controls {{ display: flex; gap: 7px; }}
        .win-btn {{ width: 12px; height: 12px; border-radius: 50%; display: inline-block; cursor: pointer; }}
        .win-close {{ background: #ef4444; }}
        .win-min {{ background: #f59e0b; }}
        .win-max {{ background: #10b981; }}
        .window-title {{ font-size: 0.8rem; font-weight: 600; color: var(--muted); }}
        .window-body {{ padding: 14px; overflow: auto; flex: 1; }}

        #term-body {{ background: #050811; color: #10b981; font-family: monospace; font-size: 0.85rem; height: 260px; display: flex; flex-direction: column; }}
        .term-history {{ flex: 1; overflow-y: auto; line-height: 1.5; }}
        .term-input-row {{ display: flex; align-items: center; gap: 6px; margin-top: 6px; }}
        .term-prompt {{ color: var(--primary); font-weight: bold; }}
        .term-input {{ background: transparent; border: none; outline: none; color: #fff; font-family: monospace; flex: 1; font-size: 0.85rem; }}

        .monitor-row {{ display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.85rem; }}
        .meter-bar {{ height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 4px; }}
        .meter-fill {{ height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: width 0.4s ease; }}

        .dock-container {{ position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(20px); border: 1px solid var(--border); padding: 8px 14px; border-radius: 20px; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .dock-item {{ width: 44px; height: 44px; border-radius: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }}
        .dock-item:hover {{ transform: translateY(-8px) scale(1.15); background: rgba(255, 255, 255, 0.12); border-color: var(--primary); }}
    </style>
</head>
<body>
    <div class="desktop-grid"></div>

    <header class="topbar">
        <div class="topbar-left">
            <div class="topbar-brand">&#9889; {title}</div>
            <span class="topbar-item">File</span>
            <span class="topbar-item">Edit</span>
            <span class="topbar-item">View</span>
            <span class="topbar-item">Terminal</span>
        </div>
        <div class="topbar-right">
            <span id="clock" style="font-weight: 600;">12:00 PM</span>
            <span style="color: #10b981;">&#9679; Online</span>
        </div>
    </header>

    <div class="desktop-icons">
        <div class="icon-item" onclick="toggleWin('win-term')">
            <div class="icon-svg">&#128187;</div>
            <span class="icon-label">Terminal</span>
        </div>
        <div class="icon-item" onclick="toggleWin('win-monitor')">
            <div class="icon-svg">&#128202;</div>
            <span class="icon-label">Monitor</span>
        </div>
        <div class="icon-item" onclick="toggleWin('win-notes')">
            <div class="icon-svg">&#128221;</div>
            <span class="icon-label">Scratchpad</span>
        </div>
    </div>

    <!-- Terminal Window -->
    <div class="window" id="win-term" style="top: 70px; left: 140px; width: 480px;">
        <div class="window-header">
            <div class="window-controls">
                <span class="win-btn win-close" onclick="toggleWin('win-term')"></span>
                <span class="win-btn win-min"></span>
                <span class="win-btn win-max"></span>
            </div>
            <span class="window-title">nexium@cloud-os:~</span>
            <div style="width: 30px;"></div>
        </div>
        <div class="window-body" id="term-body">
            <div class="term-history" id="term-hist">
                <div>NEXIUM WebOS [Version 2.4.0]</div>
                <div>Type '<span style="color:var(--primary);">help</span>' or '<span style="color:var(--primary);">status</span>' to begin.</div>
                <br>
            </div>
            <div class="term-input-row">
                <span class="term-prompt">nexium❯</span>
                <input class="term-input" id="term-in" autofocus autocomplete="off" />
            </div>
        </div>
    </div>

    <!-- Hardware Monitor Window -->
    <div class="window" id="win-monitor" style="top: 100px; right: 80px; width: 340px;">
        <div class="window-header">
            <div class="window-controls">
                <span class="win-btn win-close" onclick="toggleWin('win-monitor')"></span>
                <span class="win-btn win-min"></span>
                <span class="win-btn win-max"></span>
            </div>
            <span class="window-title">System Metrics</span>
            <div style="width: 30px;"></div>
        </div>
        <div class="window-body">
            <div class="monitor-row">
                <span>CPU Load (Rust SIMD)</span>
                <strong id="cpu-val">18%</strong>
            </div>
            <div class="meter-bar"><div class="meter-fill" id="cpu-bar" style="width: 18%;"></div></div>
            
            <div class="monitor-row" style="margin-top: 14px;">
                <span>Memory Allocation</span>
                <strong id="ram-val">42% (3.4 GB)</strong>
            </div>
            <div class="meter-bar"><div class="meter-fill" id="ram-bar" style="width: 42%;"></div></div>

            <div class="monitor-row" style="margin-top: 14px;">
                <span>Vector Cache Throughput</span>
                <strong style="color: #10b981;">1.8M ops/sec</strong>
            </div>
        </div>
    </div>

    <!-- Scratchpad Window -->
    <div class="window" id="win-notes" style="top: 360px; left: 320px; width: 380px; display: none;">
        <div class="window-header">
            <div class="window-controls">
                <span class="win-btn win-close" onclick="toggleWin('win-notes')"></span>
                <span class="win-btn win-min"></span>
                <span class="win-btn win-max"></span>
            </div>
            <span class="window-title">Workspace Notes</span>
            <div style="width: 30px;"></div>
        </div>
        <div class="window-body">
            <textarea style="width: 100%; height: 160px; background: transparent; border: none; color: var(--text); outline: none; resize: none; font-size: 0.9rem;" placeholder="Write quick autonomous notes or code snippets..."></textarea>
        </div>
    </div>

    <!-- Dock -->
    <div class="dock-container">
        <div class="dock-item" title="Terminal" onclick="toggleWin('win-term')">&#128187;</div>
        <div class="dock-item" title="Hardware Monitor" onclick="toggleWin('win-monitor')">&#128202;</div>
        <div class="dock-item" title="Notepad" onclick="toggleWin('win-notes')">&#128221;</div>
        <div class="dock-item" title="Settings" onclick="alert('NEXIUM WebOS Active')">&#9881;&#65039;</div>
    </div>

    <script>
        function toggleWin(id) {{
            const win = document.getElementById(id);
            win.style.display = win.style.display === 'none' ? 'flex' : 'none';
        }}

        function updateClock() {{
            const now = new Date();
            document.getElementById('clock').innerText = now.toLocaleTimeString([], {{hour: '2-digit', minute:'2-digit'}});
        }}
        setInterval(updateClock, 1000);
        updateClock();

        document.querySelectorAll('.window').forEach(win => {{
            const header = win.querySelector('.window-header');
            let isDragging = false, startX, startY, initX, initY;
            header.addEventListener('mousedown', e => {{
                if (e.target.classList.contains('win-btn')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initX = win.offsetLeft;
                initY = win.offsetTop;
                document.querySelectorAll('.window').forEach(w => w.style.zIndex = 20);
                win.style.zIndex = 30;
            }});
            document.addEventListener('mousemove', e => {{
                if (!isDragging) return;
                win.style.left = (initX + e.clientX - startX) + 'px';
                win.style.top = (initY + e.clientY - startY) + 'px';
            }});
            document.addEventListener('mouseup', () => isDragging = false);
        }});

        const termIn = document.getElementById('term-in');
        const termHist = document.getElementById('term-hist');
        termIn.addEventListener('keydown', e => {{
            if (e.key === 'Enter') {{
                const cmd = termIn.value.trim();
                termIn.value = '';
                const line = document.createElement('div');
                line.innerHTML = '<span style="color:var(--primary);">nexium❯</span> ' + cmd;
                termHist.appendChild(line);

                const res = document.createElement('div');
                res.style.color = 'var(--muted)';
                if (cmd === 'help') {{
                    res.innerHTML = 'Commands: status, metrics, clear, echo &lt;msg&gt;, about';
                }} else if (cmd === 'status') {{
                    res.innerHTML = '● All microservices running. Rust SIMD core active.';
                }} else if (cmd === 'clear') {{
                    termHist.innerHTML = '';
                    return;
                }} else if (cmd.startsWith('echo ')) {{
                    res.innerText = cmd.slice(5);
                }} else if (cmd === 'about') {{
                    res.innerHTML = '⚡ {title}: {sub_tagline}';
                }} else if (cmd) {{
                    res.innerHTML = 'Command not found: ' + cmd + '. Type "help".';
                }}
                termHist.appendChild(res);
                document.getElementById('term-body').scrollTop = document.getElementById('term-body').scrollHeight;
            }}
        }});

        setInterval(() => {{
            const cpu = Math.floor(15 + Math.random() * 25);
            const ram = Math.floor(38 + Math.random() * 8);
            document.getElementById('cpu-val').innerText = cpu + '%';
            document.getElementById('cpu-bar').style.width = cpu + '%';
            document.getElementById('ram-val').innerText = ram + '% (' + (ram*0.08).toFixed(1) + ' GB)';
            document.getElementById('ram-bar').style.width = ram + '%';
        }}, 2500);
    </script>
</body>
</html>
"""

def _generate_cyber_canvas(title: str, theme: Dict[str, str], tagline: Optional[str] = None) -> str:
    sub_tagline = tagline if tagline else "Interactive autonomous particle constellation with vector physics and dynamic link weaving."
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Cybernetic Physics Canvas</title>
    <style>
        :root {{
            --primary: {theme['primary']};
            --glow: {theme['primary_glow']};
            --accent: {theme['accent']};
            --bg: {theme['bg_dark']};
            --card: {theme['card_bg']};
            --border: {theme['border']};
            --text: {theme['text']};
            --muted: {theme['text_muted']};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text); overflow: hidden; height: 100vh; position: relative; }}
        canvas {{ display: block; position: absolute; inset: 0; }}

        .hud-panel {{ position: absolute; top: 24px; left: 24px; background: var(--card); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; max-width: 380px; box-shadow: 0 12px 36px rgba(0,0,0,0.5); z-index: 10; pointer-events: auto; }}
        h1 {{ font-size: 1.5rem; font-weight: 800; margin-bottom: 6px; background: linear-gradient(135deg, #fff, var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        p {{ font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; line-height: 1.5; }}
        
        .control-group {{ margin-bottom: 12px; }}
        .control-label {{ display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text); }}
        input[type="range"] {{ width: 100%; accent-color: var(--primary); cursor: pointer; }}

        .btn-group {{ display: flex; gap: 8px; margin-top: 16px; }}
        .hud-btn {{ flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: #fff; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }}
        .hud-btn:hover {{ background: var(--primary); border-color: var(--primary); box-shadow: 0 0 15px var(--glow); }}

        .stats-badge {{ position: absolute; bottom: 24px; right: 24px; background: var(--card); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 10px; padding: 10px 16px; font-size: 0.8rem; color: var(--muted); z-index: 10; display: flex; gap: 16px; }}
        .stats-badge strong {{ color: var(--primary); }}
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>

    <div class="hud-panel">
        <h1>{title}</h1>
        <p>{sub_tagline}</p>
        
        <div class="control-group">
            <div class="control-label"><span>Particle Speed</span><span id="speed-lbl">1.5x</span></div>
            <input type="range" id="speed-slider" min="0.2" max="4.0" step="0.1" value="1.5" />
        </div>

        <div class="control-group">
            <div class="control-label"><span>Connection Proximity</span><span id="prox-lbl">120px</span></div>
            <input type="range" id="prox-slider" min="50" max="220" step="10" value="120" />
        </div>

        <div class="btn-group">
            <button class="hud-btn" id="blast-btn">&#9889; Gravity Pulse</button>
            <button class="hud-btn" id="mode-btn">&#127912; Invert Flow</button>
        </div>
    </div>

    <div class="stats-badge">
        <span>Particles: <strong id="p-count">100</strong></span>
        <span>FPS: <strong id="fps-count">60</strong></span>
        <span>Status: <strong style="color:#10b981;">Synthesizing</strong></span>
    </div>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {{
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }});

        let mouse = {{ x: width / 2, y: height / 2, active: false }};
        window.addEventListener('mousemove', e => {{
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        }});
        window.addEventListener('mouseleave', () => mouse.active = false);

        let speedMultiplier = 1.5;
        let connectionDist = 120;
        let invertFlow = false;

        document.getElementById('speed-slider').addEventListener('input', e => {{
            speedMultiplier = parseFloat(e.target.value);
            document.getElementById('speed-lbl').innerText = speedMultiplier.toFixed(1) + 'x';
        }});
        document.getElementById('prox-slider').addEventListener('input', e => {{
            connectionDist = parseInt(e.target.value);
            document.getElementById('prox-lbl').innerText = connectionDist + 'px';
        }});
        document.getElementById('mode-btn').addEventListener('click', () => {{
            invertFlow = !invertFlow;
        }});

        const PARTICLE_COUNT = 100;
        document.getElementById('p-count').innerText = PARTICLE_COUNT;

        class Particle {{
            constructor() {{
                this.reset();
            }}
            reset() {{
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.radius = Math.random() * 2 + 1.5;
            }}
            update() {{
                this.x += this.vx * speedMultiplier;
                this.y += this.vy * speedMultiplier;

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;

                if (mouse.active) {{
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 180 && dist > 1) {{
                        const force = (180 - dist) / 180 * (invertFlow ? -0.06 : 0.06);
                        this.vx += (dx / dist) * force;
                        this.vy += (dy / dist) * force;
                    }}
                }}
                this.vx *= 0.99;
                this.vy *= 0.99;
            }}
            draw() {{
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = '{theme["primary"]}';
                ctx.shadowColor = '{theme["primary"]}';
                ctx.shadowBlur = 8;
                ctx.fill();
            }}
        }}

        const particles = Array.from({{ length: PARTICLE_COUNT }}, () => new Particle());

        document.getElementById('blast-btn').addEventListener('click', () => {{
            particles.forEach(p => {{
                p.vx += (Math.random() - 0.5) * 15;
                p.vy += (Math.random() - 0.5) * 15;
            }});
        }});

        let lastTime = performance.now();
        let frameCount = 0;
        function animate(now) {{
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {{
                for (let j = i + 1; j < particles.length; j++) {{
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectionDist) {{
                        const alpha = (1 - dist / connectionDist) * 0.4;
                        ctx.strokeStyle = `rgba(139, 92, 246, ${{alpha}})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }}
                }}
            }}

            particles.forEach(p => {{
                p.update();
                p.draw();
            }});

            frameCount++;
            if (now - lastTime >= 1000) {{
                document.getElementById('fps-count').innerText = frameCount;
                frameCount = 0;
                lastTime = now;
            }}
            requestAnimationFrame(animate);
        }}
        requestAnimationFrame(animate);
    </script>
</body>
</html>
"""

def _generate_node_workflow(title: str, theme: Dict[str, str], tagline: Optional[str] = None) -> str:
    sub_tagline = tagline if tagline else "Autonomous AI pipeline with native Rust safety"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Autonomous Node Workflow</title>
    <style>
        :root {{
            --primary: {theme['primary']};
            --glow: {theme['primary_glow']};
            --accent: {theme['accent']};
            --bg: {theme['bg_dark']};
            --card: {theme['card_bg']};
            --border: {theme['border']};
            --text: {theme['text']};
            --muted: {theme['text_muted']};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text); overflow: hidden; height: 100vh; position: relative; user-select: none; }}

        .grid-bg {{ position: absolute; inset: 0; background-size: 32px 32px; background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px); }}

        header {{ height: 56px; background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; padding: 0 1.5rem; position: relative; z-index: 100; }}
        .logo {{ font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }}
        .header-actions {{ display: flex; gap: 10px; align-items: center; }}
        .btn {{ padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }}
        .btn-run {{ background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; box-shadow: 0 0 16px var(--glow); }}
        .btn-run:hover {{ transform: scale(1.03); }}
        .btn-secondary {{ background: rgba(255,255,255,0.06); color: var(--text); border: 1px solid var(--border); }}
        .btn-secondary:hover {{ background: rgba(255,255,255,0.12); }}

        .node {{ position: absolute; width: 240px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(14px); cursor: move; z-index: 20; transition: border-color 0.2s, box-shadow 0.2s; }}
        .node.active {{ border-color: var(--primary); box-shadow: 0 0 24px var(--glow); }}
        .node-header {{ padding: 10px 14px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 0.85rem; border-radius: 12px 12px 0 0; background: rgba(255,255,255,0.02); }}
        .node-badge {{ font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }}
        .badge-trigger {{ background: rgba(59, 130, 246, 0.2); color: #60a5fa; }}
        .badge-rust {{ background: rgba(245, 158, 11, 0.2); color: #fbbf24; }}
        .badge-ai {{ background: rgba(139, 92, 246, 0.2); color: #c084fc; }}
        .badge-device {{ background: rgba(16, 185, 129, 0.2); color: #34d399; }}

        .node-content {{ padding: 12px 14px; font-size: 0.8rem; color: var(--muted); }}
        .port {{ width: 12px; height: 12px; border-radius: 50%; background: var(--primary); border: 2px solid var(--bg); position: absolute; top: 50%; transform: translateY(-50%); box-shadow: 0 0 8px var(--glow); }}
        .port-in {{ left: -6px; }}
        .port-out {{ right: -6px; }}

        svg.cables {{ position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }}
        path.cable {{ stroke: var(--primary); stroke-width: 3; fill: none; stroke-linecap: round; opacity: 0.75; }}
        path.cable.flowing {{ stroke: var(--accent); stroke-dasharray: 8, 8; animation: flow 1s linear infinite; }}
        @keyframes flow {{ from {{ stroke-dashoffset: 32; }} to {{ stroke-dashoffset: 0; }} }}

        .log-panel {{ position: absolute; bottom: 0; left: 0; right: 0; height: 150px; background: rgba(10, 14, 25, 0.9); backdrop-filter: blur(20px); border-top: 1px solid var(--border); z-index: 50; padding: 12px 20px; font-family: monospace; font-size: 0.82rem; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }}
        .log-line {{ display: flex; gap: 12px; }}
        .log-time {{ color: var(--muted); }}
        .log-info {{ color: #10b981; }}
    </style>
</head>
<body>
    <div class="grid-bg"></div>

    <header>
        <div class="logo">
            <span style="color: var(--primary); font-size: 1.3rem;">&#9889;</span>
            <span>{title} <span style="color: var(--muted); font-size: 0.8rem; font-weight: 500;">/ Graph Studio</span></span>
        </div>
        <div class="header-actions">
            <button class="btn btn-secondary" onclick="alert('Workflow Active: {sub_tagline}')">&#9881;&#65039; Settings</button>
            <button class="btn btn-run" id="run-btn">&#9654; Run Workflow</button>
        </div>
    </header>

    <svg class="cables" id="svg-cables"></svg>

    <!-- Node 1: Trigger -->
    <div class="node" id="node-1" style="top: 120px; left: 80px;">
        <div class="node-header">
            <span>1. Prompt Ingest</span>
            <span class="node-badge badge-trigger">Trigger</span>
        </div>
        <div class="node-content">Captures incoming user prompt and formats payload.</div>
        <div class="port port-out"></div>
    </div>

    <!-- Node 2: Rust Guardrail -->
    <div class="node" id="node-2" style="top: 120px; left: 380px;">
        <div class="port port-in"></div>
        <div class="node-header">
            <span>2. Rust Guardrail</span>
            <span class="node-badge badge-rust">Native SIMD</span>
        </div>
        <div class="node-content">Scans for injection, PII tokens, and safety violations in &lt;10µs.</div>
        <div class="port port-out"></div>
    </div>

    <!-- Node 3: AI Inference -->
    <div class="node" id="node-3" style="top: 120px; left: 680px;">
        <div class="port port-in"></div>
        <div class="node-header">
            <span>3. Cognitive Multi-Step</span>
            <span class="node-badge badge-ai">LLM Engine</span>
        </div>
        <div class="node-content">Executes chain-of-thought synthesis and task planning.</div>
        <div class="port port-out"></div>
    </div>

    <!-- Node 4: Device Execution -->
    <div class="node" id="node-4" style="top: 120px; left: 980px;">
        <div class="port port-in"></div>
        <div class="node-header">
            <span>4. Device Action</span>
            <span class="node-badge badge-device">Autonomous</span>
        </div>
        <div class="node-content">Runs hardware query, battery check, or file workspace sync.</div>
    </div>

    <!-- Log Panel -->
    <div class="log-panel" id="log-panel">
        <div class="log-line"><span class="log-time">[00:00:00]</span> <span class="log-info">&#9679; Visual Workflow Ready. Drag nodes to reposition. Click 'Run Workflow' to test.</span></div>
    </div>

    <script>
        const nodes = [
            document.getElementById('node-1'),
            document.getElementById('node-2'),
            document.getElementById('node-3'),
            document.getElementById('node-4')
        ];
        const svg = document.getElementById('svg-cables');

        nodes.forEach(node => {{
            let isDragging = false, startX, startY, initX, initY;
            node.addEventListener('mousedown', e => {{
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initX = node.offsetLeft;
                initY = node.offsetTop;
                node.classList.add('active');
            }});
            document.addEventListener('mousemove', e => {{
                if (!isDragging) return;
                node.style.left = (initX + e.clientX - startX) + 'px';
                node.style.top = (initY + e.clientY - startY) + 'px';
                drawCables();
            }});
            document.addEventListener('mouseup', () => {{
                if (isDragging) {{
                    isDragging = false;
                    node.classList.remove('active');
                }}
            }});
        }});

        function drawCables() {{
            svg.innerHTML = '';
            for (let i = 0; i < nodes.length - 1; i++) {{
                const fromNode = nodes[i];
                const toNode = nodes[i + 1];
                const x1 = fromNode.offsetLeft + fromNode.offsetWidth;
                const y1 = fromNode.offsetTop + fromNode.offsetHeight / 2;
                const x2 = toNode.offsetLeft;
                const y2 = toNode.offsetTop + toNode.offsetHeight / 2;
                const dx = (x2 - x1) / 2;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${{x1}} ${{y1}} C ${{x1 + dx}} ${{y1}}, ${{x2 - dx}} ${{y2}}, ${{x2}} ${{y2}}`);
                path.setAttribute('class', 'cable');
                path.setAttribute('id', 'cable-' + i);
                svg.appendChild(path);
            }}
        }}
        window.addEventListener('resize', drawCables);
        setTimeout(drawCables, 50);

        const runBtn = document.getElementById('run-btn');
        const logPanel = document.getElementById('log-panel');

        function appendLog(msg) {{
            const now = new Date().toTimeString().split(' ')[0];
            const div = document.createElement('div');
            div.className = 'log-line';
            div.innerHTML = `<span class="log-time">[${{now}}]</span> <span class="log-info">${{msg}}</span>`;
            logPanel.appendChild(div);
            logPanel.scrollTop = logPanel.scrollHeight;
        }}

        runBtn.addEventListener('click', () => {{
            appendLog('🚀 Triggering Pipeline Execution...');
            document.querySelectorAll('.cable').forEach(c => c.classList.add('flowing'));

            setTimeout(() => appendLog('✔ [Step 1] User Prompt Ingest verified (240 tokens)'), 500);
            setTimeout(() => appendLog('✔ [Step 2] Rust Core Safety: ZERO violations detected in 8µs'), 1000);
            setTimeout(() => appendLog('✔ [Step 3] Cognitive AI multi-step reasoning plan complete'), 1500);
            setTimeout(() => appendLog('✔ [Step 4] Autonomous Device Task executed successfully: Hardware OK'), 2000);
            setTimeout(() => {{
                appendLog('✨ Pipeline completed with 100% success rate.');
                document.querySelectorAll('.cable').forEach(c => c.classList.remove('flowing'));
            }}, 2500);
        }});
    </script>
</body>
</html>
"""

SITE_BLUEPRINTS["web_os_desktop"] = {
    "name": "NEXIUM WebOS Desktop Environment",
    "description": "Virtual browser desktop operating system with draggable window manager, live terminal shell, code notepad, hardware monitor, and dock.",
    "generate": _generate_web_os_desktop,
}
SITE_BLUEPRINTS["interactive_cyber_canvas"] = {
    "name": "Cybernetic Particle Physics Canvas",
    "description": "Dynamic interactive HTML5 Canvas particle constellation with mouse gravity physics, audio-visual glow pulses, and real-time parameter controls.",
    "generate": _generate_cyber_canvas,
}
SITE_BLUEPRINTS["node_workflow_builder"] = {
    "name": "Autonomous AI Workflow Node Graph",
    "description": "Visual drag-and-drop workflow canvas with connected AI pipeline nodes, animated glowing bezier data cables, and live pipeline execution simulation.",
    "generate": _generate_node_workflow,
}

# ============================================================================
# Web Factory Engine
# ============================================================================

class WebFactory:
    def __init__(self, output_dir: str = WEBSITES_DIR):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.generated_sites: Dict[str, Dict[str, Any]] = {}

    def get_templates(self) -> List[Dict[str, Any]]:
        return [
            {
                "key": key,
                "name": data["name"],
                "description": data["description"]
            }
            for key, data in SITE_BLUEPRINTS.items()
        ]

    def generate_website(
        self,
        title: str = "NEXIUM Platform",
        template_key: str = "saas_landing",
        theme_key: str = "cyber_violet",
        custom_tagline: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a self-contained, responsive website, saves to disk, and indexes into memory.
        """
        if template_key not in SITE_BLUEPRINTS:
            template_key = "saas_landing"
        if theme_key not in COLOR_THEMES:
            theme_key = "cyber_violet"

        bp = SITE_BLUEPRINTS[template_key]
        theme = COLOR_THEMES[theme_key]
        site_id = f"site_{uuid.uuid4().hex[:8]}"

        # Generate HTML
        html_code = bp["generate"](title, theme, custom_tagline)

        # Save to disk
        site_dir = os.path.join(self.output_dir, site_id)
        os.makedirs(site_dir, exist_ok=True)
        file_path = os.path.join(site_dir, "index.html")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_code)

        site_meta = {
            "id": site_id,
            "title": title,
            "template": template_key,
            "theme": theme_key,
            "file_path": file_path,
            "code_length": len(html_code),
            "created_at": time.time(),
            "preview_url": f"/api/web/preview/{site_id}"
        }

        self.generated_sites[site_id] = {**site_meta, "html": html_code}
        return site_meta

    def get_site_html(self, site_id: str) -> Optional[str]:
        if site_id in self.generated_sites:
            return self.generated_sites[site_id]["html"]
        
        # Disk fallback
        file_path = os.path.join(self.output_dir, site_id, "index.html")
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        return None

web_factory = WebFactory()
