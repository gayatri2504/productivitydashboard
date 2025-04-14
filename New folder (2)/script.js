document.addEventListener('DOMContentLoaded', () => {
    // Dark/Light Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const currentTheme = localStorage.getItem('theme') || 'light';

    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '<i class="fas fa-sun"></i> Light Mode';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const newTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
        localStorage.setItem('theme', newTheme);
    });

    // Focus Mode Toggle
    const focusToggle = document.getElementById('focus-toggle');
    focusToggle.addEventListener('click', () => {
        body.classList.toggle('focus-active');
        const isFocusActive = body.classList.contains('focus-active') ? 'eye' : 'eye-slash';
        focusToggle.innerHTML = `<i class="fas fa-${isFocusActive}"></i> ${isFocusActive === 'eye' ? 'Exit Focus' : 'Focus Mode'}`;
    });

    // Daily Goal
    const goalInput = document.getElementById('goal-input');
    const storedGoal = localStorage.getItem('dailyGoal') || '';
    goalInput.value = storedGoal;
    goalInput.addEventListener('input', () => {
        localStorage.setItem('dailyGoal', goalInput.value);
    });

    // To-Do List
    const newTaskInput = document.getElementById('new-task');
    const addTaskButton = document.getElementById('add-task');
    const tasksList = document.getElementById('tasks');
    const completionPercentage = document.getElementById('completion-percentage');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const taskPriorityInput = document.getElementById('task-priority');

    let tasks = loadTasks();
    renderTasks(tasks);
    enableDragSort();

    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        return storedTasks ? JSON.parse(storedTasks) : [];
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(taskList) {
        tasksList.innerHTML = '';
        let completedCount = 0;
        taskList.forEach((task, index) => {
            const listItem = document.createElement('li');
            listItem.dataset.id = task.id; // For drag and drop tracking
            listItem.dataset.priority = task.priority;
            listItem.innerHTML = `
                <input type="checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="${task.priority}">${task.text}</span>
                <button class="edit-button" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-button" data-id="${task.id}"><i class="fas fa-trash"></i></button>
            `;
            if (task.completed) {
                listItem.classList.add('completed');
                completedCount++;
            }
            tasksList.appendChild(listItem);
        });
        updateCompletionPercentage(completedCount, tasks.length);
    }

    function addTask() {
        const taskText = newTaskInput.value.trim();
        if (taskText !== '') {
            const newTask = {
                id: Date.now(), // Simple unique ID
                text: taskText,
                completed: false,
                priority: taskPriorityInput.value
            };
            tasks.push(newTask);
            newTaskInput.value = '';
            saveTasks();
            renderTasks(filterTasks());
        }
    }

    function toggleTaskCompletion(taskId) {
        const task = tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks(filterTasks());
        }
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== parseInt(taskId));
        saveTasks();
        renderTasks(filterTasks());
    }

    function editTask(taskId, newText) {
        const task = tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            task.text = newText;
            saveTasks();
            renderTasks(filterTasks());
        }
    }

    function filterTasks(filterType = document.querySelector('.filter-btn.active').dataset.filter) {
        switch (filterType) {
            case 'active':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            default:
                return tasks;
        }
    }

    function updateCompletionPercentage(completed, total) {
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        completionPercentage.textContent = `${percentage}%`;
    }

    addTaskButton.addEventListener('click', addTask);

    newTaskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    tasksList.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const taskId = event.target.dataset.id;
            toggleTaskCompletion(taskId);
        }
    });

    tasksList.addEventListener('click', (event) => {
        const taskId = event.target.dataset.id;
        if (event.target.classList.contains('delete-button')) {
            deleteTask(taskId);
        } else if (event.target.classList.contains('edit-button')) {
            const taskItem = event.target.parentNode.querySelector('span');
            const currentText = taskItem.textContent;
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.value = currentText;
            taskItem.replaceWith(inputField);
            inputField.focus();

            inputField.addEventListener('blur', () => {
                const newText = inputField.value.trim();
                if (newText !== currentText) {
                    editTask(taskId, newText);
                } else {
                    renderTasks(filterTasks()); // Re-render to show the span
                }
            });

            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    inputField.blur();
                }
            });
        }
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderTasks(filterTasks(this.dataset.filter));
        });
    });

    function enableDragSort() {
        Sortable.create(tasksList, {
            draggable: 'li',
            dataIdAttr: 'data-id',
            onEnd: function (evt) {
                const newTasksOrder = Array.from(tasksList.children).map(li => {
                    return tasks.find(task => task.id === parseInt(li.dataset.id));
                }).filter(task => task !== undefined);
                tasks = newTasksOrder;
                saveTasks();
                renderTasks(filterTasks());
            }
        });
    }

    // Pomodoro Timer
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const startButton = document.getElementById('start-timer');
    const pauseButton = document.getElementById('pause-timer');
    const resetButton = document.getElementById('reset-timer');
    const progressBar = document.getElementById('progress-bar');
    const workDurationInput = document.getElementById('work-duration');
    const breakDurationInput = document.getElementById('break-duration');

    let workTime = parseInt(workDurationInput.value) * 60;
    let breakTime = parseInt(breakDurationInput.value) * 60;
    let currentTime = workTime;
    let timerInterval;
    let isWorking = true;

    function updateTimerDisplay() {
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        minutesDisplay.textContent = String(minutes).padStart(2, '0');
        secondsDisplay.textContent = String(seconds).padStart(2, '0');
        updateProgressBar();
    }

    function startTimer() {
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                currentTime--;
                updateTimerDisplay();
                if (currentTime < 0) {
                    clearInterval(timerInterval);
                    playSound(); // Implement playSound function if desired
                    isWorking = !isWorking;
                    currentTime = isWorking ? workTime : breakTime;
                    updateTimerDisplay();
                    startTimer(); // Start the next session
                }
            }, 1000);
        }
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        workTime = parseInt(workDurationInput.value) * 60;
        breakTime = parseInt(breakDurationInput.value) * 60;
        currentTime = workTime;
        isWorking = true;
        updateTimerDisplay();
        progressBar.style.width = '0%';
    }

    function updateProgressBar() {
        const totalTime = isWorking ? workTime : breakTime;
        const percentage = (totalTime - currentTime) / totalTime * 100;
        progressBar.style.width = `${percentage}%`;
    }

    function playSound() {
        // Optional: Add audio element and play sound
        // const audio = new Audio('path/to/your/sound.mp3');
        // audio.play();
        console.log('Timer finished!');
    }

    updateTimerDisplay(); // Initial display

    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);

    workDurationInput.addEventListener('change', resetTimer);
    breakDurationInput.addEventListener('change', resetTimer);

    // Basic Daily Quote (Placeholder)
    const quoteTextElement = document.getElementById('quote-text');
    const quoteAuthorElement = document.getElementById('quote-author');
    const placeholderQuotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
        { text: "The mind is everything. What you think you become.", author: "Buddha" }
    ];

    function displayRandomQuote() {
        const randomIndex = Math.floor(Math.random() * placeholderQuotes.length);
        quoteTextElement.textContent = placeholderQuotes[randomIndex].text;
        quoteAuthorElement.textContent = `- ${placeholderQuotes[randomIndex].author}`;
    }

    displayRandomQuote(); // Display a quote on load

    // Basic Daily Planner
    const plannerInput = document.getElementById('planner-input');
    const storedPlan = localStorage.getItem('dailyPlan') || '';
    plannerInput.value = storedPlan;
    plannerInput.addEventListener('input', () => {
        localStorage.setItem('dailyPlan', plannerInput.value);
    });
});