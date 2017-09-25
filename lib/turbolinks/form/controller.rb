module Turbolinks::Form
  module Controller
    extend ActiveSupport::Concern

    included do
      send :rescue_from, Exception, with: :turboboost_form_error_handler
    end

    def turboboost_form_error_handler(error)
      if turbolinks_form_request?
        response.headers['turbolinks-form-render'] = '1'
      end
      raise error
    end

    def render(*args, &block)
      if turbolinks_form_request?
        response.headers['turbolinks-form-render'] = '1'
      end
      super
    end

    def turbolinks_form_request?
      (request.post? || request.put? || request.patch?) && request.xhr? && request.headers['turbolinks-form-submit']
    end
  end
end
