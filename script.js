function copyEmail() {
  const email = "weservices2022@gmail.com";
  navigator.clipboard.writeText(email).then(() => {
    alert("Email copied: " + email);
  });
}

/**
 * Builds time options from 8:00 AM to 5:00 PM (inclusive)
 * in 15-minute increments by default.
 */
function buildTimeOptions(selectEl, startHour = 8, endHour = 17, stepMinutes = 15) {
  if (!selectEl) return;

  // Clear existing options
  selectEl.innerHTML = "";

  const pad = (n) => String(n).padStart(2, "0");

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += stepMinutes) {
      // Stop exactly at 5:00 PM (17:00) and don't go beyond
      if (hour === endHour && min > 0) break;

      const isPM = hour >= 12;
      const displayHour = ((hour + 11) % 12) + 1;
      const displayMin = pad(min);
      const label = `${displayHour}:${displayMin} ${isPM ? "PM" : "AM"}`;
      const value = `${pad(hour)}:${pad(min)}`;

      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      selectEl.appendChild(opt);
    }
  }
}

/**
 * Reads ?service= from URL and sets the service dropdown.
 */
function applyServiceFromQuery(selectEl) {
  if (!selectEl) return;
  const params = new URLSearchParams(window.location.search);
  const service = params.get("service");
  if (!service) return;

  // Attempt to match option by value
  const found = [...selectEl.options].some(opt => {
    if (opt.value === service) {
      selectEl.value = service;
      return true;
    }
    return false;
  });

  // If not found, place it in the "Other" field if present
  const otherField = document.getElementById("serviceOther");
  if (!found && otherField) otherField.value = service;
}

/**
 * Initializes the booking form page.
 */
function initBookingForm() {
  const timeSelect = document.getElementById("time");
  const serviceSelect = document.getElementById("service");

  buildTimeOptions(timeSelect, 8, 17, 15);
  applyServiceFromQuery(serviceSelect);

  // Set min date to today
  const dateEl = document.getElementById("date");
  if (dateEl) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateEl.min = `${yyyy}-${mm}-${dd}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Only runs on the booking page when those elements exist
  if (document.getElementById("bookingForm")) {
    initBookingForm();
  }
});
