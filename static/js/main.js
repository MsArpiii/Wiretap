console.log("main.js successfully loaded!");

// Global error handler to show errors on screen for debugging
window.addEventListener('error', function(e) {
    console.error("Global error:", e.error);
    const status = document.getElementById('status-message');
    if (status) status.textContent = "JS Error: " + e.message;
});

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired!");
    
    const btnGenerate = document.getElementById('btn-generate');
    const btnAnalyze = document.getElementById('btn-analyze');
    const statusMessage = document.getElementById('status-message');
    const emptyState = document.getElementById('empty-state');
    const resultsDashboard = document.getElementById('results-dashboard');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Elements to update
    const kpiTotal = document.getElementById('kpi-total');
    const kpiForwarded = document.getElementById('kpi-forwarded');
    const kpiDropped = document.getElementById('kpi-dropped');
    const domainList = document.getElementById('domain-list');
    const chartTypeToggles = document.querySelectorAll('#chart-type-toggle span');
    
    let appChart = null;
    let currentChartType = 'bar';
    let currentChartData = {};

    // Theme Toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            if (Object.keys(currentChartData).length > 0) {
                renderChart(currentChartData, currentChartType);
            }
        });
    }

    // Chart Type Toggle
    if (chartTypeToggles) {
        chartTypeToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                chartTypeToggles.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentChartType = e.target.dataset.type;
                
                if (Object.keys(currentChartData).length > 0) {
                    renderChart(currentChartData, currentChartType);
                }
            });
        });
    }
    
    // Sidebar views toggle
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    const views = document.querySelectorAll('.view-content');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const text = e.currentTarget.textContent.trim().toLowerCase();
            
            sidebarLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            views.forEach(v => v.classList.remove('active'));
            
            if (text.includes('dashboard')) {
                const v = document.getElementById('view-dashboard');
                if (v) v.classList.add('active');
            } else if (text.includes('traffic')) {
                const v = document.getElementById('view-traffic');
                if (v) v.classList.add('active');
            } else if (text.includes('rules')) {
                const v = document.getElementById('view-rules');
                if (v) v.classList.add('active');
            } else if (text.includes('settings')) {
                const v = document.getElementById('view-settings');
                if (v) v.classList.add('active');
            }
        });
    });

    // Helper: Update status
    const setStatus = (msg, isLoading = false) => {
        statusMessage.textContent = msg;
        const indicator = document.querySelector('.status-indicator');
        if (isLoading) {
            indicator.style.background = '#f59e0b'; // warning/loading color
            indicator.style.boxShadow = '0 0 8px #f59e0b';
        } else {
            indicator.style.background = 'var(--success)';
            indicator.style.boxShadow = '0 0 8px var(--success)';
        }
    };

    // Helper: Animate counter
    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // Chart.js Configuration
    const renderChart = (appData, type = 'bar') => {
        currentChartData = appData;
        const ctx = document.getElementById('appChart').getContext('2d');
        
        const labels = Object.keys(appData);
        const data = Object.values(appData);
        
        // Define vibrant colors
        const bgColors = [
            '#a855f7', // purple
            '#ec4899', // pink
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // amber
            '#ef4444', // red
            '#64748b'  // slate
        ];
        
        if (appChart) {
            appChart.destroy();
        }
        
        const isLightMode = document.body.classList.contains('light-mode');
        Chart.defaults.color = isLightMode ? '#475569' : '#94a3b8';
        Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
        
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: type === 'doughnut',
                    position: 'right'
                },
                tooltip: {
                    backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)',
                    titleColor: isLightMode ? '#0f172a' : '#fff',
                    bodyColor: isLightMode ? '#475569' : '#cbd5e1',
                    titleFont: { size: 14, family: "'Inter', sans-serif" },
                    bodyFont: { size: 13, family: "'Inter', sans-serif" },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    borderColor: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            }
        };

        if (type === 'bar') {
            options.scales = {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    grid: { display: false }
                }
            };
        }

        appChart = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Detected Flows',
                    data: data,
                    backgroundColor: bgColors,
                    borderRadius: type === 'bar' ? 6 : 0,
                    borderWidth: type === 'doughnut' ? 2 : 0,
                    borderColor: isLightMode ? '#ffffff' : '#1e1730'
                }]
            },
            options: options
        });
    };

    const getBadgeClass = (appName) => {
        const mapping = {
            'YOUTUBE': 'badge-youtube',
            'INSTAGRAM': 'badge-instagram',
            'FACEBOOK': 'badge-facebook',
            'GITHUB': 'badge-github'
        };
        return mapping[appName] || 'badge-unknown';
    };

    // Populate Traffic List
    const renderTrafficList = (domains, blockedApps = []) => {
        domainList.innerHTML = '';
        const tableBody = document.getElementById('traffic-table-body');
        if (tableBody) tableBody.innerHTML = '';
        
        if (domains.length === 0) {
            domainList.innerHTML = '<div style="color: var(--text-muted); padding: 10px 0;">No domains detected</div>';
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="4">No data available. Run analysis first.</td></tr>';
            return;
        }
        
        // Populate full table
        if (tableBody) {
            domains.forEach(d => {
                const tr = document.createElement('tr');
                const isBlocked = blockedApps.includes(d.app);
                const actionHtml = isBlocked ? '<span style="color:var(--danger);font-weight:600;">BLOCKED</span>' : '<span style="color:var(--success);font-weight:600;">FORWARDED</span>';
                
                tr.innerHTML = `
                    <td>${d.domain}</td>
                    <td><span class="app-badge ${getBadgeClass(d.app)}">${d.app}</span></td>
                    <td>${d.count} flows</td>
                    <td>${actionHtml}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
        
        // Show top 5
        domains.slice(0, 5).forEach(d => {
            const item = document.createElement('div');
            item.className = 'traffic-item';
            
            item.innerHTML = `
                <div class="domain-info">
                    <span class="domain-name">${d.domain}</span>
                    <span class="app-badge ${getBadgeClass(d.app)}">${d.app}</span>
                </div>
                <div class="flow-count">${d.count} flows</div>
            `;
            
            domainList.appendChild(item);
        });
    };

    // API Calls
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            btnGenerate.disabled = true;
            setStatus('Generating traffic...', true);
            
            try {
                const response = await fetch('/api/generate', { method: 'POST' });
                const data = await response.json();
                
                if (data.status === 'success') {
                    setStatus('Traffic generated.');
                } else {
                    setStatus(`Error: ${data.message}`);
                }
            } catch (err) {
                setStatus('Failed to reach server.');
            } finally {
                btnGenerate.disabled = false;
            }
        });
    }
    
    const runAnalysis = async (autoRetry = false) => {
        if (!btnAnalyze) return;
        btnAnalyze.disabled = true;
        const originalText = btnAnalyze.innerHTML;
        btnAnalyze.innerHTML = '<span class="icon">⏳</span> Processing...';
        setStatus('Running DPI Engine...', true);
        
        const blockedApps = [];
        document.querySelectorAll('.switch-container input[type="checkbox"]').forEach(cb => {
            if (cb.checked) {
                blockedApps.push(cb.dataset.app);
            }
        });
        
        try {
            const response = await fetch('/api/analyze', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocked_apps: blockedApps })
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                setStatus('Analysis complete.');
                if (emptyState) emptyState.classList.add('hidden');
                if (resultsDashboard) resultsDashboard.classList.remove('hidden');
                
                const stats = data.stats;
                
                if (kpiTotal) animateValue(kpiTotal, 0, stats.total_packets, 1000);
                if (kpiForwarded) animateValue(kpiForwarded, 0, stats.forwarded, 1000);
                if (kpiDropped) animateValue(kpiDropped, 0, stats.dropped, 1000);
                
                const topKpiTotal = document.getElementById('top-kpi-total');
                const topKpiForwarded = document.getElementById('top-kpi-forwarded');
                const topKpiDropped = document.getElementById('top-kpi-dropped');
                const topKpiRules = document.getElementById('top-kpi-rules');
                
                if (topKpiTotal) animateValue(topKpiTotal, 0, stats.total_packets, 1000);
                if (topKpiForwarded) animateValue(topKpiForwarded, 0, stats.forwarded, 1000);
                if (topKpiDropped) animateValue(topKpiDropped, 0, stats.dropped, 1000);
                if (topKpiRules) animateValue(topKpiRules, 0, blockedApps.length, 1000);
                
                renderChart(stats.applications, currentChartType);
                renderTrafficList(stats.domains, blockedApps);
                
                // Update active rules list
                const activeRulesList = document.getElementById('active-rules-list');
                if (activeRulesList) {
                    if (blockedApps.length === 0) {
                        activeRulesList.innerHTML = '<li>No apps are currently blocked.</li>';
                    } else {
                        activeRulesList.innerHTML = blockedApps.map(app => `<li>Blocked App: <span class="app-badge ${getBadgeClass(app)}" style="margin-left: 8px;">${app}</span></li>`).join('');
                    }
                }
                
            } else {
                if (autoRetry && data.message.includes('not found')) {
                    setStatus('No PCAP found. Generating traffic first...', true);
                    const genRes = await fetch('/api/generate', { method: 'POST' });
                    const genData = await genRes.json();
                    if (genData.status === 'success') {
                        return runAnalysis(false);
                    } else {
                        setStatus(`Error generating traffic: ${genData.message}`);
                    }
                } else {
                    setStatus(`Analysis Error: ${data.message}`);
                }
            }
        } catch (err) {
            console.error(err);
            setStatus('Failed to reach server.');
        } finally {
            btnAnalyze.disabled = false;
            btnAnalyze.innerHTML = originalText;
        }
    };

    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', () => {
            console.log("Run Analysis clicked");
            runAnalysis(false);
        });
    }

    // Auto-run analysis on load
    runAnalysis(true);
    
    // Search logic
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (resultsDashboard.classList.contains('hidden')) {
                if (query.length > 0) {
                    searchInput.placeholder = "Run analysis first to search traffic.";
                    setTimeout(() => { searchInput.placeholder = "Ask about this traffic..."; }, 2500);
                    e.target.value = '';
                }
                return;
            }
            
            const items = domainList.querySelectorAll('.traffic-item');
            items.forEach(item => {
                const domain = item.querySelector('.domain-name').textContent.toLowerCase();
                const app = item.querySelector('.app-badge').textContent.toLowerCase();
                if (domain.includes(query) || app.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Chat Widget Logic
    const chatToggleBtn = document.getElementById('chat-toggle');
    const chatPanel = document.getElementById('chat-panel');
    const chatCloseBtn = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    if (chatToggleBtn && chatPanel) {
        chatToggleBtn.addEventListener('click', () => {
            chatPanel.classList.toggle('hidden');
        });

        chatCloseBtn.addEventListener('click', () => {
            chatPanel.classList.add('hidden');
        });

        const addMessage = (text, sender) => {
            const msg = document.createElement('div');
            msg.className = `chat-msg ${sender}`;
            msg.textContent = text;
            chatMessages.appendChild(msg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        const handleChat = () => {
            const text = chatInput.value.trim();
            if (!text) return;
            
            addMessage(text, 'user');
            chatInput.value = '';
            
            // Canned responses with fuzzy matching
            setTimeout(() => {
                const lowerText = text.toLowerCase();
                
                const matchesAny = (words) => words.some(w => lowerText.includes(w));
                
                // Greetings
                if (lowerText === 'hi' || lowerText === 'hello' || matchesAny(['hey', 'greetings', 'morning'])) {
                    addMessage("Hello there! I'm your Wiretap assistant. How can I help you analyze your traffic today?", 'bot');
                } 
                // Dropped / Blocked Stats
                else if (matchesAny(['dropped', 'blocked', 'denied', 'prevented']) && !matchesAny(['what apps', 'which apps'])) {
                    const dropped = document.getElementById('kpi-dropped');
                    const val = dropped ? dropped.textContent : "0";
                    addMessage(`In the last run, we blocked/dropped ${val} packets from reaching their destination.`, 'bot');
                } 
                // Forwarded Stats
                else if (matchesAny(['forward', 'forwarded', 'passed', 'allowed'])) {
                    const forwarded = document.getElementById('kpi-forwarded');
                    const val = forwarded ? forwarded.textContent : "0";
                    addMessage(`In the last capture, we successfully forwarded ${val} packets.`, 'bot');
                }
                // Definitions (SNI, DPI, TLS)
                else if (matchesAny(['sni', 'what is sni'])) {
                    addMessage('SNI stands for Server Name Indication. It exposes the domain name a user is connecting to before the connection is encrypted, allowing us to see what websites are visited.', 'bot');
                }
                else if (matchesAny(['dpi', 'what is dpi'])) {
                    addMessage('DPI is Deep Packet Inspection. It analyzes the payload of a network packet, not just its header, to identify the application or protocol being used.', 'bot');
                }
                else if (matchesAny(['tls', 'what is tls'])) {
                    addMessage('TLS is Transport Layer Security. It encrypts internet traffic. Wiretap extracts the SNI from the TLS Client Hello message to see the domain.', 'bot');
                }
                // Total Stats
                else if (matchesAny(['total', 'how many packets', 'overall'])) {
                    const total = document.getElementById('kpi-total');
                    const val = total ? total.textContent : "0";
                    addMessage(`We processed ${val} total packets in the last capture.`, 'bot');
                } 
                // Blocked Apps
                else if (matchesAny(['apps are blocked', 'blocked apps', 'active rules', 'what is blocked', 'what got blocked'])) {
                    const blockedApps = [];
                    document.querySelectorAll('.switch-container input[type="checkbox"]').forEach(cb => {
                        if (cb.checked) {
                            blockedApps.push(cb.dataset.app);
                        }
                    });
                    if (blockedApps.length > 0) {
                        addMessage(`Currently blocked apps: ${blockedApps.join(', ')}`, 'bot');
                    } else {
                        addMessage('No apps are currently blocked. You can toggle them in the dashboard controls.', 'bot');
                    }
                } 
                // Fallback Rotation
                else {
                    const fallbacks = [
                        "I didn't quite catch that! I'm a simple bot — try asking about 'forwarded packets', 'blocked apps', or 'SNI'.",
                        "Hmm, I'm not sure about that. Try asking me 'how many packets dropped?' or 'what is DPI?'",
                        "I can only help with Wiretap stats! Ask me about active rules, total packets, or definitions like TLS.",
                        "Sorry, I didn't understand. Can you rephrase? You can ask about 'dropped', 'forwarded', or 'blocked apps'."
                    ];
                    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                    addMessage(randomFallback, 'bot');
                }
            }, 600);
        };

        chatSendBtn.addEventListener('click', handleChat);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });
    }

});
