module Turbolinks::Form
  module Controller
    extend ActiveSupport::Concern

    included do
      if respond_to?(:before_action)
        before_action :set_turbolinks_form_header
      else
        before_filter :set_turbolinks_form_header
      end  
    end

    # convenience method
    def render_errors(view_name=nil)
      render_form_with_errors template: view_name
    end

    # Method used to render form with errors after a submit. It will automatically
    # render the 'new' template for the 'create' action and the 'edit' template
    # for the 'update' action.
    #
    # Options:
    #   :template => specify a template other than 'new'/'edit'
    #   :target => specify a css selector where the body of the rendered page should
    #              be subtituted to. When this option is used the rendering occurs
    #              without layout.
    #
    def render_form_with_errors(options={})
      render_options = prepare_render_options(options)
      render_options[:status] = :unprocessable_entity
      render render_options
    end

    # Render some view after a form submit success (to be used instead of a
    # redirect).
    #
    # Options:
    #   :template => specify a template other than 'new'/'edit'
    #   :target => specify a css selector where the body of the rendered page should
    #              be subtituted to. When this option is used the rendering occurs
    #              without layout.
    #
    def render_view_with_success(options={})
      render_options = prepare_render_options(options)
      render_options[:status] = 200

      # this header is required to prevent turbolinks-form to render any response
      # received when successfull (we don't want to render the content of a redirect,
      # for example)
      response.headers['turbolinks-form-render-when-success'] = '1'

      render render_options
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

    def prepare_render_options(options)
      render_options = {}

      if !options[:template]
        case action_name
        when 'create' then render_options[:action] = 'new'
        when 'update' then render_options[:action] = 'edit'
        end
      else
        render_options[:action] = options[:template]
      end

      if options[:target] && request.xhr?
        render_options[:layout] = false
        response.headers['turbolinks-form-render-target'] = options[:target]
      end

      render_options
    end
  end
end
