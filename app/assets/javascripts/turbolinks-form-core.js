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
// The reason we don't do such things is simply that this gem is a solution to
// render errors in forms, and usually we render the same page/form we had rendered
// before the submit.

var TurbolinksForm = function(){};

// Attach an event handler function for one or more events to the selected elements.
// This method is inspired by JQuery on() and was created so that we could remove the dependency
// on JQuery.
// Ref: https://stackoverflow.com/questions/25248286/native-js-equivalent-to-jquery-delegation#answer-46595740
TurbolinksForm.on = function(eventHandlerOwner, event, delegateSelector, handler) {
  // handles call with 3 arguments
  if (!handler && delegateSelector) {
    handler = delegateSelector;
    delegateSelector = undefined;
  }

  $(eventHandlerOwner).on(event, function(e) {
    if (delegateSelector) {
      // goes up the dom tree searching for the delegate
      var currentTarget = e.target;
      while (currentTarget != null && currentTarget !== this && !currentTarget.matches(delegateSelector)) {
        currentTarget = currentTarget.parentElement;
      }

      // if delegate found, call the handler there
      if (currentTarget != null && currentTarget.matches(delegateSelector)) {
        handler.apply(currentTarget, arguments);
      }
    }
    // if there is no delegation, just call the handler directly
    else {
      handler.apply(eventHandlerOwner, arguments);
    }
  });
}

TurbolinksForm.handleResponse = function(xhr, renderingError) {
  // parses response
  var newDom = new DOMParser().parseFromString(xhr.responseText, "text/html");

  // Some browsers (PhantomJS and earlier versions of Firefox and IE) don't implement
  // parsing from string for "text/html" format. So we use an alternative method
  // described here:
  // https://developer.mozilla.org/en-US/Add-ons/Code_snippets/HTML_to_DOM#Parsing_Complete_HTML_to_DOM
  if (newDom == null) {
    newDom = document.implementation.createHTMLDocument("document");
    newDom.documentElement.innerHTML = xhr.responseText;
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
  if (!xhr.getResponseHeader('turbolinks-form-render-target') || renderingError) {
    document.body = newDom.body;
    target = document.body;
  }
  // if there is a specific target
  else {
    target = document.body.querySelector(xhr.getResponseHeader('turbolinks-form-render-target'));
    if (target) {
      // clears target contents
      while (target.firstChild) {
        target.removeChild(target.firstChild);
      }
      // fills target with new content
      while (newDom.body.firstChild) {
        target.appendChild(newDom.body.removeChild(newDom.body.firstChild));
      }
    }
    else {
      console.warn('[turbolinks-form] target not found for selector: ' + xhr.getResponseHeader('turbolinks-form-render-target'));
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
TurbolinksForm.on(document, "ajax:error", function(e, xhr) {
  // When using rails-ujs (instead of jquery-ujs) this handler receives a single event parameter
  // and other parameters must be extracted from e.detail
  // Ref: https://edgeguides.rubyonrails.org/working_with_javascript_in_rails.html#rails-ujs-event-handlers
  if (!xhr && e.detail)
    var xhr = e.detail[2];

  // Replaces whole body and whole head when a true error occurs (same behavior as turbolinks)
  // This is done even when there is no turbolinks-form-render header (this affects all AJAX requests)
  // because when an error occurrs this header is not added by the server
  var isError500 = (xhr.status == 500)
  var isError404 = (xhr.status == 404)
  if (isError500 || isError404) {
    console.info("Error Response handled by turbolinks-form");
    TurbolinksForm.handleResponse(xhr, true);
    return;
  }

  // does not intercept unrelated AJAX responses
  if (!xhr || !xhr.getResponseHeader('turbolinks-form-render'))
    return;

  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:request-end', {data: {xhr: xhr}});

  // handles form error (replaces body/target only, does not touch head)
  var isFormErrorResponse = (xhr.status == 422);
  if (isFormErrorResponse) {
    TurbolinksForm.handleResponse(xhr);
    return;
  }
});

// This code is only activated if:
//  1) HTTP status code is 200
//  2) Response has 'turbolinks-form-render' header and 'turbolinks-form-render-when-success' header
//
// This handling is useful when we dont want a redirect after a successful submit
TurbolinksForm.on(document, "ajax:success", function(e, data, status, xhr) {
  // When using rails-ujs (instead of jquery-ujs) this handler receives a single event parameter
  // and other parameters must be extracted from e.detail
  // Ref: https://edgeguides.rubyonrails.org/working_with_javascript_in_rails.html#rails-ujs-event-handlers
  if (!status && e.detail)
    var status = e.detail[1];
  if (!xhr && e.detail)
    var xhr = e.detail[2];

  // does not intercept unrelated AJAX responses
  if (!xhr || !xhr.getResponseHeader('turbolinks-form-render'))
    return;

  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:request-end', {data: {xhr: xhr}});

  var isFormSuccessResponse = (xhr.status == 200 && xhr.getResponseHeader('turbolinks-form-render-when-success'));
  if (isFormSuccessResponse) {
    TurbolinksForm.handleResponse(xhr);
  }
});

// Sets up event delegation to forms with data-turbolinks-form attribute
TurbolinksForm.on(document, "ajax:beforeSend", "[data-turbolinks-form]", function(e, xhr, options) {
  // When using rails-ujs (instead of jquery-ujs) this handler receives a single event parameter
  // and other parameters must be extracted from e.detail
  // Ref: https://edgeguides.rubyonrails.org/working_with_javascript_in_rails.html#rails-ujs-event-handlers
  if (!xhr && e.detail)
    var xhr = e.detail[0];
  if (!options && e.detail)
    var options = e.detail[1];

  // adds the turbolinks-form-submit header for forms with data-turbolinks-form attribute being submitted,
  // so the controller knows it has to put the turbolinks-form-render header on the response
  xhr.setRequestHeader('turbolinks-form-submit', '1');

  // changes default Accept header to say we preferably want an HTML content as a response
  xhr.setRequestHeader('Accept', '*/*;q=0.5, text/javascript;q=0.9, application/javascript;q=0.9, application/ecmascript;q=0.9, application/x-ecmascript;q=0.9, text/html')

  // dispatches turbolinks event
  Turbolinks.dispatch('turbolinks:request-start', {data: {xhr: xhr}});
});

// Polyfills

if (!Element.prototype.matches) {
  Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
}
