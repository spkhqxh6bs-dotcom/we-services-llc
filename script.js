// If you're using the Google Drive (Apps Script) submission endpoint, paste it here.
// If you are NOT using it, you can leave it blank and I’ll adjust to Formspree.
const GOOGLE_WEB_APP_URL = "YOUR_GOOGLE_WEB_APP_URL_HERE";

// ---- SERVICE-SPECIFIC INTAKE QUESTIONS ----
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

// ---- UTILITIES ----
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

function renderIntakeQuestions(service) {
  const list = document.getElementById("intakeList");
  const answers = document.getElementById("intakeAnswers");
  if (!list || !answers) return;

  const qs = SERVICE_QUESTIONS[service] || [];
  list.innerHTML = "";

  qs.forEach((q, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${q}`;
    list.appendChild(li);
  });

  // Helpful prompt (does not overwrite if user already typed)
  if (!answers.value.trim()) {
    answers.placeholder = "Type your answers here (numbered is best).";
  }
}

function paymentGateOk() {
  const paidCheck = document.getElementById("paidCheck");
  const cashappTxn = document.getElementById("cashappTxn");
  if (!paidCheck || !cashappTxn) return false;

  return paidCheck.checked && cashappTxn.value.trim().length >= 4;
}

// ---- SUBMIT TO GOOGLE DRIVE (Apps Script) ----
function wireBookingToGoogleDrive() {
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // PAYMENT GATE (cannot truly verify Cash App; this is user-provided confirmation)
    if (!paymentGateOk()) {
      status.style.display = "block";
      status.textContent = "Payment confirmation is required. Please enter your Cash App transaction/reference and check the confirmation box.";
      return;
    }

    // If you're not using Drive submission, stop here (tell me and I’ll switch to Formspree).
    if (!GOOGLE_WEB_APP_URL || GOOGLE_WEB_APP_URL.includes("YOUR_GOOGLE_WEB_APP_URL_HERE")) {
      status.style.display = "block";
      status.textContent = "Booking system is not connected yet. Add your Google Web App URL in script.js.";
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
      details: document.getElementById("details").value.trim(),
      cashappTxn: document.getElementById("cashappTxn").value.trim(),
      paidConfirmed: document.getElementById("paidCheck").checked
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
    applyServiceFromQuery(serviceSelect);

    // Render initial questions
    renderIntakeQuestions(serviceSelect.value);

    // Update questions when service changes
    serviceSelect.addEventListener("change", () => {
      renderIntakeQuestions(serviceSelect.value);
    });

    wireBookingToGoogleDrive();
  }
});
