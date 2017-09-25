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


## Usage

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
