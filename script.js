// If you're sending bookings to Google Drive via Apps Script, paste your web app URL here.
// If you are using Formspree instead, tell me and I’ll swap the submit function.
const GOOGLE_WEB_APP_URL = "YOUR_GOOGLE_WEB_APP_URL_HERE";

/**
 * Each service maps to a list of intake questions.
 * The page generates a separate answer input (textarea) for each question.
 */
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
    "What outcome would make this session successful for you?"
  ],
  "Couples Consulting": [
    "What is the main challenge you’d like to address?",
    "How long has this issue been present?",
    "Are both parties attending the consultation (yes/no)?",
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
 * Render question + its own answer field (textarea) for each intake question.
 * Each answer field is required.
 */
function renderIntakeFields(serviceValue) {
  const titleEl = document.getElementById("intakeTitle");
  const container = document.getElementById("intakeFields");
  if (!titleEl || !container) return;

  const questions = SERVICE_QUESTIONS[serviceValue] || [];
  titleEl.textContent = `Questions for: ${serviceValue}`;

  // Clear old fields
  container.innerHTML = "";

  questions.forEach((q, idx) => {
    const qNum = idx + 1;

    const wrap = document.createElement("div");
    wrap.style.marginBottom = "12px";

    const label = document.createElement("label");
    label.setAttribute("for", `intake_q_${qNum}`);
    label.textContent = `${qNum}. ${q}`;

    const textarea = document.createElement("textarea");
    textarea.id = `intake_q_${qNum}`;
    textarea.name = `intake_q_${qNum}`;
    textarea.rows = 3;
    textarea.required = true;
    textarea.placeholder = "Type your answer here…";

    // Store the actual question text too (helps on the receiving end)
    const hiddenQ = document.createElement("input");
    hiddenQ.type = "hidden";
    hiddenQ.name = `intake_question_${qNum}`;
    hiddenQ.value = q;

    wrap.appendChild(label);
    wrap.appendChild(textarea);
    wrap.appendChild(hiddenQ);

    container.appendChild(wrap);
  });
}

function getIntakeAnswers(serviceValue) {
  const questions = SERVICE_QUESTIONS[serviceValue] || [];
  const answers = [];

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const field = document.getElementById(`intake_q_${qNum}`);
    answers.push({
      question: q,
      answer: field ? field.value.trim() : ""
    });
  });

  return answers;
}

function paymentGateOk() {
  const ref = document.getElementById("cashappConfirmation");
  const check = document.getElementById("cashappPaidCheck");
  if (!ref || !check) return false;

  const hasRef = ref.value.trim().length >= 4;
  const checked = check.checked === true;

  return hasRef && checked;
}

function showStatus(msg) {
  const status = document.getElementById("formStatus");
  if (!status) return;
  status.style.display = "block";
  status.textContent = msg;
}

/**
 * Submit handler (currently set up for Google Drive via Apps Script).
 * If you're using Formspree instead, tell me and I’ll swap this submit to Formspree.
 */
function wireBookingSubmit() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic HTML validity check
    if (!form.checkValidity()) {
      showStatus("Please complete all required fields before submitting.");
      return;
    }

    // Payment gate (attestation)
    if (!paymentGateOk()) {
      showStatus("Payment confirmation is required. Enter your Cash App confirmation and check the payment box.");
      return;
    }

    // If Drive endpoint not configured, stop with instructions
    if (!GOOGLE_WEB_APP_URL || GOOGLE_WEB_APP_URL.includes("YOUR_GOOGLE_WEB_APP_URL_HERE")) {
      showStatus("Booking form is ready, but not connected. Paste your Google Apps Script Web App URL into script.js.");
      return;
    }

    showStatus("Submitting your request…");

    const serviceValue = document.getElementById("service").value;

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      service: serviceValue,
      intake: getIntakeAnswers(serviceValue),
      details: document.getElementById("details").value.trim(),
      cashappConfirmation: document.getElementById("cashappConfirmation").value.trim(),
      cashappPaidConfirmed: document.getElementById("cashappPaidCheck").checked
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
        renderIntakeFields(document.getElementById("service").value);
        showStatus("Request submitted successfully. Thank you!");
      } else {
        showStatus("Submission failed. Please try again.");
      }
    } catch (err) {
      showStatus("Submission failed (network error). Please try again.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const serviceSelect = document.getElementById("service");

  if (document.getElementById("bookingForm")) {
    buildTimeOptions(document.getElementById("time"), 10, 20, 15);
    setMinDate();

    // Preselect if coming from a link like book.html?service=AI%20Consulting
    applyServiceFromQuery(serviceSelect);

    // Render the right question set immediately
    renderIntakeFields(serviceSelect.value);

    // Update questions when service changes
    serviceSelect.addEventListener("change", () => {
      renderIntakeFields(serviceSelect.value);
    });

    wireBookingSubmit();
  }
});
