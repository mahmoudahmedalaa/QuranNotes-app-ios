Pod::Spec.new do |s|
  s.name           = 'WidgetBridge'
  s.version        = '1.0.0'
  s.summary        = 'Bridge between RN app and iOS widgets via shared UserDefaults'
  s.homepage       = 'https://github.com/mahmoudahmedalaa/QuranNotes-app'
  s.license        = 'MIT'
  s.author         = 'Mahmoud Ahmed Alaa'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.platform       = :ios, '15.1'
  s.swift_version  = '5.4'
  s.source_files   = '**/*.swift'
end
