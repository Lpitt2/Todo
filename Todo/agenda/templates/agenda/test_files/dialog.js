document.addEventListener("DOMContentLoaded", () => {

  // Open dialog button on-click event.
  document.querySelectorAll(".open-dialog-button").forEach(btn => btn.addEventListener("click", () => {

    // Get the target element.
    const target = document.getElementById(btn.dataset['target']);

    // Open the dialog.
    target.showModal();

  }));

});