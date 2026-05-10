document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupThemeToggle();
  setupSmoothScroll();
  setupAnimatedBars();
  setupQuiz();
  loadQuizStats();
  setupReportForm();
  setupSimulation();
  setupFormValidation();
});

// ==================== MOBILE MENU ====================
function setupMobileMenu() {
  const btn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("show");
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "✕" : "☰";
  });

  document.addEventListener("click", (e) => {
    if (nav.classList.contains("show") &&
        !nav.contains(e.target) && !btn.contains(e.target)) {
      nav.classList.remove("show");
      btn.textContent = "☰";
      btn.setAttribute("aria-expanded", "false");
    }
  });
}

// ==================== THEME TOGGLE ====================
function setupThemeToggle() {
  if (document.querySelector('.theme-toggle-corner')) return;

  const toggle = document.createElement('button');
  toggle.className = 'theme-toggle-corner';
  toggle.setAttribute('aria-label', 'Toggle light/dark mode');
  document.body.appendChild(toggle);

  const saved = localStorage.getItem('gs-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isLight = saved === 'light' || (!saved && !prefersDark);

  if (isLight) {
    document.body.classList.add('light-mode');
    toggle.innerHTML = '☀️';
  } else {
    toggle.innerHTML = '🌙';
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const light = document.body.classList.toggle('light-mode');
    toggle.innerHTML = light ? '☀️' : '🌙';
    localStorage.setItem('gs-theme', light ? 'light' : 'dark');
    showToast(light ? 'Light mode on' : 'Dark mode on', 'info');
  });
}

// ==================== SMOOTH SCROLL ====================
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(a => {
    a.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ==================== ANIMATED BARS ====================
function setupAnimatedBars() {
  const bars = document.querySelectorAll('.bar-fill');
  if (!bars.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const w = bar.getAttribute('data-w');
        if (w) {
          setTimeout(() => { bar.style.width = w + '%'; }, 200);
        }
        io.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => io.observe(bar));
}

// ==================== QUIZ ====================
function setupQuiz() {
  const form = document.getElementById("quiz-form");
  const result = document.getElementById("quiz-result");
  if (!form || !result) return;

  // Add progress bar
  const progressWrap = document.createElement('div');
  progressWrap.className = 'quiz-progress';
  progressWrap.innerHTML = '<div class="progress-bar" style="width:0%"></div>';
  form.insertBefore(progressWrap, form.firstChild);

  form.querySelectorAll('input[type="radio"]').forEach(r => {
    r.addEventListener('change', () => {
      const total = form.querySelectorAll('fieldset').length;
      const answered = form.querySelectorAll('input[type="radio"]:checked').length;
      const bar = progressWrap.querySelector('.progress-bar');
      if (bar) bar.style.width = Math.round((answered / total) * 100) + '%';
    });
  });

  const answers = { q1: "b", q2: "b", q3: "b", q4: "b", q5: "b" };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    let score = 0; let allAnswered = true;
    Object.keys(answers).forEach(q => {
      const sel = form.querySelector(`input[name="${q}"]:checked`);
      if (!sel) { allAnswered = false; }
      else if (sel.value === answers[q]) score++;
    });

    if (!allAnswered) {
      showAlert(result, "Please answer all questions before submitting.", "error");
      setLoading(submitBtn, false);
      return;
    }

    const total = Object.keys(answers).length;
    const pct = Math.round((score / total) * 100);
    const msg = getFeedback(pct);

    localStorage.setItem("quizScore", `${score}/${total}`);
    const attempts = Number(localStorage.getItem("quizAttempts") || "0") + 1;
    localStorage.setItem("quizAttempts", String(attempts));

    showAlert(result, `You scored ${score} out of ${total} (${pct}%). ${msg}`, "success");

    if (pct === 100) {
      showToast("🎉 Perfect score! You're a cyber security pro.", "success");
      confetti();
    } else if (pct >= 80) {
      showToast("Great result! Review any missed topics in Learn.", "success");
    } else {
      showToast("Keep going — visit the Learn page to improve your score.", "info");
    }

    loadQuizStats();
    setLoading(submitBtn, false);
  });
}

function getFeedback(pct) {
  if (pct === 100) return "Outstanding! Your awareness level is excellent.";
  if (pct >= 80)  return "Good job! You understand most core security ideas.";
  if (pct >= 60)  return "Decent score. Review the Learn page to strengthen your knowledge.";
  return "Keep practicing! The Learn page covers everything on this quiz.";
}

function loadQuizStats() {
  const scoreEl  = document.getElementById("last-score");
  const attemptsEl = document.getElementById("attempt-count");
  if (scoreEl)    scoreEl.textContent   = localStorage.getItem("quizScore")    || "No score yet";
  if (attemptsEl) attemptsEl.textContent = localStorage.getItem("quizAttempts") || "0";
}

