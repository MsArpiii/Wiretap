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
    
    // Fix Sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            // Show alert just to prove it works
            if (!e.currentTarget.textContent.includes('Dashboard')) {
                alert(e.currentTarget.textContent.trim() + " section is under construction!");
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
            'TIKTOK': 'badge-tiktok',
            'FACEBOOK': 'badge-facebook',
            'GITHUB': 'badge-github'
        };
        return mapping[appName] || 'badge-unknown';
    };

    // Populate Traffic List
    const renderTrafficList = (domains) => {
        domainList.innerHTML = '';
        
        if (domains.length === 0) {
            domainList.innerHTML = '<div style="color: var(--text-muted); padding: 10px 0;">No domains detected</div>';
            return;
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
    
    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', async () => {
            console.log("Run Analysis clicked");
            btnAnalyze.disabled = true;
            const originalText = btnAnalyze.innerHTML;
            btnAnalyze.innerHTML = '<span class="icon">⏳</span> Processing...';
            setStatus('Running DPI Engine...', true);
            
            // Gather blocked apps from toggles
            const blockedApps = [];
            document.querySelectorAll('.switch-container input[type="checkbox"]').forEach(cb => {
                if (cb.checked) {
                    blockedApps.push(cb.dataset.app);
                }
            });
            
            try {
                const response = await fetch('/api/analyze', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ blocked_apps: blockedApps })
                });
                const data = await response.json();
                console.log("Analysis API Response:", data);
                
                if (data.status === 'success') {
                    setStatus('Analysis complete.');
                    
                    if (emptyState) emptyState.classList.add('hidden');
                    if (resultsDashboard) resultsDashboard.classList.remove('hidden');
                    
                    const stats = data.stats;
                    
                    // Animate KPIs
                    if (kpiTotal) animateValue(kpiTotal, 0, stats.total_packets, 1000);
                    if (kpiForwarded) animateValue(kpiForwarded, 0, stats.forwarded, 1000);
                    if (kpiDropped) animateValue(kpiDropped, 0, stats.dropped, 1000);
                    
                    // Update Top Stats Row
                    const topKpiTotal = document.getElementById('top-kpi-total');
                    const topKpiForwarded = document.getElementById('top-kpi-forwarded');
                    const topKpiDropped = document.getElementById('top-kpi-dropped');
                    const topKpiRules = document.getElementById('top-kpi-rules');
                    
                    if (topKpiTotal) animateValue(topKpiTotal, 0, stats.total_packets, 1000);
                    if (topKpiForwarded) animateValue(topKpiForwarded, 0, stats.forwarded, 1000);
                    if (topKpiDropped) animateValue(topKpiDropped, 0, stats.dropped, 1000);
                    if (topKpiRules) animateValue(topKpiRules, 0, blockedApps.length, 1000);
                    
                    // Render Chart and Table
                    renderChart(stats.applications, currentChartType);
                    renderTrafficList(stats.domains);
                    
                } else {
                    setStatus(`Analysis Error: ${data.message}`);
                }
            } catch (err) {
                console.error(err);
                setStatus('Failed to reach server.');
            } finally {
                btnAnalyze.disabled = false;
                btnAnalyze.innerHTML = originalText;
            }
        });
    }
    
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
            
            // Canned responses
            setTimeout(() => {
                const lowerText = text.toLowerCase();
                if (lowerText.includes('dropped') || lowerText.includes('block')) {
                    const dropped = document.getElementById('kpi-dropped').textContent;
                    addMessage(`In the last run, we dropped ${dropped} packets.`, 'bot');
                } else if (lowerText.includes('sni') || lowerText.includes('domain')) {
                    addMessage('SNI stands for Server Name Indication. It tells us the domain name requested before the connection is fully encrypted.', 'bot');
                } else if (lowerText.includes('total')) {
                    const total = document.getElementById('kpi-total').textContent;
                    addMessage(`We processed ${total} total packets in the last capture.`, 'bot');
                } else {
                    addMessage("I'm a simple bot! Try asking how many packets dropped or what SNI is.", 'bot');
                }
            }, 600);
        };

        chatSendBtn.addEventListener('click', handleChat);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });
    }

});
