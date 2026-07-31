(() => {
  "use strict";

  const CONFIG = {
    endings: {
      "exit solo": {
        title: "LEFT BEHIND",
        artwork: "assets/ending_leftbehind.PNG",
        particleCount: 34
      },

      "exit stitch": {
        title: "ESCAPED",
        artwork: "assets/ending_escaped.PNG",
        particleCount: 48
      },

      "pendant ending": {
        title: "TRUE FRIENDSHIP",
        artwork: "assets/ending_truefriendship.PNG",
        particleCount: 140
      }
    },

    endingAliases: {
      leftbehind: "exit solo",
      "left behind": "exit solo",
      "exit solo": "exit solo",

      escaped: "exit stitch",
      "exit stitch": "exit stitch",

      truefriendship: "pendant ending",
      "true friendship": "pendant ending",
      "pendant ending": "pendant ending"
    },

    letterTasks: [
      "letter1",
      "letter2",
      "letter3",
      "letter4",
      "letter5",
      "letter6"
    ],

    creditsUrl:
      "https://mong-world.github.io/Doll-maker-credits/",

    returnTaskName:
      "return to main menu"
  };

  const state = {
    ending: null,
    letters: new Set(),
    numericLetterCount: null,
    sequenceStarted: false
  };

  const elements = {
    endingScreen:
      document.getElementById("endingScreen"),

    endingBackground:
      document.getElementById("endingBackground"),

    backgroundShade:
      document.querySelector(".background-shade"),

    mists:
      document.querySelectorAll(".mist"),

    particles:
      document.getElementById("particles"),

    endingTitle:
      document.getElementById("endingTitle"),

    lettersBlock:
      document.getElementById("lettersBlock"),

    letterCount:
      document.getElementById("letterCount"),

    lettersMessage:
      document.getElementById("lettersMessage"),

    endingActions:
      document.getElementById("endingActions"),

    wallpaperButton:
      document.getElementById("wallpaperButton"),

    wallpaperScreen:
      document.getElementById("wallpaperScreen"),

    wallpaperPreview:
      document.getElementById("wallpaperPreview"),

    wallpaperBackButton:
      document.getElementById("wallpaperBackButton"),

    wallpaperControls:
      document.querySelector(".wallpaper-controls"),

    creditsButton:
      document.getElementById("creditsButton"),

    mainMenuButton:
      document.getElementById("mainMenuButton")
  };

  function normaliseName(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  }

  function isCompleted(value) {
    if (
      value === true ||
      value === 1 ||
      value === 2
    ) {
      return true;
    }

    return [
      "active",
      "completed",
      "complete",
      "true",
      "1",
      "2",
      "done"
    ].includes(
      normaliseName(value)
    );
  }

  function resolveEnding(rawEnding) {
    const normalised =
      normaliseName(rawEnding);

    return (
      CONFIG.endingAliases[normalised] ??
      null
    );
  }

  function setEnding(rawEnding) {
    const endingName =
      resolveEnding(rawEnding);

    if (!endingName) {
      console.warn(
        "Unknown ending value:",
        rawEnding
      );

      return false;
    }

    const ending =
      CONFIG.endings[endingName];

    state.ending =
      endingName;

    document.body.setAttribute(
      "data-ending",
      endingName
    );

    if (elements.endingTitle) {
      elements.endingTitle.textContent =
        ending.title;
    }

    if (elements.endingBackground) {
      elements.endingBackground.style.backgroundImage =
        `url("${ending.artwork}")`;
    }

    document.title =
      `The Doll Maker — ${ending.title}`;

    createParticles(
      ending.particleCount
    );

    return true;
  }

  function setLetterCount(value) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return false;
    }

    state.numericLetterCount =
      Math.max(
        0,
        Math.min(
          6,
          Math.round(number)
        )
      );

    return true;
  }

  function getLetterTotal() {
    if (
      Number.isInteger(
        state.numericLetterCount
      )
    ) {
      return state.numericLetterCount;
    }

    return Math.max(
      0,
      Math.min(
        6,
        state.letters.size
      )
    );
  }

  function updateWallpaperUnlock(total) {
    if (!elements.wallpaperButton) {
      return;
    }

    elements.wallpaperButton.hidden =
      total !== 6;
  }

  function registerTask(
    taskName,
    taskState = true
  ) {
    const normalisedTask =
      normaliseName(taskName);

    const resolvedEnding =
      resolveEnding(normalisedTask);

    if (
      resolvedEnding &&
      isCompleted(taskState)
    ) {
      setEnding(resolvedEnding);
    }

    if (
      CONFIG.letterTasks.includes(
        normalisedTask
      ) &&
      isCompleted(taskState)
    ) {
      state.numericLetterCount =
        null;

      state.letters.add(
        normalisedTask
      );
    }
  }

  function parseTaskCollection(tasks) {
    if (!tasks) {
      return;
    }

    if (Array.isArray(tasks)) {
      tasks.forEach((task) => {
        if (
          typeof task === "string"
        ) {
          registerTask(
            task,
            true
          );

          return;
        }

        if (
          task &&
          typeof task === "object"
        ) {
          registerTask(
            task.name ??
              task.taskName ??
              task.task ??
              task.id,

            task.state ??
              task.status ??
              task.completed ??
              true
          );
        }
      });

      return;
    }

    if (
      typeof tasks === "object"
    ) {
      Object.entries(tasks).forEach(
        ([taskName, taskState]) => {
          registerTask(
            taskName,
            taskState
          );
        }
      );
    }
  }

  function decodeIncomingData(input) {
    if (
      typeof input !== "string"
    ) {
      return input;
    }

    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }

  function handleIncomingData(input) {
    const data =
      decodeIncomingData(input);

    if (
      typeof data === "string"
    ) {
      const possibleEnding =
        resolveEnding(data);

      if (possibleEnding) {
        setEnding(possibleEnding);
      } else {
        registerTask(
          data,
          true
        );
      }

      maybeStartSequence();
      return;
    }

    if (
      !data ||
      typeof data !== "object"
    ) {
      return;
    }

    const ending =
      data.ending ??
      data.endingName ??
      data.endingTask ??
      data.taskEnding;

    if (ending !== undefined) {
      setEnding(ending);
    }

    const directLetterCount =
      data.letters ??
      data.letterCount ??
      data.lettersFound;

    if (
      directLetterCount !== undefined
    ) {
      setLetterCount(
        directLetterCount
      );
    }

    parseTaskCollection(
      data.tasks ??
      data.taskStates ??
      data.completedTasks
    );

    const singleTaskName =
      data.taskName ??
      data.task ??
      data.name;

    if (singleTaskName) {
      registerTask(
        singleTaskName,

        data.state ??
          data.status ??
          data.completed ??
          true
      );
    }

    maybeStartSequence();
  }

  function readQueryParameters() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const ending =
      params.get("ending");

    const letters =
      params.get("letters");

    if (ending) {
      setEnding(ending);
    }

    if (letters !== null) {
      setLetterCount(letters);
    } else if (ending) {
      setLetterCount(0);
    }
  }

  function createParticles(
    particleCount
  ) {
    if (!elements.particles) {
      return;
    }

    elements.particles.innerHTML =
      "";

    for (
      let index = 0;
      index < particleCount;
      index += 1
    ) {
      const particle =
        document.createElement("span");

      particle.className =
        "particle";

      const size =
        1 +
        Math.random() * 2.8;

      const duration =
        5.5 +
        Math.random() * 7;

      const delay =
        -Math.random() *
        duration;

      const twinkleDuration =
        1.4 +
        Math.random() * 3.2;

      const twinkleDelay =
        -Math.random() *
        twinkleDuration;

      particle.style.left =
        `${Math.random() * 100}%`;

      particle.style.top =
        `${54 + Math.random() * 52}%`;

      particle.style.setProperty(
        "--particle-size",
        `${size}px`
      );

      particle.style.setProperty(
        "--particle-duration",
        `${duration}s`
      );

      particle.style.setProperty(
        "--particle-delay",
        `${delay}s`
      );

      particle.style.setProperty(
        "--twinkle-duration",
        `${twinkleDuration}s`
      );

      particle.style.setProperty(
        "--twinkle-delay",
        `${twinkleDelay}s`
      );

      elements.particles.appendChild(
        particle
      );
    }
  }

  function wait(milliseconds) {
    return new Promise((resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    });
  }

  function animateLetterCount(target) {
    return new Promise((resolve) => {
      if (!elements.letterCount) {
        resolve();
        return;
      }

      const duration =
        1250;

      const startedAt =
        performance.now();

      function tick(now) {
        const progress =
          Math.min(
            1,
            (now - startedAt) /
              duration
          );

        const eased =
          1 -
          Math.pow(
            1 - progress,
            3
          );

        const value =
          Math.round(
            target * eased
          );

        elements.letterCount.textContent =
          `${value} / 6`;

        if (progress < 1) {
          requestAnimationFrame(
            tick
          );
        } else {
          elements.letterCount.textContent =
            `${target} / 6`;

          resolve();
        }
      }

      requestAnimationFrame(
        tick
      );
    });
  }

  async function runSequence() {
    if (
      state.sequenceStarted ||
      !state.ending
    ) {
      return;
    }

    state.sequenceStarted =
      true;

    const totalLetters =
      getLetterTotal();

    updateWallpaperUnlock(
      totalLetters
    );

    if (elements.letterCount) {
      elements.letterCount.textContent =
        "0 / 6";
    }

    elements.lettersMessage?.classList.remove(
      "is-visible"
    );

    await wait(180);

    elements.endingBackground?.classList.add(
      "is-visible"
    );

    elements.backgroundShade?.classList.add(
      "is-visible"
    );

    elements.mists.forEach(
      (mist) => {
        mist.classList.add(
          "is-visible"
        );
      }
    );

    elements.particles?.classList.add(
      "is-visible"
    );

    await wait(1150);

    elements.endingTitle?.classList.add(
      "is-visible"
    );

    if (
      state.ending ===
      "pendant ending"
    ) {
      document
        .querySelector(
          ".ending-content"
        )
        ?.classList.add(
          "has-text-fog"
        );
    }

    await wait(850);

    elements.lettersBlock?.classList.add(
      "is-visible"
    );

    await wait(350);

    await animateLetterCount(
      totalLetters
    );

    if (totalLetters === 6) {
      await wait(250);

      elements.lettersMessage?.classList.add(
        "is-visible"
      );

      await wait(1050);
    } else {
      await wait(350);
    }

    elements.endingActions?.classList.add(
      "is-visible"
    );
  }

  function maybeStartSequence() {
    if (
      state.ending &&
      !state.sequenceStarted
    ) {
      runSequence().catch(
        (error) => {
          console.error(
            "Ending sequence failed:",
            error
          );
        }
      );
    }
  }

  function showWallpaper() {
    if (
      !elements.wallpaperScreen ||
      !elements.endingScreen
    ) {
      return;
    }

    elements.wallpaperScreen.hidden =
      false;

    elements.endingScreen.setAttribute(
      "aria-hidden",
      "true"
    );

    elements.wallpaperPreview?.classList.remove(
      "is-focused"
    );

    elements.wallpaperControls?.classList.remove(
      "is-visible"
    );

    window.setTimeout(() => {
      elements.wallpaperPreview?.classList.add(
        "is-focused"
      );
    }, 80);

    window.setTimeout(() => {
      elements.wallpaperControls?.classList.add(
        "is-visible"
      );
    }, 900);
  }

  function hideWallpaper() {
    if (
      !elements.wallpaperScreen ||
      !elements.endingScreen
    ) {
      return;
    }

    elements.wallpaperScreen.hidden =
      true;

    elements.endingScreen.removeAttribute(
      "aria-hidden"
    );
  }

  function setupPortalsMessageListener() {
    if (
      typeof PortalsSdk !==
        "undefined" &&
      typeof PortalsSdk
        .setMessageListener ===
        "function"
    ) {
      PortalsSdk.setMessageListener(
        (message) => {
          handleIncomingData(
            message
          );
        }
      );
    }
  }

  function resetMainMenuButton() {
    if (!elements.mainMenuButton) {
      return;
    }

    elements.mainMenuButton.disabled =
      false;

    elements.mainMenuButton.textContent =
      "MAIN MENU";
  }

  function returnToMainMenu() {
    const button =
      elements.mainMenuButton;

    if (!button) {
      return;
    }

    button.disabled =
      true;

    button.textContent =
      "RETURNING...";

    if (
      typeof PortalsSdk ===
        "undefined" ||
      typeof PortalsSdk
        .sendMessageToUnity !==
        "function"
    ) {
      console.error(
        "PortalsSdk is unavailable. " +
        "Open this page through a Portals Iframe effect."
      );

      button.textContent =
        "SDK ERROR";

      window.setTimeout(
        resetMainMenuButton,
        1800
      );

      return;
    }

    const message =
      JSON.stringify({
        TaskName:
          CONFIG.returnTaskName,

        TaskTargetState:
          "SetAnyToActive",

        Delay:
          0
      });

    console.log(
      "Sending Portals task:",
      message
    );

    try {
      PortalsSdk.sendMessageToUnity(
        message
      );
    } catch (error) {
      console.error(
        "Failed to send Portals task:",
        error
      );

      button.textContent =
        "TASK ERROR";

      window.setTimeout(
        resetMainMenuButton,
        1800
      );
    }

    /*
     * Do not close the iframe here.
     *
     * The Active state of the Portals task
     * "return to main menu" should contain
     * the Close Iframe effect.
     */
  }

  window.addEventListener(
    "message",
    (event) => {
      handleIncomingData(
        event.data
      );
    }
  );

  window.DollMakerEnding = {
    update:
      handleIncomingData,

    setEnding:
      setEnding,

    setLetterCount:
      setLetterCount,

    registerTask:
      registerTask
  };

  elements.wallpaperButton?.addEventListener(
    "click",
    showWallpaper
  );

  elements.wallpaperBackButton?.addEventListener(
    "click",
    hideWallpaper
  );

  elements.creditsButton?.addEventListener(
    "click",
    () => {
      window.location.href =
        CONFIG.creditsUrl;
    }
  );

  elements.mainMenuButton?.addEventListener(
    "click",
    returnToMainMenu
  );

  setupPortalsMessageListener();

  readQueryParameters();

  maybeStartSequence();
})();
