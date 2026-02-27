// OPTIONAL: if you're sending bookings to Google Drive via Apps Script, paste your URL here.
// If you are not using Drive submission yet, leave it blank or keep it placeholder.
const GOOGLE_WEB_APP_URL = "YOUR_GOOGLE_WEB_APP_URL_HERE";

// Intake questions by service (auto-renders)
const SERVICE_QUESTIONS = {
  "Security Consulting": [
    "What type of security are you seeking guidance on (personal, event, business, risk assessment, other)?",
    "Is this proactive planning or a response to an incident?",
    "What concerns are most important to you right now?",
    "Are there any current vulnerabilities or known risks?"
  ],
  "Business Consulting": [
    "What type of business do you operate?",
    "What stage is your business in (startup, growing, established, struggling)?",
    "What specific area needs improvement (marketing, operations, staffing, finances, strategy)?",
    "What outcome would make this session successful?"
  ],
  "Couples Consulting": [
    "What is the main challenge you’d like to address?",
    "How long has this issue been present?",
    "Are both parties attending the consultation?",
    "Are you seeking communication improvement, conflict resolution, goal alignment, or pre-marital planning?"
  ],
  "Sports Consulting": [
    "What sport is this for?",
    "What is the athlete’s age and current level (recreational, school, collegiate, professional)?",
    "What area needs improvement (performance, mindset, recruiting, training structure)?",
    "What is your goal timeline (next game/season/tryout/date)?"
  ],
  "Educational Consulting": [
    "What is the student’s grade level?",
    "What are the primary academic concerns or goals?",
    "Is this for tutoring strategy, academic planning, or career planning?",
    "Are there IEP/504 plans involved (yes/no)?"
  ],
  "Event Consulting": [
    "What type of event is it?",
    "What is the expected guest count?",
    "What is the event date and location?",
    "What is your budget range and what level of help do you need (decor, coordination, full planning)?"
  ],
  "AI Consulting": [
    "What industry are you in?",
    "What problem are you trying to solve with AI?",
    "Are you looking for automation, content generation, data analysis, or workflow improvement?",
    "What tools are you currently using (if any)?"
  ],
  "Real Estate Consulting": [
    "Are you a buyer, seller, or investor?",
    "Residential or commercial?",
    "What is your timeline (e.g., 30/60/90 days)?",
    "What is your budget range and are you a first-time buyer/investor (yes/no)?"
  ],
  "Art Consulting": [
    "Are you an artist or collector?",
    "What medium (painting, digital, sculpture, etc.)?",
    "Are you seeking branding, exhibition planning, sales strategy, or portfolio review?",
    "Do you currently have an online presence (yes/no)?"
  ],
  "Web Design": [
    "Is this a new website or a redesign?",
    "Do you already own a domain name and hosting (yes/no)?",
    "What features do you need (booking, payments, portfolio, e-commerce, etc.)?",
    "What is your target launch date and any example sites you like?"
  ]
};

function buildTimeOptions(selectEl, startHour, endHour, stepMinutes) {
  if (!selectEl) return;

  selectEl.innerHTML = "";
  const pad = (n) => String(n).padStart(2, "0");

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += stepMinutes) {
      if (hour === endHour && min > 0) break;

      const isPM = hour >= 12;
      const displayHour = ((hour + 11) % 12) + 1;
      const label = `${displayHour}:${pad(min)} ${isPM ? "PM" : "AM"}`;
      const value = `${pad(hour)}:${pad(min)}`;

      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      selectEl.appendChild(opt);
    }
  }
}

function setMinDate() {
  const dateEl = document.getElementById("date");
  if (!dateEl) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateEl.min = `${yyyy}-${mm}-${dd}`;
}

/**
 * Pre-select service from URL: book.html?service=Security%20Consulting
 */
function applyServiceFromQuery(selectEl) {
  if (!selectEl) return;
  const params = new URLSearchParams(window.location.search);
  const service = params.get("service");
  if (!service) return;

  for (const opt of selectEl.options) {
    if (opt.value === service) {
      selectEl.value = service;
      break;
    }
  }
}

/**
 * Render the questions list for the selected service.
 */
function renderIntakeQuestions(serviceValue) {
  const listEl = document.getElementById("intakeList");
  const answersEl = document.getElementById("intakeAnswers");
  if (!listEl || !answersEl) return;

  const questions = SERVICE_QUESTIONS[serviceValue] || [];
  listEl.innerHTML = "";

  questions.forEach((q, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${q}`;
    listEl.appendChild(li);
  });

  // If the user hasn't typed anything yet, keep a helpful placeholder.
  if (!answersEl.value.trim()) {
    answersEl.placeholder = "Answer the questions above. Numbered answers work best (1, 2, 3…).";
  }
}

/**
 * OPTIONAL: If you're using Google Drive routing, this submits the booking to your Apps Script Web App.
 * If you are not using Drive routing, you can remove this and I’ll switch it to Formspree.
 */
function wireBookingSubmit() {
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // If not connected to Drive endpoint, show a helpful message
    if (!GOOGLE_WEB_APP_URL || GOOGLE_WEB_APP_URL.includes("YOUR_GOOGLE_WEB_APP_URL_HERE")) {
      status.style.display = "block";
      status.textContent = "Booking form is ready. If you want submissions saved to Google Drive, paste your Google Apps Script Web App URL into script.js.";
      return;
    }

    status.style.display = "block";
    status.textContent = "Submitting your request…";

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      service: document.getElementById("service").value,
      intakeAnswers: document.getElementById("intakeAnswers").value.trim(),
      details: document.getElementById("details").value.trim()
    };

    try {
      const res = await fetch(GOOGLE_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.ok) {
        form.reset();
        buildTimeOptions(document.getElementById("time"), 10, 20, 15);
        setMinDate();
        renderIntakeQuestions(document.getElementById("service").value);
        status.textContent = "Request submitted successfully. Thank you!";
      } else {
        status.textContent = "Submission failed. Please try again.";
      }
    } catch (err) {
      status.textContent = "Submission failed (network error). Please try again.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const serviceSelect = document.getElementById("service");

  if (document.getElementById("bookingForm")) {
    buildTimeOptions(document.getElementById("time"), 10, 20, 15);
    setMinDate();

    // Prefill service from URL (Buy Now buttons)
    applyServiceFromQuery(serviceSelect);

    // Render questions for initial service selection
    renderIntakeQuestions(serviceSelect.value);

    // Update questions instantly when the service changes
    serviceSelect.addEventListener("change", () => {
      renderIntakeQuestions(serviceSelect.value);
    });

    wireBookingSubmit();
  }
});
