import 'package:shared_preferences/shared_preferences.dart';

const rememberPrefKey = 'rg.remember';
const rememberEmailPrefKey = 'rg.remember.email';

Future<bool> wantsRememberSession() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(rememberPrefKey) ?? true;
}

Future<String?> rememberedEmail() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString(rememberEmailPrefKey);
}

Future<void> saveSessionPreference({required bool remember, String? email}) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(rememberPrefKey, remember);
  if (remember && (email ?? '').trim().isNotEmpty) {
    await prefs.setString(rememberEmailPrefKey, email!.trim());
    return;
  }
  await prefs.remove(rememberEmailPrefKey);
}
