module Turbolinks::Form

  class Railtie < Rails::Railtie
    initializer 'turbolinks-form' do
      ActiveSupport.on_load :action_view do
        include Turbolinks::Form::ViewHelper
      end

      ActiveSupport.on_load :action_controller do
        include Turbolinks::Form::Controller
      end
    end
  end

end
