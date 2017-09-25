require 'turbolinks/form/version'
require 'turbolinks/form/view_helper'
require 'turbolinks/form/controller'

# includes the Rails engine, that automatically includes the assets on the app
require "turbolinks/form/engine"

# includes the Railtie, that loads the ViewHelper and controller methods
require 'turbolinks/form/railtie' if defined?(Rails::Railtie)

module Turbolinks
  module Form

  end
end
