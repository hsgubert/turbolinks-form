# turbolinks-form

[![Gem Version](https://badge.fury.io/rb/turbolinks-form.svg)](https://badge.fury.io/rb/turbolinks-form)

Turbolinks 5 extension to render form errors after a submit.

## Requirements

* Rails >= 4.3 (tested with 4.3, 5.0 and 5.1)
* [Turbolinks 5](https://github.com/turbolinks/turbolinks)
* Either [rails-ujs](https://github.com/rails/rails-ujs) (included in Rails 5.1) or [jquery-ujs](https://github.com/rails/jquery-ujs)

## Installation

Add the gem to your `Gemfile`

``` ruby
gem 'turbolinks-form'
```

Then `bundle install`.

Add the javascript to your `application.js` or to your `vendor.js`

``` javascript
//= require turbolinks-form
```

This will automatically include Turbolinks if not included already.

You must have included either rails-ujs or jquery-ujs in your assets. This gem does not include any of them as to let you choose your preference.
``` javascript
//= require jquery_ujs
```
``` javascript
//= require rails-ujs
```

## Basic Usage

Add `turbolinks_form: true` to your `form_for` or `form_tag`

``` erb
<%= form_for :resource, turbolinks_form: true do |f| ... %>

<%= form_tag users_path, turbolinks_form: true do ... %>
```

In your controller, just render the desired view with status `:unprocessable_entity`
 when validation fails:
``` ruby
def create
  @user = User.build(params[:user])
  if @user.save
    redirect_to users_path  # This redirect_to is handled by turbolinks alone
  else
    render :new, status: :unprocessable_entity  # This render is handled by turbolinks-form
  end
end
```

The body of the rendered page will replace the current body, just like turbolinks would do for a regular visit.

If you prefer, you can use a convenience method `render_form_with_errors` that will automatically render the `new` page on `create` actions and the `edit` page on `update` actions
``` ruby
def create
  @user = User.build(params[:user])
  if @user.save
    redirect_to users_path  # This redirect_to is handled by turbolinks alone
  else
    render_form_with_errors  # This render is handled by turbolinks-form
  end
end
```

## Advanced Usage

#### Rendering custom view
You can pass the template name as the parameter to `render_form_with_errors` to choose any view you would like to render:
``` ruby
render_form_with_errors template: 'custom_view'
```

#### Rendering form with errors inside dialog
Sometimes we do not wish to replace the whole page body with the form with error, but rather just replace the content of a dialog or page fragment. You can pass the dialog CSS selector to choose where your form will be rendered:
``` ruby
render_form_with_errors target: 'div.dialog'
```
The command above will replace the whole content of `div.dialog` with the body of your rendered page. When using this option your page is rendered without layout.

## More Details

#### Script tags
Turbolinks-form will execute any `<script>` tags that the body of the response contains.

#### Cache
Turbolinks-form ignores Turbolinks caches. It does not populate or uses cache.

#### Events
Turbolinks-form will trigger only a subset of the [Turbolink events](https://github.com/turbolinks/turbolinks#full-list-of-events). Namely:

* `turbolinks:request-start` fires before Turbolinks-form submits the form. Access the XMLHttpRequest object with `event.data.xhr`.

* `turbolinks:request-end` fires after the network request completes. Access the XMLHttpRequest object with `event.data.xhr`.

* `turbolinks:before-render` fires before rendering the page. Access the new `<body>` element with `event.data.newBody`.

* `turbolinks:render` fires after Turbolinks renders the page. This event fires twice during an application visit to a cached location: once after rendering the cached version, and again after rendering the fresh version.

* `turbolinks:load` fires after the page has finished loading (after rendering and after running inline script tags).

#### Graceful Degradation
When the request is not `xhr`, `turbolinks-form` degrades gracefully to regular rendering (with full page load).

#### Browser History
Turbolinks-form ignores browser history. It does not push any new state nor replaces the last state.

#### Error Handling
When your server responds with an error 500 or 404, turbolinks-form replaces the whole page (head
and body). The reason we do this is that applications usually have a whole different set of styles
for error pages and probably need the head of the page to be replaced as well as the body. This
behavior is consistent with Turbolinks.

## License
The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
