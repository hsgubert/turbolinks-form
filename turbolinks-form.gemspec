# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'turbolinks/form/version'

Gem::Specification.new do |spec|
  spec.name          = "turbolinks-form"
  spec.version       = Turbolinks::Form::VERSION
  spec.authors       = ["Henrique Gubert"]
  spec.email         = ["guberthenrique@hotmail.com"]

  spec.description   = %q{Turbolinks 5 extension to render form errors after a submit}
  spec.summary       = %q{Turbolinks-form extends Turbolinks 5 to allow a controller
    to render any view after a form submit, and this view's body will replace the
    current body, just like a regular Turbolinks visit. This makes it easy to render
    form errors or to highlight invalid fields.}
  spec.homepage      = "https://github.com/hsgubert/turbolinks-form"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").reject { |f| f.match(%r{^(test|spec|features)/}) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_runtime_dependency 'rails', '>= 4.2'
  spec.add_runtime_dependency 'turbolinks', '~> 5.0'

  spec.add_development_dependency 'bundler', '~> 1.15'
  spec.add_development_dependency 'rake', '~> 12.0'
  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency "byebug", '~> 9'
end
