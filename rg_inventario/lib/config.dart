class AppConfig {
  static const insforgeUrl = String.fromEnvironment(
    'INSFORGE_URL',
    defaultValue: '',
  );

  static const insforgeAnonKey = String.fromEnvironment(
    'INSFORGE_ANON_KEY',
    defaultValue: '',
  );

  static const jefaturaWebUrl = String.fromEnvironment(
    'JEFATURA_WEB_URL',
    defaultValue: 'http://localhost:3000',
  );

  static bool get isConfigured =>
      insforgeUrl.startsWith('https://') && insforgeAnonKey.length > 10;
}
