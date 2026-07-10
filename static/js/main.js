document.addEventListener('DOMContentLoaded', () => {
    const btnGenerate = document.getElementById('btn-generate');
    const btnAnalyze = document.getElementById('btn-analyze');
    const statusMessage = document.getElementById('status-message');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const resultsDashboard = document.getElementById('results-dashboard');
    
    // Elements to update
    const kpiTotal = document.getElementById('kpi-total');
    const kpiForwarded = document.getElementById('kpi-forwarded');
    const kpiDropped = document.getElementById('kpi-dropped');
    const domainTableBody = document.querySelector('#domain-table tbody');
    
    let appChart = null;

    // Helper: Update status
    const setStatus = (msg, isLoading = false) => {
        statusMessage.textContent = msg;
        if (isLoading) {
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
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
    const renderChart = (appData) => {
        const ctx = document.getElementById('appChart').getContext('2d');
        
        const labels = Object.keys(appData);
        const data = Object.values(appData);
        
        // Define vibrant colors
        const bgColors = [
            'rgba(99, 102, 241, 0.8)',   // Indigo
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(16, 185, 129, 0.8)',   // Emerald
            'rgba(245, 158, 11, 0.8)',   // Amber
            'rgba(139, 92, 246, 0.8)',   // Purple
            'rgba(14, 165, 233, 0.8)',   // Sky
            'rgba(244, 63, 94, 0.8)'     // Rose
        ];
        
        if (appChart) {
            appChart.destroy();
        }
        
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Outfit', sans-serif";
        
        appChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Detected Flows',
                    data: data,
                    backgroundColor: bgColors,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 14, family: "'Outfit', sans-serif" },
                        bodyFont: { size: 13, family: "'Outfit', sans-serif" },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    };

    // Populate Table
    const renderTable = (domains) => {
        domainTableBody.innerHTML = '';
        
        if (domains.length === 0) {
            domainTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #94a3b8;">No domains detected</td></tr>';
            return;
        }
        
        domains.forEach(d => {
            const tr = document.createElement('tr');
            
            const tdDomain = document.createElement('td');
            tdDomain.textContent = d.domain;
            
            const tdApp = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = 'app-badge';
            badge.textContent = d.app;
            tdApp.appendChild(badge);
            
            const tdFlows = document.createElement('td');
            tdFlows.textContent = d.count;
            
            tr.appendChild(tdDomain);
            tr.appendChild(tdApp);
            tr.appendChild(tdFlows);
            
            domainTableBody.appendChild(tr);
        });
    };

    // API Calls
    btnGenerate.addEventListener('click', async () => {
        btnGenerate.disabled = true;
        btnAnalyze.disabled = true;
        setStatus('Generating synthetic PCAP traffic...', true);
        
        try {
            const response = await fetch('/api/generate', { method: 'POST' });
            const data = await response.json();
            
            if (data.status === 'success') {
                setStatus('Traffic generated. Ready for analysis.');
                btnAnalyze.disabled = false;
            } else {
                setStatus(`Error: ${data.message}`);
            }
        } catch (err) {
            setStatus('Failed to reach server.');
        } finally {
            btnGenerate.disabled = false;
        }
    });
    
    btnAnalyze.addEventListener('click', async () => {
        btnGenerate.disabled = true;
        btnAnalyze.disabled = true;
        setStatus('Analyzing packets via DPI engine...', true);
        
        // Hide empty state, show dashboard but reset animations
        emptyState.classList.add('hidden');
        resultsDashboard.classList.remove('hidden');
        
        // Reset counters
        kpiTotal.textContent = '0';
        kpiForwarded.textContent = '0';
        kpiDropped.textContent = '0';
        
        try {
            const response = await fetch('/api/analyze', { method: 'POST' });
            const data = await response.json();
            
            if (data.status === 'success') {
                setStatus('Analysis complete.');
                
                const stats = data.stats;
                
                // Animate KPIs
                animateValue(kpiTotal, 0, stats.total_packets, 1000);
                animateValue(kpiForwarded, 0, stats.forwarded, 1000);
                animateValue(kpiDropped, 0, stats.dropped, 1000);
                
                // Render Chart and Table
                renderChart(stats.applications);
                renderTable(stats.domains);
                
            } else {
                setStatus(`Analysis Error: ${data.message}`);
            }
        } catch (err) {
            setStatus('Failed to reach server during analysis.');
        } finally {
            btnGenerate.disabled = false;
            btnAnalyze.disabled = false;
        }
    });
});
