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

var TurbolinksForm = function(){};

TurbolinksForm.handleResponse = function(response, renderingError) {
  // parses response
  var newDom = new DOMParser().parseFromString(response.responseText, "text/html");

  // Some browsers (PhantomJS and earlier versions of Firefox and IE) don't implement
  // parsing from string for "text/html" format. So we use an alternative method
  // described here:
  // https://developer.mozilla.org/en-US/Add-ons/Code_snippets/HTML_to_DOM#Parsing_Complete_HTML_to_DOM
  if (newDom == null) {
    newDom = document.implementation.createHTMLDocument("document");
    newDom.documentElement.innerHTML = response.responseText;
  }

  if (newDom == null) {
    console.error("turbolinks-form was not able to parse response from server.");
  }

  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:before-render', {data: {newBody: newDom.body}});

  // console.log('before-render')

  // replaces whole head if rendering an error page. Useful when handling 500 error, since applications
  // usually have a whole different set of styles for this page. This is consistent with Turbolinks.
  if (renderingError) {
    // head replacement doesn't work the same way as body replacement. We must use the replaceChild()
    // function for it to work effectively
    document.documentElement.replaceChild(newDom.head, document.head);
  }

  // Removes/saves all script tags contents.
  // Most browsers don't run the new <script> tags when we replace the page body,
  // but some do (like PhantomJS). So we clear all script tags to ensure nothing
  // will run on any browser.
  var newBodyScripts = newDom.body.getElementsByTagName('script');
  var newBodyScriptContents = [];
  for (var i=0; i<newBodyScripts.length; i++) {
    var script = newBodyScripts[i];
    newBodyScriptContents.push(script.text);
    script.text = "";
  }

  // if there is no target, replaces whole body
  var target;
  if (!response.getResponseHeader('turbolinks-form-render-target') || renderingError) {
    document.body = newDom.body;
    target = document.body;
  } else {
    target = $(response.getResponseHeader('turbolinks-form-render-target'), document.body)[0];
    while (target.firstChild) {
      target.removeChild(target.firstChild);
    }
    while (newDom.body.firstChild) {
      target.appendChild(newDom.body.removeChild(newDom.body.firstChild));
    }
  }

  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:render');

  // console.log('render')

  // Add scripts to body, so they are run on any browser
  var bodyScripts = target.getElementsByTagName('script');
  for (var i=0; i<bodyScripts.length; i++) {
    var script = bodyScripts[i];
    var newScript = document.createElement("script");
    newScript.text = newBodyScriptContents[i];
    script.parentNode.replaceChild(newScript, script);
  }

  scrollTo(0, 0);
  Turbolinks.dispatch("turbolinks:load");
}


// This code is only activated if:
//  1) HTTP status code is 422 unprocessable_entity
//  2) Response has the 'turbolinks-form-render' header
//
// PS: it is also activated on errors with code 500 or 404, so that we can know the
//     error is happening and not that the site is unresponsive
$(document).on("ajax:error", function(e, response) {
  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:request-end', {data: {xhr: response}});

  // handles form error (replaces body/target only, does not touch head)
  var isFormErrorResponse = (response.status == 422 && response.getResponseHeader('turbolinks-form-render'));
  if (isFormErrorResponse) {
    TurbolinksForm.handleResponse(response);
    return;
  }

  // replaces whole body and whole head when a true error occurs
  var isError500 = (response.status == 500)
  var isError404 = (response.status == 404)
  if (isError500 || isError404) {
    TurbolinksForm.handleResponse(response, true);
    return;
  }
});

// This code is only activated if:
//  1) HTTP status code is 200
//  2) Response has 'turbolinks-form-render' header and 'turbolinks-form-render-when-success' header
//
// This handling is useful when we dont want a redirect after a successful submit
$(document).on("ajax:success", function(e, data, status, response) {
  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:request-end', {data: {xhr: response}});

  var isFormSuccessResponse = (response.status == 200 && response.getResponseHeader('turbolinks-form-render') && response.getResponseHeader('turbolinks-form-render-when-success'));
  if (isFormSuccessResponse) {
    TurbolinksForm.handleResponse(response);
  }
});

// Sets up event delegation to forms with data-turbolinks-form attribute
$(document).on("ajax:beforeSend", "[data-turbolinks-form]", function(e, xhr, settings) {
  // adds the turbolinks-form-submit header for forms with data-turbolinks-form attribute being submitted,
  // so the controller knows it has to put the turbolinks-form-render header on the response
  xhr.setRequestHeader('turbolinks-form-submit', '1');

  // changes default Accept header to say we preferably want an HTML content as a response
  xhr.setRequestHeader('Accept', '*/*;q=0.5, text/javascript;q=0.9, application/javascript;q=0.9, application/ecmascript;q=0.9, application/x-ecmascript;q=0.9, text/html')

  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:request-start', {data: {xhr: xhr}});
});
