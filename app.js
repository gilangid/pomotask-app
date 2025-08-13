// Pomotask Application JavaScript

class PomotaskApp {
    constructor() {
        // Timer state
        this.currentMode = 'focus';
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 25 * 60; // 25 minutes in seconds
        this.timerInterval = null;
        this.sessionName = '';
        
        // Settings
        this.settings = {
            focus: 25,
            short: 5,
            long: 15,
            goal: 8,
            autoStart: false
        };
        
        // Statistics
        this.stats = {
            doneToday: 0,
            totalTasks: 0,
            completedTasks: 0
        };
        
        // Tasks
        this.tasks = [];
        this.reminders = [];
        
        // Music Player
        this.musicPlayer = {
            audio: null,
            playlist: [
                { title: 'Arka Music', artist: 'Instrumental', src: 'music/Arka Music_1754913259009.mp3' },
                { title: 'Sofia Music', artist: 'Instrumental', src: 'music/Sofia Music_1754913259010.mp3' },
                { title: 'Kiana Music', artist: 'Instrumental', src: 'music/Kiana Music_1754913259010.mp3' },
                { title: 'Andara Music', artist: 'Instrumental', src: 'music/Andara Music_1754913259011.mp3' }
            ],
            currentIndex: 0,
            isPlaying: false,
            volume: 0.5
        };
        
        // Initialize the app
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeUI();
        this.setupChart();
        this.requestNotificationPermission();
        this.initializeMusicPlayer();
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    loadData() {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('pomotask-settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Load stats from localStorage
        const savedStats = localStorage.getItem('pomotask-stats');
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
        
        // Load tasks from localStorage
        const savedTasks = localStorage.getItem('pomotask-tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
        
        // Load reminders from localStorage
        const savedReminders = localStorage.getItem('pomotask-reminders');
        if (savedReminders) {
            this.reminders = JSON.parse(savedReminders);
        }
        
        // Check if it's a new day and reset daily stats
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('pomotask-last-date');
        if (lastDate !== today) {
            this.stats.doneToday = 0;
            localStorage.setItem('pomotask-last-date', today);
            this.saveStats();
        }
    }
    
    saveData() {
        this.saveSettings();
        this.saveStats();
        this.saveTasks();
        this.saveReminders();
    }
    
    saveSettings() {
        localStorage.setItem('pomotask-settings', JSON.stringify(this.settings));
    }
    
    saveStats() {
        localStorage.setItem('pomotask-stats', JSON.stringify(this.stats));
    }
    
    saveTasks() {
        localStorage.setItem('pomotask-tasks', JSON.stringify(this.tasks));
    }
    
    saveReminders() {
        localStorage.setItem('pomotask-reminders', JSON.stringify(this.reminders));
    }
    
    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.target.dataset.mode);
            });
        });
        
        // Timer controls
        document.getElementById('startPauseBtn').addEventListener('click', () => {
            this.toggleTimer();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetTimer();
        });
        
        document.getElementById('skipBtn').addEventListener('click', () => {
            this.skipSession();
        });
        
        // Custom name
        document.getElementById('saveNameBtn').addEventListener('click', () => {
            this.saveSessionName();
        });
        
        // Settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettingsFromUI();
        });
        
        // Auto start toggle
        document.getElementById('autoToggle').addEventListener('click', () => {
            this.toggleAutoStart();
        });
        
        // Tasks
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.addTask();
        });
        
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        // Reminders
        document.getElementById('setReminderBtn').addEventListener('click', () => {
            this.setReminder();
        });
        
        // Notifications
        document.getElementById('notifyBtn').addEventListener('click', () => {
            this.requestNotificationPermission();
        });
        
        // Info modal
        const infoBtn = document.getElementById('infoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => this.openInfoModal());
        }
        document.getElementById('closeInfoBtn').addEventListener('click', () => this.closeInfoModal());
        document.getElementById('infoModal').addEventListener('click', (e) => {
            if (e.target.id === 'infoModal') this.closeInfoModal();
        });
        
        // Music Player
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.toggleMusicPlayback();
        });
        
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousTrack();
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextTrack();
        });
        
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Playlist items
        document.querySelectorAll('.playlist-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectTrack(index);
            });
        });
        
        // Auto-save settings on input change
        ['durFocus', 'durShort', 'durLong', 'goalInput'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                setTimeout(() => this.saveSettingsFromUI(), 500);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.toggleTimer();
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetTimer();
                    break;
                case 's':
                    e.preventDefault();
                    this.skipSession();
                    break;
                case 'Escape':
                    this.closeInfoModal();
                    break;
            }
        });
    }
    
    initializeUI() {
        // Update duration inputs
        document.getElementById('durFocus').value = this.settings.focus;
        document.getElementById('durShort').value = this.settings.short;
        document.getElementById('durLong').value = this.settings.long;
        document.getElementById('goalInput').value = this.settings.goal;
        
        // Update auto start toggle
        const autoToggle = document.getElementById('autoToggle');
        autoToggle.setAttribute('aria-pressed', this.settings.autoStart.toString());
        
        // Update stats
        this.updateStatsDisplay();
        
        // Update task list
        this.updateTaskList();
        
        // Update timer display
        this.updateTimerDisplay();
        
        // Set initial timer duration
        this.timeRemaining = this.settings[this.currentMode] * 60;
    }
    
    switchMode(mode) {
        if (this.isRunning && !this.isPaused) {
            if (!confirm('Timer sedang berjalan. Yakin ingin mengganti mode?')) {
                return;
            }
        }
        
        this.currentMode = mode;
        this.resetTimer();
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('bg-[#ff6347]/20', 'text-white', 'border-[#ff6347]/30');
            btn.classList.add('bg-white/0', 'hover:bg-white/5', 'border-white/10', 'text-white/80', 'hover:text-white');
        });
        
        const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
        activeBtn.classList.remove('bg-white/0', 'hover:bg-white/5', 'border-white/10', 'text-white/80', 'hover:text-white');
        activeBtn.classList.add('bg-[#ff6347]/20', 'text-white', 'border-[#ff6347]/30');
        
        // Update timer
        this.timeRemaining = this.settings[mode] * 60;
        this.updateTimerDisplay();
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.completeSession();
            }
        }, 1000);
        
        // Update button
        this.updateStartPauseButton();
        
        // Show notification
        this.showNotification('Timer dimulai!', `${this.getModeLabel()} session telah dimulai.`);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        
        clearInterval(this.timerInterval);
        this.updateStartPauseButton();
        
        this.showNotification('Timer dijeda', 'Timer telah dijeda. Klik play untuk melanjutkan.');
    }
    
    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.timerInterval);
        this.timeRemaining = this.settings[this.currentMode] * 60;
        
        this.updateTimerDisplay();
        this.updateStartPauseButton();
    }
    
    skipSession() {
        if (this.isRunning || this.isPaused) {
            this.completeSession();
        }
    }
    
    completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        
        // Update stats if it was a focus session
        if (this.currentMode === 'focus') {
            this.stats.doneToday++;
            this.saveStats();
        }
        
        // Show completion notification
        this.showNotification(
            'Session Selesai!', 
            `${this.getModeLabel()} session telah selesai. ${this.sessionName ? `"${this.sessionName}"` : ''}`
        );
        
        // Play completion sound (if available)
        this.playCompletionSound();
        
        // Auto start next session if enabled
        if (this.settings.autoStart) {
            setTimeout(() => {
                this.autoStartNextSession();
            }, 3000);
        } else {
            this.resetTimer();
        }
        
        this.updateStatsDisplay();
        this.updateStartPauseButton();
        this.updateChart();
    }
    
    autoStartNextSession() {
        // Determine next mode
        if (this.currentMode === 'focus') {
            // After focus, determine break type based on sessions completed
            const nextMode = (this.stats.doneToday % 4 === 0) ? 'long' : 'short';
            this.switchMode(nextMode);
        } else {
            // After break, go to focus
            this.switchMode('focus');
        }
        
        setTimeout(() => {
            this.startTimer();
        }, 1000);
    }
    
    saveSessionName() {
        const nameInput = document.getElementById('customName');
        this.sessionName = nameInput.value.trim();
        this.updateSessionNameDisplay();
        
        // Show feedback
        if (this.sessionName) {
            this.showNotification('Nama Session Disimpan', `"${this.sessionName}"`);
        }
    }
    
    saveSettingsFromUI() {
        this.settings.focus = parseInt(document.getElementById('durFocus').value) || 25;
        this.settings.short = parseInt(document.getElementById('durShort').value) || 5;
        this.settings.long = parseInt(document.getElementById('durLong').value) || 15;
        this.settings.goal = parseInt(document.getElementById('goalInput').value) || 8;
        
        // Update timer if not running
        if (!this.isRunning) {
            this.timeRemaining = this.settings[this.currentMode] * 60;
            this.updateTimerDisplay();
        }
        
        this.saveSettings();
        this.updateStatsDisplay();
        
        // Show feedback
        document.getElementById('saveHint').textContent = 'Tersimpan!';
        setTimeout(() => {
            document.getElementById('saveHint').textContent = 'Otomatis tersimpan';
        }, 2000);
    }
    
    toggleAutoStart() {
        this.settings.autoStart = !this.settings.autoStart;
        const toggle = document.getElementById('autoToggle');
        toggle.setAttribute('aria-pressed', this.settings.autoStart.toString());
        
        this.saveSettings();
    }
    
    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date()
        };
        
        this.tasks.unshift(task);
        input.value = '';
        
        this.updateTaskList();
        this.saveTasks();
    }
    
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.updateTaskList();
            this.saveTasks();
        }
    }
    
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.updateTaskList();
        this.saveTasks();
    }
    
    setReminder() {
        const timeInput = document.getElementById('reminderTime');
        const textInput = document.getElementById('reminderText');
        
        const time = timeInput.value;
        const text = textInput.value.trim();
        
        if (!time || !text) {
            this.showNotification('Error', 'Harap isi waktu dan pesan reminder.');
            return;
        }
        
        const reminder = {
            id: Date.now(),
            time: time,
            text: text,
            active: true
        };
        
        this.reminders.push(reminder);
        this.saveReminders();
        
        // Set up the reminder
        this.scheduleReminder(reminder);
        
        // Clear inputs
        timeInput.value = '';
        textInput.value = '';
        
        this.showNotification('Reminder Set', `Reminder akan aktif pada ${time}`);
    }
    
    scheduleReminder(reminder) {
        const now = new Date();
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);
        
        // If the time has passed today, set for tomorrow
        if (reminderTime <= now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.showNotification('Reminder', reminder.text);
            this.playNotificationSound();
        }, timeUntilReminder);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timeDisplay').textContent = display;
        document.getElementById('timerLabel').textContent = this.getModeLabel();
        document.getElementById('modeNow').textContent = this.getModeLabel();
        
        // Update progress ring
        const totalTime = this.settings[this.currentMode] * 60;
        const progress = ((totalTime - this.timeRemaining) / totalTime) * 360;
        const progressRing = document.getElementById('progressRing');
        progressRing.style.background = `conic-gradient(#ff6347 ${progress}deg, rgba(255,255,255,0.06) ${progress}deg)`;
        
        // Update page title
        document.title = `${display} - Pomotask`;
        
        this.updateSessionNameDisplay();
    }
    
    updateSessionNameDisplay() {
        const sessionNameEl = document.getElementById('sessionName');
        sessionNameEl.textContent = this.sessionName || '—';
    }
    
    updateStartPauseButton() {
        const btn = document.getElementById('startPauseBtn');
        const label = document.getElementById('startPauseLabel');
        const playIcon = btn.querySelector('.icon-play');
        const pauseIcon = btn.querySelector('.icon-pause');
        
        if (this.isRunning) {
            label.textContent = 'Pause';
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            label.textContent = this.isPaused ? 'Resume' : 'Mulai';
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('doneToday').textContent = this.stats.doneToday;
        document.getElementById('goalToday').textContent = this.settings.goal;
        document.getElementById('totalTasks').textContent = this.tasks.length;
        document.getElementById('completedTasks').textContent = this.tasks.filter(t => t.completed).length;
    }
    
    updateTaskList() {
        const container = document.getElementById('taskList');
        
        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-white/40">
                    <i data-lucide="clipboard" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>Belum ada task. Tambahkan task pertama Anda!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        container.innerHTML = this.tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="app.toggleTask(${task.id})">
                <span class="task-text">${task.text}</span>
                <button class="task-delete" onclick="app.deleteTask(${task.id})">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
        
        lucide.createIcons();
        this.updateStatsDisplay();
    }
    
    setupChart() {
        const ctx = document.getElementById('productivityChart').getContext('2d');
        
        // Get last 7 days data
        const last7Days = this.getLast7DaysData();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.labels,
                datasets: [{
                    label: 'Pomodoro Sessions',
                    data: last7Days.data,
                    borderColor: '#ff6347',
                    backgroundColor: 'rgba(255, 99, 71, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    updateChart() {
        if (this.chart) {
            const last7Days = this.getLast7DaysData();
            this.chart.data.labels = last7Days.labels;
            this.chart.data.datasets[0].data = last7Days.data;
            this.chart.update();
            
            this.updateWeeklyStats(last7Days);
        }
    }
    
    getLast7DaysData() {
        const labels = [];
        const data = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            const dateStr = date.toDateString();
            labels.push(date.toLocaleDateString('id-ID', { weekday: 'short' }));
            
            // Get data from localStorage for this date
            const dayData = localStorage.getItem(`pomotask-day-${dateStr}`);
            data.push(dayData ? parseInt(dayData) : 0);
        }
        
        return { labels, data };
    }
    
    updateWeeklyStats(weekData) {
        const total = weekData.data.reduce((sum, val) => sum + val, 0);
        const avg = total / 7;
        
        document.getElementById('avgPerDay').textContent = avg.toFixed(1);
        document.getElementById('totalWeek').textContent = total;
        
        // Calculate streaks (simplified)
        let currentStreak = 0;
        let bestStreak = 0;
        let streak = 0;
        
        for (let i = weekData.data.length - 1; i >= 0; i--) {
            if (weekData.data[i] > 0) {
                streak++;
                if (i === weekData.data.length - 1) {
                    currentStreak = streak;
                }
            } else {
                bestStreak = Math.max(bestStreak, streak);
                streak = 0;
            }
        }
        
        bestStreak = Math.max(bestStreak, streak);
        
        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('bestStreak').textContent = bestStreak;
        
        // Save today's data
        const today = new Date().toDateString();
        localStorage.setItem(`pomotask-day-${today}`, this.stats.doneToday.toString());
    }
    
    getModeLabel() {
        const labels = {
            focus: 'Fokus',
            short: 'Short Break',
            long: 'Long Break'
        };
        return labels[this.currentMode] || 'Fokus';
    }
    
    // Info modal controls
    openInfoModal() {
        const modal = document.getElementById('infoModal');
        const contentEl = document.getElementById('infoContent');
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');

        // Load info.html into an iframe to preserve its styles and layout
        if (contentEl) {
            contentEl.innerHTML = '';
            const frame = document.createElement('iframe');
            frame.id = 'infoFrame';
            frame.src = 'info.html?v=' + Date.now();
            frame.className = 'w-full h-[70vh] rounded-md border border-white/10 bg-black';
            frame.loading = 'eager';
            contentEl.appendChild(frame);
        }
    }
    
    closeInfoModal() {
        const modal = document.getElementById('infoModal');
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');

        // Clear iframe to stop any background activity
        const contentEl = document.getElementById('infoContent');
        if (contentEl) {
            contentEl.innerHTML = '';
        }
    }
    
    requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    const btn = document.getElementById('notifyBtn');
                    const span = btn.querySelector('span');
                    
                    if (permission === 'granted') {
                        span.textContent = 'Notifikasi Aktif';
                        this.showNotification('Notifikasi Aktif', 'Anda akan menerima notifikasi dari Pomotask.');
                    } else {
                        span.textContent = 'Notifikasi Ditolak';
                    }
                });
            }
        }
    }
    
    showNotification(title, body) {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/favicon.ico'
            });
        }
        
        // In-app notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <i data-lucide="bell" class="w-5 h-5 text-[#ff6347] mt-0.5"></i>
                <div class="flex-1">
                    <h4 class="font-semibold text-sm">${title}</h4>
                    <p class="text-xs text-white/80 mt-1">${body}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white/60 hover:text-white">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        lucide.createIcons();
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    playCompletionSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Fallback: no sound
            console.log('Audio not supported');
        }
    }
    
    playNotificationSound() {
        this.playCompletionSound();
    }
    
    // Music Player Methods
    initializeMusicPlayer() {
        this.musicPlayer.audio = document.getElementById('audioPlayer');
        
        // Audio event listeners
        this.musicPlayer.audio.addEventListener('loadedmetadata', () => {
            this.updateMusicUI();
        });
        
        this.musicPlayer.audio.addEventListener('timeupdate', () => {
            this.updateProgressBar();
        });
        
        this.musicPlayer.audio.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        this.musicPlayer.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showNotification('Error', 'Failed to load audio file');
        });
        
        // Set initial volume
        this.musicPlayer.audio.volume = this.musicPlayer.volume;
        this.updateMusicUI();
    }
    
    toggleMusicPlayback() {
        if (!this.musicPlayer.audio.src) {
            this.selectTrack(0);
            return;
        }
        
        if (this.musicPlayer.isPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }
    
    playMusic() {
        this.musicPlayer.audio.play().then(() => {
            this.musicPlayer.isPlaying = true;
            this.updatePlayPauseButton();
        }).catch(error => {
            console.error('Play error:', error);
            this.showNotification('Error', 'Failed to play audio');
        });
    }
    
    pauseMusic() {
        this.musicPlayer.audio.pause();
        this.musicPlayer.isPlaying = false;
        this.updatePlayPauseButton();
    }
    
    selectTrack(index) {
        if (index < 0 || index >= this.musicPlayer.playlist.length) return;
        
        const wasPlaying = this.musicPlayer.isPlaying;
        this.pauseMusic();
        
        this.musicPlayer.currentIndex = index;
        const track = this.musicPlayer.playlist[index];
        this.musicPlayer.audio.src = track.src;
        
        // Update UI
        this.updatePlaylistUI();
        this.updateMusicUI();
        
        if (wasPlaying) {
            setTimeout(() => this.playMusic(), 100);
        }
    }
    
    nextTrack() {
        const nextIndex = (this.musicPlayer.currentIndex + 1) % this.musicPlayer.playlist.length;
        this.selectTrack(nextIndex);
    }
    
    previousTrack() {
        const prevIndex = this.musicPlayer.currentIndex === 0 
            ? this.musicPlayer.playlist.length - 1 
            : this.musicPlayer.currentIndex - 1;
        this.selectTrack(prevIndex);
    }
    
    setVolume(volume) {
        this.musicPlayer.volume = Math.max(0, Math.min(1, volume));
        this.musicPlayer.audio.volume = this.musicPlayer.volume;
        document.getElementById('volumeValue').textContent = Math.round(this.musicPlayer.volume * 100) + '%';
    }
    
    updateMusicUI() {
        const track = this.musicPlayer.playlist[this.musicPlayer.currentIndex];
        document.getElementById('currentSongTitle').textContent = track.title;
        document.getElementById('currentSongArtist').textContent = track.artist;
        
        if (this.musicPlayer.audio.duration) {
            document.getElementById('totalTime').textContent = this.formatTime(this.musicPlayer.audio.duration);
        }
    }
    
    updatePlayPauseButton() {
        const playIcon = document.querySelector('#playPauseBtn .icon-play');
        const pauseIcon = document.querySelector('#playPauseBtn .icon-pause');
        
        if (this.musicPlayer.isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }
    
    updateProgressBar() {
        if (this.musicPlayer.audio.duration) {
            const progress = (this.musicPlayer.audio.currentTime / this.musicPlayer.audio.duration) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('currentTime').textContent = this.formatTime(this.musicPlayer.audio.currentTime);
        }
    }
    
    updatePlaylistUI() {
        document.querySelectorAll('.playlist-item').forEach((item, index) => {
            if (index === this.musicPlayer.currentIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}


// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PomotaskApp();
});

// Service Worker registration for better performance (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // You can implement a service worker here for offline functionality
    });
}


