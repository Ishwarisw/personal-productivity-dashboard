/**
 * Personal Productivity Dashboard
 * Vanilla JavaScript (ES6+) Implementation
 * 
 * Features:
 * - CRUD operations for tasks (Create, Read, Update, Delete)
 * - Priority levels: High, Medium, Low
 * - Deadline tracking & overdue detection
 * - Real-time statistics & progress bar
 * - Multi-criteria filtering (Status, Priority) & Sorting
 * - LocalStorage synchronization
 * - Accessible Modal & Toast alerts
 */

(function () {
  'use strict';

  // ==========================================
  // Storage & State Configuration
  // ==========================================
  const STORAGE_KEY = 'productivity_hub_tasks_v1';

  let state = {
    tasks: [],
    statusFilter: 'all',     // 'all' | 'pending' | 'completed' | 'overdue'
    priorityFilter: 'all',   // 'all' | 'high' | 'medium' | 'low'
    searchQuery: '',
    sortBy: 'deadline',      // 'deadline' | 'priority' | 'created' | 'alphabetical'
    editingTaskId: null
  };

  // Default seed data for first-time visitors
  const DEFAULT_TASKS = [
    {
      id: 'task-seed-1',
      title: 'Complete Project Architecture Plan',
      description: 'Finalize core technical specifications and review component boundaries.',
      priority: 'high',
      deadline: getOffsetDateString(1), // Tomorrow
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-seed-2',
      title: 'Conduct Weekly Team Sync',
      description: 'Discuss sprint progress, remove blockers, and align on upcoming deliverables.',
      priority: 'medium',
      deadline: getOffsetDateString(3), // In 3 days
      completed: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'task-seed-3',
      title: 'Archive Completed Sprint Docs',
      description: 'Clean up repository notes and organize shared documentation folder.',
      priority: 'low',
      deadline: getOffsetDateString(5), // In 5 days
      completed: true,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  // ==========================================
  // DOM Elements Cache
  // ==========================================
  const elements = {
    // Current date header
    currentDate: document.getElementById('current-date'),

    // Stats
    statTotal: document.getElementById('stat-total'),
    statPending: document.getElementById('stat-pending'),
    statCompleted: document.getElementById('stat-completed'),
    statPercentage: document.getElementById('stat-percentage'),
    progressBarFill: document.getElementById('progress-bar-fill'),

    // Controls
    addTaskBtn: document.getElementById('add-task-btn'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    statusFilterPills: document.querySelectorAll('.filter-pill'),
    priorityFilterSelect: document.getElementById('filter-priority'),
    sortTasksSelect: document.getElementById('sort-tasks'),

    // Task list & empty state
    tasksList: document.getElementById('tasks-list'),
    taskListTitle: document.getElementById('task-list-title'),
    activeTasksCount: document.getElementById('active-tasks-count'),
    emptyState: document.getElementById('empty-state'),
    emptyMessage: document.getElementById('empty-message'),
    emptyAddBtn: document.getElementById('empty-add-btn'),

    // Modal elements
    modal: document.getElementById('task-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    taskForm: document.getElementById('task-form'),
    taskIdInput: document.getElementById('task-id'),
    taskTitleInput: document.getElementById('task-title'),
    taskDescInput: document.getElementById('task-description'),
    taskPriorityInput: document.getElementById('task-priority'),
    taskDeadlineInput: document.getElementById('task-deadline'),

    // Validation error spans
    titleError: document.getElementById('title-error'),
    deadlineError: document.getElementById('deadline-error'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================
  // Helper Utility Functions
  // ==========================================

  /**
   * Returns a date string formatted as YYYY-MM-DD offset by a number of days from today
   */
  function getOffsetDateString(daysOffset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return formatDateToISOString(d);
  }

  function formatDateToISOString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generates a unique task ID
   */
  function generateId() {
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Escape HTML to prevent XSS injection in user-rendered strings
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Returns metadata about task deadline (overdue status, friendly label, styling class)
   */
  function getDeadlineInfo(deadlineStr, completed) {
    if (!deadlineStr) {
      return { label: 'No deadline', isOverdue: false, isToday: false, badgeClass: '' };
    }

    // Set end-of-day for target deadline in local time
    const [year, month, day] = deadlineStr.split('-').map(Number);
    const deadlineDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const isToday = deadlineDate >= startOfToday && deadlineDate <= endOfToday;
    const isOverdue = !completed && deadlineDate < startOfToday;

    // Friendly date display
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = new Date(year, month - 1, day).toLocaleDateString(undefined, options);

    let label = formattedDate;
    let badgeClass = '';

    if (isOverdue) {
      label = `Overdue (${formattedDate})`;
      badgeClass = 'overdue';
    } else if (isToday) {
      label = `Due Today (${formattedDate})`;
      badgeClass = 'today';
    }

    return { label, isOverdue, isToday, badgeClass };
  }

  // ==========================================
  // LocalStorage Persistence
  // ==========================================
  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        state.tasks = JSON.parse(stored);
      } else {
        // Seed default tasks on very first visit
        state.tasks = [...DEFAULT_TASKS];
        saveTasks();
      }
    } catch (e) {
      console.error('Could not load tasks from localStorage:', e);
      state.tasks = [...DEFAULT_TASKS];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Could not save tasks to localStorage:', e);
      showToast('Warning: LocalStorage quota exceeded or storage disabled.', 'danger');
    }
  }

  // ==========================================
  // Toast Notifications
  // ==========================================
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }

  // ==========================================
  // Task Operations (CRUD)
  // ==========================================

  function addTask(title, description, priority, deadline) {
    const newTask = {
      id: generateId(),
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority,
      deadline: deadline,
      completed: false,
      createdAt: new Date().toISOString()
    };

    state.tasks.unshift(newTask);
    saveTasks();
    render();
    showToast('Task added successfully!', 'success');
  }

  function updateTask(id, title, description, priority, deadline) {
    const taskIndex = state.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    state.tasks[taskIndex].title = title.trim();
    state.tasks[taskIndex].description = description ? description.trim() : '';
    state.tasks[taskIndex].priority = priority;
    state.tasks[taskIndex].deadline = deadline;

    saveTasks();
    render();
    showToast('Task updated successfully!', 'success');
  }

  function toggleTaskComplete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    render();

    const msg = task.completed ? 'Task completed! Great job!' : 'Task marked as pending.';
    showToast(msg, 'info');
  }

  function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${task.title}"?`);
    if (!confirmDelete) return;

    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    render();
    showToast('Task deleted.', 'danger');
  }

  // ==========================================
  // Filtering & Sorting Logic
  // ==========================================
  function getFilteredAndSortedTasks() {
    let result = [...state.tasks];

    // 1. Filter by Status
    if (state.statusFilter === 'pending') {
      result = result.filter(t => !t.completed);
    } else if (state.statusFilter === 'completed') {
      result = result.filter(t => t.completed);
    } else if (state.statusFilter === 'overdue') {
      result = result.filter(t => {
        if (t.completed || !t.deadline) return false;
        const info = getDeadlineInfo(t.deadline, t.completed);
        return info.isOverdue;
      });
    }

    // 2. Filter by Priority
    if (state.priorityFilter !== 'all') {
      result = result.filter(t => t.priority === state.priorityFilter);
    }

    // 3. Search query filter
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (state.sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      } else if (state.sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      } else if (state.sortBy === 'created') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (state.sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }

  // ==========================================
  // Statistics Calculations
  // ==========================================
  function updateStatistics() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    elements.statTotal.textContent = total;
    elements.statPending.textContent = pending;
    elements.statCompleted.textContent = completed;
    elements.statPercentage.textContent = `${percentage}%`;

    elements.progressBarFill.style.width = `${percentage}%`;
    const container = elements.progressBarFill.parentElement;
    if (container) {
      container.setAttribute('aria-valuenow', percentage);
    }
  }

  // ==========================================
  // DOM Rendering
  // ==========================================
  function renderTaskCard(task) {
    const card = document.createElement('article');
    card.className = `task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`;
    card.setAttribute('data-id', task.id);
    card.setAttribute('role', 'listitem');

    const deadlineInfo = getDeadlineInfo(task.deadline, task.completed);

    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    card.innerHTML = `
      <button class="checkbox-btn" aria-label="${task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
        <svg class="checkbox-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      <div class="task-body">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
        
        <div class="task-meta">
          <span class="badge badge-priority-${task.priority}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6"/>
            </svg>
            ${priorityLabel} Priority
          </span>

          <span class="badge badge-deadline ${deadlineInfo.badgeClass}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${deadlineInfo.label}
          </span>
        </div>
      </div>

      <div class="task-actions">
        <button class="action-btn btn-edit" aria-label="Edit task" title="Edit task">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>
        <button class="action-btn btn-delete" aria-label="Delete task" title="Delete task">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Event listeners on task items
    const checkboxBtn = card.querySelector('.checkbox-btn');
    checkboxBtn.addEventListener('click', () => toggleTaskComplete(task.id));

    const editBtn = card.querySelector('.btn-edit');
    editBtn.addEventListener('click', () => openEditModal(task));

    const deleteBtn = card.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return card;
  }

  function render() {
    updateStatistics();

    const filteredTasks = getFilteredAndSortedTasks();
    elements.tasksList.innerHTML = '';

    // Update section title & count label
    const titles = {
      all: 'All Tasks',
      pending: 'Active / Pending Tasks',
      completed: 'Completed Tasks',
      overdue: 'Overdue Tasks'
    };
    elements.taskListTitle.textContent = titles[state.statusFilter] || 'Tasks';
    elements.activeTasksCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'} shown`;

    // Check empty state
    if (filteredTasks.length === 0) {
      elements.emptyState.style.display = 'flex';
      elements.tasksList.style.display = 'none';

      if (state.searchQuery.trim() !== '') {
        elements.emptyMessage.textContent = `No tasks matching "${state.searchQuery}". Try a different keyword or reset filters.`;
      } else if (state.statusFilter === 'overdue') {
        elements.emptyMessage.textContent = 'Great news! You have no overdue tasks.';
      } else if (state.statusFilter === 'completed') {
        elements.emptyMessage.textContent = 'No tasks completed yet. Finish a task to see it here!';
      } else if (state.statusFilter === 'pending') {
        elements.emptyMessage.textContent = 'Awesome! There are no pending tasks right now.';
      } else {
        elements.emptyMessage.textContent = 'Your task list is empty. Add a new task to get started!';
      }
    } else {
      elements.emptyState.style.display = 'none';
      elements.tasksList.style.display = 'grid';

      filteredTasks.forEach(task => {
        elements.tasksList.appendChild(renderTaskCard(task));
      });
    }
  }

  // ==========================================
  // Modal Management
  // ==========================================
  function openAddModal() {
    state.editingTaskId = null;
    elements.modalTitle.textContent = 'Create New Task';
    elements.taskForm.reset();
    elements.taskIdInput.value = '';
    elements.taskPriorityInput.value = 'medium';
    // Default deadline: today
    elements.taskDeadlineInput.value = getOffsetDateString(0);

    clearFormValidation();
    showModal();
  }

  function openEditModal(task) {
    state.editingTaskId = task.id;
    elements.modalTitle.textContent = 'Edit Task';
    elements.taskIdInput.value = task.id;
    elements.taskTitleInput.value = task.title;
    elements.taskDescInput.value = task.description || '';
    elements.taskPriorityInput.value = task.priority;
    elements.taskDeadlineInput.value = task.deadline || '';

    clearFormValidation();
    showModal();
  }

  function showModal() {
    elements.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent page scroll
    setTimeout(() => elements.taskTitleInput.focus(), 50);
  }

  function closeModal() {
    elements.modal.style.display = 'none';
    document.body.style.overflow = '';
    state.editingTaskId = null;
    elements.taskForm.reset();
    clearFormValidation();
  }

  function clearFormValidation() {
    elements.taskTitleInput.classList.remove('is-invalid');
    elements.taskDeadlineInput.classList.remove('is-invalid');
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const title = elements.taskTitleInput.value.trim();
    const description = elements.taskDescInput.value.trim();
    const priority = elements.taskPriorityInput.value;
    const deadline = elements.taskDeadlineInput.value;

    let isValid = true;

    // Validate title
    if (!title) {
      elements.taskTitleInput.classList.add('is-invalid');
      isValid = false;
    } else {
      elements.taskTitleInput.classList.remove('is-invalid');
    }

    // Validate deadline
    if (!deadline) {
      elements.taskDeadlineInput.classList.add('is-invalid');
      isValid = false;
    } else {
      elements.taskDeadlineInput.classList.remove('is-invalid');
    }

    if (!isValid) return;

    if (state.editingTaskId) {
      updateTask(state.editingTaskId, title, description, priority, deadline);
    } else {
      addTask(title, description, priority, deadline);
    }

    closeModal();
  }

  // ==========================================
  // Event Listeners Setup
  // ==========================================
  function setupEventListeners() {
    // Add Task Button
    elements.addTaskBtn.addEventListener('click', openAddModal);
    elements.emptyAddBtn.addEventListener('click', openAddModal);

    // Modal Close Triggers
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modalCancelBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        closeModal();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.modal.style.display === 'flex') {
        closeModal();
      }
    });

    // Form Submit
    elements.taskForm.addEventListener('submit', handleFormSubmit);

    // Live validation clearance on typing
    elements.taskTitleInput.addEventListener('input', () => {
      if (elements.taskTitleInput.value.trim()) {
        elements.taskTitleInput.classList.remove('is-invalid');
      }
    });

    elements.taskDeadlineInput.addEventListener('change', () => {
      if (elements.taskDeadlineInput.value) {
        elements.taskDeadlineInput.classList.remove('is-invalid');
      }
    });

    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      elements.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
      render();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      elements.searchInput.focus();
      render();
    });

    // Status Filter Pills
    elements.statusFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        elements.statusFilterPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        state.statusFilter = pill.getAttribute('data-status');
        render();
      });
    });

    // Priority Filter
    elements.priorityFilterSelect.addEventListener('change', (e) => {
      state.priorityFilter = e.target.value;
      render();
    });

    // Sort Dropdown
    elements.sortTasksSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      render();
    });
  }

  // ==========================================
  // Header Date Display
  // ==========================================
  function displayCurrentDate() {
    if (!elements.currentDate) return;
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    elements.currentDate.textContent = `Today is ${now.toLocaleDateString(undefined, options)}`;
  }

  // ==========================================
  // Application Bootstrap
  // ==========================================
  function init() {
    displayCurrentDate();
    loadTasks();
    setupEventListeners();
    render();
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
