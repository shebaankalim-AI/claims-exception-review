import '@testing-library/jest-dom/vitest'

// jsdom has the <dialog> element but not showModal() or close(). This stands in
// for them closely enough for the dialogs' own behaviour to be tested.
if (typeof HTMLDialogElement !== 'undefined') {
  const dialog = HTMLDialogElement.prototype
  if (!dialog.showModal) {
    dialog.showModal = function () {
      this.setAttribute('open', '')
    }
  }
  if (!dialog.close) {
    dialog.close = function () {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
}
