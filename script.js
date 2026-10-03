/* ========= CONFIG =========
   1. Create a free form at https://formspree.io using the email you want to receive answers on.
   2. Paste its endpoint below (looks like https://formspree.io/f/abcdwxyz).
*/
// Put your video here: an .mp4 path (e.g. "story.mp4") or a YouTube embed link (e.g. "https://www.youtube.com/embed/XXXX"). Leave "" until ready.
const VIDEO_SRC = "";

const FORM_ENDPOINT = "https://formspree.io/f/xbglnqpp";

const $ = s => document.querySelector(s);
const panels = [null, ...[1, 2, 3, 4].map(n => $("#panel" + n))];
const data = { date: "", time: "", interest: 6 };
let current = 0;

/* ---------- open / close with expand animation ---------- */
function rectOf(step) {
  const r = document.querySelector(`.card.c${step}`).getBoundingClientRect();
  return r;
}
function place(p, r) {
  Object.assign(p.style, { top: r.top + "px", left: r.left + "px", width: r.width + "px", height: r.height + "px" });
}
function openStep(n) {
  const p = panels[n];
  place(p, rectOf(n));
  p.classList.add("show");
  void p.offsetWidth; // reflow so the transition runs
  p.classList.add("full");
  document.body.style.overflow = "hidden";
  current = n;
}
function closeAll() {
  const p = panels[current];
  if (!p) return;
  place(p, rectOf(current));
  p.classList.remove("full");
  setTimeout(() => p.classList.remove("show"), 450);
  document.body.style.overflow = "";
  current = 0;
}
function goTo(n) {
  const from = panels[current];
  const to = panels[n];
  to.style.cssText = "";
  to.classList.add("show", "full");
  from.classList.remove("show", "full");
  from.style.cssText = "";
  current = n;
}

document.querySelectorAll("[data-step]").forEach(el =>
  el.addEventListener("click", e => { e.preventDefault(); openStep(+el.dataset.step); }));

document.querySelectorAll("[data-back]").forEach(b =>
  b.addEventListener("click", () => (current === 1 ? closeAll() : goTo(current - 1))));

document.addEventListener("keydown", e => { if (e.key === "Escape" && current) closeAll(); });

/* ---------- STEP 1: calendar ---------- */
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let view = new Date(today.getFullYear(), today.getMonth(), 1);
const SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function renderCal() {
  $("#monthLabel").textContent = view.toLocaleString("en-US", { month: "long", year: "numeric" });
  const cal = $("#cal");
  cal.innerHTML = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<div class="dow">${d}</div>`).join("");
  const offset = (view.getDay() + 6) % 7;
  const start = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
  const last = new Date(view.getFullYear(), view.getMonth() + 1, 0);
  const total = Math.ceil((offset + last.getDate()) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const b = document.createElement("button");
    b.textContent = d.getDate();
    b.disabled = d < today || d.getMonth() !== view.getMonth();
    if (iso(d) === data.date) b.classList.add("sel");
    b.onclick = () => { data.date = iso(d); renderCal(); };
    cal.appendChild(b);
  }
}
function renderSlots() {
  $("#slots").innerHTML = "";
  SLOTS.forEach(t => {
    const b = document.createElement("button");
    b.textContent = t;
    if (t === data.time) b.classList.add("sel");
    b.onclick = () => { data.time = t; renderSlots(); };
    $("#slots").appendChild(b);
  });
}
$("#prevM").onclick = () => {
  const p = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  if (p >= new Date(today.getFullYear(), today.getMonth(), 1)) { view = p; renderCal(); }
};
$("#nextM").onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); };
renderCal(); renderSlots();

$("#next1").onclick = () => {
  if (!data.date || !data.time) return ($("#err1").textContent = "Please choose a date and a time.");
  $("#err1").textContent = "";
  goTo(2);
};

/* ---------- STEP 2: contact ---------- */
$("#next2").onclick = () => {
  const name = $("#name").value.trim(), email = $("#email").value.trim();
  if (!name) return ($("#err2").textContent = "Please enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return ($("#err2").textContent = "Please enter a valid email.");
  $("#err2").textContent = "";
  Object.assign(data, { name, email, phone: $("#phone").value.trim(), whatsapp: $("#whatsapp").value.trim() });
  goTo(3);
};

/* ---------- STEP 3: project ---------- */
$("#next3").onclick = () => {
  const role = $("#role").value.trim();
  if (!role) return ($("#err3").textContent = "Please tell us your specialty or role.");
  $("#err3").textContent = "";
  Object.assign(data, { role, vision: $("#vision").value.trim(), notes: $("#notes").value.trim() });
  goTo(4);
};

/* ---------- STEP 4: slider + send ---------- */
const slider = $("#interest");
const syncSlider = () => {
  $("#val").textContent = slider.value;
  slider.style.setProperty("--p", slider.value * 10 + "%");
  data.interest = +slider.value;
};
slider.addEventListener("input", syncSlider);
syncSlider();

$("#submit").onclick = async () => {
  const btn = $("#submit");
  btn.disabled = true; btn.textContent = "Sending…"; $("#err4").textContent = "";
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `New portfolio request from ${data.name}`,
        "Date": data.date, "Time": data.time,
        "Name": data.name, "Email": data.email,
        "Phone": data.phone || "-", "WhatsApp": data.whatsapp || "-",
        "Specialty / role": data.role, "Vision": data.vision || "-", "Notes": data.notes || "-",
        "Interest (0-10)": data.interest,
        email: data.email // lets you reply directly
      })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    $("#panel4 .box").innerHTML = `<div class="done"><h3>You're in! 🎉</h3><p style="margin-top:10px">Thank you, ${data.name}. We'll be back to you very soon.</p><button class="cta" style="margin-top:24px;width:100%" onclick="location.reload()">Back to home</button></div>`;
  } catch (e) {
    console.error(e);
    $("#err4").textContent = "Couldn't send. Check your connection (or the email endpoint) and try again.";
    btn.disabled = false; btn.textContent = "Submit →";
  }
};

/* ---------- Watch our story (video modal) ---------- */
const modal = $("#videoModal"), slot = $("#videoSlot");
$("#storyBtn").onclick = () => {
  if (VIDEO_SRC) {
    slot.innerHTML = /youtube|vimeo|embed/.test(VIDEO_SRC)
      ? `<iframe src="${VIDEO_SRC}" allow="autoplay; fullscreen" allowfullscreen></iframe>`
      : `<video src="${VIDEO_SRC}" controls autoplay></video>`;
  }
  modal.classList.add("open");
};
const closeVideo = () => { modal.classList.remove("open"); if (VIDEO_SRC) slot.innerHTML = ""; };
$("#videoX").onclick = closeVideo;
modal.addEventListener("click", e => { if (e.target === modal) closeVideo(); });
