# ⚡ Personal Productivity Dashboard

A modern, fast, and responsive task and productivity management web app built with vanilla **HTML5**, **CSS3**, and modern **JavaScript (ES6+)**. No external libraries, frameworks, or paid APIs required.

🌐 **Live Demo:** [https://Ishwarisw.github.io/personal-productivity-dashboard/](https://Ishwarisw.github.io/personal-productivity-dashboard/)

---

## 🌟 Features

- **Full Task Lifecycle (CRUD)**: Create, Read, Update/Edit, and Delete tasks seamlessly.
- **Priority Categorization**: Assign urgency levels (**🔥 High**, **⚡ Medium**, **🌱 Low**) with visual color-coded badges.
- **Deadline Tracking**: Set due dates with smart badge status indicators:
  - 🚨 **Overdue**: Automatically flags missed deadlines.
  - 📅 **Due Today**: Highlights immediate priorities.
  - 📆 **Upcoming**: Shows formatted target dates.
- **Real-Time Analytics & Progress**:
  - Live counts for **Total**, **Pending**, and **Completed** tasks.
  - Dynamic completion rate percentage and an animated progress bar.
- **Offline Local Persistence**: Automatically saves and loads your tasks using your browser's `localStorage` so your data persists even after closing or refreshing the tab.
- **Search, Filter & Sort**:
  - **Live Search**: Instant keyword filtering across task titles and descriptions.
  - **Status Tabs**: Filter by *All*, *Pending*, *Completed*, or *Overdue*.
  - **Priority Filter**: Filter tasks by High, Medium, or Low priority.
  - **Sorting**: Order tasks by Deadline (soonest first), Priority (highest first), Date Added, or Alphabetical.
- **Mobile-First & Modern UI**: Built with responsive CSS Grid and Flexbox, featuring smooth animations, accessible dialog modals, and toast alerts.

---

## 📁 Project Structure

```text
Productivity_Dashboard/
├── index.html        # App skeleton, semantic layout, and accessible dialogs
├── css/
│   └── styles.css    # Design tokens, CSS variables, typography, animations, responsive rules
├── js/
│   └── app.js        # Core logic: state management, localStorage, DOM rendering & event handling
├── .gitignore        # Ignores OS artifacts and editor configuration files
└── README.md         # Comprehensive setup instructions and architecture explanation
```

---

## 🚀 How to Launch and Test the App

You have three easy ways to run this application:

### Method 1: Direct Browser Launch (Easiest & Fastest)
1. Open your file explorer and navigate to the project directory:
   ```
   c:\Users\ISHWARI WALEWADIKAR\Downloads\Productivity_Dashboard
   ```
2. Double-click **`index.html`** (or right-click → **Open with** → Google Chrome, Microsoft Edge, Firefox, or Safari).
3. The dashboard will launch immediately in your default browser.

### Method 2: Using Python (Local HTTP Server)
If you have Python installed, open PowerShell or Terminal in this folder and run:
```powershell
python -m http.server 8000
```
Then open your browser and navigate to:
```
http://localhost:8000
```

### Method 3: Using VS Code Live Server
1. Open this folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Click **"Go Live"** in the bottom status bar or right-click `index.html` → **Open with Live Server**.

---

## 🧪 Testing Checklist (Verify Everything Works)

Follow these simple steps to test every feature:

1. **First-Time Load**:
   - When the dashboard opens, you should see 3 sample tasks showcasing High, Medium, and Low priorities, as well as an accurate statistics count and progress bar.
2. **Add a New Task**:
   - Click the **"+ New Task"** button in the header.
   - Enter a title (e.g., *"Prepare presentation"*), pick a priority, choose a deadline date, and optionally enter notes.
   - Click **Save Task**. You will see a success toast notification and the task will appear in the list.
3. **Complete a Task**:
   - Click the circular checkbox on any task card.
   - Notice the animated checkmark, strike-through text, updated stats, and progress bar adjustment.
4. **Edit a Task**:
   - Click the pencil icon on any task.
   - Modify the title or priority, then click **Save Task**. Verify that the card updates instantly.
5. **Delete a Task**:
   - Click the trash can icon on a task.
   - Confirm the deletion prompt. The task is removed and a notification is displayed.
6. **Search & Filter**:
   - Type a keyword into the search bar to verify live filtering.
   - Click the status pills (**Pending**, **Completed**, **Overdue**) to see filtered views.
   - Select a priority filter or change the sorting option (e.g. *Priority: Highest*).
7. **Persistence Test**:
   - Refresh the browser (`F5` or `Ctrl + R`).
   - Notice that all your additions, edits, and completed states remain intact!

---

## 💡 How the Code Works (Beginner-Friendly Explanation)

### 1. `index.html` (The Structure)
- Uses semantic HTML5 tags (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`) which improve readability, search engine indexing, and screen reader accessibility.
- Contains an accessible modal dialog (`role="dialog"`, `aria-modal="true"`) for adding and editing tasks.
- Employs lightweight, self-contained SVG icons so there is zero dependency on external icon fonts (like FontAwesome) that require an internet connection.

### 2. `css/styles.css` (The Presentation)
- **CSS Variables (`:root`)**: Centrally defines color schemes, border radii, shadows, and priority tints. If you want to change the primary brand color, you only edit `--primary: #4f46e5;` in one place!
- **CSS Grid & Flexbox**: Uses CSS Grid for the 4-column metrics dashboard (collapsing to 2 columns on tablets and 1 column on mobile phones) and Flexbox for toolbar alignment and task cards.
- **Micro-Interactions**: Provides subtle hover effects, active button transitions, and keyframe animations for the modal (`slideUp`) and toast banners (`slideToast`).

### 3. `js/app.js` (The Logic & Engine)
The JavaScript follows clean software engineering principles:
- **Single Source of Truth (State)**: A single JavaScript object (`state`) holds the current list of tasks, active search queries, selected filters, and sorting criteria.
- **Separation of Concerns**:
  - `loadTasks()` and `saveTasks()` handle reading/writing data to browser `localStorage`.
  - `render()` is a pure rendering pipeline that computes metrics, filters tasks based on user selections, sorts them, and updates the DOM.
  - `getDeadlineInfo()` calculates whether an item is overdue by comparing timestamps to the current day.
- **Security & XSS Protection**: Any user input rendered onto the screen passes through `escapeHtml()` to ensure malicious HTML/script tags cannot be executed.
- **Event Delegation & Isolation**: Wrapped in an Immediately Invoked Function Expression (IIFE) to avoid polluting the global window scope.

---

## 🛡️ Privacy & Security
- **100% Client-Side**: No personal data or task details leave your browser.
- **Zero API Keys**: Operates entirely offline without external subscriptions or telemetry.

---

## 📝 License
This project is open-source and free to use for personal or educational purposes.
