import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../services/errors.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final name = TextEditingController();
  final invite = TextEditingController();
  bool register = false;
  bool remember = true;
  bool busy = false;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadRemembered();
  }

  Future<void> _loadRemembered() async {
    final saved = await rememberedEmail();
    final keep = await wantsRememberSession();
    if (!mounted) return;
    setState(() {
      remember = keep;
      if (saved != null && saved.isNotEmpty) email.text = saved;
    });
  }

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    name.dispose();
    invite.dispose();
    super.dispose();
  }

  Future<void> _claimIfNeeded(String? code, String? fullName) async {
    final client = Supabase.instance.client;
    final pending = (code ?? '').trim().toUpperCase();
    final display = (fullName ?? '').trim().isEmpty ? 'Encargado bodega' : fullName!.trim();
    if (pending.length >= 6) {
      await client.rpc('claim_invite', params: {
        'p_code': pending,
        'p_full_name': display,
      });
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('pending_invite');
      return;
    }
    await client.rpc('ensure_profile', params: {
      'p_full_name': (fullName ?? '').trim().isEmpty ? null : fullName!.trim(),
    });
  }

  Future<void> _submit() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await saveSessionPreference(remember: remember, email: email.text);
      await _submitSupabase();
    } catch (e) {
      setState(() => error = friendlyError(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _submitSupabase() async {
    final auth = Supabase.instance.client.auth;
    final mail = email.text.trim();
    final pass = password.text;
    if (register) {
      if (invite.text.trim().length < 6) {
        throw Exception('Pide a jefatura un código de invitación.');
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pending_invite', invite.text.trim().toUpperCase());
      final result = await auth.signUp(
        email: mail,
        password: pass,
        data: {'full_name': name.text.trim().isEmpty ? 'Encargado bodega' : name.text.trim()},
      );
      if (result.session == null) {
        setState(() => error = 'Cuenta creada. Si pide confirmar correo, revísalo y luego entra.');
        return;
      }
      await _claimIfNeeded(invite.text, name.text);
    } else {
      await auth.signInWithPassword(email: mail, password: pass);
      final prefs = await SharedPreferences.getInstance();
      final pending = prefs.getString('pending_invite');
      await _claimIfNeeded(pending, name.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!AppConfig.isConfigured) {
      return const SetupScreen();
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(-0.8, -1.1),
            radius: 1.2,
            colors: [Color(0x73173A79), RgColors.ink950],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const RgLogo(height: 78),
                        const SizedBox(height: 12),
                        const Text(
                          'BODEGA · PUERTO MONTT',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            letterSpacing: 2.4,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: RgColors.muted,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          register ? 'Crear acceso' : 'Entrar',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 16),
                        if (register) ...[
                          TextField(
                            controller: name,
                            decoration: const InputDecoration(labelText: 'Nombre'),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: invite,
                            textCapitalization: TextCapitalization.characters,
                            decoration: const InputDecoration(labelText: 'Código de invitación'),
                          ),
                          const SizedBox(height: 10),
                        ],
                        TextField(
                          controller: email,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'Correo'),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: password,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'Contraseña'),
                        ),
                        const SizedBox(height: 8),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Recordarme en este equipo'),
                          value: remember,
                          onChanged: busy ? null : (v) => setState(() => remember = v),
                        ),
                        if (error != null) ...[
                          const SizedBox(height: 8),
                          Text(error!, style: const TextStyle(color: Color(0xFFFF8A80))),
                        ],
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: busy ? null : _submit,
                          child: Text(busy ? '…' : (register ? 'Crear cuenta' : 'Entrar')),
                        ),
                        TextButton(
                          onPressed: busy
                              ? null
                              : () => setState(() {
                                    register = !register;
                                    error = null;
                                  }),
                          child: Text(
                            register ? 'Ya tengo cuenta' : 'Tengo un código de invitación',
                            style: const TextStyle(color: RgColors.brandLight),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class SetupScreen extends StatelessWidget {
  const SetupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const RgLogo(height: 64),
              const SizedBox(height: 24),
              const SectionTitle(
                'CONECTAR SUPABASE',
                subtitle:
                    'Crea jefatura con create-inv-admin.mjs en el panel web y lanza la app con SUPABASE_ANON_KEY + JEFATURA_WEB_URL.',
              ),
              const SizedBox(height: 12),
              const Text(
                'flutter run --dart-define=SUPABASE_ANON_KEY=... --dart-define=JEFATURA_WEB_URL=https://...',
                style: TextStyle(color: RgColors.brandLight, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
