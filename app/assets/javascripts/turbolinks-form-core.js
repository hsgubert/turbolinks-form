
// As documented on the reference below, turbolinks 5 does not treat a render
// after a form submit by default, leaving the users to implement their own
// solutions.
//
// https://github.com/turbolinks/turbolinks/issues/85#issuecomment-323446272
//
// The code below imitates the behavior of turbolinks when treating regular GET
// responses. Namely, it:
//   - Replaces only the body of the page
//   - It runs all script tags on the body of the new page
//   - It fires the turbolinks:load event
//
// This doesn't mean it does ALL what turbolinks does. For example, we don't
// merge script tags from old and new page <head> elements.
// This also doesn't change the browser history or does any change to the URL.
// The reason we don't do such things is simply that this is a solution to
// render errors in forms, and usually we render the same page/form rendered
// before the submit.
//
// This code is only activated if:
//  1) HTTP status code is 422 unprocessable_entity
//  2) Response has the 'turbolinks-form-render' header
//
// PS: it is also activated on errors with code 500, so that we can know the
//     error is happening and not that the site is unresponsive
$(function() {
  $(document).on("ajax:error", function(e, response) {
    // dispatches turbolinks event
    Turbolinks.dispatch('turbolinks:request-end', {data: {xhr: response}});

    var isError500 = (response.status == 500)
    var isFormErrorResponse = (response.status == 422 && response.getResponseHeader('turbolinks-form-render'));
    if (!isError500 && !isFormErrorResponse) { return; }

    // parses response
    var newDom = new DOMParser().parseFromString(response.responseText, "text/html");

    // dispatches turbolinks event
    Turbolinks.dispatch('turbolinks:before-render', {data: {newBody: newDom.body}});

    document.body = newDom.body;

    // dispatches turbolinks event
    Turbolinks.dispatch('turbolinks:render');

    // get all script tags, and replace them by a new version with the same
    // content. This makes them run.
    var bodyScriptTags = document.body.getElementsByTagName('script');
    for (var i=0; i<bodyScriptTags.length; i++) {
      var newScript = document.createElement("script");
      var oldScript = bodyScriptTags[i];
      newScript.text = oldScript.text;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    }

    Turbolinks.dispatch("turbolinks:load");
    scrollTo(0, 0);
  });

  // setups event delegation to forms with data-turbolinks-form attribute
  $(document).on("ajax:beforeSend", "[data-turbolinks-form]", function(e, xhr, settings) {
    // adds the turbolinks-form-submit header for forms with data-turbolinks-form attribute being submitted,
    // so the controller knows it has to put the turbolinks-form-render header on the response
    xhr.setRequestHeader('turbolinks-form-submit', '1');

    // dispatches turbolinks event
    Turbolinks.dispatch('turbolinks:request-start', {data: {xhr: xhr}});
  });

});
