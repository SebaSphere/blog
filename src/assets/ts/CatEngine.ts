export enum CatStates {
  FREE_RANGE_CAT,
  CAT_AT_HOME,
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

export interface CatEngineOptions {
  getBedElement: () => HTMLElement | null;
  nekoFile?: string;
  bedFile?: string;
  persistPosition?: boolean;
}

export interface CatPosition {
  x: number;
  y: number;
}

export class CatEngine {
  static readonly SIZE = 32;

  private static active: CatEngine | null = null;

  private readonly getBedElement: () => HTMLElement | null;
  private readonly nekoFile: string;
  private readonly persistPosition: boolean;

  private el: HTMLDivElement | null = null;
  private speed = 10;
  private state: CatStates = CatStates.CAT_AT_HOME;
  private posX = 32;
  private posY = 32;
  private homeX = 32;
  private homeY = 32;
  private mouseX = 0;
  private mouseY = 0;
  private mouseLocked = false;
  private usingTouch = false;
  private frameCount = 0;
  private idleTime = 0;
  private idleAnimation: string | null = null;
  private idleAnimationFrame = 0;

  private onMouseMove: ((event: MouseEvent) => void) | null = null;
  private onTouchMove: ((event: TouchEvent) => void) | null = null;
  private onNekoClick: (() => void) | null = null;
  private onBeforeUnload: (() => void) | null = null;
  private onResize: (() => void) | null = null;
  private animationFrameId: number | null = null;
  private lastFrameTimestamp: number | undefined;

  constructor(options: CatEngineOptions) {
    this.getBedElement = options.getBedElement;
    this.nekoFile = options.nekoFile ?? "/images/oneko.gif";
    this.persistPosition = options.persistPosition ?? false;
  }

  getPosition(): CatPosition {
    return { x: this.posX, y: this.posY };
  }

  getState(): CatStates {
    return this.state;
  }

  getBounds(): DOMRect {
    const half = CatEngine.SIZE / 2;
    return new DOMRect(
      this.posX - half,
      this.posY - half,
      CatEngine.SIZE,
      CatEngine.SIZE
    );
  }

  isOver(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      this.posX >= rect.left &&
      this.posX <= rect.right &&
      this.posY >= rect.top &&
      this.posY <= rect.bottom
    );
  }

  static get current(): CatEngine | null {
    return CatEngine.active;
  }

  static isActive(): boolean {
    return CatEngine.active !== null;
  }

  static getPosition(): CatPosition | null {
    return CatEngine.active?.getPosition() ?? null;
  }

  static getState(): CatStates | null {
    return CatEngine.active?.getState() ?? null;
  }

  static getBounds(): DOMRect | null {
    return CatEngine.active?.getBounds() ?? null;
  }

  static isOver(element: Element | null): boolean {
    if (!element || !CatEngine.active) return false;
    return CatEngine.active.isOver(element);
  }

  syncHomeToBed() {
    const bed = this.getBedElement();
    if (!bed) return;
    const rect = bed.getBoundingClientRect();
    this.homeX = rect.left + rect.width / 2;
    this.homeY = rect.top + rect.height / 2 - 20;
    if (this.state === CatStates.CAT_AT_HOME) {
      this.posX = this.homeX;
      this.posY = this.homeY;
      if (this.el) {
        this.el.style.left = `${this.posX - 16}px`;
        this.el.style.top = `${this.posY - 16}px`;
      }
    }
  }

  private setSprite(name: string, frame: number) {
    const set = spriteSets[name]!;
    const sprite = set[frame % set.length]!;
    this.el!.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  private resetIdleAnimation() {
    this.idleAnimation = null;
    this.idleAnimationFrame = 0;
  }

  private idle() {
    this.idleTime += 1;

    if (
      this.idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      this.idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (this.posX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (this.posY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (this.posX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (this.posY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      this.idleAnimation =
        avalibleIdleAnimations[
          Math.floor(Math.random() * avalibleIdleAnimations.length)
        ]!;
    }

    switch (this.idleAnimation) {
      case "sleeping":
        if (this.idleAnimationFrame < 8) {
          this.setSprite("tired", 0);
          break;
        }
        this.setSprite("sleeping", Math.floor(this.idleAnimationFrame / 4));
        if (this.idleAnimationFrame > 192) {
          this.resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        this.setSprite(this.idleAnimation, this.idleAnimationFrame);
        if (this.idleAnimationFrame > 9) {
          this.resetIdleAnimation();
        }
        break;
      default:
        this.setSprite("idle", 0);
        return;
    }
    this.idleAnimationFrame += 1;
  }

  private frame() {
    this.frameCount += 1;
    const diffX = this.posX - this.mouseX;
    const diffY = this.posY - this.mouseY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (this.state == CatStates.CAT_AT_HOME) {
      if (distance <= 50) {
        this.idleTime = 0;
        this.resetIdleAnimation();
        this.setSprite("alert", 0);
        const bounce = Math.abs(Math.sin(this.frameCount / 1.2)) * 8;
        this.el!.style.left = `${this.posX - 16}px`;
        this.el!.style.top = `${this.posY - 16 - bounce}px`;
      } else {
        this.idleTime += 1;
        this.el!.style.left = `${this.posX - 16}px`;
        this.el!.style.top = `${this.posY - 16}px`;
        if (this.idleTime > 100) {
          if (this.idleAnimationFrame < 8) {
            this.setSprite("tired", 0);
          } else {
            this.setSprite("sleeping", Math.floor(this.idleAnimationFrame / 4));
          }
          this.idleAnimationFrame += 1;
        } else {
          this.setSprite("idle", 0);
        }
      }
      return;
    }

    if (this.state == CatStates.CAT_GOING_HOME) {
      if (distance < this.speed) {
        this.state = CatStates.CAT_AT_HOME;
        this.posX = this.homeX;
        this.posY = this.homeY;
        this.mouseLocked = false;
        this.idleTime = 0;
        this.resetIdleAnimation();
        this.setSprite("idle", 0);
        this.el!.style.left = `${this.posX - 16}px`;
        this.el!.style.top = `${this.posY - 16}px`;
        return;
      }
    } else {
      const followGap = this.usingTouch ? this.speed : 48;
      if (distance < this.speed || distance < followGap) {
        this.idle();
        return;
      }
    }

    this.idleAnimation = null;
    this.idleAnimationFrame = 0;

    if (this.state != CatStates.CAT_GOING_HOME && this.idleTime > 1) {
      this.setSprite("alert", 0);
      this.idleTime = Math.min(this.idleTime, 7);
      this.idleTime -= 1;
      return;
    }

    let direction: string;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    this.setSprite(direction, this.frameCount);

    this.posX -= (diffX / distance) * this.speed;
    this.posY -= (diffY / distance) * this.speed;

    this.posX = Math.min(Math.max(16, this.posX), window.innerWidth - 16);
    this.posY = Math.min(Math.max(16, this.posY), window.innerHeight - 16);

    this.el!.style.left = `${this.posX - 16}px`;
    this.el!.style.top = `${this.posY - 16}px`;
  }

  private onAnimationFrame = (timestamp: number) => {
    if (!this.el || !this.el.isConnected) {
      return;
    }
    if (!this.lastFrameTimestamp) {
      this.lastFrameTimestamp = timestamp;
    }
    if (timestamp - this.lastFrameTimestamp > 100) {
      this.lastFrameTimestamp = timestamp;
      this.frame();
    }
    this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
  };

  start(): boolean {
    const isReducedMotion =
      window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

    if (isReducedMotion) return false;

    CatEngine.active = this;

    this.el = document.createElement("div");

    if (this.persistPosition) {
      const storedNeko = JSON.parse(
        window.localStorage.getItem("oneko") as string
      );
      if (storedNeko !== null) {
        this.posX = storedNeko.nekoPosX;
        this.posY = storedNeko.nekoPosY;
        this.mouseX = storedNeko.mousePosX;
        this.mouseY = storedNeko.mousePosY;
        this.frameCount = storedNeko.frameCount;
        this.idleTime = storedNeko.idleTime;
        this.idleAnimation = storedNeko.idleAnimation;
        this.idleAnimationFrame = storedNeko.idleAnimationFrame;
        this.el.style.backgroundPosition = storedNeko.bgPos;
      }
    }

    this.el.id = "oneko";
    this.el.ariaHidden = "true";
    this.el.style.width = "32px";
    this.el.style.height = "32px";
    this.el.style.position = "fixed";
    this.el.style.pointerEvents = "auto";
    this.el.style.cursor = "pointer";
    this.el.style.imageRendering = "pixelated";
    this.el.style.zIndex = "2147483647";

    this.el.style.backgroundImage = `url(${this.nekoFile})`;

    this.syncHomeToBed();
    this.posX = this.homeX;
    this.posY = this.homeY;

    this.mouseX = this.posX;
    this.mouseY = this.posY;

    this.el.style.left = `${this.posX - 16}px`;
    this.el.style.top = `${this.posY - 16}px`;

    this.idleTime = 0;
    this.resetIdleAnimation();
    this.setSprite("idle", 0);

    document.body.appendChild(this.el);

    this.onMouseMove = (event: MouseEvent) => {
      if (this.mouseLocked) return;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    };
    document.addEventListener("mousemove", this.onMouseMove);

    this.onTouchMove = (event: TouchEvent) => {
      if (this.mouseLocked) return;
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return;
      this.usingTouch = true;
      this.mouseX = touch.clientX;
      this.mouseY = touch.clientY;
    };
    document.addEventListener("touchstart", this.onTouchMove, { passive: true });
    document.addEventListener("touchmove", this.onTouchMove, { passive: true });

    this.onNekoClick = () => {
      if (this.state == CatStates.CAT_AT_HOME) {
        this.state = CatStates.FREE_RANGE_CAT;
      } else if (this.state == CatStates.FREE_RANGE_CAT) {
        this.state = CatStates.CAT_GOING_HOME;
        this.mouseX = this.homeX;
        this.mouseY = this.homeY;
        this.mouseLocked = true;
        this.idleTime = 0;
        this.resetIdleAnimation();
      }
    };
    this.el.addEventListener("click", this.onNekoClick);

    this.onResize = () => {
      this.syncHomeToBed();
    };
    window.addEventListener("resize", this.onResize);

    if (this.persistPosition) {
      this.onBeforeUnload = () => {
        window.localStorage.setItem(
          "oneko",
          JSON.stringify({
            nekoPosX: this.posX,
            nekoPosY: this.posY,
            mousePosX: this.mouseX,
            mousePosY: this.mouseY,
            frameCount: this.frameCount,
            idleTime: this.idleTime,
            idleAnimation: this.idleAnimation,
            idleAnimationFrame: this.idleAnimationFrame,
            bgPos: this.el!.style.backgroundPosition,
          })
        );
      };
      window.addEventListener("beforeunload", this.onBeforeUnload);
    }

    this.animationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
    return true;
  }

  stop() {
    if (CatEngine.active === this) {
      CatEngine.active = null;
    }
    if (this.onBeforeUnload) {
      this.onBeforeUnload();
      window.removeEventListener("beforeunload", this.onBeforeUnload);
      this.onBeforeUnload = null;
    }
    if (this.onMouseMove) {
      document.removeEventListener("mousemove", this.onMouseMove);
      this.onMouseMove = null;
    }
    if (this.onTouchMove) {
      document.removeEventListener("touchstart", this.onTouchMove);
      document.removeEventListener("touchmove", this.onTouchMove);
      this.onTouchMove = null;
    }
    if (this.onResize) {
      window.removeEventListener("resize", this.onResize);
      this.onResize = null;
    }
    if (this.onNekoClick && this.el) {
      this.el.removeEventListener("click", this.onNekoClick);
      this.onNekoClick = null;
    }
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }
}
