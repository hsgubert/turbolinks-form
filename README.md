# turbolinks-form
Turbolinks 5 extension to render form errors after a submit.

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

This will automatically include jQuery and Turbolinks if not included already.


## Basic Usage

Add `turbolinks_form: true` to your `form_for` or `form_tag`

``` erb
<%= form_for :resource, turbolinks_form: true do |f| ... %>

<%= form_tag users_path, turbolinks_form: true do ... %>
```

In your controller, just render the desired view with status `:unprocessable_entity`
 if validation fails:
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

The body of the page rendered will be substituted into the page, just like turbolinks would do for a regular visit.

## More Details

#### Script tags
Turbolinks-form will execute any `<script>` tags that the body of the response contains.

#### Events
Turbolinks-form will trigger only a subset of the (Turbolink events)[https://github.com/turbolinks/turbolinks#full-list-of-events]. Namely:

* `turbolinks:request-start` fires before Turbolinks-form submits the form. Access the XMLHttpRequest object with `event.data.xhr`.

* `turbolinks:request-end` fires after the network request completes. Access the XMLHttpRequest object with `event.data.xhr`.

* `turbolinks:before-render` fires before rendering the page. Access the new `<body>` element with `event.data.newBody`.

* `turbolinks:render` fires after Turbolinks renders the page. This event fires twice during an application visit to a cached location: once after rendering the cached version, and again after rendering the fresh version.

* `turbolinks:load` fires after the page has finished loading (after rendering and after running inline script tags).

#### Cache
Turbolinks-form ignores Turbolinks caches. It does not populate or uses cache.

## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
