String friendlyError(Object error) {
  var text = error.toString();
  text = text
      .replaceAll('InsforgeException: ', '')
      .replaceAll('PostgrestException: ', '')
      .replaceAll('AuthException: ', '');
  final match = RegExp(r'Exception: (.+)$').firstMatch(text);
  if (match != null) text = match.group(1)!;

  if (text.contains('Invalid login')) return 'Correo o contraseña incorrectos.';
  if (text.contains('Email not confirmed')) return 'Confirma el correo antes de entrar.';
  if (text.contains('User already registered')) return 'Ese correo ya tiene cuenta. Entra con tu contraseña.';
  if (text.contains('Failed host lookup') || text.contains('SocketException')) {
    return 'Sin conexión. Revisa el WiFi e inténtalo de nuevo.';
  }
  return text;
}