// ==================== REPORT FORM ====================
function setupReportForm() {
  const form = document.getElementById("report-form");
  const msg  = document.getElementById("report-message");
  if (!form || !msg) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    setLoading(btn, true);

    const name     = esc(form.name.value.trim());
    const email    = esc(form.email.value.trim());
    const threat   = form.threatType.value.trim();
    const desc     = esc(form.description.value.trim());
    const consent  = form.consent.checked;
    const file     = form.evidence.files[0];

    if (!name || !email || !threat || !desc) {
      showAlert(msg, "Please complete all required fields.", "error");
      setLoading(btn, false); return;
    }
    if (!validEmail(email)) {
      showAlert(msg, "Please enter a valid email address.", "error");
      setLoading(btn, false); return;
    }
    if (!consent) {
      showAlert(msg, "Please confirm the consent checkbox.", "error");
      setLoading(btn, false); return;
    }
    if (file) {
      const ok = ["image/png","image/jpeg","image/jpg","application/pdf","text/plain"];
      if (!ok.includes(file.type)) {
        showAlert(msg, "Invalid file type. Please upload PNG, JPG, JPEG, PDF, or TXT.", "error");
        setLoading(btn, false); return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showAlert(msg, "File too large — maximum 2MB.", "error");
        setLoading(btn, false); return;
      }
    }

    await new Promise(r => setTimeout(r, 900));

    showAlert(msg,
      `Report submitted — thank you, ${name}.\n\nWe received your ${threat} report and will review it within 24–48 hours. A confirmation has been sent to ${email}.`,
      "success");
    showToast("Report submitted successfully!", "success");

    // Show next steps
    const ns = document.getElementById('next-steps');
    if (ns) ns.style.display = 'block';

    form.reset();
    setLoading(btn, false);
  });
}

// ==================== SIMULATION ====================
function setupSimulation() {
  const btn    = document.getElementById("phishing-link");
  const result = document.getElementById("simulation-result");
  if (!btn || !result) return;

  btn.addEventListener("click", () => {
    showAlert(result,
      "⚠️ That's a phishing link!\n\nRed flags:\n• Fake sender domain (epic-prizes-bonus.net)\n• Artificial urgency ('within 10 minutes')\n• 'Account locked' scare tactic\n• Prize offer from nowhere\n\nAlways verify through the official platform before clicking anything like this.",
      "error");
    showToast("⚠️ Good — you spotted the phishing simulation. Never click links like this.", "error");
    btn.style.animation = "shake 0.5s ease-in-out";
    setTimeout(() => btn.style.animation = "", 500);
  });
}

// ==================== FORM VALIDATION ====================
function setupFormValidation() {
  document.querySelectorAll('form').forEach(form => {
    form.querySelectorAll('input[required], textarea[required], select[required]').forEach(input => {
      input.addEventListener('blur', () => validateInput(input));
      input.addEventListener('input', () => {
        if (input.checkValidity()) clearError(input);
      });
    });
  });
}

function validateInput(input) {
  const err = input.parentElement.querySelector('.error-message');
  if (!input.checkValidity()) {
    input.style.borderColor = 'var(--danger)';
    if (!err) {
      const el = document.createElement('span');
      el.className = 'error-message';
      el.textContent = getErrMsg(input);
      input.parentElement.appendChild(el);
    }
    return false;
  } else {
    input.style.borderColor = 'var(--primary)';
    if (err) err.remove();
    setTimeout(() => { if (input.checkValidity()) input.style.borderColor = ''; }, 2000);
    return true;
  }
}

function clearError(input) {
  input.style.borderColor = '';
  const err = input.parentElement.querySelector('.error-message');
  if (err) err.remove();
}

function getErrMsg(input) {
  if (input.validity.valueMissing) return 'This field is required';
  if (input.validity.typeMismatch && input.type === 'email') return 'Please enter a valid email address';
  return input.validationMessage || 'Invalid input';
}

// ==================== HELPERS ====================
function showAlert(el, message, type) {
  if (!el) return;
  el.classList.remove("hidden", "alert-success", "alert-error");
  el.classList.add(type === "success" ? "alert-success" : "alert-error");
  el.textContent = message;
  setTimeout(() => el.classList.add("hidden"), 8000);
  showToast(message.split('\n')[0], type);
}

function showToast(message, type = 'info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-message">${esc(message.split('\n')[0])}</div>
    <button class="toast-close" aria-label="Close">×</button>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  toast.querySelector('.toast-close').addEventListener('click', () => hideToast(toast));
  setTimeout(() => hideToast(toast), 4500);
}

function hideToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 350);
}

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.orig = btn.textContent;
    btn.textContent = 'Processing…';
    btn.disabled = true;
    btn.style.opacity = '.7';
  } else {
    btn.textContent = btn.dataset.orig || 'Submit';
    btn.disabled = false;
    btn.style.opacity = '';
  }
}

function esc(val) {
  const d = document.createElement('div');
  d.textContent = val;
  return d.innerHTML;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function confetti() {
  const colors = ['#00e5a0','#4f8aff','#fbbf24','#f05252','#a78bfa'];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    const size = Math.random() * 8 + 6;
    el.style.cssText = `
      position:fixed; width:${size}px; height:${size}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      top:-12px; left:${Math.random()*100}vw;
      border-radius:${Math.random()>.5?'50%':'2px'};
      opacity:.9; pointer-events:none; z-index:10001;
      animation:confFall ${Math.random()*2+2.5}s linear forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
}

// Inject dynamic keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes confFall {
    0%   { transform: translateY(0) rotate(0deg); opacity:.9 }
    100% { transform: translateY(105vh) rotate(540deg); opacity:0 }
  }
  @keyframes shake {
    0%,100% { transform:translateX(0) }
    25%      { transform:translateX(-6px) }
    75%      { transform:translateX(6px) }
  }
`;
document.head.appendChild(style);
