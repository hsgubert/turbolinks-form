module Turbolinks::Form
  module ViewHelper
    extend ActiveSupport::Concern

    def form_for(record_or_name_or_array, *args, &proc)
      options = args.extract_options!

      # makes submit a xhr request that accepts html as response
      if options.keys.include?(:turbolinks_form) && options[:turbolinks_form]
        options[:remote] = true
        options[:data] ||= {}
        options[:data][:turbolinks_form] = true
      end

      super(record_or_name_or_array, *(args << options), &proc)
    end

    def form_tag(record_or_name_or_array, *args, &proc)
      options = args.extract_options!

      # makes submit a xhr request that accepts html as response
      if options.keys.include?(:turbolinks_form) && options[:turbolinks_form]
        options[:remote] = true
        options[:data] ||= {}
        options[:data][:turbolinks_form] = true
      end

      super(record_or_name_or_array, *(args << options), &proc)
    end

  end
end
