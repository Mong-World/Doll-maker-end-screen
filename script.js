(() => {
  "use strict";

  const CONFIG = {
    endings: {
      "exit solo": {
        title: "LEFT BEHIND",
        artwork: "assets/ending_leftbehind.png"
      },
      "exit stitch": {
        title: "ESCAPED",
        artwork: "assets/ending_escaped.png"
      },
      "pendant ending": {
        title: "TRUE FRIENDSHIP",
        artwork: "assets/ending_truefriendship.png"
      }
    },

    letterTasks: [
      "letter1",
      "letter2",
      "letter3",
      "letter4",
      "letter5",
      "letter6"
    ]
  };

  const state = {
    ending: "exit solo",
    letters: new Set(),
    numericLetterCount: null
  };

  const elements = {
    endingScreen: document.getElementById("endingScreen"),
    endingBackground: document.getElementById("endingBackground"),
    endingTitle: document.getElementById("endingTitle"),
    letterCount: document.getElementById("letterCount"),
    wallpaperButton: document.getElementById("wallpaperButton"),
    wallpaperScreen: document.getElementById("wallpaperScreen"),
    wallpaperBackButton: document.getElementById("wallpaperBackButton"),
    particles: document.getElementById("particles")
  };

  function normaliseName(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  }

  function isCompleted(value) {
    if (value === true || value === 1) return true;

    const normalised = normaliseName(value);
    return [
      "completed",
      "complete",
      "active",
      "true",
      "1",
      "done"
    ].includes(normalised);
  }

  function setEnding(rawEnding) {
    const endingName = normaliseName(rawEnding);

    if (!CONFIG.endings[endingName]) {
      return;
    }

    state.ending = endingName;
    const ending = CONFIG.endings[endingName];

    elements.endingTitle.textContent = ending.title;
    elements.endingBackground.style.backgroundImage = `url("${ending.artwork}")`;
    document.title = `The Doll Maker — ${ending.title}`;
  }

  function getLetterTotal() {
    if (Number.isInteger(state.numericLetterCount)) {
      return Math.max(0, Math.min(6, state.numericLetterCount));
    }

    return Math.max(0, Math.min(6, state.letters.size));
  }

  function renderLetterCount(animate = true) {
    const target = getLetterTotal();
    const start = animate ? 0 : target;
    const duration = 760;
    const startedAt = performance.now();

    if (!animate) {
      elements.letterCount.textContent = `${target} / 6`;
      updateWallpaperUnlock(target);
      return;
    }

    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (target - start) * eased);

      elements.letterCount.textContent = `${value} / 6`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        updateWallpaperUnlock(target);
      }
    }

    requestAnimationFrame(tick);
  }

  function updateWallpaperUnlock(total) {
    elements.wallpaperButton.hidden = total !== 6;
  }

  function registerTask(taskName, taskState = true) {
    const normalisedTask = normaliseName(taskName);

    if (CONFIG.endings[normalisedTask] && isCompleted(taskState)) {
      setEnding(normalisedTask);
    }

    if (
      CONFIG.letterTasks.includes(normalisedTask) &&
      isCompleted(taskState)
    ) {
      state.numericLetterCount = null;
      state.letters.add(normalisedTask);
      renderLetterCount(false);
    }
  }

  function parseTaskCollection(tasks) {
    if (!tasks) return;

    if (Array.isArray(tasks)) {
      tasks.forEach((task) => {
        if (typeof task === "string") {
          registerTask(task, true);
          return;
        }

        if (task && typeof task === "object") {
          registerTask(
            task.name ?? task.taskName ?? task.task ?? task.id,
            task.state ?? task.status ?? task.completed ?? true
          );
        }
      });

      return;
    }

    if (typeof tasks === "object") {
      Object.entries(tasks).forEach(([taskName, taskState]) => {
        registerTask(taskName, taskState);
      });
    }
  }

  function handleIncomingData(input) {
    let data = input;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        registerTask(data, true);
        return;
      }
    }

    if (!data || typeof data !== "object") return;

    const ending =
      data.ending ??
      data.endingName ??
      data.endingTask ??
      data.taskEnding;

    if (ending) {
      setEnding(ending);
    }

    const directLetterCount =
      data.letters ??
      data.letterCount ??
      data.lettersFound;

    if (
      directLetterCount !== undefined &&
      Number.isFinite(Number(directLetterCount))
    ) {
      state.numericLetterCount = Math.max(
        0,
        Math.min(6, Math.round(Number(directLetterCount)))
      );
      renderLetterCount(false);
    }

    parseTaskCollection(data.tasks ?? data.taskStates ?? data.completedTasks);

    const singleTaskName =
      data.taskName ??
      data.task ??
      data.name;

    if (singleTaskName) {
      registerTask(
        singleTaskName,
        data.state ?? data.status ?? data.completed ?? true
      );
    }
  }

  function readPreviewQueryParameters() {
    const params = new URLSearchParams(window.location.search);

    const ending = params.get("ending");
    const letters = params.get("letters");

    if (ending) {
      setEnding(ending);
    }

    if (letters !== null && Number.isFinite(Number(letters))) {
      state.numericLetterCount = Math.max(
        0,
        Math.min(6, Math.round(Number(letters)))
      );
    }
  }

  function createParticles() {
    const particleCount = 24;

    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";

      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${55 + Math.random() * 50}%`;
      particle.style.opacity = `${0.12 + Math.random() * 0.3}`;
      particle.style.animationDuration = `${10 + Math.random() * 15}s`;
      particle.style.animationDelay = `${-Math.random() * 18}s`;
      particle.style.transform = `scale(${0.6 + Math.random() * 1.5})`;

      elements.particles.appendChild(particle);
    }
  }

  function showWallpaper() {
    elements.wallpaperScreen.hidden = false;
    elements.endingScreen.setAttribute("aria-hidden", "true");
  }

  function hideWallpaper() {
    elements.wallpaperScreen.hidden = true;
    elements.endingScreen.removeAttribute("aria-hidden");
  }

  window.addEventListener("message", (event) => {
    handleIncomingData(event.data);
  });

  /*
    Portals can also call this function directly from the iframe context:

    window.DollMakerEnding.update({
      ending: "exit stitch",
      letters: 6
    });
  */
  window.DollMakerEnding = {
    update: handleIncomingData,
    setEnding,
    registerTask
  };

  elements.wallpaperButton.addEventListener("click", showWallpaper);
  elements.wallpaperBackButton.addEventListener("click", hideWallpaper);

  readPreviewQueryParameters();
  setEnding(state.ending);
  createParticles();

  window.setTimeout(() => {
    renderLetterCount(true);
  }, 2750);
})();
