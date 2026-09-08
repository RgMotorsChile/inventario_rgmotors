class AppConfig {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static const jefaturaWebUrl = String.fromEnvironment(
    'JEFATURA_WEB_URL',
    defaultValue: 'https://inventario-rgmotors.vercel.app',
  );

  static bool get isConfigured =>
      supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;
}
