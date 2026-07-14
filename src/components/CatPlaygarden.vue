<script setup lang="ts">
// oneko.js: https://github.com/adryd325/oneko.js
// CatPlaygarden bundles all of the cat's state/config into a single `cat`
// object and gives it a home: a bed rendered at the centre of the viewport,
// which is the coordinate the cat rests at.
import { onMounted, onBeforeUnmount, ref } from "vue";

const nekoFile = "/images/oneko.gif";
const bedFile = "/images/grey-soft-round-plush-pet-bed-png.png";
const persistPosition = false;

enum CatStates {
  FREE_RANGE_CAT, // the cat follows the mouse
  CAT_AT_HOME, // the cat stays on its bed
  CAT_GOING_HOME,
}

const spriteSets: Record<string, number[][]> = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [
    [-5, 0],
    [-6, 0],
    [-7, 0],
  ],
  scratchWallN: [
    [0, 0],
    [0, -1],
  ],
  scratchWallS: [
    [-7, -1],
    [-6, -2],
  ],
  scratchWallE: [
    [-2, -2],
    [-2, -3],
  ],
  scratchWallW: [
    [-4, 0],
    [-4, -1],
  ],
  tired: [[-3, -2]],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  N: [
    [-1, -2],
    [-1, -3],
  ],
  NE: [
    [0, -2],
    [0, -3],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  SE: [
    [-5, -1],
    [-5, -2],
  ],
  S: [
    [-6, -3],
    [-7, -2],
  ],
  SW: [
    [-5, -3],
    [-6, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
  NW: [
    [-1, 0],
    [-1, -1],
  ],
};

// Everything that belongs to the cat lives on this single object.
const cat = {
  el: null as HTMLDivElement | null,
  speed: 10,
  state: CatStates.CAT_AT_HOME,
  posX: 32,
  posY: 32,
  // The coordinate of the bed — where the cat rests.
  homeX: 32,
  homeY: 32,
  mouseX: 0,
  mouseY: 0,
  // While the cat is walking itself home, we freeze the tracked mouse position
  // so real cursor movement can't tug it off course.
  mouseLocked: false,
  frameCount: 0,
  idleTime: 0,
  idleAnimation: null as string | null,
  idleAnimationFrame: 0,
};

// The bed element is the anchor for the cat's home coordinate. The cat lives
// in the viewport's fixed-position pixel space, so we read the bed's rendered
// centre from the DOM rather than assuming it sits at any particular fraction
// of the window.
const bedEl = ref<HTMLImageElement | null>(null);

let onMouseMove: ((event: MouseEvent) => void) | null = null;
let onNekoClick: ((event: MouseEvent) => void) | null = null;
let onBeforeUnload: (() => void) | null = null;
let onResize: (() => void) | null = null;
let animationFrameId: number | null = null;
let lastFrameTimestamp: number | undefined;

// Lock the cat's home to the bed's current on-screen centre. The bed is
// positioned in CSS relative to the viewport, so it moves when the window is
// resized; syncing here keeps the cat's resting spot glued to the bed instead
// of to a pixel value captured once at mount.
function syncHomeToBed() {
  if (!bedEl.value) return;
  const rect = bedEl.value.getBoundingClientRect();
  cat.homeX = rect.left + (rect.width / 2);
  cat.homeY = rect.top + (rect.height / 2) - 20;
  // If the cat is resting on the bed, carry it along so it stays seated.
  if (cat.state === CatStates.CAT_AT_HOME) {
    cat.posX = cat.homeX;
    cat.posY = cat.homeY;
    if (cat.el) {
      cat.el.style.left = `${cat.posX - 16}px`;
      cat.el.style.top = `${cat.posY - 16}px`;
    }
  }
}

function setSprite(name: string, frame: number) {
  const set = spriteSets[name]!;
  const sprite = set[frame % set.length]!;
  cat.el!.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
}

function resetIdleAnimation() {
  cat.idleAnimation = null;
  cat.idleAnimationFrame = 0;
}

function idle() {
  cat.idleTime += 1;

  // every ~ 20 seconds
  if (
    cat.idleTime > 10 &&
    Math.floor(Math.random() * 200) == 0 &&
    cat.idleAnimation == null
  ) {
    let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
    if (cat.posX < 32) {
      avalibleIdleAnimations.push("scratchWallW");
    }
    if (cat.posY < 32) {
      avalibleIdleAnimations.push("scratchWallN");
    }
    if (cat.posX > window.innerWidth - 32) {
      avalibleIdleAnimations.push("scratchWallE");
    }
    if (cat.posY > window.innerHeight - 32) {
      avalibleIdleAnimations.push("scratchWallS");
    }
    cat.idleAnimation =
      avalibleIdleAnimations[
        Math.floor(Math.random() * avalibleIdleAnimations.length)
      ]!;
  }

  switch (cat.idleAnimation) {
    case "sleeping":
      if (cat.idleAnimationFrame < 8) {
        setSprite("tired", 0);
        break;
      }
      setSprite("sleeping", Math.floor(cat.idleAnimationFrame / 4));
      if (cat.idleAnimationFrame > 192) {
        resetIdleAnimation();
      }
      break;
    case "scratchWallN":
    case "scratchWallS":
    case "scratchWallE":
    case "scratchWallW":
    case "scratchSelf":
      setSprite(cat.idleAnimation, cat.idleAnimationFrame);
      if (cat.idleAnimationFrame > 9) {
        resetIdleAnimation();
      }
      break;
    default:
      setSprite("idle", 0);
      return;
  }
  cat.idleAnimationFrame += 1;
}

function frame() {
  cat.frameCount += 1;
  const diffX = cat.posX - cat.mouseX;
  const diffY = cat.posY - cat.mouseY;
  const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

  // When the cat is at home it never moves; it just reacts to the mouse
  // getting close. Handle this before the idle guard below, otherwise the
  // `distance < 48` check swallows the frame and the alert never shows.
  if (cat.state == CatStates.CAT_AT_HOME) {
    if (distance <= 50) {
      // Mouse is nearby: wake up, stay put, and bounce in place.
      cat.idleTime = 0;
      resetIdleAnimation();
      setSprite("alert", 0);
      const bounce = Math.abs(Math.sin(cat.frameCount / 1.2)) * 8;
      cat.el!.style.left = `${cat.posX - 16}px`;
      cat.el!.style.top = `${cat.posY - 16 - bounce}px`;
    } else {
      // Mouse is away: rest on the bed and fall asleep after ~10s idle.
      cat.idleTime += 1;
      cat.el!.style.left = `${cat.posX - 16}px`;
      cat.el!.style.top = `${cat.posY - 16}px`;
      // frame() runs ~every 100ms, so 10s ≈ 100 frames.
      if (cat.idleTime > 100) {
        if (cat.idleAnimationFrame < 8) {
          setSprite("tired", 0);
        } else {
          setSprite("sleeping", Math.floor(cat.idleAnimationFrame / 4));
        }
        cat.idleAnimationFrame += 1;
      } else {
        setSprite("idle", 0);
      }
    }
    return;
  }

  if (cat.state == CatStates.CAT_GOING_HOME) {
    // Walking home: keep closing on the bed (no idling) until we arrive.
    if (distance < cat.speed) {
      cat.state = CatStates.CAT_AT_HOME;
      cat.posX = cat.homeX;
      cat.posY = cat.homeY;
      cat.mouseLocked = false;
      cat.idleTime = 0;
      resetIdleAnimation();
      setSprite("idle", 0);
      cat.el!.style.left = `${cat.posX - 16}px`;
      cat.el!.style.top = `${cat.posY - 16}px`;
      return;
    }
  } else if (distance < cat.speed || distance < 48) {
    idle();
    return;
  }

  cat.idleAnimation = null;
  cat.idleAnimationFrame = 0;

  if (cat.state != CatStates.CAT_GOING_HOME && cat.idleTime > 1) {
    setSprite("alert", 0);
    // count down after being alerted before moving
    cat.idleTime = Math.min(cat.idleTime, 7);
    cat.idleTime -= 1;
    return;
  }

  let direction: string;
  direction = diffY / distance > 0.5 ? "N" : "";
  direction += diffY / distance < -0.5 ? "S" : "";
  direction += diffX / distance > 0.5 ? "W" : "";
  direction += diffX / distance < -0.5 ? "E" : "";
  setSprite(direction, cat.frameCount);

  cat.posX -= (diffX / distance) * cat.speed;
  cat.posY -= (diffY / distance) * cat.speed;

  cat.posX = Math.min(Math.max(16, cat.posX), window.innerWidth - 16);
  cat.posY = Math.min(Math.max(16, cat.posY), window.innerHeight - 16);

  cat.el!.style.left = `${cat.posX - 16}px`;
  cat.el!.style.top = `${cat.posY - 16}px`;
}

function onAnimationFrame(timestamp: number) {
  // Stops execution if the neko element is removed from DOM
  if (!cat.el || !cat.el.isConnected) {
    return;
  }
  if (!lastFrameTimestamp) {
    lastFrameTimestamp = timestamp;
  }
  if (timestamp - lastFrameTimestamp > 100) {
    lastFrameTimestamp = timestamp;
    frame();
  }
  animationFrameId = window.requestAnimationFrame(onAnimationFrame);
}

onMounted(() => {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

  cat.el = document.createElement("div");

  if (persistPosition) {
    const storedNeko = JSON.parse(window.localStorage.getItem("oneko") as string);
    if (storedNeko !== null) {
      cat.posX = storedNeko.nekoPosX;
      cat.posY = storedNeko.nekoPosY;
      cat.mouseX = storedNeko.mousePosX;
      cat.mouseY = storedNeko.mousePosY;
      cat.frameCount = storedNeko.frameCount;
      cat.idleTime = storedNeko.idleTime;
      cat.idleAnimation = storedNeko.idleAnimation;
      cat.idleAnimationFrame = storedNeko.idleAnimationFrame;
      cat.el.style.backgroundPosition = storedNeko.bgPos;
    }
  }

  cat.el.id = "oneko";
  cat.el.ariaHidden = "true";
  cat.el.style.width = "32px";
  cat.el.style.height = "32px";
  cat.el.style.position = "fixed";
  // needs to be "auto" so the cat can receive clicks (see onNekoClick below)
  cat.el.style.pointerEvents = "auto";
  cat.el.style.cursor = "pointer";
  cat.el.style.imageRendering = "pixelated";
  cat.el.style.zIndex = "2147483647";

  cat.el.style.backgroundImage = `url(${nekoFile})`;

  // Anchor the cat's home to the bed's rendered centre.
  syncHomeToBed();
  cat.posX = cat.homeX;
  cat.posY = cat.homeY;

  cat.mouseX = cat.posX;
  cat.mouseY = cat.posY;

  cat.el.style.left = `${cat.posX - 16}px`;
  cat.el.style.top = `${cat.posY - 16}px`;

  cat.idleTime = 0;
  resetIdleAnimation();
  setSprite("idle", 0);

  document.body.appendChild(cat.el);

  onMouseMove = function (event: MouseEvent) {
    if (cat.mouseLocked) return;
    cat.mouseX = event.clientX;
    cat.mouseY = event.clientY;
  };
  document.addEventListener("mousemove", onMouseMove);

  onNekoClick = function () {
    if (cat.state == CatStates.CAT_AT_HOME) {
      cat.state = CatStates.FREE_RANGE_CAT;
    } else if (cat.state == CatStates.FREE_RANGE_CAT) {
      // Don't teleport home — walk there. Point the (now frozen) mouse target
      // at the bed and let the movement code carry the cat over.
      cat.state = CatStates.CAT_GOING_HOME;
      cat.mouseX = cat.homeX;
      cat.mouseY = cat.homeY;
      cat.mouseLocked = true;
      cat.idleTime = 0;
      resetIdleAnimation();
    }
  };
  cat.el.addEventListener("click", onNekoClick);

  // Keep the cat's home glued to the bed as the viewport changes size.
  onResize = function () {
    syncHomeToBed();
  };
  window.addEventListener("resize", onResize);

  if (persistPosition) {
    onBeforeUnload = function () {
      window.localStorage.setItem(
        "oneko",
        JSON.stringify({
          nekoPosX: cat.posX,
          nekoPosY: cat.posY,
          mousePosX: cat.mouseX,
          mousePosY: cat.mouseY,
          frameCount: cat.frameCount,
          idleTime: cat.idleTime,
          idleAnimation: cat.idleAnimation,
          idleAnimationFrame: cat.idleAnimationFrame,
          bgPos: cat.el!.style.backgroundPosition,
        })
      );
    };
    window.addEventListener("beforeunload", onBeforeUnload);
  }

  animationFrameId = window.requestAnimationFrame(onAnimationFrame);
});

onBeforeUnmount(() => {
  if (onBeforeUnload) {
    // persist the current position before tearing down
    onBeforeUnload();
    window.removeEventListener("beforeunload", onBeforeUnload);
    onBeforeUnload = null;
  }
  if (onMouseMove) {
    document.removeEventListener("mousemove", onMouseMove);
    onMouseMove = null;
  }
  if (onResize) {
    window.removeEventListener("resize", onResize);
    onResize = null;
  }
  if (onNekoClick && cat.el) {
    cat.el.removeEventListener("click", onNekoClick);
    onNekoClick = null;
  }
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (cat.el) {
    cat.el.remove();
    cat.el = null;
  }
});
</script>

<template>
  <!-- The bed marks the middle coordinate where the cat rests. -->
  <!-- Re-anchor once the image loads: its height (and thus centre) isn't
       known until then, so the cat's resting Y would otherwise be stale. -->
  <img
    ref="bedEl"
    class="cat-bed"
    :src="bedFile"
    alt=""
    aria-hidden="true"
    @load="syncHomeToBed"
  />
</template>

<style scoped>
.cat-bed {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: auto;
  pointer-events: none;
  image-rendering: auto;
  /* just below the cat's z-index so the cat sits on top of the bed */
  z-index: 2147483646;
}
</style>
