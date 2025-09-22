document.addEventListener("DOMContentLoaded", () => {

  // Set up the pages of each tab panel.
  document.querySelectorAll(".tab-panel").forEach(panel => {

    // Disable all pages for the current panel.
    panel.querySelectorAll(".tab-page").forEach(page => page.style.opacity = 0);     

  });

  // Set up the page selector buttons.
  document.querySelectorAll(".tab-selector-bar").forEach(bar => {

    // Add the button events for each selector.
    bar.querySelectorAll(".tab-selector").forEach((selector) => {

      // Add the click event to the selector.
      selector.addEventListener("click", handle_tab_selector_pressed);

      

      // Determine if the current selector is the default selector.
      if (selector.dataset['default'] == "true") {
        document.getElementById(selector.dataset['page']).style.opacity = 1;
        selector.dataset['toggle'] = "true";
      }

    });

  });

});



// Handle the click event for tab selectors.
function handle_tab_selector_pressed(event) {

  // Get the associated elements.
  const bar = event.target.parentNode;
  const group = document.getElementById(bar.dataset['group']);

  // Disable each page in the group.
  group.querySelectorAll(".tab-page").forEach(page => {
    
    // Style pages accordingly.
    if (page.id == event.target.dataset['page'])
      page.style.opacity = 1;
    else
      page.style.opacity = 0;

  });

  // Untoggle each button in the group except the present button.
  bar.querySelectorAll(".tab-selector").forEach(button => button.dataset['toggle'] = "false");

  // Set the current button.
  event.target.dataset['toggle'] = "true";

}