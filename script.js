// Formspree endpoint you provided:
const FORMSPREE_URL = "https://formspree.io/f/mzdavobw";

// Where to send users after a successful booking:
const CONFIRMATION_PAGE = "confirmation.html";

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

function $(id) { return document.getElementById(id); }

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
  const dateEl = $("date");
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

function resetIntakeGate() {
  const completedCheck = $("intakeCompletedCheck");
  const hidden = $("intakeCompletedHidden");
  const status = $("intakeStatus");

  if (completedCheck) {
    completedCheck.checked = false;
    completedCheck.disabled = true;
  }
  if (hidden) hidden.value = "false";
  if (status) {
    status.style.display = "none";
    status.textContent = "";
  }
  updateSubmitEnabled();
}

function renderIntakeFields(serviceValue) {
  const titleEl = $("intakeTitle");
  const container = $("intakeFields");
  if (!titleEl || !container) return;

  const questions = SERVICE_QUESTIONS[serviceValue] || [];
  titleEl.textContent = `Questions for: ${serviceValue}`;
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

    textarea.addEventListener("input", () => resetIntakeGate());

    wrap.appendChild(label);
    wrap.appendChild(textarea);
    container.appendChild(wrap);
  });

  resetIntakeGate();
}

function intakeAllAnswered(serviceValue) {
  const questions = SERVICE_QUESTIONS[serviceValue] || [];
  for (let i = 0; i < questions.length; i++) {
    const field = $(`intake_q_${i + 1}`);
    if (!field || field.value.trim().length === 0) return false;
  }
  return true;
}

function getIntakeAnswers(serviceValue) {
  const questions = SERVICE_QUESTIONS[serviceValue] || [];
  return questions.map((q, idx) => {
    const field = $(`intake_q_${idx + 1}`);
    return { question: q, answer: field ? field.value.trim() : "" };
  });
}

function paymentGateOk() {
  const ref = $("cashappConfirmation");
  const check = $("cashappPaidCheck");
  if (!ref || !check) return false;
  return ref.value.trim().length >= 4 && check.checked === true;
}

function intakeCompletedOk() {
  const hidden = $("intakeCompletedHidden");
  return hidden && hidden.value === "true";
}

function formBasicsOk() {
  const name = $("name");
  const email = $("email");
  const phone = $("phone");
  const date = $("date");
  const time = $("time");
  const service = $("service");
  if (!name || !email || !phone || !date || !time || !service) return false;

  return (
    name.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    phone.value.trim().length > 0 &&
    date.value.trim().length > 0 &&
    time.value.trim().length > 0 &&
    service.value.trim().length > 0
  );
}

function updateSubmitEnabled() {
  const submitBtn = $("submitBtn");
  if (!submitBtn) return;
  const enabled = formBasicsOk() && intakeCompletedOk() && paymentGateOk();
  submitBtn.disabled = !enabled;
}

function showIntakeStatus(msg) {
  const el = $("intakeStatus");
  if (!el) return;
  el.style.display = "block";
  el.textContent = msg;
}

function showFormStatus(msg) {
  const el = $("formStatus");
  if (!el) return;
  el.style.display = "block";
  el.textContent = msg;
}

function wireIntakeTab() {
  const btn = $("intakeToggleBtn");
  const panel = $("intakePanel");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    btn.setAttribute("aria-expanded", (!isOpen).toString());
    btn.textContent = isOpen
      ? "Service Intake Questions (Click to Open)"
      : "Service Intake Questions (Click to Close)";
  });
}

