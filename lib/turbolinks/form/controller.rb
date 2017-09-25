module Turbolinks::Form
  module Controller
    extend ActiveSupport::Concern

    included do
      # send :rescue_from, Exception, with: :turbolinks_form_error_handler

      before_filter :set_turbolinks_form_header
    end

    private

    def set_turbolinks_form_header
      if turbolinks_form_request?
        # response.set_header("turbolinks-form-render", '1')
        response.headers['turbolinks-form-render'] = '1'
      end
    end

    def turbolinks_form_request?
      (request.post? || request.put? || request.patch?) && request.xhr? && request.headers['turbolinks-form-submit']
    end

    # def turbolinks_form_error_handler(error)
    #   if turbolinks_form_request?
    #     # response.set_header("turbolinks-form-render", '1')
    #     response.headers['turbolinks-form-render'] = '1'
    #   end
    #   raise error
    # end
  end
end
