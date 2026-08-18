/**
 * TAILORA USER — PLAN A TRIP
 * Drives the 5-step planner (destination → dates → budget → travelers →
 * style) on top of:
 *   GET  /cities                       (destination search, client-filtered —
 *                                        no city search endpoint is documented)
 *   POST /trips                        (create the trip)
 *   POST /trips/trips/{id}/cities      (attach the chosen city)
 * and the AI assistant on top of:
 *   POST /ai/travel                    (chat)
 *   POST /ai/travel/{conversationId}/plans   (generate plan options)
 *   POST /ai/travel/{conversationId}/choose  (pick one)
 *
 * The exact request/response shape for Trips and AI isn't specified beyond
 * the endpoint list, so payloads use the most natural field names for what
 * the UI collects, and every response is read defensively via TL.Util.pick
 * rather than assumed to match one schema.
 */
(function () {
  "use strict";

  const TOTAL_STEPS = 5;
  const state = {
    step: 1,
    allCities: [],
    city: null, // { id, name }
    startDate: "",
    endDate: "",
    budget: "",
    adults: 1,
    children: 0,
    styles: [],
    tripId: null,
    conversationId: null
  };

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* --------------------------- Step navigation --------------------------- */

  function updateStepUI() {
    document.querySelectorAll(".tl-planner-step").forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle("is-active", n === state.step);
      el.classList.toggle("is-done", n < state.step);
    });
    document.querySelectorAll(".tl-planner-content").forEach((el) => {
      el.classList.toggle("tl-hidden", Number(el.dataset.content) !== state.step);
    });

    const backBtn = document.getElementById("planner-back");
    const nextBtn = document.getElementById("planner-next");
    if (backBtn) backBtn.disabled = state.step === 1;
    if (nextBtn) nextBtn.textContent = state.step === TOTAL_STEPS ? "Create My Trip" : "Continue";
  }

  function validateStep(step) {
    if (step === 1 && !state.city) {
      window.TL.toast("Pick a destination to continue", "error");
      return false;
    }
    if (step === 2 && state.startDate && state.endDate && state.endDate < state.startDate) {
      window.TL.toast("Your return date is before your start date", "error");
      return false;
    }
    if (step === 3 && !state.budget) {
      window.TL.toast("Choose a budget range to continue", "error");
      return false;
    }
    return true;
  }

  async function handleNext() {
    if (!validateStep(state.step)) return;
    if (state.step < TOTAL_STEPS) {
      state.step += 1;
      updateStepUI();
      return;
    }
    await submitTrip();
  }

  function handleBack() {
    if (state.step === 1) return;
    state.step -= 1;
    updateStepUI();
  }

  /* --------------------------- Step 1: destination --------------------------- */

  async function loadCities() {
    try {
      const response = await window.TL.Cities.all();
      state.allCities = window.TL.Util.list(response);
    } catch (err) {
      state.allCities = [];
    }
  }

  function selectCity(city) {
    state.city = { id: window.TL.Util.id(city), name: window.TL.Util.name(city) };
    const input = document.getElementById("plan-destination");
    if (input) input.value = state.city.name;
    const box = document.getElementById("plan-destination-suggest");
    if (box) box.classList.remove("is-open");
    renderSelectedCity();
  }

  function renderSelectedCity() {
    const mount = document.getElementById("plan-destination-selected");
    if (!mount) return;
    if (!state.city) {
      mount.innerHTML = "";
      return;
    }
    mount.innerHTML = `
      <div class="tl-badge tl-mt-16" style="font-size:13px;padding:8px 14px;">
        📍 ${window.TL.Util.escape(state.city.name)} selected
      </div>`;
  }

  let suggestTimer;
  function wireDestinationSuggest() {
    const input = document.getElementById("plan-destination");
    const box = document.getElementById("plan-destination-suggest");
    if (!input || !box) return;

    input.addEventListener("input", () => {
      state.city = null;
      clearTimeout(suggestTimer);
      const q = input.value.trim().toLowerCase();
      if (q.length < 1) {
        box.classList.remove("is-open");
        return;
      }
      suggestTimer = setTimeout(() => {
        const matches = state.allCities
          .filter((c) => window.TL.Util.name(c).toLowerCase().includes(q))
          .slice(0, 8);
        if (!matches.length) {
          box.innerHTML = `<button type="button" disabled>No cities found</button>`;
        } else {
          box.innerHTML = matches
            .map((c) => {
              const name = window.TL.Util.name(c);
              const country = window.TL.Util.country(c);
              return `<button type="button" data-id="${window.TL.Util.id(c)}" data-name="${window.TL.Util.escape(name)}">${window.TL.Util.escape(name)}${country ? ` <span style="opacity:.55;">— ${window.TL.Util.escape(country)}</span>` : ""}</button>`;
            })
            .join("");
        }
        box.classList.add("is-open");
      }, 200);
    });

    box.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      selectCity({ id: btn.dataset.id, name: btn.dataset.name });
    });

    document.addEventListener("click", (e) => {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove("is-open");
    });
  }

  /* --------------------------- Step 2: dates --------------------------- */

  function wireDates() {
    const start = document.getElementById("plan-start");
    const end = document.getElementById("plan-end");
    if (start) start.addEventListener("change", (e) => (state.startDate = e.target.value));
    if (end) end.addEventListener("change", (e) => (state.endDate = e.target.value));
  }

  /* --------------------------- Step 3: budget --------------------------- */

  function wireBudgetCards() {
    document.querySelectorAll("#plan-budget-cards .tl-option-card").forEach((card) => {
      card.addEventListener("click", () => {
        document.querySelectorAll("#plan-budget-cards .tl-option-card").forEach((c) => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        state.budget = card.dataset.budget;
      });
    });
  }

  /* --------------------------- Step 4: travelers --------------------------- */

  function wireTravelerSteppers() {
    document.querySelectorAll(".tl-stepper-input button[data-adjust]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.adjust;
        const dir = Number(btn.dataset.dir);
        const min = key === "adults" ? 1 : 0;
        state[key] = Math.max(min, state[key] + dir);
        const countEl = document.getElementById(`plan-${key}-count`);
        if (countEl) countEl.textContent = state[key];
      });
    });
  }

  /* --------------------------- Step 5: style --------------------------- */

  function wireStyleCards() {
    document.querySelectorAll("#plan-style-cards .tl-option-card").forEach((card) => {
      card.addEventListener("click", () => {
        const style = card.dataset.style;
        card.classList.toggle("is-selected");
        if (card.classList.contains("is-selected")) {
          if (!state.styles.includes(style)) state.styles.push(style);
        } else {
          state.styles = state.styles.filter((s) => s !== style);
        }
      });
    });
  }

  /* --------------------------- Submit trip --------------------------- */

  async function submitTrip() {
    const nextBtn = document.getElementById("planner-next");
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent = "Creating your trip…";
    }
    try {
      const payload = {
        title: `Trip to ${state.city.name}`,
        destination: state.city.name,
        start_date: state.startDate || undefined,
        end_date: state.endDate || undefined,
        budget: state.budget || undefined,
        adults: state.adults,
        children: state.children,
        travelers: state.adults + state.children,
        travel_style: state.styles
      };
      const response = await window.TL.Trips.create(payload);
      const trip = window.TL.Util.pick(response, ["data", "trip"], response);
      const tripId = window.TL.Util.id(trip);

      if (tripId && state.city.id) {
        try {
          await window.TL.Trips.selectCities(tripId, { city_ids: [state.city.id] });
        } catch (e) {
          /* Non-fatal — the trip itself was created successfully. */
        }
      }

      window.TL.toast("Your trip has been created!");
      if (tripId) {
        window.location.href = `trip-details.html?id=${encodeURIComponent(tripId)}`;
      } else {
        window.location.href = "profile.html";
      }
    } catch (err) {
      window.TL.toast(err.message || "Couldn't create your trip. Please try again.", "error");
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = "Create My Trip";
      }
    }
  }

  /* --------------------------- AI assistant --------------------------- */

  function appendAiMessage(text, who = "ai") {
    const mount = document.getElementById("ai-messages");
    if (!mount) return;
    const bubble = document.createElement("div");
    bubble.className = `tl-ai-msg tl-ai-msg--${who}`;
    bubble.textContent = text;
    mount.appendChild(bubble);
    mount.scrollTop = mount.scrollHeight;
  }

  function extractAiReply(response) {
    return window.TL.Util.pick(
      response,
      ["reply", "message", "response", "data.reply", "data.message"],
      "Got it — I've noted that for your plan."
    );
  }

  function extractConversationId(response) {
    return window.TL.Util.pick(response, [
      "conversation_id",
      "conversationId",
      "id",
      "data.conversation_id",
      "data.id"
    ]);
  }

  function wireAiAssistant() {
    const form = document.getElementById("ai-form");
    const input = document.getElementById("ai-input");
    const sendBtn = document.getElementById("ai-send");
    const generateBtn = document.getElementById("ai-generate-plans");
    const planActions = document.getElementById("ai-plan-actions");
    if (!form) return;

    appendAiMessage(
      "Hi! Tell me what kind of trip you're imagining — I'll help shape it alongside the form on the left."
    );

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      appendAiMessage(text, "user");
      input.value = "";
      sendBtn.disabled = true;

      try {
        const payload = { message: text };
        if (state.conversationId) payload.conversation_id = state.conversationId;
        const response = await window.TL.Ai.travel(payload);
        const convId = extractConversationId(response);
        if (convId) {
          state.conversationId = convId;
          if (planActions) planActions.classList.remove("tl-hidden");
        }
        appendAiMessage(extractAiReply(response), "ai");
      } catch (err) {
        appendAiMessage(err.message || "I couldn't reach the planner right now — please try again.", "ai");
      } finally {
        sendBtn.disabled = false;
      }
    });

    if (generateBtn) {
      generateBtn.addEventListener("click", async () => {
        if (!state.conversationId) return;
        generateBtn.disabled = true;
        generateBtn.textContent = "Generating…";
        try {
          const response = await window.TL.Ai.generatePlans(state.conversationId, {});
          const plans = window.TL.Util.list(response);
          if (!plans.length) {
            appendAiMessage("No plan options came back yet — try describing your trip in a bit more detail.", "ai");
          } else {
            renderPlanOptions(plans);
          }
        } catch (err) {
          appendAiMessage(err.message || "Couldn't generate plans right now.", "ai");
        } finally {
          generateBtn.disabled = false;
          generateBtn.textContent = "Generate Travel Plans";
        }
      });
    }
  }

  function renderPlanOptions(plans) {
    const mount = document.getElementById("ai-messages");
    if (!mount) return;
    const wrap = document.createElement("div");
    wrap.className = "tl-ai-plans";
    wrap.innerHTML = plans
      .map((plan, i) => {
        const title = window.TL.Util.pick(plan, ["title", "name"], `Plan ${i + 1}`);
        const summary = window.TL.Util.pick(plan, ["summary", "description"], "");
        const id = window.TL.Util.id(plan) || i;
        return `
        <div class="tl-ai-plan-card">
          <strong>${window.TL.Util.escape(title)}</strong>
          ${summary ? `<p>${window.TL.Util.escape(summary)}</p>` : ""}
          <button type="button" class="tl-btn tl-btn--outline tl-btn--sm" data-plan-id="${window.TL.Util.escape(id)}">Choose This Plan</button>
        </div>`;
      })
      .join("");
    mount.appendChild(wrap);
    mount.scrollTop = mount.scrollHeight;

    wrap.querySelectorAll("button[data-plan-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "Choosing…";
        try {
          const response = await window.TL.Ai.choosePlan(state.conversationId, { plan_id: btn.dataset.planId });
          const trip = window.TL.Util.pick(response, ["data", "trip"], response);
          const tripId = window.TL.Util.id(trip);
          window.TL.toast("Plan selected!");
          window.location.href = tripId ? `trip-details.html?id=${encodeURIComponent(tripId)}` : "profile.html";
        } catch (err) {
          window.TL.toast(err.message || "Couldn't select that plan.", "error");
          btn.disabled = false;
          btn.textContent = "Choose This Plan";
        }
      });
    });
  }

  /* --------------------------- Prefill from hero form --------------------------- */

  function prefillFromQuery() {
    const destination = getParam("destination");
    const when = getParam("when");
    const travelers = getParam("travelers");
    const styles = getParam("styles");

    if (destination) {
      const input = document.getElementById("plan-destination");
      if (input) input.value = destination;
      const match = state.allCities.find((c) => window.TL.Util.name(c).toLowerCase() === destination.toLowerCase());
      if (match) selectCity(match);
    }
    if (when) {
      const start = document.getElementById("plan-start");
      if (start) {
        start.value = `${when}-01`;
        state.startDate = start.value;
      }
    }
    if (travelers) {
      const n = parseInt(travelers, 10);
      if (Number.isFinite(n) && n > 0) {
        state.adults = n;
        const countEl = document.getElementById("plan-adults-count");
        if (countEl) countEl.textContent = state.adults;
      }
    }
    if (styles) {
      styles.split(",").forEach((style) => {
        const card = document.querySelector(`#plan-style-cards [data-style="${CSS.escape(style)}"]`);
        if (card) {
          card.classList.add("is-selected");
          state.styles.push(style);
        }
      });
    }
  }

  /* --------------------------- Init --------------------------- */

  async function init() {
    const signedOut = document.getElementById("planner-signed-out");
    const shell = document.getElementById("planner-shell");
    const aiCard = document.getElementById("ai-assistant-card");

    if (!window.TL.Auth.isAuthenticated()) {
      if (signedOut) signedOut.classList.remove("tl-hidden");
      if (shell) shell.classList.add("tl-hidden");
      if (aiCard) aiCard.classList.add("tl-hidden");
      return;
    }

    if (signedOut) signedOut.classList.add("tl-hidden");
    if (shell) shell.classList.remove("tl-hidden");
    if (aiCard) aiCard.classList.remove("tl-hidden");

    await loadCities();
    prefillFromQuery();
    updateStepUI();

    document.getElementById("planner-next").addEventListener("click", handleNext);
    document.getElementById("planner-back").addEventListener("click", handleBack);

    wireDestinationSuggest();
    wireDates();
    wireBudgetCards();
    wireTravelerSteppers();
    wireStyleCards();
    wireAiAssistant();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
