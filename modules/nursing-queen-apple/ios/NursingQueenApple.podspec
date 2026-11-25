Pod::Spec.new do |s|
  s.name = 'NursingQueenApple'
  s.version = '1.0.0'
  s.summary = 'Nursing Queen phone, widget and watch session coordination'
  s.description = s.summary
  s.license = 'MIT'
  s.author = 'Blumea'
  s.homepage = 'https://github.com/vidaelzufari/nursingqueen'
  s.platforms = { :ios => '15.1' }
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.frameworks = 'WatchConnectivity', 'WidgetKit'
  s.libraries = 'sqlite3'
  s.swift_version = '5.0'
end
