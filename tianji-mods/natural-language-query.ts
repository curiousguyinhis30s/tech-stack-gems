

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tianji Analytics | NL-to-SQL Interface</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom animations and scrollbar styles */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
        
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-glow { animation: pulse-glow 2s infinite; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1e293b; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }

        /* Glassmorphism utilities */
        .glass-panel {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .code-editor-font { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; }
    </style>
    <!-- Importing a charting library -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-slate-950 text-slate-200 font-sans h-screen overflow-hidden flex flex-col selection:bg-blue-500 selection:text-white">

    <!-- Header -->
    <header class="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 z-20">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">T</div>
            <h1 class="font-semibold text-lg tracking-tight text-white">Tianji <span class="text-slate-500 font-normal">Analytics</span></h1>
        </div>
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                SQL Engine: Ready
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/></svg>
            </div>
        </div>
    </header>

    <!-- Main Layout -->
    <main class="flex-1 flex overflow-hidden">
        
        <!-- Sidebar: Schema & History -->
        <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 transform -translate-x-full md:translate-x-0 absolute md:relative h-full z-10 md:z-auto" id="sidebar">
            <div class="p-4 border-b border-slate-800">
                <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Context Schema</h2>
                <div class="space-y-2">
                    <div class="text-xs bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:border-blue-500/50 cursor-default transition-colors group">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-blue-400 group-hover:text-blue-300">users</span>
                            <span class="text-[10px] text-slate-500">table</span>
                        </div>
                        <div class="text-[10px] text-slate-400 code-editor-font">id, country, created_at</div>
                    </div>
                    <div class="text-xs bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:border-purple-500/50 cursor-default transition-colors group">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-purple-400 group-hover:text-purple-300">events</span>
                            <span class="text-[10px] text-slate-500">table</span>
                        </div>
                        <div class="text-[10px] text-slate-400 code-editor-font">id, user_id, event_name, ts</div>
                    </div>
                </div>
            </div>

            <div class="p-4 flex-1 overflow-y-auto">
                <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Queries</h2>
                <ul class="space-y-2" id="history-list">
                    <li class="text-xs text-slate-400 italic p-2">No history yet.</li>
                </ul>
            </div>
        </aside>

        <!-- Content Area -->
        <section class="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-900 to-slate-950 relative">
            
            <!-- Background Decoration -->
            <div class="absolute inset-0 z-0 pointer-events-none opacity-20" 
                 style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 32px 32px;">
            </div>

            <!-- Input Section -->
            <div class="relative z-10 p-6 md:p-10 pb-4">
                <div class="max-w-4xl mx-auto w-full">
                    <h2 class="text-3xl font-light text-white mb-6">Ask anything about your data.</h2>
                    
                    <div class="glass-panel p-1.5 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10 relative group">
                        <div class="absolute -top-3 left-4 bg-slate-900 px-2 text-xs text-blue-400 font-semibold border border-slate-700 rounded-full">Natural Language</div>
                        
                        <div class="flex items-center gap-3">
                            <div class="pl-4 text-slate-400">
                                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input type="text" id="nl-input" 
                                class="w-full bg-transparent text-slate-100 placeholder-slate-500 py-3 focus:outline-none text-lg"
                                placeholder="e.g., How many users from France signed up yesterday?" 
                                autocomplete="off">
                            <button id="submit-btn" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                                <span>Run Query</span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="transform group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                            </button>
                        </div>
                        
                        <!-- Autocomplete Dropdown (Hidden by default) -->
                        <div id="autocomplete-dropdown" class="hidden absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                            <!-- Populated via JS -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Results Section -->
            <div class="flex-1 overflow-y-auto z-10 px-6 md:px-10 pb-10 pt-2">
                <div class="max-w-6xl mx-auto w-full space-y-6" id="results-area">
                    
                    <!-- Example Empty State -->
                    <div id="empty-state" class="flex flex-col items-center justify-center h-64 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                        <svg class="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <p>Waiting for query...</p>
                    </div>

                    <!-- Query Result Card (Dynamic) -->
                    <div id="query-result-card" class="hidden animate-fade-in glass-panel rounded-xl overflow-hidden border border-slate-700/50">
                        <!-- Header -->
                        <div class="px-6 py-4 border-b border-slate-700/50 flex justify-between items-start bg-slate-800/30">
                            <div>
                                <h3 class="text-sm font-medium text-slate-400 uppercase tracking-wider">Generated SQL</h3>
                                <div class="mt-2 code-editor-font text-sm bg-slate-950/50 p-3 rounded border border-slate-900 text-green-400 shadow-inner" id="sql-display">
                                    -- SQL will appear here
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button class="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Copy SQL">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                                </button>
                            </div>
                        </div>

                        <!-- Charts & Data -->
                        <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <!-- Chart Section -->
                            <div class="lg:col-span-2 min-h-[300px] flex flex-col">
                                <h4 class="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                                    <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                                    Visualization
                                </h4>
                                <div class="relative flex-1 bg-slate-950/50 rounded-lg border border-slate-800/50 p-4 flex items-center justify-center">
                                    <canvas id="result-chart"></canvas>
                                </div>
                            </div>

                            <!-- Data Table -->
                            <div class="lg:col-span-1 overflow-hidden flex flex-col h-full max-h-[400px]">
                                <h4 class="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                                    <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    Raw Data
                                </h4>
                                <div class="overflow-y-auto flex-1 bg-slate-900/50 rounded border border-slate-800">
                                    <table class="w-full text-left text-sm border-collapse">
                                        <thead class="bg-slate-950 sticky top-0 text-xs uppercase text-slate-500 font-semibold">
                                            <tr id="table-head">
                                                <!-- Dynamic Headers -->
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-800 text-slate-300" id="table-body">
                                            <!-- Dynamic Rows -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Script Implementation -->
    <script>
        // --- 1. lib/text-to-sql.ts Logic (Ported) ---
        class TextToSqlEngine {
            constructor() {
                this.schema = {
                    tables: [
                        { name: 'users', columns: ['id', 'email', 'country', 'created_at'] },
                        { name: 'events', columns: ['id', 'user_id', 'event_name', 'ts'] }
                    ]
                };
            }

            // Simulating the OpenAI API call logic
            async convert(naturalQuery) {
                return new Promise((resolve) => {
                    // In a real app, this would be: await fetch('/api/query', { body: JSON.stringify({ query }) })
                    
                    // Heuristic Mock Logic for the demo
                    const q = naturalQuery.toLowerCase();
                    let sql = "SELECT * FROM users LIMIT 10"; // Default
                    
                    if (q.includes('france') && q.includes('yesterday')) {
                        sql = "SELECT country, COUNT(*) as count FROM users WHERE country = 'France' AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' GROUP BY country";
                    } else if (q.includes('how many users')) {
                        sql = "SELECT country, COUNT(*) as total_users FROM users GROUP BY country ORDER BY total_users DESC";
                    } else if (q.includes('signup trend')) {
                        sql = "SELECT DATE(created_at) as date, COUNT(*) as signups FROM users GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7";
                    } else if (q.includes('page view')) {
                        sql = "SELECT event_name, COUNT(*) as hits FROM events WHERE event_name LIKE '%view%' GROUP BY event_name";
                    }

                    // Simulate API latency
                    setTimeout(() => resolve({ sql, query: naturalQuery }), 800);
                });
            }
        }

        // --- 2. lib/chart-generator.ts Logic (Ported) ---
        class ChartGenerator {
            static determineConfig(sql, data) {
                // Heuristic to guess chart type based on SQL keywords
                if (sql.includes('GROUP BY') && sql.includes('COUNT')) {
                    return {
                        type: 'bar',
                        labelX: data.columns[0],
                        labelY: data.columns[1],
                        title: 'Aggregated Count'
                    };
                }
                if (sql.includes('DATE') || sql.includes('ts')) {
                    return {
                        type: 'line',
                        labelX: data.columns[0],
                        labelY: data.columns[1],
                        title: 'Trend over Time'
                    };
                }
                return {
                    type: 'bar', // Fallback
                    labelX: data.columns[0],
                    labelY: data.columns[1],
                    title: 'Query Results'
                };
            }
        }

        // --- 3. components/NaturalQueryInput.tsx Logic (Ported) ---
        // DOM Elements
        const inputEl = document.getElementById('nl-input');
        const submitBtn = document.getElementById('submit-btn');
        const autoCompleteContainer = document.getElementById('autocomplete-dropdown');
        const resultCard = document.getElementById('query-result-card');
        const emptyState = document.getElementById('empty-state');
        const sqlDisplay = document.getElementById('sql-display');
        const tableHead = document.getElementById('table-head');
        const tableBody = document.getElementById('table-body');
        const chartCanvas = document.getElementById('result-chart');

        // Instances
        const engine = new TextToSqlEngine();
        let chartInstance = null;

        // Mock Data Generator for Demo
        function executeMockSql(sql) {
            // Returns mock data based on the mocked SQL string
            if (sql.includes('France')) {
                return { 
                    columns: ['country', 'total_users'], 
                    rows: [
                        ['France', 142],
                        ['Germany', 98],
                        ['USA', 250]
                    ]
                };
            }
            if (sql.includes('trend') || sql.includes('DATE')) {
                return {
                    columns: ['date', 'signups'],
                    rows: [
                        ['2023-10-20', 45],
                        ['2023-10-21', 52],
                        ['2023-10-22', 38],
                        ['2023-10-23', 65],
                        ['2023-10-24', 80]
                    ]
                };
            }
            // Fallback
            return {
                columns: ['Metric', 'Value'],
                rows: [['Total', 1024]]
            };
        }

        // --- Autocomplete Logic ---
        const suggestions = [
            "How many users from France signed up yesterday?",
            "Show signup trends for the last 7 days",
            "Count users by country",
            "Top 5 most viewed pages",
            "Unique visitors last week"
        ];

        inputEl.addEventListener('input', (e) => {
            const val = e.target.value;
            autoCompleteContainer.innerHTML = '';
            
            if (val.length > 0) {
                const matches = suggestions.filter(s => s.toLowerCase().includes(val.toLowerCase()));
                if (matches.length > 0) {
                    autoCompleteContainer.classList.remove('hidden');
                    matches.forEach(match => {
                        const div = document.createElement('div');
                        div.className = "px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-300";
                        div.textContent = match;
                        div.onclick = () => {
                            inputEl.value = match;
                            autoCompleteContainer.classList.add('hidden');
                        };
                        autoCompleteContainer.appendChild(div);
                    });
                } else {
                    autoCompleteContainer.classList.add('hidden');
                }
            } else {
                autoCompleteContainer.classList.add('hidden');
            }
        });

        // Hide autocomplete on click outside
        document.addEventListener('click', (e) => {
            if (!inputEl.contains(e.target) && !autoCompleteContainer.contains(e.target)) {
                autoCompleteContainer.classList.add('hidden');
            }
        });

        // --- Main Execution Flow ---
        async function handleQuery() {
            const query = inputEl.value.trim();
            if (!query) return;

            // UI Loading State
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...`;
            
            // 1. Convert Text to SQL
            const response = await engine.convert(query);
            
            // 2. "Execute" SQL (Mock)
            const data = executeMockSql(response.sql);

            // 3. Update UI
            renderResult(response.sql, data);
            addToHistory(query);

            // Reset UI State
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Run Query</span><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="transform group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>`;
        }

        function renderResult(sql, data) {
            emptyState.classList.add('hidden');
            resultCard.classList.remove('hidden');
            
            // Show SQL
            sqlDisplay.textContent = sql;

            // Render Table
            tableHead.innerHTML = '';
            tableBody.innerHTML = '';
            
            data.columns.forEach(col => {
                const th = document.createElement('th');
                th.className = "px-4 py-2 bg-slate-900/80";
                th.textContent = col;
                tableHead.appendChild(th);
            });

            data.rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-800/50 transition-colors";
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.className = "px-4 py-2";
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });

            // Generate Chart
            if (chartInstance) chartInstance.destroy();
            
            const chartConfig = ChartGenerator.determineConfig(sql, data);
            
            const labels = data.rows.map(r => r[0]);
            const values = data.rows.map(r => r[1]);

            const ctx = chartCanvas.getContext('2d');
            chartInstance = new Chart(ctx, {
                type: chartConfig.type,
                data: {
                    labels: labels,
                    datasets: [{
                        label: chartConfig.labelY,
                        data: values,
                        backgroundColor: chartConfig.type === 'line' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        borderRadius: 4,
                        fill: chartConfig.type === 'line',
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                            borderColor: '#334155',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#334155', drawBorder: false },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }

        function addToHistory(query) {
            const list = document.getElementById('history-list');
            // Remove "No history" if present
            if (list.firstElementChild && list.firstElementChild.innerText === "No history yet.") {
                list.innerHTML = '';
            }
            
            const li = document.createElement('li');
            li.className = "text-xs text-slate-400 bg-slate-800/40 p-2 rounded border border-slate-800 cursor-pointer hover:bg-slate-800 hover:text-white transition-colors truncate";
            li.textContent = query;
            li.onclick = () => {
                inputEl.value = query;
                handleQuery();
            };
            
            list.insertBefore(li, list.firstChild);
        }

        // Event Listeners
        submitBtn.addEventListener('click', handleQuery);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleQuery();
        });

    </script>
</body>
</html>
```
