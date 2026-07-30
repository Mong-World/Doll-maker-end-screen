(() => {
  "use strict";

  const CONFIG = {
    endings: {
      "exit solo": {
        title: "LEFT BEHIND",
        artwork: "assets/ending_leftbehind.PNG"
      },
      "exit stitch": {
        title: "ESCAPED",
        artwork: "assets/ending_escaped.PNG"
      },
      "pendant ending": {
        title: "TRUE FRIENDSHIP",
        artwork: "assets/ending_truefriendship.PNG"
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
    backgroundShade: document.querySelector(".background-shade"),
    mists: document.querySelectorAll(".mist"),
    particles: document.getElementById("particles"),
    endingTitle: document.getElementById("endingTitle"),
    lettersBlock: document.getElementById("lettersBlock"),
    letterCount: document.getElementById("letterCount"),
    lettersMessage: document.getElementById("lettersMessage"),
    endingActions: document.getElementById("endingActions"),
    wallpaperButton: document.getElementById("wallpaperButton"),
    wallpaperScreen: document.getElementById("wallpaperScreen"),
    wallpaperPreview: document.getElementById("wallpaperPreview"),
    wallpaperBackButton: document.getElementById("wallpaperBackButton"),
    wallpaperControls: document.querySelector(".wallpaper-controls")
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
      "true",
      "1",
      "done"
    ].includes(normalised);
  }

  function setEnding(rawEnding) {
    const endingName = normaliseName(rawEnding);

    if (!CONFIG.endings[endingName]) return;

    state.ending = endingName;

    const ending = CONFIG.endings[endingName];

    document.body.setAttribute("data-ending", endingName);
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
    const particleCount = 34;

    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";

      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${58 + Math.random() * 45}%`;
      particle.style.opacity = `${0.14 + Math.random() * 0.38}`;
      particle.style.animationDuration = `${9 + Math.random() * 13}s`;
      particle.style.animationDelay = `${-Math.random() * 20}s`;
      particle.style.transform = `scale(${0.6 + Math.random() * 1.8})`;

      elements.particles.appendChild(particle);
    }
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function animateLetterCount(target) {
    return new Promise((resolve) => {
      const duration = 1500;
      const startedAt = performance.now();

      function tick(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);

        elements.letterCount.textContent = `${value} / 6`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          elements.letterCount.textContent = `${target} / 6`;
          resolve();
        }
      }

      requestAnimationFrame(tick);
    });
  }

  async function runSequence() {
    const totalLetters = getLetterTotal();

    updateWallpaperUnlock(totalLetters);
    elements.letterCount.textContent = "0 / 6";
    elements.lettersMessage.classList.remove("is-visible");
    elements.lettersMessage.textContent =
      "Congratulations — You Collected All of Angelica’s Letters";

    await wait(250);

    elements.endingBackground.classList.add("is-visible");
    elements.backgroundShade.classList.add("is-visible");
    elements.mists.forEach((mist) => mist.classList.add("is-visible"));
    elements.particles.classList.add("is-visible");

    await wait(1650);

    elements.endingTitle.classList.add("is-visible");

    await wait(1350);

    elements.lettersBlock.classList.add("is-visible");

    await wait(650);

    await animateLetterCount(totalLetters);

    if (totalLetters === 6) {
      await wait(450);
      elements.lettersMessage.classList.add("is-visible");
      await wait(1550);
    } else {
      await wait(650);
    }

    elements.endingActions.classList.add("is-visible");
  }

  function showWallpaper() {
    elements.wallpaperScreen.hidden = false;
    elements.endingScreen.setAttribute("aria-hidden", "true");

    elements.wallpaperPreview.classList.remove("is-focused");
    elements.wallpaperControls.classList.remove("is-visible");

    window.setTimeout(() => {
      elements.wallpaperPreview.classList.add("is-focused");
    }, 80);

    window.setTimeout(() => {
      elements.wallpaperControls.classList.add("is-visible");
    }, 900);
  }

  function hideWallpaper() {
    elements.wallpaperScreen.hidden = true;
    elements.endingScreen.removeAttribute("aria-hidden");
  }

  window.addEventListener("message", (event) => {
    handleIncomingData(event.data);
  });

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
  runSequence();
})();
