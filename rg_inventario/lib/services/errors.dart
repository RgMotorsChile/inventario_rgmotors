String friendlyError(Object error) {
  final text = error.toString();
  final match = RegExp(r'Exception: (.+)$').firstMatch(text);
  if (match != null) return match.group(1)!;
  if (text.contains('Invalid login')) return 'Correo o contraseña incorrectos.';
  if (text.contains('Email not confirmed')) return 'Confirma el correo antes de entrar.';
  if (text.contains('User already registered')) return 'Ese correo ya tiene cuenta. Entra con tu contraseña.';
  if (text.contains('Failed host lookup') || text.contains('SocketException')) {
    return 'Sin conexión. Revisa el WiFi e inténtalo de nuevo.';
  }
  return text.replaceAll('PostgrestException: ', '').replaceAll('AuthException: ', '');
}
