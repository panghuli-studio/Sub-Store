import type { Directive } from "vue";
const handlers = new WeakMap<HTMLElement, (event: KeyboardEvent) => void>();
function sync(element: HTMLElement) {
  const disabled =
    element.classList.contains("nut-button--disabled") ||
    element.getAttribute("disabled") !== null;
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", disabled ? "-1" : "0");
  element.setAttribute("aria-disabled", String(disabled));
}
// NutUI 3 renders Button as a nonsemantic view; adapt it without changing its event or disabled logic.
export const actionKeyboard: Directive<HTMLElement> = {
  mounted(element) {
    sync(element);
    const keydown = (event: KeyboardEvent) => {
      if (
        (event.key === "Enter" || event.key === " ") &&
        element.getAttribute("aria-disabled") !== "true"
      ) {
        event.preventDefault();
        element.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      }
    };
    handlers.set(element, keydown);
    element.addEventListener("keydown", keydown);
  },
  updated: sync,
  unmounted(element) {
    const handler = handlers.get(element);
    if (handler) element.removeEventListener("keydown", handler);
    handlers.delete(element);
  },
};

export const editorTabsKeyboard: Directive<HTMLElement> = {
  mounted(element) {
    const keydown = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      const tabs = Array.from(
        element.querySelectorAll<HTMLElement>('[role="tab"]'),
      );
      const current = tabs.indexOf(event.target as HTMLElement);
      if (current < 0) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      tabs[next].click();
      tabs[next].focus();
    };
    handlers.set(element, keydown);
    element.addEventListener("keydown", keydown);
  },
  unmounted(element) {
    const handler = handlers.get(element);
    if (handler) element.removeEventListener("keydown", handler);
    handlers.delete(element);
  },
};
