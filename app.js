document.addEventListener("DOMContentLoaded", () => {
  const addReminderBtn = document.getElementById("addReminderBtn");
  const reminderList = document.getElementById("reminderList");
  const alarmModal = document.getElementById("alarm-modal");
  const alarmText = document.getElementById("alarm-text");
  const stopAlarmBtn = document.getElementById("stop-alarm-btn");

  let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
  let audioCtx;
  let alarmState = {
    oscillator: null,
    gainNode: null,
    interval: null,
    timeout: null,
  };
  const stopAlarmSound = () => {
    if (alarmState.interval) {
      clearInterval(alarmState.interval);
      clearTimeout(alarmState.timeout);
      alarmState.oscillator.stop();
      alarmState.interval = null;
      alarmState.timeout = null;
      alarmState.oscillator = null;
      alarmModal.classList.add("hidden");
    }
  };
  const startAlarmSound = (text) => {
    if (alarmState.interval) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      alarmText.textContent = text;
      alarmModal.classList.remove("hidden");
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "square";
      gainNode.gain.value = 0;
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);

      let isBeeping = true;
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      alarmState.interval = setInterval(() => {
        gainNode.gain.setValueAtTime(
          isBeeping ? 0 : 0.5,
          audioCtx.currentTime
        );
        isBeeping = !isBeeping;
      }, 400);
      oscillator.start();
      alarmState.oscillator = oscillator;
      alarmState.gainNode = gainNode;
      alarmState.timeout = setTimeout(() => startAlarmSound(text), 10000);
    } catch (e) {
      console.error(e);
      alarmModal.classList.add("hidden");
    }
  };
  const renderReminders = () => {
    const reminderListEl = document.getElementById("reminderList");
    reminderListEl.innerHTML =
      reminders.length === 0
        ? `<p class="text-center text-gray-500 dark:text-gray-400 p-4">No reminders set yet.</p>`
        : reminders
            .sort((a, b) => new Date(a.time) - new Date(b.time))
            .map(
              (r) => `
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center justify-between" data-id="${r.id}">
                  <div>
                    <p class="font-semibold text-lg">${r.text}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${new Date(
                      r.time
                    ).toLocaleString()}</p>
                  </div>
                  <button class="delete-btn text-red-500 hover:text-red-700 p-2 rounded-full" aria-label="Delete reminder">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              `
            )
            .join("");
  };
  const addReminder = async () => {
    await Notification.requestPermission();

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const reminderText = document.getElementById("reminderText");
    const reminderTime = document.getElementById("reminderTime");
    const text = reminderText.value.trim();
    const time = reminderTime.value;
    if (!text || !time) return;
    const newReminder = { id: Date.now(), text, time };
    reminders.push(newReminder);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    renderReminders();
    reminderText.value = "";
    reminderTime.value = "";
  };
  const deleteReminder = (id) => {
    reminders = reminders.filter((reminder) => reminder.id !== id);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    renderReminders();
  };
  const triggerAlarm = (reminder) => {
    if (!document.hidden) {
      startAlarmSound(reminder.text);
    }
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "show-notification",
        payload: { title: "Reminder", body: reminder.text, id: reminder.id },
      });
    }
  };
  const checkReminders = () => {
    let remindersTriggered = false;
    const now = Date.now();
    reminders = reminders.filter((r) => {
      if (now >= new Date(r.time).getTime()) {
        triggerAlarm(r);
        remindersTriggered = true;
        return false;
      }
      return true;
    });
    if (remindersTriggered) {
      localStorage.setItem("reminders", JSON.stringify(reminders));
      renderReminders();
    }
  };
  addReminderBtn.addEventListener("click", addReminder);
  stopAlarmBtn.addEventListener("click", stopAlarmSound);
  reminderList.addEventListener("click", (e) => {
    if (e.target.closest(".delete-btn")) {
      deleteReminder(Number(e.target.closest("div[data-id]").dataset.id));
    }
  });
  document
    .getElementById("viewRemindersBtn")
    .addEventListener("click", () => {
      document.getElementById("reminderSection").classList.toggle("hidden");
    });
  navigator.serviceWorker
    .register("sw.js")
    .then(() => console.log("service worker registered"))
    .catch((err) => console.error(err));
  setInterval(checkReminders, 60000);
  renderReminders();
});