function wireSaveIntake() {
  const saveBtn = $("saveIntakeBtn");
  const completedCheck = $("intakeCompletedCheck");
  const hidden = $("intakeCompletedHidden");
  const serviceSelect = $("service");

  if (!saveBtn || !completedCheck || !hidden || !serviceSelect) return;

  saveBtn.addEventListener("click", () => {
    const serviceValue = serviceSelect.value;

    if (!intakeAllAnswered(serviceValue)) {
      showIntakeStatus("Please answer every intake question before saving.");
      completedCheck.disabled = true;
      completedCheck.checked = false;
      hidden.value = "false";
      updateSubmitEnabled();
      return;
    }

    showIntakeStatus("Intake answers saved. Please check “Intake Completed” to continue.");
    completedCheck.disabled = false;
    completedCheck.checked = false;
    hidden.value = "false";
    updateSubmitEnabled();
  });

  completedCheck.addEventListener("change", () => {
    hidden.value = completedCheck.checked ? "true" : "false";
    showIntakeStatus(completedCheck.checked ? "Intake marked as completed." : "Intake completion unchecked.");
    updateSubmitEnabled();
  });
}

function wireEnableChecks() {
  const ids = ["name", "email", "phone", "date", "time", "service", "cashappConfirmation", "cashappPaidCheck"];
  ids.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", updateSubmitEnabled);
    el.addEventListener("change", updateSubmitEnabled);
  });
}

function redirectToConfirmation(payload) {
  const params = new URLSearchParams({
    name: payload.name || "",
    service: payload.service || "",
    date: payload.date || "",
    time: payload.time || ""
  });
  window.location.href = `${CONFIRMATION_PAGE}?${params.toString()}`;
}

async function submitToFormspree(payload) {
  // Use JSON submission (recommended). Formspree accepts JSON when content-type is application/json.
  const res = await fetch(FORMSPREE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  });

  // Formspree returns JSON; success is usually 200 with { ok: true } or a success message.
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) ? (data.error || data.message) : "Form submission failed.";
    throw new Error(msg);
  }

  return data;
}

function wireBookingSubmit() {
  const form = $("bookingForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!formBasicsOk()) {
      showFormStatus("Please complete all required booking fields.");
      return;
    }
    if (!intakeCompletedOk()) {
      showFormStatus("Please complete the Service Intake Questions before submitting the booking.");
      return;
    }
    if (!paymentGateOk()) {
      showFormStatus("Payment confirmation is required before submitting the booking.");
      return;
    }

    showFormStatus("Submitting your request…");

    const serviceValue = $("service").value;

    // Flatten intake answers into readable text
    const intakePairs = getIntakeAnswers(serviceValue);
    const intakeText = intakePairs
      .map((x, i) => `${i + 1}) ${x.question}\nAnswer: ${x.answer}`)
      .join("\n\n");

    // Payload sent to Formspree email
    const payload = {
      subject: `New Booking Request - ${serviceValue}`,
      name: $("name").value.trim(),
      email: $("email").value.trim(),
      phone: $("phone").value.trim(),
      preferred_date: $("date").value,
      preferred_time: $("time").value,
      service: serviceValue,
      intake_completed: true,
      intake_answers: intakeText,
      additional_details: $("details").value.trim(),
      cashapp_confirmation: $("cashappConfirmation").value.trim(),
      cashapp_paid_confirmed: $("cashappPaidCheck").checked ? "Yes" : "No"
    };

    try {
      await submitToFormspree(payload);
      redirectToConfirmation(payload);
    } catch (err) {
      showFormStatus(err.message || "Submission failed. Please try again.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const jsLoaded = $("jsLoaded");
  if (jsLoaded) jsLoaded.textContent = "JavaScript status: loaded ✓";

  const serviceSelect = $("service");
  const bookingForm = $("bookingForm");
  if (!bookingForm || !serviceSelect) return;

  buildTimeOptions($("time"), 10, 20, 15);
  setMinDate();
  applyServiceFromQuery(serviceSelect);

  wireIntakeTab();
  renderIntakeFields(serviceSelect.value);

  serviceSelect.addEventListener("change", () => {
    renderIntakeFields(serviceSelect.value);
    updateSubmitEnabled();
  });

  wireSaveIntake();
  wireEnableChecks();
  wireBookingSubmit();
  updateSubmitEnabled();
});
