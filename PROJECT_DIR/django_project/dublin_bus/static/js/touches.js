
window.requestAnimFrame = (function() {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

// ^ Check for pointer events support...

var pointerDownName = "pointerdown";
var pointerUpName = "pointerup";
var pointerMoveName = "pointermove";

if (window.navigator.msPointerEnabled) {
  pointerDownName = "MSPointerDown";
  pointerUpName = "MSPointerUp";
  pointerMoveName = "MSPointerMove";
}

// Simple way to check if some form of pointerevents is enabled or not
window.PointerEventsSupport = false;
if (window.PointerEvent || window.navigator.msPointerEnabled) {
  window.PointerEventsSupport = true;
}

class Swiper {
  constructor(element, position, otherSwiper) {
    this.element = element;
    this.position = position;
    this.otherSwiper = otherSwiper;

    this.IN_STATE = 1;
    this.OUT_STATE = 2;
    this.differenceInY = 0;
    this.rafPending = false;
    //   * where the touch happens
    this.initialTouchPos = null;
    // * where the last touch happened
    this.lastTouchPos = null;
    this.open = true;
    this.scrollThreshold;
    this.itemHeight = element.offsetHeight;

    if (this.position === "top") {
      this.inTransformVal = -(element.offsetHeight * 0.8);
      this.outTransformVal = -(element.offsetHeight * 0.08);
      this.OTHER_ONE_inTransformVal = element.offsetHeight * 0.8;
      this.OTHER_ONE_outTransformVal = element.offsetHeight * 0.08;
    } else {
      this.inTransformVal = element.offsetHeight * 0.8;
      this.outTransformVal = element.offsetHeight * 0.08;
      this.OTHER_ONE_inTransformVal = -(element.offsetHeight * 0.8);
      this.OTHER_ONE_outTransformVal = -(element.offsetHeight * 0.08);
    }

    if (this.position == "top") {
      this.inputs = document.querySelectorAll(".drawer__jp__input");
    }

    this.startTransform = this.inTransformVal;

    //   * where the bottom of the div is currently located
    // * the transform value is -(500 - currentYPosition)

    this.currentState = this.IN_STATE;

    // Perform client width here as this can be expensive and doens't
    // change until window.onresize

    // *   the height of the div
    this.slopValue = this.itemHeight * (1 / 4);

    this.handleGestureStart = this.handleGestureStart.bind(this);
    this.handleGestureMove = this.handleGestureMove.bind(this);
    this.handleGestureEnd = this.handleGestureEnd.bind(this);
    this.updateSwipeRestPosition = this.updateSwipeRestPosition.bind(this);
    this.changeState = this.changeState.bind(this);
    this.getGesturePointFromEvent = this.getGesturePointFromEvent.bind(this);
    this.addListeners = this.addListeners.bind(this);
    this.onAnimFrame = this.onAnimFrame.bind(this);
    this.addListeners();

    // if (this.position =="bottom"){
    //     this.changeState(this.OUT_STATE);
    // }
  }

  handleGestureStart(evt) {
    // evt.preventDefault()
    if (this.otherSwiper.currentState !== this.otherSwiper.IN_STATE) {
      this.otherSwiper.changeState(this.otherSwiper.IN_STATE);
    }

    if (evt.touches && evt.touches.length > 1) {
      return;
    }

    // Add the move and end listeners
    if (window.PointerEvent) {
      evt.target.setPointerCapture(evt.pointerId);
    } else {
      // Add Mouse Listeners
      document.addEventListener("mousemove", this.handleGestureMove, true);
      document.addEventListener("mouseup", this.handleGestureEnd, true);
    }

    this.initialTouchPos = this.getGesturePointFromEvent(evt);
    this.element.style.transition = "initial";
  }

  handleGestureMove(evt) {
    evt.preventDefault();

    if (!this.initialTouchPos) {
      return;
    }

    this.lastTouchPos = this.getGesturePointFromEvent(evt);

    if (this.rafPending) {
      return;
    }

    this.rafPending = true;

    window.requestAnimFrame(this.onAnimFrame);
  }

  handleGestureEnd(evt) {
    if (evt.touches && evt.touches.length > 0) {
      return;
    }

    this.rafPending = false;

    // Remove Event Listeners
    if (window.PointerEvent) {
      evt.target.releasePointerCapture(evt.pointerId);
    } else {
      // Remove Mouse Listeners
      document.removeEventListener("mousemove", this.handleGestureMove, true);
      document.removeEventListener("mouseup", this.handleGestureEnd, true);
    }

    this.updateSwipeRestPosition();

    this.initialTouchPos = null;
  }

  updateSwipeRestPosition() {
    let differenceInY = this.initialTouchPos.y - this.lastTouchPos.y;
    let currentTransform = this.startTransform - differenceInY;
    let newState = this.currentState;

    if (Math.abs(differenceInY) > this.slopValue) {
      if (this.currentState === this.IN_STATE) {
        if (this.position === "top") {
          if (differenceInY > 0) {
            newState = this.IN_STATE;
          } else {
            newState = this.OUT_STATE;
          }
        } else {
          if (differenceInY < 0) {
            newState = this.IN_STATE;
          } else {
            newState = this.OUT_STATE;
          }
        }
      } else {
        if (this.position === "top") {
          if (this.currentState === this.OUT_STATE && differenceInY > 0) {
            newState = this.IN_STATE;
          } else if (
            this.currentState === this.OUT_STATE &&
            differenceInY < 0
          ) {
            newState = this.OUT_STATE;
          }
        } else {
          if (this.currentState === this.OUT_STATE && differenceInY < 0) {
            newState = this.IN_STATE;
          } else if (
            this.currentState === this.OUT_STATE &&
            differenceInY > 0
          ) {
            newState = this.OUT_STATE;
          }
        }
      }
    } else {
      newState = this.currentState;
    }

    this.element.style.transition = "all 150ms ease-out";
    this.changeState(newState);
  }

  changeState(newState) {
    let transformStyle;
    switch (newState) {
      case this.IN_STATE:
        this.startTransform = this.inTransformVal;
        if (this.position === "top") {
          this.inputs.forEach(input => {
            input.style.opacity = 0;
          });
        }
        break;
      case this.OUT_STATE:
        this.startTransform = this.outTransformVal;
        if (this.position === "top") {
          this.inputs.forEach(input => {
            input.style.opacity = 1;
          });
        }
        break;
    }

    this.transformStyle =
      "translateY(" + this.startTransform + "px) translateX(-50%)";

    this.element.style.msTransform = this.transformStyle;
    this.element.style.MozTransform = this.transformStyle;
    this.element.style.webkitTransform = this.transformStyle;
    this.element.style.transform = this.transformStyle;

    this.currentState = newState;

    if (this.position === "top" && this.currentState === this.OUT_STATE) {
      Swiper.underline.classList.add("open");
    } else {
      Swiper.underline.classList.remove("open");
    }
  }

  getGesturePointFromEvent(evt) {
    var point = {};

    if (evt.targetTouches) {
      point.x = evt.targetTouches[0].clientX;
      point.y = evt.targetTouches[0].clientY;
    } else {
      // Either Mouse event or Pointer Event
      point.x = evt.clientX;
      point.y = evt.clientY;
    }

    return point;
  }

  onAnimFrame() {
    if (!this.rafPending) {
      return;
    }

    let differenceInY = this.initialTouchPos.y - this.lastTouchPos.y;

    let newYTransform = this.startTransform - differenceInY;
    let transformStyle;

    if (this.position === "top") {
      if (newYTransform < -5) {
        transformStyle = `translateY(${newYTransform}px) translateX(-50%)`;
        if (this.currentState === this.OUT_STATE) {
          this.inputs.forEach(input => {
            input.style.opacity = 1 - differenceInY / 100;
          });
        }
      }
    } else {
      if (newYTransform > 5) {
        transformStyle = `translateY(${newYTransform}px) translateX(-50%)`;
      }
    }

    this.element.style.webkitTransform = transformStyle;
    this.element.style.MozTransform = transformStyle;
    this.element.style.msTransform = transformStyle;
    this.element.style.webkitTransform = transformStyle;
    this.element.style.transform = transformStyle;

    this.rafPending = false;
  }

  addListeners() {
    if (window.PointerEvent) {
      // Add Pointer Event Listener
      this.element.addEventListener(
        "pointerdown",
        this.handleGestureStart,
        false
      );
      this.element.addEventListener(
        "pointermove",
        this.handleGestureMove,
        false
      );
      this.element.addEventListener("pointerup", this.handleGestureEnd, false);
      this.element.addEventListener(
        "pointercancel",
        this.handleGestureEnd,
        false
      );
    } else {
      // Add Touch Listener
      this.element.addEventListener(
        "touchstart",
        this.handleGestureStart,
        false
      );
      this.element.addEventListener("touchmove", this.handleGestureMove, false);
      this.element.addEventListener("touchend", this.handleGestureEnd, false);
      this.element.addEventListener(
        "touchcancel",
        this.handleGestureEnd,
        false
      );

      // Add Mouse Listener
      this.element.addEventListener(
        "mousedown",
        this.handleGestureStart,
        false
      );
    }
  }
}

window.addEventListener("load", function() {
  setTimeout(() => {
    var h = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );

    const main = document.querySelector(".main");

    window.onresize = function() {
      main.setAttribute("style", `height:${h}px`);
    };

    Swiper.underline = document.querySelector(".jp__header__underline");

    window.onresize();

    const topDrawer = document.querySelector(".drawer__container--top");
    const bottomDrawer = document.querySelector(".drawer__container--bottom");

    const wrapper = document.querySelector(".drawer__jp__wrapper");

    const bottomSwiper = new Swiper(bottomDrawer, "bottom", null);
    const topSwiper = new Swiper(topDrawer, "top", bottomSwiper);
    bottomSwiper.otherSwiper = topSwiper;

    const drawers = [bottomSwiper, topSwiper];

    const end = document.querySelector(".route_end");

    end.addEventListener("click", e => {
      e.preventDefault();
    });

    const map = document.querySelector(".map__container");
    const searchInput = document.querySelector(".drawer__search__input");

    

    

  }, 500);
});