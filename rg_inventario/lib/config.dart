class AppConfig {
  static const jefaturaWebUrl = String.fromEnvironment(
    'JEFATURA_WEB_URL',
    defaultValue: 'http://localhost:3000',
  );

  /// Panel web que proxifica stock → Supabase.
  /// Si vacío, se usa [jefaturaWebUrl].
  static const bodegaApiUrl = String.fromEnvironment(
    'BODEGA_API_URL',
    defaultValue: '',
  );

  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://tuybpizjeszgwtcvunmp.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static bool get useSupabaseAuth =>
      supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 10;

  static bool get isConfigured => useSupabaseAuth;

  static String get resolvedBodegaApiUrl {
    if (bodegaApiUrl.startsWith('http://') || bodegaApiUrl.startsWith('https://')) {
      return bodegaApiUrl.replaceAll(RegExp(r'/+$'), '');
    }
    return jefaturaWebUrl.replaceAll(RegExp(r'/+$'), '');
  }

  static bool get useBodegaApi => resolvedBodegaApiUrl.isNotEmpty;
}
